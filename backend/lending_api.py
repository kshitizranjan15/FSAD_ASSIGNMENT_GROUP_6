# lending_api.py

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from models import LendingRequestCreate, LendingRequestDB, OverdueNotification
from database import get_connection
from auth_utils import role_required
import mysql.connector
from datetime import date

router = APIRouter(prefix="/lending", tags=["Due Date Tracking & Requests"])

# --- Request/Approve/Return (CORE) ---
@router.post("/request", response_model=LendingRequestDB, status_code=status.HTTP_201_CREATED)
def create_lending_request(request_data: LendingRequestCreate, current_user: dict = Depends(role_required(["Student", "Staff"]))):
    # ... (Implementation similar to previous response for brevity)
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        requester_id = current_user['user_id']
        
        cur.execute("SELECT available_quantity FROM equipment WHERE equipment_id = %s", (request_data.equipment_id,))
        available_data = cur.fetchone()
        
        if not available_data or available_data['available_quantity'] < request_data.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Insufficient quantity available.")

        insert_query = "INSERT INTO lending_requests (equipment_id, requester_id, request_date, expected_return_date, quantity, status) VALUES (%s, %s, NOW(), %s, %s, 'Pending')"
        params = (request_data.equipment_id, requester_id, request_data.expected_return_date, request_data.quantity)
        cur.execute(insert_query, params)
        request_id = cur.lastrowid
        conn.commit()
        
        return {"request_id": request_id, "requester_id": requester_id, "request_date": date.today(), "status": "Pending", **request_data.model_dump()}
    finally:
        if conn:
            cur.close()
            conn.close()

@router.post("/approve/{request_id}", status_code=status.HTTP_200_OK)
def approve_request(request_id: int, current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    # ... (Implementation similar to previous response for brevity)
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        approver_id = current_user['user_id']
        borrow_date = date.today()
        
        cur.execute("SELECT equipment_id, quantity FROM lending_requests WHERE request_id = %s AND status = 'Pending'", (request_id,))
        data = cur.fetchone()
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or not in 'Pending' status.")
            
        cur.execute("UPDATE lending_requests SET status = 'Issued', approver_id = %s, borrow_date = %s WHERE request_id = %s", (approver_id, borrow_date, request_id))
        cur.execute("UPDATE equipments SET available_quantity = available_quantity - %s WHERE equipment_id = %s", (data['quantity'], data['equipment_id']))
        conn.commit()
        return {"message": f"Request {request_id} approved and item issued."}
    finally:
        if conn:
            cur.close()
            conn.close()

@router.post("/return/{request_id}", status_code=status.HTTP_200_OK)
def return_request(request_id: int, current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    # ... (Implementation similar to previous response for brevity)
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        return_date = date.today()

        cur.execute("SELECT equipment_id, quantity FROM lending_requests WHERE request_id = %s AND status = 'Issued'", (request_id,))
        data = cur.fetchone()
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Request not found or not in 'Issued' status.")
            
        cur.execute("UPDATE lending_requests SET status = 'Returned', return_date = %s WHERE request_id = %s", (return_date, request_id))
        cur.execute("UPDATE equipment SET available_quantity = available_quantity + %s WHERE equipment_id = %s", (data['quantity'], data['equipment_id']))
        conn.commit()
        return {"message": f"Item from request {request_id} returned successfully."}
    finally:
        if conn:
            cur.close()
            conn.close()

# --- Due Date Tracking and automatic overdue notifications ---
@router.get("/overdue", response_model=List[OverdueNotification])
def get_overdue_loans(
    current_user: dict = Depends(role_required(["Admin", "Staff"]))
):
    """
    API for the notification system: Identifies all currently issued loans past the due date.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        
        query = """
        SELECT
            R.request_id, U.full_name AS borrower_name, U.email AS requester_email, 
            E.name AS equipment_name, R.expected_return_date
        FROM lending_requests R
        JOIN users U ON R.requester_id = U.user_id
        JOIN equipment E ON R.equipment_id = E.equipment_id
        WHERE
            R.status = 'Issued' 
            AND R.expected_return_date < CURDATE()
        """
        cur.execute(query)
        results = cur.fetchall()
        
        return results

    finally:
        if conn:
            cur.close()
            conn.close()