# analytics_api.py

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
from models import RepairLogCreate, RepairLogDB, RepairLogUpdate
from database import get_connection
from auth_utils import role_required, get_current_user
import mysql.connector

router = APIRouter(prefix="/analytics", tags=["History, Analytics & Maintenance"])

# --- Request History and Usage Analytics ---
@router.get("/usage/top-requested")
def get_top_requested(current_user: dict = Depends(role_required(["Admin"]))):
    """Analytics: Top 5 most requested equipment based on total quantity borrowed."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        query = """
        SELECT E.name AS equipment_name, SUM(R.quantity) AS total_units_borrowed
        FROM LENDING_REQUESTS R JOIN EQUIPMENT E ON R.equipment_id = E.equipment_id
        GROUP BY E.equipment_id, E.name ORDER BY total_units_borrowed DESC LIMIT 5;
        """
        cur.execute(query)
        return cur.fetchall()
    finally:
        if conn: cur.close(); conn.close()

@router.get("/usage/average-duration")
def get_average_duration(current_user: dict = Depends(role_required(["Admin"]))):
    """Analytics: Average loan duration for returned equipment."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        query = """
        SELECT E.name AS equipment_name, AVG(DATEDIFF(R.return_date, R.borrow_date)) AS avg_loan_duration_days
        FROM LENDING_REQUESTS R JOIN EQUIPMENT E ON R.equipment_id = E.equipment_id
        WHERE R.status = 'Returned' AND R.borrow_date IS NOT NULL AND R.return_date IS NOT NULL
        GROUP BY E.name ORDER BY avg_loan_duration_days DESC;
        """
        cur.execute(query)
        return cur.fetchall()
    finally:
        if conn: cur.close(); conn.close()


# --- Damage/Repair Log for equipment maintenance ---

@router.post("/repair-log", response_model=RepairLogDB, status_code=status.HTTP_201_CREATED)
def log_damage(log_data: RepairLogCreate, current_user: dict = Depends(get_current_user)):
    """Logs a damage report for an equipment type. Any user can report damage."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        insert_query = "INSERT INTO REPAIR_LOG (equipment_id, damage_description, reported_by_user_id, report_date) VALUES (%s, %s, %s, CURDATE())"
        params = (log_data.equipment_id, log_data.damage_description, current_user['user_id'])
        cur.execute(insert_query, params)
        log_id = cur.lastrowid
        conn.commit()
        return {"log_id": log_id, "reported_by_user_id": current_user['user_id'], "report_date": date.today(), **log_data.model_dump()}
    finally:
        if conn: cur.close(); conn.close()


@router.put("/repair-log/{log_id}", status_code=status.HTTP_200_OK)
def complete_repair(log_id: int, update_data: RepairLogUpdate, current_user: dict = Depends(role_required(["Admin", "Staff"]))):
    """Staff/Admin marks a repair log as completed."""
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        update_query = "UPDATE REPAIR_LOG SET repair_cost = %s, repaired_by = %s, repair_date = CURDATE() WHERE log_id = %s AND repair_date IS NULL"
        params = (update_data.repair_cost, update_data.repaired_by, log_id)
        cur.execute(update_query, params)
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Repair log not found or already completed.")
        return {"message": f"Repair log {log_id} marked as completed."}
    finally:
        if conn: cur.close(); conn.close()