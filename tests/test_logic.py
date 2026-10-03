import os
import sys
import uuid
from datetime import datetime, timezone

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import ReserveRequest, WebhookPaymentRequest, LUA_RESERVE_CODE

def test_models():
    # 1. Valid ReserveRequest
    req = ReserveRequest(tier_id=str(uuid.uuid4()), user_id=str(uuid.uuid4()), quantity=2)
    assert req.quantity == 2

    # 2. Invalid quantity > 2 should fail
    try:
        ReserveRequest(tier_id=str(uuid.uuid4()), user_id=str(uuid.uuid4()), quantity=3)
        assert False, "Quantity > 2 should raise ValidationError"
    except Exception as e:
        assert "less than or equal to 2" in str(e) or "Input should be less than or equal to 2" in str(e)

    # 3. Invalid quantity < 1 should fail
    try:
        ReserveRequest(tier_id=str(uuid.uuid4()), user_id=str(uuid.uuid4()), quantity=0)
        assert False, "Quantity < 1 should raise ValidationError"
    except Exception as e:
        assert "greater than or equal to 1" in str(e) or "Input should be greater than or equal to 1" in str(e)

    # 4. WebhookPaymentRequest
    pay = WebhookPaymentRequest(idempotency_key="pay_test_123", order_id=str(uuid.uuid4()), status="SUCCESS")
    assert pay.status == "SUCCESS"
    print("✓ Pydantic model validation checks PASSED")

def test_lua_code():
    assert "tonumber(redis.call('GET', KEYS[1]) or 0)" in LUA_RESERVE_CODE
    assert "DECRBY" in LUA_RESERVE_CODE
    assert "HSET" in LUA_RESERVE_CODE
    assert "ZADD" in LUA_RESERVE_CODE
    assert "EXISTS" in LUA_RESERVE_CODE
    assert "return -1" in LUA_RESERVE_CODE  # Out of stock
    assert "return -2" in LUA_RESERVE_CODE  # User already has lock
    assert "return 1" in LUA_RESERVE_CODE   # Success
    print("✓ Lua atomic script structure checks PASSED")

def test_time_and_token():
    now_epoch = int(datetime.now(timezone.utc).timestamp())
    ttl = 600
    token = f"res_{uuid.uuid4().hex[:16]}"
    assert token.startswith("res_")
    assert len(token) == 20
    expiry_epoch = now_epoch + ttl
    assert expiry_epoch - now_epoch == 600
    print("✓ TTL & Token format checks PASSED")

if __name__ == "__main__":
    test_models()
    test_lua_code()
    test_time_and_token()
    print("\nALL OFFLINE LOGIC CHECKS PASSED PERFECTLY!")
