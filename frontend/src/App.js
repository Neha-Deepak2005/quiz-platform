import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Use relative API path for both local and deployed environments
const API_BASE = "/api";

// Login Page
function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("admin@quiz.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_id", response.data.user_id);
      onLogin(response.data.user_id);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <h1 style={{ textAlign: "center", color: "#333", marginBottom: "30px" }}>🎯 Quiz Platform</h1>

        {error && <div style={{ background: "#fee", color: "#c00", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <div style={{ marginBottom: "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "12px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#666", marginTop: "20px", fontSize: "14px" }}>
          Demo: admin@quiz.com / Admin@123
        </p>
      </div>
    </div>
  );
}

// Quiz List Page
function QuizzesPage({ onSelectQuiz }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const response = await axios.get(`${API_BASE}/quizzes/published`);
        setQuizzes(response.data);
      } catch (err) {
        console.error("Error fetching quizzes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading quizzes...</div>;

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ marginBottom: "30px", color: "#333" }}>📚 Available Quizzes</h1>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
        {quizzes.map((quiz) => (
          <div key={quiz.id} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer", transition: "transform 0.2s", border: "2px solid transparent" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}>
            <h3 style={{ color: "#333", marginBottom: "10px" }}>{quiz.title}</h3>
            <p style={{ color: "#666", marginBottom: "15px", fontSize: "14px" }}>{quiz.description}</p>

            <div style={{ fontSize: "13px", color: "#999", marginBottom: "15px" }}>
              <p>⏱️ Duration: {quiz.duration} mins</p>
              <p>📊 Difficulty: {quiz.difficulty}</p>
              <p>✅ Pass Score: {quiz.passing_score}%</p>
            </div>

            <button
              onClick={() => onSelectQuiz(quiz.id)}
              style={{
                width: "100%",
                padding: "10px",
                background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Start Quiz
            </button>
          </div>
        ))}
      </div>

      {quizzes.length === 0 && <p style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>No quizzes available</p>}
    </div>
  );
}

// Quiz Page
function QuizPage({ quizId, onComplete }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [attemptId, setAttemptId] = useState(null);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res1 = await axios.post(`${API_BASE}/quizzes/${quizId}/start`);
        setAttemptId(res1.data.attempt_id);

        const res2 = await axios.get(`${API_BASE}/quizzes/${quizId}`);
        setQuiz(res2.data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId]);

  const handleAnswer = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    const answerList = (quiz.questions || []).map((q) => ({
      question_id: q.id,
      selected_option_id: answers[q.id] || null
    }));

    try {
      const response = await axios.post(`${API_BASE}/quizzes/${quizId}/submit`, { answers: answerList });
      onComplete(response.data.id);
    } catch (err) {
      console.error("Error submitting:", err);
    }
  };

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading quiz...</div>;
  if (!quiz) return <div>Quiz not found</div>;

  const question = quiz.questions[currentQuestion];

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
      <h2 style={{ marginBottom: "20px", color: "#333" }}>{quiz.title}</h2>

      <div style={{ background: "#f0f0f0", padding: "10px 20px", borderRadius: "6px", marginBottom: "30px", fontSize: "14px" }}>
        Question {currentQuestion + 1} of {quiz.questions.length}
      </div>

      {question && (
        <div>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>{question.question_text}</h3>

          <div style={{ marginBottom: "30px" }}>
            {question.options.map((option) => (
              <label key={option.id} style={{ display: "block", marginBottom: "12px", cursor: "pointer" }}>
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  checked={answers[question.id] === option.id}
                  onChange={() => handleAnswer(question.id, option.id)}
                  style={{ marginRight: "10px" }}
                />
                <span style={{ color: "#333" }}>{option.option_text}</span>
              </label>
            ))}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              disabled={currentQuestion === 0}
              onClick={() => setCurrentQuestion(currentQuestion - 1)}
              style={{
                padding: "10px 20px",
                background: currentQuestion === 0 ? "#ccc" : "#667eea",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: currentQuestion === 0 ? "default" : "pointer"
              }}
            >
              Previous
            </button>

            {currentQuestion === quiz.questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                style={{
                  padding: "10px 20px",
                  background: "#28a745",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                Submit Quiz
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestion(currentQuestion + 1)}
                style={{
                  padding: "10px 20px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer"
                }}
              >
                Next
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Results Page
function ResultsPage({ attemptId, onBackHome }) {
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttempt = async () => {
      try {
        const response = await axios.get(`${API_BASE}/attempts/${attemptId}`);
        setAttempt(response.data);
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading results...</div>;
  if (!attempt) return <div>Results not found</div>;

  const isPassed = attempt.status === "PASSED";

  return (
    <div style={{ padding: "40px", maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
      <h1 style={{ marginBottom: "20px", color: isPassed ? "#28a745" : "#dc3545" }}>
        {isPassed ? "🎉 Congratulations!" : "❌ You Failed"}
      </h1>

      <div style={{
        background: isPassed ? "#d4edda" : "#f8d7da",
        color: isPassed ? "#155724" : "#721c24",
        padding: "20px",
        borderRadius: "8px",
        marginBottom: "30px"
      }}>
        <h2 style={{ margin: "0 0 10px 0" }}>{attempt.percentage.toFixed(1)}%</h2>
        <p style={{ margin: "0", fontSize: "16px" }}>Score: {attempt.score.toFixed(1)}</p>
        <p style={{ margin: "0", fontSize: "16px" }}>Status: {attempt.status}</p>
      </div>

      <button
        onClick={onBackHome}
        style={{
          padding: "12px 30px",
          background: "#667eea",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "16px",
          fontWeight: "bold"
        }}
      >
        Back to Quizzes
      </button>
    </div>
  );
}

// Main App
export default function App() {
  const [page, setPage] = useState("login");
  const [selectedQuizId, setSelectedQuizId] = useState(null);
  const [attemptId, setAttemptId] = useState(null);

  const handleLogin = () => {
    setPage("quizzes");
  };

  const handleSelectQuiz = (quizId) => {
    setSelectedQuizId(quizId);
    setPage("quiz");
  };

  const handleComplete = (attId) => {
    setAttemptId(attId);
    setPage("results");
  };

  const handleBackHome = () => {
    setPage("quizzes");
    setSelectedQuizId(null);
    setAttemptId(null);
  };

  return (
    <div>
      {page === "login" && <LoginPage onLogin={handleLogin} />}
      {page === "quizzes" && <QuizzesPage onSelectQuiz={handleSelectQuiz} />}
      {page === "quiz" && <QuizPage quizId={selectedQuizId} onComplete={handleComplete} />}
      {page === "results" && <ResultsPage attemptId={attemptId} onBackHome={handleBackHome} />}
    </div>
  );
}