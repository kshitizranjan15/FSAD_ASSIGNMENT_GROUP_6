# users_api.py

from fastapi import APIRouter, HTTPException, Depends, status
from models import UserCreate, LoginRequest, Token, UserBase
from database import get_connection
from auth_utils import get_password_hash, verify_password, create_access_token, role_required
import mysql.connector

router = APIRouter(prefix="/users", tags=["1. User Authentication & Roles"])

@router.post("/signup", response_model=UserBase, status_code=status.HTTP_201_CREATED)
def signup(
    user: UserCreate, 
    # Only Admins can create new user accounts
    current_user: dict = Depends(role_required(["Admin"])) 
):
    """
    Creates a new user account (Student, Staff, or Admin). Requires 'Admin' access.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        hashed_password = get_password_hash(user.password)
        
        insert_query = """
        INSERT INTO users (username, password_hash, full_name, role, email, phone_number)
        VALUES (%s, %s, %s, %s, %s, %s)
        """
        params = (
            user.username, hashed_password, user.full_name, user.role, 
            user.email, user.phone_number
        )
        
        cur.execute(insert_query, params)
        conn.commit()
        
        return user.model_dump(exclude={"password"})

    except mysql.connector.IntegrityError:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username or email already registered.")
    finally:
        if conn:
            cur.close()
            conn.close()


@router.post("/login", response_model=Token)
def login_for_access_token(form_data: LoginRequest):
    """
    Handles user login and returns a JWT access token.
    """
    conn = None
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)
        
        cur.execute(
            "SELECT user_id, password_hash, role FROM users WHERE username = %s", 
            (form_data.username,)
        )
        user_data = cur.fetchone()
        
        if not user_data or not verify_password(form_data.password, user_data["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        access_token = create_access_token(
            data={"user_id": user_data["user_id"], "role": user_data["role"]}
        )
        
        return {
            "access_token": access_token, 
            "token_type": "bearer", 
            "user_id": user_data["user_id"], 
            "role": user_data["role"]
        }

    finally:
        if conn:
            cur.close()
            conn.close()