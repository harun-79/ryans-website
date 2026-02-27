from __future__ import annotations

import json
import os
import base64
import hashlib
import hmac
import sqlite3
from datetime import datetime, timedelta, timezone
from functools import wraps
import threading
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent

# Load environment variables from .env file if it exists
ENV_FILE = PROJECT_ROOT / ".env"
if ENV_FILE.exists():
    with open(ENV_FILE) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                key, value = line.split("=", 1)
                os.environ.setdefault(key.strip(), value.strip())
FRONTEND_DIR = PROJECT_ROOT / "frontend"
PUBLIC_DIR = FRONTEND_DIR / "public"  # React build output directory
UPLOADS_DIR = BASE_DIR / "uploads"
DB_FILE = PROJECT_ROOT / "database.db"

PORT = int(os.getenv("PORT", "3000"))
JWT_SECRET = os.getenv("JWT_SECRET", "dev_secret_change_me")
ADMIN_KEY = os.getenv("ADMIN_KEY", "dev_admin_key_change_me")
ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}

# Serve from public directory if it exists (React build), otherwise frontend directory
SERVE_DIR = PUBLIC_DIR if PUBLIC_DIR.exists() else FRONTEND_DIR
app = Flask(__name__, static_folder=str(SERVE_DIR), static_url_path="")
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_FILE)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    legacy_db_candidates = [UPLOADS_DIR / "marketplace.db"]
    if not DB_FILE.exists():
        for legacy_db_file in legacy_db_candidates:
            if legacy_db_file.exists():
                legacy_db_file.replace(DB_FILE)
                break

    with get_db_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password TEXT NOT NULL,
                role TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                price REAL NOT NULL,
                description TEXT NOT NULL,
                image TEXT NOT NULL,
                artist_name TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS orders (
                id TEXT PRIMARY KEY,
                buyer_id TEXT NOT NULL,
                total_price REAL NOT NULL,
                status TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (buyer_id) REFERENCES users(id)
            )
            """
        )

        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS order_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT NOT NULL,
                product_id TEXT NOT NULL,
                title TEXT NOT NULL,
                price REAL NOT NULL,
                quantity INTEGER NOT NULL,
                FOREIGN KEY (order_id) REFERENCES orders(id)
            )
            """
        )


def fetch_all_products() -> list[dict[str, Any]]:
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, title, price, description, image, artist_name, created_at
            FROM products
            ORDER BY created_at DESC
            """
        ).fetchall()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "price": row["price"],
            "description": row["description"],
            "image": row["image"],
            "artistName": row["artist_name"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def fetch_product_by_id(product_id: str) -> dict[str, Any] | None:
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT id, title, price, description, image, artist_name, created_at
            FROM products
            WHERE id = ?
            """,
            (product_id,),
        ).fetchone()

    if row is None:
        return None

    return {
        "id": row["id"],
        "title": row["title"],
        "price": row["price"],
        "description": row["description"],
        "image": row["image"],
        "artistName": row["artist_name"],
        "createdAt": row["created_at"],
    }


def fetch_database_tables() -> list[str]:
    with get_db_connection() as connection:
        rows = connection.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type='table'
            ORDER BY name ASC
            """
        ).fetchall()
    return [row["name"] for row in rows]


def fetch_user_by_email(email: str) -> dict[str, Any] | None:
    with get_db_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, password, role
            FROM users
            WHERE email = ?
            """,
            (email.lower(),),
        ).fetchone()

    if row is None:
        return None

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "password": row["password"],
        "role": row["role"],
    }


def insert_user(user: dict[str, Any]) -> None:
    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO users (id, name, email, password, role, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                user["id"],
                user["name"],
                user["email"],
                user["password"],
                user["role"],
                user["createdAt"],
            ),
        )


def insert_order_with_items(order: dict[str, Any], items: list[dict[str, Any]]) -> None:
    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO orders (id, buyer_id, total_price, status, created_at)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                order["id"],
                order["buyerId"],
                float(order["totalPrice"]),
                order["status"],
                order["createdAt"],
            ),
        )

        for item in items:
            connection.execute(
                """
                INSERT INTO order_items (order_id, product_id, title, price, quantity)
                VALUES (?, ?, ?, ?, ?)
                """,
                (
                    order["id"],
                    item["productId"],
                    item["title"],
                    float(item["price"]),
                    int(item["quantity"]),
                ),
            )


# BUG FIX: was incorrectly nested inside insert_order_with_items, making it
# a local function and causing a NameError when called from the M-Pesa timer thread.
def update_order_status_in_db(order_id: str, new_status: str) -> None:
    with get_db_connection() as connection:
        connection.execute(
            "UPDATE orders SET status = ? WHERE id = ?",
            (new_status, order_id),
        )


def fetch_orders_by_buyer(buyer_id: str) -> list[dict[str, Any]]:
    with get_db_connection() as connection:
        order_rows = connection.execute(
            """
            SELECT id, buyer_id, total_price, status, created_at
            FROM orders
            WHERE buyer_id = ?
            ORDER BY created_at DESC
            """,
            (buyer_id,),
        ).fetchall()

        orders: list[dict[str, Any]] = []
        for row in order_rows:
            item_rows = connection.execute(
                """
                SELECT product_id, title, price, quantity
                FROM order_items
                WHERE order_id = ?
                """,
                (row["id"],),
            ).fetchall()

            items = [
                {
                    "productId": item["product_id"],
                    "title": item["title"],
                    "price": item["price"],
                    "quantity": item["quantity"],
                }
                for item in item_rows
            ]

            orders.append(
                {
                    "id": row["id"],
                    "buyerId": row["buyer_id"],
                    "items": items,
                    "totalPrice": row["total_price"],
                    "status": row["status"],
                    "createdAt": row["created_at"],
                }
            )

    return orders


def insert_product(product: dict[str, Any]) -> None:
    with get_db_connection() as connection:
        connection.execute(
            """
            INSERT INTO products (id, title, price, description, image, artist_name, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                product["id"],
                product["title"],
                float(product["price"]),
                product["description"],
                product["image"],
                product["artistName"],
                product["createdAt"],
            ),
        )


def delete_product_by_id(product_id: str) -> bool:
    with get_db_connection() as connection:
        cursor = connection.execute("DELETE FROM products WHERE id = ?", (product_id,))
        return cursor.rowcount > 0


def is_allowed_image(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_IMAGE_EXTENSIONS


def generate_unique_id(prefix: str) -> str:
    """Generate a unique ID using a combination of timestamp and random bytes
    to avoid collisions when multiple requests arrive in the same millisecond."""
    ts = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    rand = int.from_bytes(os.urandom(4), "big") % 100000
    return f"{prefix}{ts}_{rand}"


def admin_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        admin_key = request.headers.get("x-admin-key", "")
        if admin_key != ADMIN_KEY:
            return jsonify({"message": "Unauthorized admin access"}), 401
        return func(*args, **kwargs)

    return wrapper


def _b64url_encode(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).decode("utf-8").rstrip("=")


def _b64url_decode(value: str) -> bytes:
    padding = "=" * (-len(value) % 4)
    return base64.urlsafe_b64decode((value + padding).encode("utf-8"))


def create_token(payload: dict[str, Any], expires_delta: timedelta) -> str:
    payload_to_sign = dict(payload)
    exp = int((datetime.now(tz=timezone.utc) + expires_delta).timestamp())
    payload_to_sign["exp"] = exp
    payload_json = json.dumps(payload_to_sign, separators=(",", ":"), sort_keys=True)
    payload_b64 = _b64url_encode(payload_json.encode("utf-8"))
    signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()
    return f"{payload_b64}.{signature}"


def decode_token(token: str) -> dict[str, Any]:
    parts = token.split(".")
    if len(parts) != 2:
        raise ValueError("Malformed token")

    payload_b64, signature = parts
    expected_signature = hmac.new(
        JWT_SECRET.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(signature, expected_signature):
        raise ValueError("Invalid token signature")

    payload_raw = _b64url_decode(payload_b64).decode("utf-8")
    payload = json.loads(payload_raw)
    if int(payload.get("exp", 0)) < int(datetime.now(tz=timezone.utc).timestamp()):
        raise ValueError("Token expired")

    return payload


def token_required(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = auth_header[7:] if auth_header.startswith("Bearer ") else None

        if not token:
            return jsonify({"message": "Unauthorized: token missing"}), 401

        try:
            payload = decode_token(token)
            request.user = payload
        except ValueError:
            return jsonify({"message": "Unauthorized: invalid token"}), 401

        return func(*args, **kwargs)

    return wrapper


@app.post("/api/register")
def register():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name", "").strip()
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    if not name or not email or not password:
        return jsonify({"message": "Name, email and password are required"}), 400

    existing_user = fetch_user_by_email(email)
    if existing_user is not None:
        return jsonify({"message": "Email already exists"}), 409

    user = {
        "id": generate_unique_id("u_"),
        "name": name,
        "email": email,
        "password": generate_password_hash(password),
        "role": "buyer",
        "createdAt": datetime.now(tz=timezone.utc).isoformat(),
    }
    insert_user(user)
    return jsonify({"message": "Registration successful"}), 201


@app.post("/api/login")
def login():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email", "").strip().lower()
    password = payload.get("password", "")

    if not email or not password:
        return jsonify({"message": "Email and password are required"}), 400

    user = fetch_user_by_email(email)

    if user is None or not check_password_hash(user.get("password", ""), password):
        return jsonify({"message": "Invalid credentials"}), 401

    token = create_token(
        {
            "userId": user["id"],
            "role": user["role"],
            "name": user["name"],
            "email": user["email"],
        },
        expires_delta=timedelta(days=1),
    )

    return jsonify(
        {
            "token": token,
            "user": {
                "id": user["id"],
                "name": user["name"],
                "email": user["email"],
                "role": user["role"],
            },
        }
    )


@app.get("/api")
def api_root():
    # simple helper route to avoid a 404 when hitting /api directly
    return jsonify({
        "message": "API root – use one of the documented endpoints",
        "endpoints": [
            "/api/products",
            "/api/products/<id>",
            "/api/login",
            "/api/register",
            "..."
        ],
    })

@app.get("/api/products")
def get_products():
    return jsonify(fetch_all_products())


@app.get("/api/products/<product_id>")
def get_product(product_id: str):
    product = fetch_product_by_id(product_id)

    if not product:
        return jsonify({"message": "Product not found"}), 404

    return jsonify(product)


@app.get("/api/admin/products")
@admin_required
def get_products_admin():
    return jsonify(fetch_all_products())


@app.get("/api/admin/db/tables")
@admin_required
def get_database_tables_admin():
    return jsonify({"tables": fetch_database_tables()})


@app.get("/api/admin/db/products")
@admin_required
def get_database_products_admin():
    return jsonify(fetch_all_products())


@app.post("/api/admin/upload-image")
@admin_required
def upload_image():
    image = request.files.get("image")
    if image is None or image.filename is None or image.filename.strip() == "":
        return jsonify({"message": "Image file is required"}), 400

    filename = secure_filename(image.filename)
    if not is_allowed_image(filename):
        return jsonify({"message": "Unsupported image file type"}), 400

    unique_name = f"{int(datetime.now(tz=timezone.utc).timestamp() * 1000)}_{filename}"
    save_path = UPLOADS_DIR / unique_name
    image.save(save_path)

    return jsonify({"image": f"/uploads/{unique_name}"}), 201


@app.post("/api/admin/products")
@admin_required
def create_product_admin():
    if request.content_type and request.content_type.startswith("multipart/form-data"):
        title = (request.form.get("title") or "").strip()
        price = request.form.get("price")
        description = (request.form.get("description") or "").strip()
        artist_name = (request.form.get("artistName") or "").strip()
        image_url = (request.form.get("imageUrl") or "").strip()
        image_file = request.files.get("image")
    else:
        payload = request.get_json(silent=True) or {}
        title = str(payload.get("title", "")).strip()
        price = payload.get("price")
        description = str(payload.get("description", "")).strip()
        artist_name = str(payload.get("artistName", "")).strip()
        image_url = str(payload.get("image", "")).strip()
        image_file = None

    if not title or price in (None, "") or not description or not artist_name:
        return jsonify({"message": "Title, price, description, and artist name are required"}), 400

    try:
        parsed_price = float(price)
    except (TypeError, ValueError):
        return jsonify({"message": "Price must be a valid number"}), 400

    if parsed_price <= 0:
        return jsonify({"message": "Price must be greater than zero"}), 400

    final_image = image_url
    if image_file is not None and image_file.filename and image_file.filename.strip() != "":
        filename = secure_filename(image_file.filename)
        if not is_allowed_image(filename):
            return jsonify({"message": "Unsupported image file type"}), 400
        unique_name = f"{int(datetime.now(tz=timezone.utc).timestamp() * 1000)}_{filename}"
        save_path = UPLOADS_DIR / unique_name
        image_file.save(save_path)
        final_image = f"/uploads/{unique_name}"

    if not final_image:
        return jsonify({"message": "Provide an image file or image URL"}), 400

    product = {
        "id": generate_unique_id("p"),
        "title": title,
        "price": parsed_price,
        "description": description,
        "image": final_image,
        "artistName": artist_name,
        "createdAt": datetime.now(tz=timezone.utc).isoformat(),
    }
    insert_product(product)
    return jsonify({"message": "Product created", "product": product}), 201


@app.delete("/api/admin/products/<product_id>")
@admin_required
def delete_product_admin(product_id: str):
    product = fetch_product_by_id(product_id)
    if product is None:
        return jsonify({"message": "Product not found"}), 404

    image_path = product.get("image", "")
    if isinstance(image_path, str) and image_path.startswith("/uploads/"):
        file_name = image_path.replace("/uploads/", "", 1)
        file_path = UPLOADS_DIR / file_name
        if file_path.exists() and file_path.is_file():
            file_path.unlink(missing_ok=True)

    deleted = delete_product_by_id(product_id)
    if not deleted:
        return jsonify({"message": "Product not found"}), 404

    return jsonify({"message": "Product deleted"})


@app.post("/api/orders")
@token_required
def create_order():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items", [])

    if not isinstance(items, list) or not items:
        return jsonify({"message": "Order items are required"}), 400

    products = fetch_all_products()
    matched_items = []

    for item in items:
        product_id = item.get("productId")
        quantity = int(item.get("quantity", 1) or 1)

        product = next((product for product in products if product.get("id") == product_id), None)
        if not product:
            return jsonify({"message": f"Invalid product ID: {product_id}"}), 400

        matched_items.append(
            {
                "productId": product["id"],
                "title": product["title"],
                "price": product["price"],
                "quantity": max(1, quantity),
            }
        )

    total_price = sum(item["price"] * item["quantity"] for item in matched_items)

    order = {
        "id": generate_unique_id("o_"),
        "buyerId": request.user["userId"],
        "totalPrice": total_price,
        "status": "completed",
        "createdAt": datetime.now(tz=timezone.utc).isoformat(),
    }

    insert_order_with_items(order, matched_items)

    return jsonify({"message": "Order placed successfully", "order": {**order, "items": matched_items}}), 201


@app.post("/api/mpesa/checkout")
@token_required
def mpesa_checkout():
    payload = request.get_json(silent=True) or {}
    items = payload.get("items", [])
    phone = str(payload.get("phone", "")).strip()

    if not isinstance(items, list) or not items:
        return jsonify({"message": "Order items are required"}), 400

    if not phone:
        return jsonify({"message": "Phone number is required for M-Pesa"}), 400

    products = fetch_all_products()
    matched_items = []

    for item in items:
        product_id = item.get("productId")
        quantity = int(item.get("quantity", 1) or 1)

        product = next((product for product in products if product.get("id") == product_id), None)
        if not product:
            return jsonify({"message": f"Invalid product ID: {product_id}"}), 400

        matched_items.append(
            {
                "productId": product["id"],
                "title": product["title"],
                "price": product["price"],
                "quantity": max(1, quantity),
            }
        )

    total_price = sum(item["price"] * item["quantity"] for item in matched_items)

    order = {
        "id": generate_unique_id("o_"),
        "buyerId": request.user["userId"],
        "totalPrice": total_price,
        "status": "pending",
        "createdAt": datetime.now(tz=timezone.utc).isoformat(),
    }

    insert_order_with_items(order, matched_items)

    def mark_complete():
        update_order_status_in_db(order["id"], "completed")

    # Simulate M-Pesa asynchronous confirmation after a short delay
    threading.Timer(5.0, mark_complete).start()

    return jsonify({"message": "M-Pesa checkout initiated", "order": {**order, "items": matched_items}, "mpesa": {"status": "initiated", "phone": phone}}), 201


@app.get("/api/orders")
@token_required
def get_orders():
    user_orders = fetch_orders_by_buyer(request.user["userId"])
    return jsonify(user_orders)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.get("/uploads/<path:filename>")
def uploaded_files(filename: str):
    return send_from_directory(UPLOADS_DIR, filename)


@app.get("/")
def index():
    # serve main application entrypoint when available
    index_file = SERVE_DIR / "index.html"
    if index_file.exists():
        return send_from_directory(SERVE_DIR, "index.html")
    # when frontend hasn't been built (or you're running dev server)
    # provide a clear message instead of a generic 404
    return jsonify({
        "message": "Frontend not built. run `npm run build` or start the
dev server on port 5173 to view the UI."  # noqa: E501
    }), 200


@app.get("/<path:asset_path>")
def static_files(asset_path: str):
    # Try to serve the requested file first
    file_path = SERVE_DIR / asset_path
    if file_path.exists() and file_path.is_file():
        return send_from_directory(SERVE_DIR, asset_path)

    # For SPA routing, if file doesn't exist, serve index.html if available
    if not asset_path.startswith("api/"):
        index_file = SERVE_DIR / "index.html"
        if index_file.exists():
            return send_from_directory(SERVE_DIR, "index.html")
        return jsonify({
            "message": "Frontend not built. run `npm run build` or start the
dev server to handle this request."
        }), 200

    return {"error": "Not found"}, 404


if __name__ == "__main__":
    initialize_database()
    app.run(host="0.0.0.0", port=PORT, debug=False)