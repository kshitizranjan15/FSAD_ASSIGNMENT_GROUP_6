# equipment_api.py

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import List, Optional
from models import EquipmentDB
from database import get_connection
from auth_utils import get_current_user

router = APIRouter(prefix="/equipment", tags=["2. Dashboard & Search"])

@router.get("/", response_model=List[EquipmentDB])
def list_equipment(
    current_user: dict = Depends(get_current_user), # Any authenticated user can view
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    search_term: Optional[str] = Query(None, description="Search by equipment name"),
):
    """
    Lists all available equipment. Can be filtered by category or searched by name.
    Accessible by Student, Staff, and Admin.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        
        query = """
        SELECT 
            E.equipment_id, E.name, E.category_id, E.total_quantity, E.available_quantity
        FROM 
            equipment E
        JOIN 
            equipment_category C ON E.category_id = C.category_id
        WHERE 
            E.available_quantity > 0 
        """
        params = []
        
        if category_id is not None:
            query += " AND E.category_id = %s"
            params.append(category_id)
        
        if search_term:
            query += " AND E.name LIKE %s"
            search_like = f"%{search_term}%"
            params.append(search_like)
            
        cur.execute(query, tuple(params))
        results = cur.fetchall()
        
        return results

    except Exception as e:
        print(f"Error listing equipment: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Server error retrieving equipment list.")
    finally:
        if conn:
            cur.close()
            conn.close()

# Fetch all equipment
@router.get("/", response_model=List[dict])
def get_all_equipment():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM equipment;")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data

# Insert new equipment
@router.post("/", status_code=status.HTTP_201_CREATED)
def add_equipment(equipment: dict):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO equipment (name, category_id, total_quantity, available_quantity)
        VALUES (%s, %s, %s, %s)
        """,
        (equipment['name'], equipment['category_id'], equipment['total_quantity'], equipment['total_quantity'])
    )
    conn.commit()
    equipment_id = cur.lastrowid
    cur.close()
    conn.close()
    return {**equipment, "equipment_id": equipment_id, "available_quantity": equipment['total_quantity']}

# Update equipment
@router.put("/{equipment_id}", status_code=status.HTTP_200_OK)
def update_equipment(equipment_id: int, equipment: dict):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE equipment SET name=%s, category_id=%s, total_quantity=%s, available_quantity=%s
        WHERE equipment_id=%s
        """,
        (equipment['name'], equipment['category_id'], equipment['total_quantity'], equipment['available_quantity'], equipment_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": f"Equipment with ID {equipment_id} updated successfully."}

# Delete equipment
@router.delete("/{equipment_id}", status_code=status.HTTP_200_OK)
def delete_equipment(equipment_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM equipment WHERE equipment_id=%s", (equipment_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": f"Equipment with ID {equipment_id} deleted successfully."}