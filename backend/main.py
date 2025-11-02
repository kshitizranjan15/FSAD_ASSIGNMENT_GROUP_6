# main.py - UPDATED WITH CORS SUPPORT

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv()

# --- Import Routers ---
from users_api import router as users_router
from equipment_api import router as equipment_router
from lending_api import router as lending_router
from analytics_api import router as analytics_router

# --- Initialize FastAPI App ---
app = FastAPI(title="School Equipment Lending Portal")

# ✅ --- Enable CORS Middleware ---
# Allow your frontend (React) to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",     # React dev server
        "http://127.0.0.1:3000",     # Alternate localhost
        "https://your-production-domain.com"  # (Optional) Add your deployed frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],   # Allows GET, POST, PUT, DELETE, OPTIONS, etc.
    allow_headers=["*"],   # Allows all headers including Authorization
)

# --- Include Routers ---
app.include_router(users_router)
app.include_router(equipment_router)
app.include_router(lending_router)
app.include_router(analytics_router)

# --- Base route for status check ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the School Equipment Lending Portal API. Check /docs for endpoints."}

# --- Run app directly ---
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
