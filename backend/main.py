from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from database import get_connection
import uvicorn

app = FastAPI(title="School Equipment Lending Portal")

class Users(BaseModel):
    user_id: int
    username: str
    password_hash: str 
    full_name: str
    role: str  # 'student', 'staff', 'admin'
    email: str
    phone_number: str

# ✅ Get all users
@app.get("/users")
def get_users():
    conn = get_connection()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT * FROM users;")
    data = cur.fetchall()
    cur.close()
    conn.close()
    return data

# # ✅ Pydantic model
# class Equipment(BaseModel):
#     name: str
#     category: str
#     condition_status: str
#     total_quantity: int
#     available_quantity: int
#     added_by: int


# # ✅ Get all equipment
# @app.get("/equipment")
# def get_equipment():
#     conn = get_connection()
#     cur = conn.cursor(dictionary=True)
#     cur.execute("SELECT * FROM equipment;")
#     data = cur.fetchall()
#     cur.close()
#     conn.close()
#     return data


# # ✅ Add new equipment
# @app.post("/equipment")
# def add_equipment(e: Equipment):
#     conn = get_connection()
#     cur = conn.cursor()
#     cur.execute("""
#         INSERT INTO equipment (name, category, condition_status, total_quantity, available_quantity, added_by)
#         VALUES (%s, %s, %s, %s, %s, %s)
#     """, (e.name, e.category, e.condition_status, e.total_quantity, e.available_quantity, e.added_by))
#     conn.commit()
#     cur.close()
#     conn.close()
#     return {"message": "✅ Equipment added successfully"}


# # ✅ Update equipment
# @app.put("/equipment/{equipment_id}")
# def update_equipment(equipment_id: int, e: Equipment):
#     conn = get_connection()
#     cur = conn.cursor()
#     cur.execute("""
#         UPDATE equipment SET name=%s, category=%s, condition_status=%s,
#         total_quantity=%s, available_quantity=%s, added_by=%s WHERE equipment_id=%s
#     """, (e.name, e.category, e.condition_status, e.total_quantity,
#           e.available_quantity, e.added_by, equipment_id))
#     conn.commit()
#     cur.close()
#     conn.close()
#     return {"message": "✅ Equipment updated successfully"}


# # ✅ Delete equipment
# @app.delete("/equipment/{equipment_id}")
# def delete_equipment(equipment_id: int):
#     conn = get_connection()
#     cur = conn.cursor()
#     cur.execute("DELETE FROM equipment WHERE equipment_id=%s", (equipment_id,))
#     conn.commit()
#     cur.close()
#     conn.close()
#     return {"message": "🗑️ Equipment deleted successfully"}


# # ✅ Borrow Requests overview
# @app.get("/borrow_requests")
# def borrow_requests():
#     conn = get_connection()
#     cur = conn.cursor(dictionary=True)
#     cur.execute("""
#         SELECT br.request_id, u.name AS borrower, e.name AS equipment,
#                br.approval_status, br.issue_date, br.return_date
#         FROM borrow_requests br
#         JOIN users u ON br.user_id = u.user_id
#         JOIN equipment e ON br.equipment_id = e.equipment_id;
#     """)
#     data = cur.fetchall()
#     cur.close()
#     conn.close()
#     return data


# ✅ Run app directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)

# Test Checking in
