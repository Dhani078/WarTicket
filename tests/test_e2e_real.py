import urllib.request
import json
import uuid

BASE = "http://127.0.0.1:8000"

def get(path):
    req = urllib.request.Request(f"{BASE}{path}")
    with urllib.request.urlopen(req) as res:
        return res.status, json.loads(res.read().decode("utf-8"))

def post(path, body):
    data = json.dumps(body).encode("utf-8")
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req) as res:
            return res.status, json.loads(res.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode("utf-8"))

def run():
    print("--- 1. Testing Catalog & Live DB Connection ---")
    st, cat = get("/api/v1/events/active")
    assert st == 200
    print(f"✓ Event Title: {cat['title']}")
    ga_tier = [t for t in cat["tiers"] if "General" in t["name"]][0]
    initial_ga_stock = ga_tier["available_stock"]
    print(f"✓ GA Stock Available: {initial_ga_stock}")

    print("\n--- 2. Testing UUID Validation Pre-flight (422) ---")
    st, err = post("/api/v1/tickets/reserve", {"tier_id": "not-a-uuid", "user_id": "invalid", "quantity": 1})
    assert st == 422
    print(f"✓ Malformed UUID rejected cleanly with HTTP {st}")

    print("\n--- 3. Testing Valid Ticket Reservation ---")
    user_1 = str(uuid.uuid4())
    st, res1 = post("/api/v1/tickets/reserve", {"tier_id": ga_tier["id"], "user_id": user_1, "quantity": 1})
    assert st == 201
    order_id = res1["data"]["order_id"]
    token = res1["data"]["reservation_token"]
    print(f"✓ Reservation Created: Order {order_id}, Token {token}")

    print("\n--- 4. Testing User Double-Reservation Lock (-2 / 429) ---")
    st, res2 = post("/api/v1/tickets/reserve", {"tier_id": ga_tier["id"], "user_id": user_1, "quantity": 1})
    assert st == 429
    print(f"✓ Duplicate reservation blocked cleanly with HTTP {st}: {res2['detail']}")

    print("\n--- 5. Testing Instant Cancellation & Stock Restoral ---")
    st, cancel_res = post("/api/v1/tickets/cancel", {"order_id": order_id, "reservation_token": token})
    assert st == 200
    print(f"✓ Order cancelled: {cancel_res['status']}")
    st, cat2 = get("/api/v1/events/active")
    ga_tier2 = [t for t in cat2["tiers"] if t["id"] == ga_tier["id"]][0]
    assert ga_tier2["available_stock"] == initial_ga_stock
    print(f"✓ Stock restored to exact original: {ga_tier2['available_stock']}")

    print("\n--- 6. Testing Successful Payment Webhook & Idempotency ---")
    user_2 = str(uuid.uuid4())
    st, res3 = post("/api/v1/tickets/reserve", {"tier_id": ga_tier["id"], "user_id": user_2, "quantity": 1})
    assert st == 201
    order_id_2 = res3["data"]["order_id"]
    token_2 = res3["data"]["reservation_token"]

    idem_key = f"pay_test_{uuid.uuid4().hex[:12]}"
    st, pay_res = post("/api/v1/webhooks/payment", {"idempotency_key": idem_key, "order_id": order_id_2, "status": "SUCCESS"})
    assert st == 200 and pay_res["status"] == "processed"
    print(f"✓ Payment processed: {pay_res}")

    # Duplicate webhook with same idempotency key
    st, dup_res = post("/api/v1/webhooks/payment", {"idempotency_key": idem_key, "order_id": order_id_2, "status": "SUCCESS"})
    assert st == 200 and dup_res["status"] == "ignored"
    print(f"✓ Duplicate webhook ignored safely: {dup_res}")

    print("\n--- 7. Testing Order Detail Verification ---")
    st, ord_det = get(f"/api/v1/orders/{order_id_2}")
    assert st == 200 and ord_det["status"] == "PAID"
    print(f"✓ Verified in Neon PostgreSQL: Status = {ord_det['status']}, Total = Rp {ord_det['total_amount']:,.0f}")

    print("\n=======================================================")
    print("ALL 7 END-TO-END CRITICAL TESTS PASSED 100% PERFECTLY!")
    print("=======================================================")

if __name__ == "__main__":
    run()
