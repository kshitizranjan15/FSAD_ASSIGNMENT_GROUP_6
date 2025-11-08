from fastapi import APIRouter, HTTPException, Depends, status, Query, Body
from typing import List, Optional
from models import LendingRequestCreate, LendingRequestDB, OverdueNotification
from database import get_connection
from auth_utils import role_required
import mysql.connector
from datetime import date

router = APIRouter(prefix="/lending", tags=["Due Date Tracking & Requests"])

def _row_to_request(row: dict) -> LendingRequestDB:
    return {
        "request_id": row.get("request_id"),
        "equipment_id": row.get("equipment_id"),
        "requester_id": row.get("requester_id"),
        "request_date": row.get("request_date"),
        "expected_return_date": row.get("expected_return_date"),
        "quantity": row.get("quantity"),
        "status": row.get("status"),
    }


@router.post("/request", response_model=LendingRequestDB, status_code=status.HTTP_201_CREATED)
def create_lending_request(request_data: LendingRequestCreate, current_user: dict = Depends(role_required(["Student", "Staff"]))):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        requester_id = current_user['user_id']

        cur.execute("SELECT available_quantity FROM equipment WHERE equipment_id = %s",
                    (request_data.equipment_id,))
        available_data = cur.fetchone()

        if not available_data or available_data['available_quantity'] < request_data.quantity:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Insufficient quantity available.")

        insert_query = """
            INSERT INTO lending_requests 
              (equipment_id, requester_id, request_date, expected_return_date, quantity, status)
            VALUES (%s, %s, NOW(), %s, %s, 'Pending')
        """
        params = (request_data.equipment_id, requester_id,
                  request_data.expected_return_date, request_data.quantity)
        cur.execute(insert_query, params)
        request_id = cur.lastrowid
        conn.commit()

        return {
            "request_id": request_id,
            "equipment_id": request_data.equipment_id,
            "requester_id": requester_id,
            "request_date": date.today().isoformat(),
            "expected_return_date": request_data.expected_return_date,
            "quantity": request_data.quantity,
            "status": "Pending"
        }
    finally:
        if conn:
            cur.close()
            conn.close()


@router.post("/approve/{request_id}", status_code=status.HTTP_200_OK)
def approve_request(request_id: int, current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        approver_id = current_user['user_id']
        borrow_date = date.today()

        cur.execute(
            "SELECT equipment_id, quantity FROM lending_requests WHERE request_id = %s AND status = 'Pending'", (request_id,))
        data = cur.fetchone()
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Request not found or not in 'Pending' status.")

        cur.execute(
            "SELECT available_quantity FROM equipment WHERE equipment_id = %s", (data['equipment_id'],))
        equip = cur.fetchone()
        if not equip or equip['available_quantity'] < data['quantity']:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Insufficient quantity available to approve this request.")

        cur.execute("UPDATE lending_requests SET status = 'Issued', approver_id = %s, borrow_date = %s WHERE request_id = %s",
                    (approver_id, borrow_date, request_id))
        cur.execute("UPDATE equipment SET available_quantity = available_quantity - %s WHERE equipment_id = %s",
                    (data['quantity'], data['equipment_id']))
        conn.commit()
        return {"message": f"Request {request_id} approved and item issued."}
    finally:
        if conn:
            cur.close()
            conn.close()


@router.post("/reject/{request_id}", status_code=status.HTTP_200_OK)
def reject_request(request_id: int, payload: dict = Body(...), current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    """
    Mark a Pending request as Rejected and store a rejection reason.
    Expects JSON body: { "reason": "Insufficient stock", ... }
    """
    reason = None
    if isinstance(payload, dict):
        reason = payload.get("reason")
    if reason is not None:
        reason = str(reason)[:1000]

    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute(
            "SELECT status FROM lending_requests WHERE request_id = %s", (request_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
        if row['status'] != 'Pending':
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                                detail="Only requests in 'Pending' status can be rejected.")

        try:
            cur.execute(
                "UPDATE lending_requests SET status = 'Rejected', approver_id = %s, rejection_reason = %s WHERE request_id = %s",
                (current_user['user_id'], reason, request_id)
            )
        except mysql.connector.errors.ProgrammingError:
            cur.execute(
                "UPDATE lending_requests SET status = 'Rejected', approver_id = %s WHERE request_id = %s",
                (current_user['user_id'], request_id)
            )

        conn.commit()
        return {"message": f"Request {request_id} rejected.", "rejection_reason": reason}
    finally:
        if conn:
            cur.close()
            conn.close()


@router.post("/return/{request_id}", status_code=status.HTTP_200_OK)
def return_request(request_id: int, current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        return_date = date.today()

        cur.execute(
            "SELECT equipment_id, quantity FROM lending_requests WHERE request_id = %s AND status = 'Issued'", (request_id,))
        data = cur.fetchone()
        if not data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                                detail="Request not found or not in 'Issued' status.")

        cur.execute("UPDATE lending_requests SET status = 'Returned', return_date = %s WHERE request_id = %s",
                    (return_date, request_id))
        cur.execute("UPDATE equipment SET available_quantity = available_quantity + %s WHERE equipment_id = %s",
                    (data['quantity'], data['equipment_id']))
        conn.commit()
        return {"message": f"Item from request {request_id} returned successfully."}
    finally:
        if conn:
            cur.close()
            conn.close()


@router.get("/overdue", response_model=List[OverdueNotification])
def get_overdue_loans(
    current_user: dict = Depends(role_required(["Admin", "Staff"]))
):
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


@router.get("/", response_model=List[LendingRequestDB])
def list_all_requests(current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    """
    Return all lending requests (admin/staff).
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT * FROM lending_requests ORDER BY request_date DESC")
        rows = cur.fetchall()
        return [_row_to_request(r) for r in rows]
    finally:
        if conn:
            cur.close()
            conn.close()


@router.get("/requests", response_model=List[LendingRequestDB])
def list_requests_by_status(status: Optional[str] = Query(None, title="status", description="Filter by request status"), current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    """
    If status is provided, return requests that match; otherwise return all requests.
    Example: /lending/requests?status=Pending
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        if status:
            cur.execute(
                "SELECT * FROM lending_requests WHERE status = %s ORDER BY request_date DESC", (status,))
        else:
            cur.execute(
                "SELECT * FROM lending_requests ORDER BY request_date DESC")
        rows = cur.fetchall()
        return [_row_to_request(r) for r in rows]
    finally:
        if conn:
            cur.close()
            conn.close()


@router.get("/{request_id}", response_model=LendingRequestDB)
def get_request(request_id: int, current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT * FROM lending_requests WHERE request_id = %s", (request_id,))
        row = cur.fetchone()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Request not found.")
        return _row_to_request(row)
    finally:
        if conn:
            cur.close()
            conn.close()
