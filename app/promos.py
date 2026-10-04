from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

promo_router = APIRouter(prefix="/api/v1/promos", tags=["Promo & Vouchers"])

class PromoValidateRequest(BaseModel):
    code: str = Field(..., min_length=2, max_length=20)
    subtotal: float = Field(..., ge=0)

VALID_PROMOS = {
    "WAR50K": {"type": "fixed", "value": 50000, "desc": "Potongan Langsung Rp 50.000 Flash-Sale"},
    "LIBURLAND": {"type": "percent", "value": 0.10, "desc": "Diskon 10% Liburland Festival Stage"},
    "FREEFEE": {"type": "fixed", "value": 5000, "desc": "Bebas Biaya Platform Concurrency"}
}

@promo_router.post("/validate")
async def validate_promo(payload: PromoValidateRequest):
    code_upper = payload.code.strip().upper()
    promo = VALID_PROMOS.get(code_upper)

    if not promo:
        raise HTTPException(status_code=404, detail="Kode promo tidak valid atau sudah kedaluwarsa.")

    discount = 0.0
    if promo["type"] == "fixed":
        discount = min(promo["value"], payload.subtotal)
    elif promo["type"] == "percent":
        discount = round(payload.subtotal * promo["value"], 2)

    return {
        "valid": True,
        "code": code_upper,
        "discount_amount": discount,
        "description": promo["desc"],
        "final_subtotal": max(0.0, payload.subtotal - discount)
    }
