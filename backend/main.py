from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt
import os

# Database setup
DATABASE_URL = "sqlite:///./quiz.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Models
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    email = Column(String, unique=True)
    password = Column(String)
    role = Column(String, default="STUDENT")
    name = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True)
    name = Column(String)
    description = Column(String, nullable=True)

class Quiz(Base):
    __tablename__ = "quizzes"
    id = Column(Integer, primary_key=True)
    title = Column(String)
    description = Column(String, nullable=True)
    category_id = Column(Integer, ForeignKey("categories.id"))
    difficulty = Column(String)
    duration = Column(Integer)
    passing_score = Column(Float, default=60.0)
    status = Column(String, default="DRAFT")
    created_at = Column(DateTime, default=datetime.utcnow)

class Question(Base):
    __tablename__ = "questions"
    id = Column(Integer, primary_key=True)
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    question_text = Column(String)
    marks = Column(Float, default=1.0)
    difficulty = Column(String)

class Option(Base):
    __tablename__ = "options"
    id = Column(Integer, primary_key=True)
    question_id = Column(Integer, ForeignKey("questions.id"))
    option_text = Column(String)
    is_correct = Column(Boolean, default=False)

class Attempt(Base):
    __tablename__ = "attempts"
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    quiz_id = Column(Integer, ForeignKey("quizzes.id"))
    score = Column(Float, default=0.0)
    percentage = Column(Float, default=0.0)
    status = Column(String, default="PASSED")
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

class Answer(Base):
    __tablename__ = "answers"
    id = Column(Integer, primary_key=True)
    attempt_id = Column(Integer, ForeignKey("attempts.id"))
    question_id = Column(Integer, ForeignKey("questions.id"))
    selected_option_id = Column(Integer, ForeignKey("options.id"), nullable=True)
    is_correct = Column(Boolean, default=False)

Base.metadata.create_all(bind=engine)

# Schemas
class UserLogin(BaseModel):
    email: str
    password: str

# FastAPI app
app = FastAPI(title="Quiz Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "secret-key-change-in-production"

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_token(user_id: int):
    payload = {"sub": str(user_id), "exp": datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"])
    except:
        return None

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        parts = authorization.split(" ")
        if len(parts) != 2:
            raise HTTPException(status_code=401, detail="Invalid token format")
        token = parts[1]
        user_id = verify_token(token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Token verification failed")

# Routes
@app.post("/api/auth/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email).first()
    if not user or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "role": user.role}

@app.post("/api/auth/register")
def register(credentials: UserLogin, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == credentials.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    user = User(email=credentials.email, password=credentials.password, name=credentials.email.split("@")[0])
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id}

@app.get("/api/quizzes/published")
def get_published_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).filter(Quiz.status == "PUBLISHED").all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "difficulty": q.difficulty,
            "duration": q.duration,
            "passing_score": q.passing_score,
            "status": q.status
        }
        for q in quizzes
    ]

@app.get("/api/quizzes/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db)):
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()

        questions_data = []
        for q in questions:
            options = db.query(Option).filter(Option.question_id == q.id).all()
            questions_data.append({
                "id": q.id,
                "question_text": q.question_text,
                "marks": q.marks,
                "options": [
                    {
                        "id": o.id,
                        "option_text": o.option_text,
                        "is_correct": o.is_correct
                    }
                    for o in options
                ]
            })

        return {
            "id": quiz.id,
            "title": quiz.title,
            "description": quiz.description,
            "difficulty": quiz.difficulty,
            "duration": quiz.duration,
            "passing_score": quiz.passing_score,
            "status": quiz.status,
            "questions": questions_data
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in get_quiz: {str(e)}")
        raise HTTPException(status_code=500, detail="Error loading quiz")

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, data: dict, db: Session = Depends(get_db), user_id: int = Depends(get_current_user)):
    try:
        attempt = db.query(Attempt).filter(Attempt.quiz_id == quiz_id, Attempt.user_id == user_id).order_by(Attempt.id.desc()).first()
        if not attempt:
            attempt = Attempt(user_id=user_id, quiz_id=quiz_id)
            db.add(attempt)
            db.commit()
            db.refresh(attempt)

        answers_data = data.get("answers", {})
        if not answers_data:
            raise HTTPException(status_code=400, detail="No answers provided")

        correct_count = 0
        total_marks = 0

        if isinstance(answers_data, dict):
            for q_id_str, option_id in answers_data.items():
                try:
                    q_id = int(q_id_str)
                    option_id = int(option_id)
                except:
                    continue

                question = db.query(Question).filter(Question.id == q_id).first()
                if not question:
                    continue

                total_marks += question.marks

                option = db.query(Option).filter(Option.id == option_id).first()
                is_correct = option and option.is_correct

                if is_correct:
                    correct_count += question.marks

                ans = Answer(attempt_id=attempt.id, question_id=q_id, selected_option_id=option_id, is_correct=is_correct)
                db.add(ans)

        db.commit()

        attempt.score = correct_count
        attempt.percentage = (correct_count / total_marks * 100) if total_marks > 0 else 0
        attempt.status = "PASSED" if attempt.percentage >= 33 else "FAILED"
        attempt.completed_at = datetime.utcnow()
        db.commit()
        db.refresh(attempt)

        return {
            "id": attempt.id,
            "score": attempt.score,
            "percentage": attempt.percentage,
            "status": attempt.status,
            "completed_at": attempt.completed_at
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in submit_quiz: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Error submitting quiz")

@app.post("/api/admin/quizzes")
def create_quiz(data: dict, db: Session = Depends(get_db)):
    category = db.query(Category).first()
    if not category:
        category = Category(name="General", description="General category")
        db.add(category)
        db.commit()

    quiz = Quiz(
        title=data.get("title"),
        description=data.get("description"),
        category_id=category.id,
        difficulty=data.get("difficulty", "Easy"),
        duration=data.get("duration", 30),
        passing_score=data.get("passing_score", 60.0)
    )
    db.add(quiz)
    db.commit()
    db.refresh(quiz)
    return {"id": quiz.id, "title": quiz.title}

@app.get("/api/admin/quizzes")
def get_admin_quizzes(db: Session = Depends(get_db)):
    quizzes = db.query(Quiz).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "difficulty": q.difficulty,
            "duration": q.duration,
            "passing_score": q.passing_score,
            "status": q.status
        }
        for q in quizzes
    ]

@app.post("/api/admin/quizzes/{quiz_id}/add-question")
def add_question(quiz_id: int, data: dict, db: Session = Depends(get_db)):
    try:
        quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
        if not quiz:
            raise HTTPException(status_code=404, detail="Quiz not found")

        question_text = data.get("question_text", "").strip()
        if not question_text:
            raise HTTPException(status_code=400, detail="Question text required")

        options = data.get("options", [])
        if not options or len(options) == 0:
            raise HTTPException(status_code=400, detail="At least one option required")

        question = Question(
            quiz_id=quiz_id,
            question_text=question_text,
            marks=float(data.get("marks", 1.0)),
            difficulty=data.get("difficulty", "Medium")
        )
        db.add(question)
        db.commit()
        db.refresh(question)

        for opt in options:
            opt_text = str(opt.get("text", "")).strip()
            if opt_text:
                option = Option(
                    question_id=question.id,
                    option_text=opt_text,
                    is_correct=bool(opt.get("is_correct", False))
                )
                db.add(option)

        db.commit()
        return {"id": question.id, "question_text": question.question_text}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        print(f"Error in add_question: {str(e)}")
        raise HTTPException(status_code=500, detail="Error adding question")

@app.post("/api/admin/quizzes/{quiz_id}/publish")
def publish_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()
    if not questions:
        raise HTTPException(status_code=400, detail="Cannot publish quiz without questions")

    quiz.status = "PUBLISHED"
    db.commit()
    return {"id": quiz.id, "status": quiz.status}

@app.delete("/api/admin/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    db.query(Answer).filter(Answer.question_id.in_(
        db.query(Question.id).filter(Question.quiz_id == quiz_id)
    )).delete()
    db.query(Option).filter(Option.question_id.in_(
        db.query(Question.id).filter(Question.quiz_id == quiz_id)
    )).delete()
    db.query(Question).filter(Question.quiz_id == quiz_id).delete()
    db.query(Attempt).filter(Attempt.quiz_id == quiz_id).delete()
    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted"}

# Seed data
@app.on_event("startup")
def seed_data():
    db = SessionLocal()

    if db.query(User).count() == 0:
        admin = User(email="admin@quiz.com", password="Admin@123", role="ADMIN", name="Admin")
        student = User(email="student@quiz.com", password="Student@123", role="STUDENT", name="Student")
        db.add_all([admin, student])
        db.commit()

    if db.query(Category).count() == 0:
        cat = Category(name="General Knowledge", description="Basic GK questions")
        db.add(cat)
        db.commit()
        cat_id = cat.id
    else:
        cat_id = db.query(Category).first().id

    if db.query(Quiz).count() == 0:
        quiz = Quiz(
            title="General Knowledge Quiz",
            description="Test your general knowledge",
            category_id=cat_id,
            difficulty="Easy",
            duration=30,
            status="PUBLISHED"
        )
        db.add(quiz)
        db.commit()
        db.refresh(quiz)

        q1 = Question(quiz_id=quiz.id, question_text="What is the capital of France?", difficulty="Easy", marks=1.0)
        q2 = Question(quiz_id=quiz.id, question_text="What is 2+2?", difficulty="Easy", marks=1.0)
        db.add_all([q1, q2])
        db.commit()

        options_list = [
            Option(question_id=q1.id, option_text="London", is_correct=False),
            Option(question_id=q1.id, option_text="Paris", is_correct=True),
            Option(question_id=q1.id, option_text="Berlin", is_correct=False),
            Option(question_id=q2.id, option_text="3", is_correct=False),
            Option(question_id=q2.id, option_text="4", is_correct=True),
            Option(question_id=q2.id, option_text="5", is_correct=False),
        ]
        db.add_all(options_list)
        db.commit()

    db.close()

# Mount static files
if os.path.exists("../frontend/build"):
    app.mount("/", StaticFiles(directory="../frontend/build", html=True), name="static")
elif os.path.exists("./frontend/build"):
    app.mount("/", StaticFiles(directory="./frontend/build", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)