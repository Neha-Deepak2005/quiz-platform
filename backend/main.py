from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, relationship, sessionmaker
from pydantic import BaseModel
from datetime import datetime, timedelta
import jwt

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
    role = Column(String, default="STUDENT")  # ADMIN or STUDENT
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
    status = Column(String, default="DRAFT")  # DRAFT or PUBLISHED
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
    status = Column(String, default="PASSED")  # PASSED or FAILED
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
    role: str = "STUDENT"

class QuizResponse(BaseModel):
    id: int
    title: str
    description: str
    difficulty: str
    duration: int
    passing_score: float
    status: str

class AttemptResponse(BaseModel):
    id: int
    quiz_id: int
    score: float
    percentage: float
    status: str
    completed_at: datetime

class OptionCreate(BaseModel):
    option_text: str
    is_correct: bool

class QuestionCreate(BaseModel):
    question_text: str
    difficulty: str
    marks: float
    options: list

class QuizCreate(BaseModel):
    title: str
    description: str
    difficulty: str
    duration: int
    passing_score: float = 60.0
    questions: list = []

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
current_user_id = 1  # Simulated current user

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_token(user_id: int, role: str):
    payload = {"sub": str(user_id), "role": role, "exp": datetime.utcnow() + timedelta(hours=24)}
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        return int(payload["sub"]), payload.get("role", "STUDENT")
    except:
        return None, None

# Routes
@app.post("/api/auth/login")
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email, User.role == credentials.role).first()
    if not user or user.password != credentials.password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token(user.id, user.role)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "role": user.role}

@app.post("/api/auth/register")
def register(credentials: UserLogin, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == credentials.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    role = credentials.role if credentials.role in ["ADMIN", "STUDENT"] else "STUDENT"
    user = User(email=credentials.email, password=credentials.password, role=role, name=credentials.email.split("@")[0])
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_token(user.id, user.role)
    return {"access_token": token, "token_type": "bearer", "user_id": user.id, "role": user.role}

# ADMIN ENDPOINTS
@app.get("/api/admin/quizzes")
def get_all_quizzes(db: Session = Depends(get_db)):
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

@app.post("/api/admin/quizzes")
def create_quiz(quiz: QuizCreate, db: Session = Depends(get_db)):
    cat = db.query(Category).first()
    if not cat:
        cat = Category(name="General", description="General category")
        db.add(cat)
        db.commit()

    new_quiz = Quiz(
        title=quiz.title,
        description=quiz.description,
        category_id=cat.id,
        difficulty=quiz.difficulty,
        duration=quiz.duration,
        passing_score=quiz.passing_score,
        status="DRAFT"
    )
    db.add(new_quiz)
    db.commit()
    db.refresh(new_quiz)

    return {"id": new_quiz.id, "title": new_quiz.title, "status": new_quiz.status}

@app.post("/api/admin/quizzes/{quiz_id}/publish")
def publish_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    quiz.status = "PUBLISHED"
    db.commit()
    return {"id": quiz.id, "status": quiz.status}

@app.post("/api/admin/quizzes/{quiz_id}/add-question")
def add_question(quiz_id: int, data: dict, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    question = Question(
        quiz_id=quiz_id,
        question_text=data.get("question_text"),
        difficulty=data.get("difficulty", "Easy"),
        marks=data.get("marks", 1.0)
    )
    db.add(question)
    db.commit()
    db.refresh(question)

    for opt in data.get("options", []):
        option = Option(
            question_id=question.id,
            option_text=opt.get("option_text"),
            is_correct=opt.get("is_correct", False)
        )
        db.add(option)
    db.commit()

    return {"id": question.id, "quiz_id": quiz_id}

@app.delete("/api/admin/quizzes/{quiz_id}")
def delete_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    db.delete(quiz)
    db.commit()
    return {"message": "Quiz deleted"}

# STUDENT ENDPOINTS
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
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()

    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "difficulty": quiz.difficulty,
        "duration": quiz.duration,
        "passing_score": quiz.passing_score,
        "questions": [
            {
                "id": q.id,
                "question_text": q.question_text,
                "marks": q.marks,
                "options": [
                    {
                        "id": o.id,
                        "option_text": o.option_text,
                        "is_correct": o.is_correct
                    }
                    for o in db.query(Option).filter(Option.question_id == q.id).all()
                ]
            }
            for q in questions
        ]
    }

@app.post("/api/quizzes/{quiz_id}/start")
def start_quiz(quiz_id: int, db: Session = Depends(get_db)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    attempt = Attempt(user_id=current_user_id, quiz_id=quiz_id)
    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {"attempt_id": attempt.id}

@app.post("/api/quizzes/{quiz_id}/submit")
def submit_quiz(quiz_id: int, data: dict, db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.quiz_id == quiz_id, Attempt.user_id == current_user_id).order_by(Attempt.id.desc()).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    answers = data.get("answers", [])
    correct_count = 0
    total_marks = 0

    for answer in answers:
        q_id = answer["question_id"]
        option_id = answer.get("selected_option_id")

        question = db.query(Question).filter(Question.id == q_id).first()
        total_marks += question.marks if question else 1

        if option_id:
            option = db.query(Option).filter(Option.id == option_id).first()
            is_correct = option and option.is_correct

            if is_correct:
                correct_count += question.marks if question else 1

            ans = Answer(attempt_id=attempt.id, question_id=q_id, selected_option_id=option_id, is_correct=is_correct)
            db.add(ans)

    attempt.score = correct_count
    attempt.percentage = (correct_count / total_marks * 100) if total_marks > 0 else 0
    attempt.status = "PASSED" if attempt.percentage >= 33 else "FAILED"
    attempt.completed_at = datetime.utcnow()
    db.commit()
    db.refresh(attempt)

    # Get quiz details and answers for review
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == quiz_id).all()

    review = []
    for q in questions:
        options = db.query(Option).filter(Option.question_id == q.id).all()
        user_answer = db.query(Answer).filter(Answer.attempt_id == attempt.id, Answer.question_id == q.id).first()
        correct_option = next((o for o in options if o.is_correct), None)

        review.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "user_answer_id": user_answer.selected_option_id if user_answer else None,
            "correct_answer_id": correct_option.id if correct_option else None,
            "is_correct": user_answer.is_correct if user_answer else False,
            "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct} for o in options]
        })

    return {
        "id": attempt.id,
        "score": attempt.score,
        "percentage": attempt.percentage,
        "status": attempt.status,
        "completed_at": attempt.completed_at,
        "quiz_title": quiz.title,
        "review": review
    }

@app.get("/api/attempts/{attempt_id}")
def get_attempt(attempt_id: int, db: Session = Depends(get_db)):
    attempt = db.query(Attempt).filter(Attempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Attempt not found")

    quiz = db.query(Quiz).filter(Quiz.id == attempt.quiz_id).first()
    questions = db.query(Question).filter(Question.quiz_id == attempt.quiz_id).all()

    review = []
    for q in questions:
        options = db.query(Option).filter(Option.question_id == q.id).all()
        user_answer = db.query(Answer).filter(Answer.attempt_id == attempt.id, Answer.question_id == q.id).first()
        correct_option = next((o for o in options if o.is_correct), None)

        review.append({
            "question_id": q.id,
            "question_text": q.question_text,
            "user_answer_id": user_answer.selected_option_id if user_answer else None,
            "correct_answer_id": correct_option.id if correct_option else None,
            "is_correct": user_answer.is_correct if user_answer else False,
            "options": [{"id": o.id, "text": o.option_text, "is_correct": o.is_correct} for o in options]
        })

    return {
        "id": attempt.id,
        "quiz_id": attempt.quiz_id,
        "score": attempt.score,
        "percentage": attempt.percentage,
        "status": attempt.status,
        "completed_at": attempt.completed_at,
        "quiz_title": quiz.title,
        "review": review
    }

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

        # Add questions
        q1 = Question(quiz_id=quiz.id, question_text="What is the capital of France?", difficulty="Easy", marks=1.0)
        q2 = Question(quiz_id=quiz.id, question_text="What is 2+2?", difficulty="Easy", marks=1.0)
        db.add_all([q1, q2])
        db.commit()

        # Add options
        opts = [
            Option(question_id=q1.id, option_text="London", is_correct=False),
            Option(question_id=q1.id, option_text="Paris", is_correct=True),
            Option(question_id=q1.id, option_text="Berlin", is_correct=False),
            Option(question_id=q2.id, option_text="3", is_correct=False),
            Option(question_id=q2.id, option_text="4", is_correct=True),
            Option(question_id=q2.id, option_text="5", is_correct=False)
        ]
        db.add_all(opts)
        db.commit()

    db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
