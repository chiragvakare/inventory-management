from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime


class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int

    @field_validator("quantity")
    @classmethod
    def quantity_positive(cls, v):
        if v <= 0:
            raise ValueError("Quantity must be greater than 0")
        return v


class OrderItemResponse(BaseModel):
    id: int
    product_id: Optional[int]
    product_name: str
    product_sku: str
    quantity: int
    unit_price: float
    subtotal: float

    model_config = {"from_attributes": True}


class OrderCreate(BaseModel):
    customer_id: Optional[int] = None
    items: List[OrderItemCreate]
    discount: float = 0.0
    tax: float = 0.0
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    shipping_address: Optional[str] = None

    @field_validator("items")
    @classmethod
    def items_not_empty(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None
    shipping_address: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v:
            allowed = {"pending", "confirmed", "packed", "shipped", "delivered", "cancelled"}
            if v not in allowed:
                raise ValueError(f"status must be one of: {allowed}")
        return v


class CustomerShort(BaseModel):
    id: int
    full_name: str
    email: str

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: Optional[int]
    customer: Optional[CustomerShort]
    status: str
    payment_status: str
    payment_method: Optional[str]
    subtotal: float
    discount: float
    tax: float
    total_amount: float
    notes: Optional[str]
    shipping_address: Optional[str]
    items: List[OrderItemResponse]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
