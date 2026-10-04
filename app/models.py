from pydantic import BaseModel, Field

class ReserveRequest(BaseModel):
    tier_id: str
    user_id: str
    quantity: int = Field(..., ge=1, le=2)

class CancelReservationRequest(BaseModel):
    reservation_token: str
    order_id: str

class WebhookPaymentRequest(BaseModel):
    idempotency_key: str
    order_id: str
    status: str
