from fastapi import APIRouter, HTTPException, status
from typing import List
from database import get_connection

router = APIRouter(prefix="/equipment_category", tags=["Equipment Category"])

# Fetch all equipment categories
@router.get("/", response_model=List[dict])
def get_all_categories():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM equipment_category;")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data

# Insert new equipment category
@router.post("/", status_code=status.HTTP_201_CREATED)
def add_category(category: dict):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO equipment_category (category_name, description)
        VALUES (%s, %s)
        """,
        (category['category_name'], category['description'])
    )
    conn.commit()
    category_id = cur.lastrowid
    cur.close()
    conn.close()
    return {"category_id": category_id, **category}

# Update equipment category
@router.put("/{category_id}", status_code=status.HTTP_200_OK)
def update_category(category_id: int, category: dict):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        """
        UPDATE equipment_category SET category_name=%s, description=%s
        WHERE category_id=%s
        """,
        (category['category_name'], category['description'], category_id)
    )
    conn.commit()
    cur.close()
    conn.close()
    return {"message": f"Category with ID {category_id} updated successfully."}

# Delete equipment category
@router.delete("/{category_id}", status_code=status.HTTP_200_OK)
def delete_category(category_id: int):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("DELETE FROM equipment_category WHERE category_id=%s", (category_id,))
    conn.commit()
    cur.close()
    conn.close()
    return {"message": f"Category with ID {category_id} deleted successfully."}