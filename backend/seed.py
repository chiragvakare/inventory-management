import httpx
import sys

BASE = "http://localhost:8000/api/v1"

products = [
    {"name": "iPhone 15 Pro", "sku": "IPH-15P-256", "category": "Electronics", "price": 134900, "cost_price": 95000, "quantity_in_stock": 45, "reorder_level": 10, "unit": "pcs", "description": "Apple iPhone 15 Pro 256GB Space Black"},
    {"name": "Samsung Galaxy S24", "sku": "SAM-S24-128", "category": "Electronics", "price": 79999, "cost_price": 58000, "quantity_in_stock": 30, "reorder_level": 8, "unit": "pcs", "description": "Samsung Galaxy S24 128GB Phantom Black"},
    {"name": "Sony WH-1000XM5", "sku": "SNY-WH1000-BLK", "category": "Electronics", "price": 29990, "cost_price": 20000, "quantity_in_stock": 6, "reorder_level": 10, "unit": "pcs", "description": "Sony Noise Cancelling Headphones"},
    {"name": "MacBook Air M3", "sku": "MBK-AIR-M3-8", "category": "Electronics", "price": 114900, "cost_price": 85000, "quantity_in_stock": 15, "reorder_level": 5, "unit": "pcs", "description": "Apple MacBook Air 13-inch M3 8GB"},
    {"name": "Levi's 511 Slim Jeans", "sku": "LEV-511-32-BLU", "category": "Clothing", "price": 3999, "cost_price": 1800, "quantity_in_stock": 80, "reorder_level": 20, "unit": "pcs", "description": "Levi's 511 Slim Fit Jeans Blue"},
    {"name": "Nike Air Max 270", "sku": "NKE-AM270-10-BLK", "category": "Sports", "price": 12995, "cost_price": 7500, "quantity_in_stock": 3, "reorder_level": 15, "unit": "pcs", "description": "Nike Air Max 270 Running Shoes"},
    {"name": "Whey Protein 2kg", "sku": "WHY-PRO-2KG-CHC", "category": "Health & Beauty", "price": 2999, "cost_price": 1500, "quantity_in_stock": 50, "reorder_level": 10, "unit": "kg", "description": "Chocolate flavour whey protein powder"},
    {"name": "Office Chair Ergonomic", "sku": "FRN-CHR-ERG-BLK", "category": "Furniture", "price": 18500, "cost_price": 11000, "quantity_in_stock": 12, "reorder_level": 5, "unit": "pcs", "description": "Ergonomic mesh office chair with lumbar support"},
    {"name": "Wireless Mouse Logitech", "sku": "LGT-MX3-WRL-GRY", "category": "Electronics", "price": 3495, "cost_price": 2000, "quantity_in_stock": 0, "reorder_level": 10, "unit": "pcs", "description": "Logitech MX Master 3 Wireless Mouse"},
    {"name": "IKEA Study Table", "sku": "IKA-STD-TBL-WHT", "category": "Furniture", "price": 8999, "cost_price": 5500, "quantity_in_stock": 8, "reorder_level": 3, "unit": "pcs", "description": "IKEA white study table 120x60cm"},
]

customers = [
    {"full_name": "Rahul Sharma", "email": "rahul.sharma@gmail.com", "phone": "+91 98765 43210", "company": "TCS Ltd", "city": "Mumbai", "country": "India", "customer_type": "wholesale"},
    {"full_name": "Priya Patel", "email": "priya.patel@outlook.com", "phone": "+91 87654 32109", "company": "", "city": "Ahmedabad", "country": "India", "customer_type": "retail"},
    {"full_name": "Arjun Mehta", "email": "arjun.mehta@infosys.com", "phone": "+91 76543 21098", "company": "Infosys", "city": "Bangalore", "country": "India", "customer_type": "vip"},
    {"full_name": "Sneha Nair", "email": "sneha.nair@wipro.com", "phone": "+91 65432 10987", "company": "Wipro", "city": "Pune", "country": "India", "customer_type": "wholesale"},
    {"full_name": "Vikram Singh", "email": "vikram.singh@gmail.com", "phone": "+91 54321 09876", "company": "", "city": "Delhi", "country": "India", "customer_type": "retail"},
    {"full_name": "Ananya Reddy", "email": "ananya.reddy@amazon.com", "phone": "+91 43210 98765", "company": "Amazon India", "city": "Hyderabad", "country": "India", "customer_type": "vip"},
]

orders = [
    {"customer_id": 1, "items": [{"product_id": 1, "quantity": 2}, {"product_id": 5, "quantity": 3}], "discount": 500, "tax": 18, "payment_method": "Bank Transfer", "notes": "Bulk order for office use"},
    {"customer_id": 2, "items": [{"product_id": 7, "quantity": 4}], "discount": 0, "tax": 18, "payment_method": "UPI"},
    {"customer_id": 3, "items": [{"product_id": 4, "quantity": 1}, {"product_id": 3, "quantity": 1}], "discount": 2000, "tax": 18, "payment_method": "Card", "notes": "VIP customer — priority shipping"},
    {"customer_id": 4, "items": [{"product_id": 5, "quantity": 10}, {"product_id": 6, "quantity": 2}], "discount": 1000, "tax": 18, "payment_method": "Bank Transfer"},
    {"customer_id": 5, "items": [{"product_id": 8, "quantity": 1}], "discount": 0, "tax": 18, "payment_method": "Cash"},
    {"customer_id": 6, "items": [{"product_id": 2, "quantity": 3}, {"product_id": 10, "quantity": 2}], "discount": 3000, "tax": 18, "payment_method": "Card", "notes": "Express delivery requested"},
]

order_statuses = ["delivered", "shipped", "confirmed", "pending", "packed", "delivered"]
payment_statuses = ["paid", "paid", "partial", "unpaid", "paid", "paid"]


def seed():
    print("🌱 Seeding database...\n")

    print("📦 Creating products...")
    created_products = []
    for p in products:
        try:
            r = httpx.post(f"{BASE}/products", json=p, timeout=10)
            if r.status_code == 201:
                created_products.append(r.json())
                print(f"  ✓ {p['name']}")
            else:
                print(f"  ✗ {p['name']}: {r.json()}")
        except Exception as e:
            print(f"  ✗ {p['name']}: {e}")

    print(f"\n👥 Creating customers...")
    created_customers = []
    for c in customers:
        try:
            r = httpx.post(f"{BASE}/customers", json=c, timeout=10)
            if r.status_code == 201:
                created_customers.append(r.json())
                print(f"  ✓ {c['full_name']}")
            else:
                print(f"  ✗ {c['full_name']}: {r.json()}")
        except Exception as e:
            print(f"  ✗ {c['full_name']}: {e}")

    print(f"\n🛒 Creating orders...")
    for i, o in enumerate(orders):
        try:
            r = httpx.post(f"{BASE}/orders", json=o, timeout=10)
            if r.status_code == 201:
                order = r.json()
                # update status
                httpx.put(f"{BASE}/orders/{order['id']}", json={
                    "status": order_statuses[i],
                    "payment_status": payment_statuses[i],
                }, timeout=10)
                print(f"  ✓ Order #{order['order_number']} — {order_statuses[i]}")
            else:
                print(f"  ✗ Order {i+1}: {r.json()}")
        except Exception as e:
            print(f"  ✗ Order {i+1}: {e}")

    print("\n✅ Done! Open http://localhost:3000 to see your data.")


if __name__ == "__main__":
    seed()
