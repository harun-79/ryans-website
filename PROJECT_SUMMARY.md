# Project Summary: Buyer-Only Art & Craft Marketplace

## 1) What the project entails
This project is a full-stack, buyer-focused online marketplace for art and craft products.
- **Frontend:** Vanilla HTML/CSS/JavaScript pages for browsing, product details, cart, login/register, admin upload, and DB viewer.
- **Backend:** Flask API server (`backend/server.py`) that serves both static frontend files and JSON API endpoints.
- **Database:** SQLite (`database.db` at project root) for users, products, orders, and order items.
- **Target flow:** Admin uploads products, buyers browse and order, orders are stored for authenticated buyers.

## 2) Code comments, style, and indentations
- The codebase is intentionally simple and readable, with clear function names and modular JS files.
- Python and JavaScript mostly use 2-space/4-space consistent indentation per file conventions.
- There are minimal inline comments; readability is driven by naming and route/function separation.
- Backend is organized by helper functions (DB/auth/validation) followed by API routes.

## 3) Key functions and modules

### Backend (`backend/server.py`)
- **Database setup:** `initialize_database()`, `get_db_connection()`
- **Product data access:** `fetch_all_products()`, `fetch_product_by_id()`, `insert_product()`, `delete_product_by_id()`
- **User/auth data access:** `fetch_user_by_email()`, `insert_user()`
- **Order handling:** `insert_order_with_items()`, `fetch_orders_by_buyer()`
- **Admin and auth guards:** `admin_required`, `token_required`
- **Token utilities:** `_b64url_encode()`, `_b64url_decode()`, `create_token()`, `decode_token()`
- **Upload helper:** `is_allowed_image()`
- **HTTP routes:** register/login/products/orders/admin CRUD and health/static routes.

### Frontend JS modules
- `api.js`: API wrapper for products/auth/orders.
- `store.js`: localStorage cart/auth state management.
- `auth.js`: login/register submit handlers and auth UI state.
- `main.js`: product grid rendering.
- `product.js`: product detail rendering + add-to-cart.
- `cart.js`: cart rendering, quantity updates, checkout flow.
- `admin.js`: admin product publish/list/delete.
- `db-viewer.js`: admin-only DB table/product viewer and delete actions.

## 4) Python features used
- `from __future__ import annotations` for modern type-hint behavior.
- Type hints with built-ins like `list[dict[str, Any]]` and unions (`| None`).
- Decorators (`@app.get`, `@app.post`, `@wraps`) for route and middleware-style guards.
- Context managers (`with get_db_connection() as connection`) for safe DB transactions.
- Standard-library security/crypto modules (`hmac`, `hashlib`, `base64`) for token signing.
- `datetime` with UTC timezone-aware timestamps for IDs and audit fields.
- Path-safe filesystem handling using `pathlib.Path`.

## 5) Innovative ideas and practical design choices
- **No external auth service needed:** custom signed token design keeps deployment lightweight.
- **Single-file backend architecture:** easy to run, debug, and extend for MVP use.
- **Dual image input strategy:** supports both file upload and image URL in admin product creation.
- **Embedded DB operations in admin UI:** DB Viewer gives quick operational visibility for local environments.
- **Simple local persistence for UX:** cart/auth in localStorage improves flow without extra backend complexity.

## 6) Input parameters and validations

### Auth endpoints
- `POST /api/register`
  - Inputs: `name`, `email`, `password`
  - Validation: required fields; email is normalized to lowercase; duplicate email blocked.
- `POST /api/login`
  - Inputs: `email`, `password`
  - Validation: required fields; password checked against hashed DB password.

### Product endpoints
- `GET /api/products`, `GET /api/products/<id>`
  - Validation: returns 404 if product not found.
- `POST /api/admin/products` (admin key required)
  - Inputs: `title`, `price`, `description`, `artistName`, plus `image` file or `imageUrl`
  - Validation:
    - required fields present
    - `price` must parse as float and be `> 0`
    - image must exist via URL or file
    - uploaded file extension must be in allowed list (`png/jpg/jpeg/webp/gif`)
- `DELETE /api/admin/products/<id>`
  - Validation: product must exist; uploaded image file is deleted when applicable.

### Upload endpoint
- `POST /api/admin/upload-image`
  - Inputs: multipart `image`
  - Validation: file required, filename sanitized with `secure_filename`, extension allowlist enforced.

### Order endpoints
- `POST /api/orders` (Bearer token required)
  - Inputs: `items` array of `{ productId, quantity }`
  - Validation:
    - non-empty items array
    - each `productId` must map to a real product
    - quantity coerced to integer and clamped to minimum 1
- `GET /api/orders`
  - Validation: authenticated token required.

## 7) Security model
- Passwords are hashed using Werkzeug (`generate_password_hash`, `check_password_hash`).
- Authentication uses signed tokens with HMAC-SHA256 and expiration (`exp`).
- Token verification uses `hmac.compare_digest` to reduce timing attack risk.
- Admin endpoints require `x-admin-key` header matching configured `ADMIN_KEY`.
- Upload names sanitized with `secure_filename` and extension allowlist to reduce risky uploads.
- SQL queries use parameterized statements (`?`) to reduce SQL injection risks.
- Security caveats for production:
  - default secrets (`JWT_SECRET`, `ADMIN_KEY`) must be overridden,
  - transport should be HTTPS,
  - role/permission model is basic and can be expanded.

## 8) Entry of information, deletion, and updates
- **Entry:**
  - Buyer registration and login via `login.html`.
  - Product creation via `admin.html` form (text fields + image file/URL).
  - Order creation via cart checkout.
- **Deletion:**
  - Product deletion from both `admin.html` and `db-viewer.html`.
  - On product delete, corresponding uploaded image is removed if stored under `/uploads`.
- **Updates:**
  - Cart quantity updates are handled client-side in localStorage (`updateQty`).
  - No dedicated backend product update (`PUT/PATCH`) route yet; current admin flow supports create/delete.

## 9) Database implementation
- SQLite file: `database.db` in workspace root.
- Tables:
  - `users(id, name, email, password, role, created_at)`
  - `products(id, title, price, description, image, artist_name, created_at)`
  - `orders(id, buyer_id, total_price, status, created_at)`
  - `order_items(id, order_id, product_id, title, price, quantity)`
- Relationships:
  - `orders.buyer_id -> users.id`
  - `order_items.order_id -> orders.id`
- Initialization runs on server startup; legacy DB migration path is included.
- Data retrieval is converted into frontend-friendly JSON (`artist_name` -> `artistName`, etc.).

## 10) General workability assessment
- **Strengths:**
  - Lightweight architecture and easy setup.
  - Clear separation between user and admin workflows.
  - End-to-end commerce loop works: list -> detail -> cart -> checkout -> order history.
  - Practical local admin operations (publish/delete/view DB records).
- **Current limits (MVP-level):**
  - No role hierarchy beyond buyer + admin key.
  - No edit/update API for products.
  - Limited frontend input sanitization beyond HTML form constraints.
  - Custom token format is simple; can be replaced by standard JWT library if needed.

Overall, the project is a solid MVP marketplace implementation with functional auth, product lifecycle (create/delete), order capture, and SQLite-backed persistence, while remaining easy to maintain and extend.