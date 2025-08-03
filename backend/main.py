from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel,EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float,Boolean,Text,Date
from sqlalchemy.orm import declarative_base  
from sqlalchemy.orm import sessionmaker, Session
from fastapi.responses import FileResponse
import pdfkit
from datetime import date
import os, time
from passlib.context import CryptContext
from typing import Optional
from fastapi.staticfiles import StaticFiles

DATABASE_URL = "postgresql://postgres:ran123@localhost/student_portal"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Student(Base):
    __tablename__ = "students"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True)
    gender = Column(String, nullable=False)
    department=Column(String)
    year=Column(Integer)
    quota=Column(String)
    batch=Column(Integer)

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True,unique=True, index=True)
    hashed_password = Column(String)
    is_admin = Column(Boolean, default=False)
    
class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    phone = Column(String, unique=True)
    

    dob = Column(Date, nullable=True)               # New field
    experience = Column(Integer, nullable=True)     # New field (years)
    date_of_joining = Column(Date, nullable=True)

Base.metadata.create_all(bind=engine)

class TeacherBase(BaseModel):
    name: str
    email: EmailStr
    department: str
    subject: str
    phone: str
    dob: Optional[date] = None
    experience: Optional[int] = None
    date_of_joining: Optional[date] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherOut(TeacherBase):
    id: int
class StudentCreate(BaseModel):
    id: str
    name: str
    email: str
    gender: str
    department: str
    year: int
    quota: str
    batch: int

class StudentUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    department: str | None = None
    year: int | None = None

class StudentResponse(StudentCreate):
    class Config:
        from_attributes = True


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Simple admin login - hardcoded for demo
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

@app.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if password==User.hashed_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.is_admin:
        return {"role": "admin", "message": "Admin login successful"}
    else:
        return {"role": "student", "message": "Student login successful"}
    
@app.post("/admin/add_student", response_model=StudentResponse)
def add_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.get("/admin/students")
def get_students(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    return students

@app.put("/admin/update_student/{student_id}")
def update_student(student_id: str, student: StudentUpdate, db: Session = Depends(get_db)):
    db_student = db.query(Student).filter(Student.id == student_id).first()
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    for key, value in student.dict(exclude_unset=True).items():
        setattr(db_student, key, value)
    db.commit()
    db.refresh(db_student)
    return db_student

@app.delete("/admin/delete_student/{student_id}")
def delete_student(student_id: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    db.delete(student)
    db.commit()
    return {"message": "Student deleted"}

@app.get("/api/teachers/by-email/{email}", response_model=TeacherOut)
def get_teacher_by_email(email: str, db: Session = Depends(get_db)):
    print(email)
    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

@app.get("/student/{email}")
def get_student(email: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

import pdfkit

config = pdfkit.configuration(wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")  # update path

@app.get("/student/{email}/pdf")
def generate_pdf(email: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    grade = get_grade(student.marks)
    html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; }}
            h1 {{ color: #007bff; }}
            p {{ font-size: 18px; }}
        </style>
    </head>
    <body>
        <h1>Marksheet</h1>
        <p><b>Name:</b> {student.name}</p>
        <p><b>Email:</b> {student.email}</p>
        <p><b>Marks:</b> {student.marks}</p>
        <p><b>Grade:</b> {grade}</p>
    </body>
    </html>
    """

    filename = f"{student.name}_{int(time.time())}.pdf"

    try:
        pdfkit.from_string(html, filename, configuration=config)
    except OSError as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {e}")

    if not os.path.exists(filename):
        raise HTTPException(status_code=500, detail="PDF file was not created")

    return FileResponse(path=filename, media_type='application/pdf', filename=filename)

def get_grade(marks: float) -> str:
    if marks >= 90: return "A+"
    if marks >= 75: return "A"
    if marks >= 60: return "B"
    if marks >= 45: return "C"
    return "F"
