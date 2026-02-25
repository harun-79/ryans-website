# Buyer-Only Art & Craft Marketplace

A simple web marketplace where buyers can:
- Register and login
- Browse products
- View product details
- Place an order with simulated checkout

Admin can:
- Open Admin Upload page
- Upload product images from phone/gallery
- Publish products directly to customer gallery
- Delete posted products and uploaded images

Seller/artist/admin features are intentionally excluded.

## Tech Stack
- Python + Flask
- SQLite database for all app data (`database.db` in workspace root)
- Vanilla HTML/CSS/JavaScript frontend

## Run
1. Install dependencies:
   python -m pip install -r requirements.txt
2. Start server:
   python backend/server.py
3. Open in browser:
   http://localhost:3000

## API
- POST /api/register
- POST /api/login
- GET /api/products
- GET /api/products/:id
- POST /api/orders (auth required)
- GET /api/orders (auth required)
- POST /api/admin/products (admin key required)
- POST /api/admin/upload-image (admin key required)
- GET /api/admin/products (admin key required)
- DELETE /api/admin/products/:id (admin key required)
- GET /api/admin/db/tables (admin key required)
- GET /api/admin/db/products (admin key required)

## Notes
- JWT secret defaults to `dev_secret_change_me`; set `JWT_SECRET` in environment for production.
- Main SQLite DB file is `database.db` in the project root (open this directly in your SQLite extension).
- App data is stored only in SQLite (`database.db`).
- Admin panel is at `http://localhost:3000/admin.html`.
- Database viewer is at `http://localhost:3000/db-viewer.html`.
- Default admin key is `ryan`; set `ADMIN_KEY` in environment to change it.
