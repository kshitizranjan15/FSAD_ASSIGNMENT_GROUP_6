# models.py

from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

# --- User Authentication & Roles ---

class UserBase(BaseModel):
    username: str = Field(..., max_length=100)
    full_name: str = Field(..., max_length=255)
    role: str = Field(..., pattern="^(Student|Staff|Admin)$")
    email: str = Field(..., max_length=150)
    phone_number: Optional[str] = Field(None, max_length=15)

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    phone: Optional[str] = None
    role: str

class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str

# --- Equipment Listing & Search ---

class EquipmentBase(BaseModel):
    name: str = Field(..., max_length=255)
    category_id: int
    total_quantity: int = Field(..., ge=0)
    
class EquipmentCreate(EquipmentBase):
    pass

class EquipmentDB(EquipmentBase):
    equipment_id: int
    available_quantity: int = Field(..., ge=0)
    
    class Config:
        from_attributes = True

# --- Lending Requests & Due Date Tracking ---

class LendingRequestCreate(BaseModel):
    equipment_id: int
    quantity: int = Field(..., ge=1)
    expected_return_date: date

class LendingRequestDB(LendingRequestCreate):
    request_id: int
    requester_id: int
    request_date: datetime
    status: str = Field(..., pattern="^(Pending|Approved|Issued|Rejected|Returned)$")
    borrow_date: Optional[date] = None

class OverdueNotification(BaseModel):
    request_id: int
    borrower_name: str
    requester_email: str
    equipment_name: str
    expected_return_date: date

# --- Damage/Repair Log ---

class RepairLogCreate(BaseModel):
    equipment_id: int
    damage_description: str
    
class RepairLogUpdate(BaseModel):
    repair_cost: float = Field(..., gt=0.0)
    repaired_by: str = Field(..., max_length=100)

class RepairLogDB(RepairLogCreate):
    log_id: int
    report_date: date
    repair_cost: Optional[float] = None
    repair_date: Optional[date] = None