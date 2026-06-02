from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from models import Product, Customer, Order, OrderItem
from routers import products, customers, orders, dashboard
from config import settings

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Inventory & Order Management API",
    description="A production-ready inventory management system with products, customers, and orders.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

origins = settings.ALLOWED_ORIGINS.split(",") if settings.ALLOWED_ORIGINS != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router, prefix="/api/v1")
app.include_router(customers.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(dashboard.router, prefix="/api/v1")


@app.get("/", tags=["Health"])
def root():
    return {"message": "Inventory Management API is running", "version": "1.0.0", "status": "healthy"}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
