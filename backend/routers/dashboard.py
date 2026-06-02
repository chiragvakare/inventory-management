from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.product import Product
from models.customer import Customer
from models.order import Order, OrderItem
from datetime import datetime, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_summary(db: Session = Depends(get_db)):
    total_products = db.query(Product).count()
    total_customers = db.query(Customer).count()
    total_orders = db.query(Order).count()

    low_stock = db.query(Product).filter(
        Product.quantity_in_stock <= Product.reorder_level
    ).count()

    out_of_stock = db.query(Product).filter(Product.quantity_in_stock == 0).count()

    pending_orders = db.query(Order).filter(Order.status == "pending").count()
    shipped_orders = db.query(Order).filter(Order.status == "shipped").count()

    total_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status != "cancelled"
    ).scalar() or 0.0

    today_revenue = db.query(func.sum(Order.total_amount)).filter(
        Order.status != "cancelled",
        func.date(Order.created_at) == datetime.now().date(),
    ).scalar() or 0.0

    inventory_value = db.query(
        func.sum(Product.price * Product.quantity_in_stock)
    ).scalar() or 0.0

    return {
        "total_products": total_products,
        "total_customers": total_customers,
        "total_orders": total_orders,
        "low_stock_count": low_stock,
        "out_of_stock_count": out_of_stock,
        "pending_orders": pending_orders,
        "shipped_orders": shipped_orders,
        "total_revenue": round(total_revenue, 2),
        "today_revenue": round(today_revenue, 2),
        "inventory_value": round(inventory_value, 2),
    }


@router.get("/low-stock-products")
def get_low_stock(db: Session = Depends(get_db)):
    products = (
        db.query(Product)
        .filter(Product.quantity_in_stock <= Product.reorder_level)
        .order_by(Product.quantity_in_stock.asc())
        .limit(10)
        .all()
    )
    return [
        {
            "id": p.id,
            "name": p.name,
            "sku": p.sku,
            "quantity_in_stock": p.quantity_in_stock,
            "reorder_level": p.reorder_level,
            "category": p.category,
        }
        for p in products
    ]


@router.get("/recent-orders")
def get_recent_orders(db: Session = Depends(get_db)):
    orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(5)
        .all()
    )
    return [
        {
            "id": o.id,
            "order_number": o.order_number,
            "customer": o.customer.full_name if o.customer else "Walk-in",
            "status": o.status,
            "total_amount": o.total_amount,
            "created_at": o.created_at,
        }
        for o in orders
    ]


@router.get("/revenue-chart")
def get_revenue_chart(days: int = 7, db: Session = Depends(get_db)):
    result = []
    for i in range(days - 1, -1, -1):
        date = (datetime.now() - timedelta(days=i)).date()
        revenue = (
            db.query(func.sum(Order.total_amount))
            .filter(
                Order.status != "cancelled",
                func.date(Order.created_at) == date,
            )
            .scalar()
            or 0.0
        )
        orders_count = (
            db.query(func.count(Order.id))
            .filter(func.date(Order.created_at) == date)
            .scalar()
            or 0
        )
        result.append({
            "date": str(date),
            "revenue": round(revenue, 2),
            "orders": orders_count,
        })
    return result


@router.get("/top-products")
def get_top_products(db: Session = Depends(get_db)):
    rows = (
        db.query(
            OrderItem.product_name,
            OrderItem.product_sku,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.subtotal).label("total_revenue"),
        )
        .group_by(OrderItem.product_name, OrderItem.product_sku)
        .order_by(func.sum(OrderItem.quantity).desc())
        .limit(5)
        .all()
    )
    return [
        {
            "product_name": r.product_name,
            "product_sku": r.product_sku,
            "total_sold": r.total_sold,
            "total_revenue": round(r.total_revenue, 2),
        }
        for r in rows
    ]


@router.get("/order-status-distribution")
def get_order_status_distribution(db: Session = Depends(get_db)):
    rows = (
        db.query(Order.status, func.count(Order.id).label("count"))
        .group_by(Order.status)
        .all()
    )
    return [{"status": r.status, "count": r.count} for r in rows]
