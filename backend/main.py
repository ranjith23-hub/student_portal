from fastapi import FastAPI, HTTPException, Depends, Request, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse, FileResponse
from pydantic import BaseModel, EmailStr
from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, Date
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import pdfkit
from datetime import date
import os, time
from flask import Flask, request, jsonify
from typing import Optional, List
from fastapi.staticfiles import StaticFiles
import logging
import smtplib
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders

SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USERNAME = "ranjithkumar.official.23@gmail.com"
SMTP_PASSWORD = "pwcq xeme slst hapv"

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATABASE_URL = "postgresql://postgres:ran123@localhost/student_portal1"

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

# Database Models
class Student(Base):
    __tablename__ = "students"
    id = Column(String, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True)
    gender = Column(String, nullable=False)
    department = Column(String)
    year = Column(Integer)
    quota = Column(String)
    batch = Column(Integer)
    marks = Column(Float, nullable=True)

class User(Base):
    __tablename__ = "users"
    email = Column(String, primary_key=True, unique=True, index=True)
    password = Column(String)
    is_admin = Column(Boolean, default=False)

class Teacher(Base):
    __tablename__ = "teachers"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String, nullable=False, index=True)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    subject = Column(String, nullable=False)
    phone = Column(String, unique=True)
    dob = Column(Date, nullable=True)
    experience = Column(Integer, nullable=True)
    date_of_joining = Column(Date, nullable=True)

class cn(Base):
    __tablename__ = "cn"
    roll_no = Column(String, primary_key=True, index=True)
    total = Column(Integer, default=0)
    attended = Column(Integer, default=0)

class se(Base):
    __tablename__ = "se"
    roll_no = Column(String, primary_key=True, index=True)
    total = Column(Integer, default=0)
    attended = Column(Integer, default=0)
class cd(Base):
    __tablename__ = "cd"
    roll_no = Column(String, primary_key=True, index=True)
    total = Column(Integer, default=0)
    attended = Column(Integer, default=0)
class js(Base):
    __tablename__ = "js"
    roll_no = Column(String, primary_key=True, index=True)
    total = Column(Integer, default=0)
    attended = Column(Integer, default=0)
class cloud(Base):
    __tablename__ = "cloud"
    roll_no = Column(String, primary_key=True, index=True)
    total = Column(Integer, default=0)
    attended = Column(Integer, default=0)


class Marks(Base):
    __tablename__ = "marks"
    roll_no = Column(String, primary_key=True, index=True)
    cn_marks = Column(Float, nullable=True)
    se_marks = Column(Float, nullable=True)
    cd_marks = Column(Float, nullable=True)
    js_marks = Column(Float, nullable=True)
    cloud_marks = Column(Float, nullable=True)

# Pydantic model for marks input (unchanged)
class MarksCreate(BaseModel):
    roll_no: str
    cn_marks: Optional[float] = None
    se_marks: Optional[float] = None
    cd_marks: Optional[float] = None
    js_marks: Optional[float] = None
    cloud_marks: Optional[float] = None

Base.metadata.create_all(bind=engine)

# Pydantic Models

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

class MarkEntry(BaseModel):
    roll_no: str
    marks: float

class MarksUpdate(BaseModel):
    subject: str
    marks: List[MarkEntry]

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class AttendanceRecord(BaseModel):
    student_id: int
    status: str

class AttendancePayload(BaseModel):
    subject: str
    hours: int
    records: list[AttendanceRecord]

SUBJECT_TABLES = {
    "cn": cn,
    "se": se,
    "cd": cd,
    "js": js,
    "cloud": cloud
}


@app.get("/attendance/{roll_no}")
def get_attendance(roll_no: str, db: Session = Depends(get_db)):
    result = {}

    for subject, table in SUBJECT_TABLES.items():
        attendance = db.query(table).filter(table.roll_no == roll_no).first()
        if attendance:
            result[subject] = {
                "attended": attendance.attended,
                "total": attendance.total
            }
        else:
            result[subject] = {
                "attended": 0,
                "total": 0
            }

    return {"roll_no": roll_no, "attendance": result}


@app.post("/admin/attendance/bulk")
def submit_attendance(payload: AttendancePayload, db: Session = Depends(get_db)):
    subject = payload.subject.lower()
    if subject not in SUBJECT_TABLES:
        raise HTTPException(status_code=400, detail="Invalid subject")

    table = SUBJECT_TABLES[subject]
    print(payload)
    for record in payload.records:
        roll_no = str(record.student_id)
        attendance = db.query(table).filter(table.roll_no == roll_no).first()

        if not attendance:
            attendance = table(roll_no=roll_no, total=0, attended=0)
            db.add(attendance)

        attendance.total = (attendance.total or 0) + payload.hours
        if record.status == "Present":
            attendance.attended = (attendance.attended or 0) + payload.hours

    db.commit()
    return {"message": f"Attendance updated for {subject.upper()}"}


@app.post("/login")
def login(
    email: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if password != user.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if user.is_admin:
        return {"role": "admin", "message": "Admin login successful"}
    else:
        return {"role": "student", "message": "Student login successful"}

# Student Management
@app.post("/admin/add_student", response_model=StudentResponse)
def add_student(student: StudentCreate, db: Session = Depends(get_db)):
    db_student = Student(**student.dict())
    db_user = User(email=student.email, password="password", is_admin=False)
    db.add(db_user)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    db_marks = Marks(roll_no=student.id)
    db.add(db_marks)
    db.commit()
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

# Teacher
@app.get("/api/teachers/by-email/{email}", response_model=TeacherOut)
def get_teacher_by_email(email: str, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.email == email).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    return teacher

# Student Dashboard
@app.get("/student/{email}")
def get_student(email: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    marks = db.query(Marks).filter(Marks.roll_no == student.id).first()
    return {
        "id": student.id,
        "name": student.name,
        "email": student.email,
        "gender": student.gender,
        "department": student.department,
        "year": student.year,
        "quota": student.quota,
        "batch": student.batch,
        "marks": {
            "cn": marks.cn_marks if marks else None,
            "se": marks.se_marks if marks else None,
            "cd": marks.cd_marks if marks else None,
            "js": marks.js_marks if marks else None,
            "cloud": marks.cloud_marks if marks else None
        }
    }

# PDF Generation
config = pdfkit.configuration(wkhtmltopdf=r"C:\Program Files\wkhtmltopdf\bin\wkhtmltopdf.exe")

@app.get("/student/{email}/pdf")
def generate_pdf(email: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.email == email).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    marks = db.query(Marks).filter(Marks.roll_no == student.id).first()
    html = f"""
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{ font-family: Arial, sans-serif; }}
            h1 {{ color: #007bff; }}
            p {{ font-size: 18px; }}
            table {{ border-collapse: collapse; width: 50%; margin-top: 20px; }}
            th, td {{ border: 1px solid #ddd; padding: 8px; text-align: left; }}
            th {{ background-color: #f2f2f2; }}
        </style>
    </head>
    <body>
        <h1>Marksheet</h1>
        <p><b>Name:</b> {student.name}</p>
        <p><b>Email:</b> {student.email}</p>
        <table>
            <tr><th>Subject</th><th>Marks</th></tr>
            <tr><td>CN</td><td>{marks.cn_marks if marks and marks.cn_marks is not None else 'N/A'}</td></tr>
            <tr><td>SE</td><td>{marks.se_marks if marks and marks.se_marks is not None else 'N/A'}</td></tr>
            <tr><td>CD</td><td>{marks.cd_marks if marks and marks.cd_marks is not None else 'N/A'}</td></tr>
            <tr><td>JS</td><td>{marks.js_marks if marks and marks.js_marks is not None else 'N/A'}</td></tr>
            <tr><td>Cloud</td><td>{marks.cloud_marks if marks and marks.cloud_marks is not None else 'N/A'}</td></tr>
        </table>
        <p><b>Overall Grade:</b> {get_grade(sum([m for m in [marks.cn_marks, marks.se_marks, marks.cd_marks, marks.js_marks, marks.cloud_marks] if m is not None]) / 5 if marks and any(m is not None for m in [marks.cn_marks, marks.se_marks, marks.cd_marks, marks.js_marks, marks.cloud_marks]) else 'N/A')}</p>
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

# Attendance
@app.get("/attendance/{roll_no}")
def get_attendance_percentage(roll_no: str, db: Session = Depends(get_db)):
    attendance = db.query(Attendance).filter(Attendance.roll_no == roll_no).first()
    if not attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    subjects = {
        "cn": {"total": attendance.cn_total, "attended": attendance.cn_attended},
        "se": {"total": attendance.se_total, "attended": attendance.se_attended},
        "cd": {"total": attendance.cd_total, "attended": attendance.cd_attended},
        "js": {"total": attendance.js_total, "attended": attendance.js_attended},
        "cloud": {"total": attendance.cloud_total, "attended": attendance.cloud_attended}
    }
    
    total_classes = sum(sub["total"] for sub in subjects.values())
    attended_classes = sum(sub["attended"] for sub in subjects.values())
    
    if total_classes == 0:
        raise HTTPException(status_code=400, detail="No classes available to calculate attendance")
    
    percentage = (attended_classes / total_classes) * 100
    details = {}
    for sub, data in subjects.items():
        sub_percentage = (data["attended"] / data["total"] * 100) if data["total"] > 0 else 0
        details[sub] = {
            "total": data["total"],
            "attended": data["attended"],
            "percentage": round(sub_percentage, 2)
        }
    
    return {
        "roll_no": roll_no,
        "attendance_percentage": round(percentage, 2),
        "details": details
    }

@app.get("/teacher/attendance_page/{subject}", response_class=HTMLResponse)
def get_attendance_page(subject: str, db: Session = Depends(get_db)):
    if subject.lower() not in ["cn", "se", "cd", "js", "cloud"]:
        raise HTTPException(status_code=400, detail="Invalid subject")
    students = db.query(Student).all()
    html_content = f"""
    <html>
    <head>
        <title>Attendance for {subject.upper()}</title>
        <style>
            body {{ font-family: Arial, sans-serif; }}
            h1 {{ color: #007bff; margin-bottom: 20px; }}
            .student {{ margin-bottom: 10px; }}
            .error {{ color: red; }}
        </style>
        <script>
            function validateForm() {{
                let valid = true;
                const students = document.querySelectorAll('.student');
                students.forEach(student => {{
                    const present = student.querySelector('input[name^="present_"]');
                    const absent = student.querySelector('input[name^="absent_"]');
                    if (present.checked && absent.checked) {{
                        valid = false;
                        alert('Please select only one option (Present or Absent) for each student.');
                    }} else if (!present.checked && !absent.checked) {{
                        valid = false;
                        alert('Please select either Present or Absent for each student.');
                    }}
                }});
                return valid;
            }}
        </script>
    </head>
    <body>
        <h1>Take Attendance for {subject.upper()}</h1>
        <form method="post" action="/teacher/update_attendance" onsubmit="return validateForm()">
            <input type="hidden" name="subject" value="{subject}">
    """
    for student in students:
        html_content += f"""
            <div class="student">
                <p>{student.id} - {student.name}</p>
                <input type="checkbox" name="present_{student.id}" value="present"> Present
                <input type="checkbox" name="absent_{student.id}" value="absent"> Absent
            </div>
        """
    html_content += """
            <br>
            <input type="submit" value="Submit Attendance">
        </form>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.post("/teacher/update_attendance")
async def update_attendance(request: Request, db: Session = Depends(get_db)):
    form_data = await request.form()
    subject = form_data.get("subject")
    if subject.lower() not in ["cn", "se", "cd", "js", "cloud"]:
        raise HTTPException(status_code=400, detail="Invalid subject")
    
    subject = subject.lower()
    total_field = f"{subject}_total"
    attended_field = f"{subject}_attended"
    
    students = db.query(Student).all()
    for student in students:
        roll_no = student.id
        attendance = db.query(Attendance).filter(Attendance.roll_no == roll_no).first()
        if not attendance:
            attendance = Attendance(roll_no=roll_no)
            db.add(attendance)
        
        # Increment total classes for the subject
        current_total = getattr(attendance, total_field)
        setattr(attendance, total_field, current_total + 1)
        
        # Increment attended classes if marked present
        if f"present_{roll_no}" in form_data:
            if f"absent_{roll_no}" in form_data:
                raise HTTPException(status_code=400, detail=f"Cannot mark both Present and Absent for {roll_no}")
            current_attended = getattr(attendance, attended_field)
            setattr(attendance, attended_field, current_attended + 1)
        elif f"absent_{roll_no}" not in form_data:
            raise HTTPException(status_code=400, detail=f"Missing attendance status for {roll_no}")
    
    db.commit()
    return {"message": f"Attendance updated for {subject.upper()}"}

@app.post("/api/marks")
def add_marks(marks: MarksCreate, db: Session = Depends(get_db)):
    try:
        logger.info(f"Received marks data: {marks.dict()}")
        
        # Validate roll_no
        if not marks.roll_no:
            logger.error("Roll number is empty")
            raise HTTPException(status_code=400, detail="Roll number is required")

        # Check if roll number exists in students table (optional, depending on your requirements)
        from sqlalchemy import text
        student_exists = db.execute(text("SELECT 1 FROM students WHERE id = :roll_no"), {"roll_no": marks.roll_no}).scalar()
        if not student_exists:
            logger.error(f"Student with roll number {marks.roll_no} not found")
            raise HTTPException(status_code=404, detail="Student not found")

        # Check if roll number already exists in marks table
        existing_marks = db.query(Marks).filter(Marks.roll_no == marks.roll_no).first()
        if existing_marks:
            logger.error(f"Marks for roll number {marks.roll_no} already exist")
            raise HTTPException(status_code=409, detail="Roll number already exists")

        # Create new marks entry
        new_marks = Marks(
            roll_no=marks.roll_no,
            cn_marks=marks.cn_marks,
            se_marks=marks.se_marks,
            cd_marks=marks.cd_marks,
            js_marks=marks.js_marks,
            cloud_marks=marks.cloud_marks
        )

        db.add(new_marks)
        db.commit()
        db.refresh(new_marks)
        logger.info(f"Successfully added marks for roll number {marks.roll_no}")

        return {
            "message": "Marks added successfully",
            "marks": {
                "roll_no": new_marks.roll_no,
                "cn_marks": new_marks.cn_marks,
                "se_marks": new_marks.se_marks,
                "cd_marks": new_marks.cd_marks,
                "js_marks": new_marks.js_marks,
                "cloud_marks": new_marks.cloud_marks
            }
        }

    except HTTPException as he:
        logger.error(f"HTTP Exception: {he.detail}")
        raise he
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

def get_grade(marks: float) -> str:
    if marks >= 90: return "A+"
    if marks >= 75: return "A"
    if marks >= 60: return "B"
    if marks >= 45: return "C"
    return "F"


def send_email(to_email: str, subject: str, body: str):
    try:
        msg = MIMEMultipart()
        msg["From"] = SMTP_USERNAME
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.sendmail(SMTP_USERNAME, to_email, msg.as_string())
    except Exception as e:
        logger.error(f"Failed to send email to {to_email}: {e}")


ATTENDANCE_THRESHOLD = 75  # %

@app.post("/admin/send_attendance_alerts")
def send_attendance_alerts(db: Session = Depends(get_db)):
    students = db.query(Student).all()
    alerts_sent = []

    for student in students:
        total_classes = 0
        attended_classes = 0

        for subject, table in SUBJECT_TABLES.items():
            record = db.query(table).filter(table.roll_no == student.id).first()
            if record:
                total_classes = record.total or 0
                attended_classes = record.attended or 0

            if total_classes > 0:
                percentage = (attended_classes / total_classes) * 100
                if percentage < ATTENDANCE_THRESHOLD:
                    subject1 = "Low Attendance Alert"
                    body = f"""
                    Dear {student.name},

                    Your current attendance percentage is {percentage:.2f}%  in  subject {subject},
                    which is below the required threshold of {ATTENDANCE_THRESHOLD}%.

                    Please ensure better participation in upcoming classes.

                    Regards,
                    Student Attendance Management System
                    """
                    send_email(student.email, subject1, body)
                    alerts_sent.append({"student": student.name, "email": student.email, "attendance": round(percentage, 2)})

    if not alerts_sent:
        return {"message": "No students found with low attendance."}

    return {"alerts_sent": alerts_sent}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
