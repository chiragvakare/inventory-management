from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_
from typing import List, Optional
from datetime import datetime
from database import get_db
from models.order import Order, OrderItem
from models.product import Product
from models.customer import Customer
from schemas.order import OrderCreate, OrderUpdate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


def generate_order_number(db: Session) -> str:
    count = db.query(Order).count()
    timestamp = datetime.now().strftime("%Y%m%d")
    return f"ORD-{timestamp}-{str(count + 1).zfill(4)}"


@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(payload: OrderCreate, db: Session = Depends(get_db)):
    if payload.customer_id:
        customer = db.query(Customer).filter(Customer.id == payload.customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

    order_items = []
    subtotal = 0.0

    for item_data in payload.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product ID {item_data.product_id} not found")
        if product.quantity_in_stock < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for '{product.name}'. Available: {product.quantity_in_stock}, Requested: {item_data.quantity}",
            )
        item_subtotal = product.price * item_data.quantity
        subtotal += item_subtotal
        order_items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                product_sku=product.sku,
                quantity=item_data.quantity,
                unit_price=product.price,
                subtotal=item_subtotal,
            )
        )

    discount = payload.discount or 0.0
    tax = payload.tax or 0.0
    total_amount = subtotal - discount + (subtotal * tax / 100)

    order = Order(
        order_number=generate_order_number(db),
        customer_id=payload.customer_id,
        subtotal=subtotal,
        discount=discount,
        tax=tax,
        total_amount=total_amount,
        payment_method=payload.payment_method,
        notes=payload.notes,
        shipping_address=payload.shipping_address,
        items=order_items,
    )
    db.add(order)

    for i, item_data in enumerate(payload.items):
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        product.quantity_in_stock -= item_data.quantity

    db.commit()
    db.refresh(order)
    return order


@router.get("", response_model=List[OrderResponse])
def get_orders(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    payment_status: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    query = db.query(Order).options(joinedload(Order.items), joinedload(Order.customer))
    if search:
        query = query.filter(Order.order_number.ilike(f"%{search}%"))
    if status:
        query = query.filter(Order.status == status)
    if payment_status:
        query = query.filter(Order.payment_status == payment_status)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    return query.order_by(Order.created_at.desc()).offset(skip).limit(limit).all()


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(order_id: int, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(order_id: int, payload: OrderUpdate, db: Session = Depends(get_db)):
    order = (
        db.query(Order)
        .options(joinedload(Order.items), joinedload(Order.customer))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(order, key, value)
    db.commit()
    db.refresh(order)
    return order


@router.delete("/{order_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    order = db.query(Order).options(joinedload(Order.items)).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if order.status not in ("cancelled", "delivered"):
        for item in order.items:
            product = db.query(Product).filter(Product.id == item.product_id).first()
            if product:
                product.quantity_in_stock += item.quantity

    db.delete(order)
    db.commit()
