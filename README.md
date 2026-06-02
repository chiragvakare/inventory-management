# InvenTrack — Inventory & Order Management System

A production-ready, full-stack Inventory & Order Management System built with FastAPI, React, and PostgreSQL.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Python 3.11, FastAPI, SQLAlchemy, Pydantic v2 |
| Database | PostgreSQL 16 |
| Containerization | Docker, Docker Compose |

## Features

### Product Management
- Full CRUD — add, view, edit, delete products
- Unique SKU validation
- Category filtering
- Table & grid view toggle
- Image URL support

### Customer Management
- Full CRUD with email uniqueness enforcement
- Customer types: retail, wholesale, VIP
- Search by name, email, company, phone

### Order Management
- Multi-product order creation with real-time subtotal calculation
- Automatic stock deduction on order creation
- Stock restoration on order cancellation
- Order status workflow: pending → confirmed → packed → shipped → delivered
- Visual order progress tracker
- Discount & tax support

### Inventory Tracking
- Real-time stock levels with low-stock alerts
- Manual stock adjustment (positive/negative)
- Out-of-stock flagging
- Inventory value calculation

### Dashboard & Reports
- Revenue charts (7/14/30/90 days)
- Order status distribution (pie chart)
- Top selling products (bar chart)
- Low stock alerts
- Recent orders feed
- KPI summary cards

## Quick Start

### Using Docker (Recommended)

```bash
cp .env.example .env
# Edit .env and set POSTGRES_PASSWORD and SECRET_KEY

docker compose up --build
```

Open http://localhost:3000

### Local Development

**Backend:**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
# Set DATABASE_URL in .env
uvicorn main:app --reload
```

**Frontend:**
```bash
cd frontend
npm install
# Set VITE_API_URL in .env
npm run dev
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTGRES_DB` | Database name | `inventory_db` |
| `POSTGRES_USER` | Database user | `postgres` |
| `POSTGRES_PASSWORD` | Database password | **required** |
| `DATABASE_URL` | Full DB connection string | derived |
| `SECRET_KEY` | App secret key | **required** |
| `ALLOWED_ORIGINS` | CORS allowed origins | `*` |
| `VITE_API_URL` | Backend URL for frontend | `http://localhost:8000` |

## Business Rules

- Product SKUs must be unique across the catalog
- Customer email addresses must be unique
- Product quantity cannot go negative
- Orders are rejected if any item has insufficient stock
- Order creation automatically reduces product stock
- Order cancellation automatically restores stock
- Order total = subtotal − discount + (subtotal × tax%)
