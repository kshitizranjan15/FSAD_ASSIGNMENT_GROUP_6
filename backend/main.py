# main.py - UPDATED TO USE MODULAR ROUTERS

from fastapi import FastAPI
import uvicorn
from dotenv import load_dotenv

# --- Load Environment Variables ---
load_dotenv()

# --- Import Routers ---
from users_api import router as users_router
from equipment_api import router as equipment_router
from equipment_category_api import router as equipment_category_router
from lending_api import router as lending_router
from analytics_api import router as analytics_router

app = FastAPI(title="School Equipment Lending Portal")

# --- Include Routers ---
app.include_router(users_router)
app.include_router(equipment_router)
app.include_router(equipment_category_router)
app.include_router(lending_router)
app.include_router(analytics_router)

# --- Base route for status check ---
@app.get("/")
def read_root():
    return {"message": "Welcome to the School Equipment Lending Portal API. Check /docs for endpoints."}

# ✅ Run app directly
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)