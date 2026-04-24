from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from contextlib import contextmanager
import mysql.connector
import os
from datetime import datetime

app = FastAPI(title="FastAPI Backend", version="1.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
db_config = {
    "host": os.getenv("DB_HOST", "mysql"),
    "user": os.getenv("DB_USER", "capstone_user"),
    "password": os.getenv("DB_PASSWORD", "capstone123"),
    "database": os.getenv("DB_NAME", "capstone_db"),
}

@contextmanager
def get_db_connection():
    conn = mysql.connector.connect(**db_config)
    try:
        yield conn
    finally:
        conn.close()

class UserCreate(BaseModel):
    name: str
    email: str

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "backend": "FastAPI",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/users")
async def get_users():
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor(dictionary=True)
            cursor.execute("SELECT id, name, email, created_at FROM users ORDER BY id DESC")
            users = cursor.fetchall()
            return users
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/users")
async def create_user(user: UserCreate):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "INSERT INTO users (name, email, created_at) VALUES (%s, %s, NOW())",
                (user.name, user.email)
            )
            conn.commit()
            user_id = cursor.lastrowid
            return {
                "id": user_id,
                "name": user.name,
                "email": user.email,
                "created_at": datetime.now().isoformat()
            }
    except mysql.connector.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/users/{user_id}")
async def delete_user(user_id: int):
    try:
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("DELETE FROM users WHERE id = %s", (user_id,))
            conn.commit()
            if cursor.rowcount == 0:
                raise HTTPException(status_code=404, detail="User not found")
            return {"message": "User deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
