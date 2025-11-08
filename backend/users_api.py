from fastapi import APIRouter, HTTPException, Depends, status
from database import get_connection
from auth_utils import get_password_hash, verify_password, create_access_token
from models import UserCreate, LoginRequest, Token

router = APIRouter(prefix="/users", tags=["Users"])

# ✅ Public signup (no token required)
@router.post("/signup", response_model=dict)
def signup(user: UserCreate):
    """
    Public signup route — allows new users (student, staff, admin) to register.
    """
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        # Check if username already exists
        cur.execute("SELECT user_id FROM users WHERE username = %s", (user.username,))
        if cur.fetchone():
            raise HTTPException(status_code=400, detail="Username already exists")

        hashed_pw = get_password_hash(user.password)

        cur.execute("""
            INSERT INTO users (username, password_hash, full_name, email, phone_number, role)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (user.username, hashed_pw, user.full_name, user.email, user.phone, user.role))

        conn.commit()
        return {"message": f"User '{user.username}' created successfully!"}

    except Exception as e:
        print("Signup error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    finally:
        cur.close()
        conn.close()


# ✅ Login route — returns JWT token and user details
@router.post("/login", response_model=Token)
def login(form_data: LoginRequest):
    """
    Handles user login and returns a JWT token.
    """
    try:
        conn = get_connection()
        cur = conn.cursor(dictionary=True)

        cur.execute(
            "SELECT user_id, username, password_hash, role, full_name FROM users WHERE username = %s",
            (form_data.username,),
        )
        user = cur.fetchone()

        if not user or not verify_password(form_data.password, user["password_hash"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )

        token = create_access_token(data={"user_id": user["user_id"], "role": user["role"]})

        return {
            "access_token": token,
            "token_type": "bearer",
            "user_id": user["user_id"],
            "role": user["role"],
            "full_name": user["full_name"],
        }

    except Exception as e:
        print("Login error:", e)
        raise HTTPException(status_code=500, detail="Internal server error")

    finally:
        cur.close()
        conn.close()
