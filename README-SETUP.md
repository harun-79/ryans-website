# Complete Setup Guide - Art & Craft Marketplace

## Project Overview

A full-stack art and craft marketplace with:
- **Backend**: Python Flask server with SQLite database
- **Frontend**: React SPA with Vite build tool
- **Features**: User authentication, product browsing, shopping cart, M-Pesa integration

## System Requirements

- **Python 3.8+** (for backend)
- **Node.js 16+** (for frontend)
- **npm** or **yarn** (Node package manager)

## Quick Start

### 1. Backend Setup

Install Python dependencies:

```bash
c:\Python313\python.exe -m pip install -r requirements.txt
```

Start the backend server (runs on port 3000):

```bash
c:\Python313\python.exe backend\server.py
```

Server will be available at `http://127.0.0.1:3000`

### 2. Frontend Setup

Install Node dependencies:

```bash
cd frontend
npm install
```

#### Development Mode (with hot reload)

```bash
npm run dev
```

Access at `http://127.0.0.1:5173` - frontend will proxy API requests to backend

#### Production Build

```bash
npm run build
```

This generates `frontend/public/` which the backend serves directly

Then start backend again - it will serve the React app from the public directory

## File Structure

```
project-root/
├── backend/
│   ├── server.py              # Flask application
│   ├── uploads/               # Uploaded product images
│   └── __pycache__/
├── frontend/
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── styles/            # CSS modules
│   │   ├── App.jsx            # Main app
│   │   ├── main.jsx           # Entry point
│   │   └── utils.js           # API & storage
│   ├── public/                # Built output (generated)
│   ├── package.json           # Frontend dependencies
│   ├── vite.config.js
│   ├── README.md              # Frontend docs
│   └── *-legacy files (.html, /js/, /css/) - old vanilla JS version
├── database.db                # SQLite database
├── requirements.txt           # Python dependencies
└── README-SETUP.md           # This file
```

## Environment Variables

### Backend

Set optional environment variables:

```bash
set PORT=3000
set JWT_SECRET=your-secret-key
set ADMIN_KEY=ryan
```

### Frontend

No environment variables needed. Vite dev server auto-proxies `/api` and `/uploads` to backend.

## Database

SQLite database (`database.db`) is created automatically on first run with:
- `users` table (login/register)
- `products` table (marketplace items)
- `orders` table (purchase orders)
- `order_items` table (order line items)

## API Endpoints

### Public Endpoints

```
GET  /api/health              - Health check
GET  /api/products            - Get all products
GET  /api/products/<id>       - Get product by ID
POST /api/register            - Register new user
POST /api/login               - Login user
```

### Protected Endpoints (require Bearer token)

```
POST /api/orders              - Create order
GET  /api/orders              - Get user orders
POST /api/mpesa/checkout      - Initiate M-Pesa payment
```

### Admin Endpoints (require x-admin-key header)

```
POST /api/admin/upload-image  - Upload product image
POST /api/admin/products      - Create new product
GET  /api/admin/products      - Get all products
DEL  /api/admin/products/<id> - Delete product
```

## Frontend Architecture

### Components

- **App.jsx** - Main component, handles auth state and routing
- **Header.jsx** - Navigation header with cart icon and logout
- **AuthSection.jsx** - Login and register forms
- **ProductGrid.jsx** - Display products grid
- **CartSidebar.jsx** - Shopping cart with M-Pesa and checkout

### State Management

- React hooks (`useState`, `useEffect`)
- localStorage for persistence (cart, auth token)
- Direct API calls with async/await

### Styling

- CSS modules (component-scoped styles)
- Global variables in `index.css`
- Responsive design (mobile-first)

## Common Tasks

### View Products

1. Start backend and frontend servers
2. Navigate to frontend URL
3. Register/login
4. Products appear automatically

### Add Product (Admin)

Backend must be running. Use admin dashboard or curl:

```bash
curl -X POST http://127.0.0.1:3000/api/admin/products \
  -H "x-admin-key: ryan" \
  -H "Content-Type: application/json" \
  -d '{"title":"Art Piece","price":50,"description":"Beautiful art","artistName":"Artist","image":"url-or-file"}'
```

### Test M-Pesa Checkout

1. Login
2. Add product to cart
3. Open cart sidebar (🛒 button)
4. Enter phone number (format: 2547XXXXXXXX)
5. Click "Pay with M-Pesa"
6. Order created with status "pending" → "completed" after ~5 seconds

## Troubleshooting

### "ModuleNotFoundError: No module named 'flask'"

Install dependencies:
```bash
c:\Python313\python.exe -m pip install flask
```

### "npm: command not found"

Install Node.js from https://nodejs.org/

### Frontend not finding API

Ensure backend is running on port 3000. Check vite config proxy settings if using different port.

### Database locked error

Ensure only one backend instance is running.

## Development Workflow

1. **Start Backend**: `c:\Python313\python.exe backend\server.py`
2. **Start Frontend**: `cd frontend && npm run dev`
3. **Make Changes**: Edit React components, see instant hot reload
4. **Test**: Use browser DevTools and backend logs
5. **Build**: `npm run build` to create production bundle
6. **Deploy**: Backend serves built frontend automatically

## Production Deployment

1. Install dependencies: `npm install && pip install -r requirements.txt`
2. Build frontend: `cd frontend && npm run build`
3. Start backend: `python backend/server.py`
4. Backend serves React app from `frontend/public/`

## License

Internal project

## Support

Check `frontend/README.md` for frontend-specific docs
Check code comments and component docstrings for implementation details
