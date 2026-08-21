import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "http://localhost:8000/api";

// Login Type Selection
function LoginTypeSelection({ onSelectType }) {
  return (
    <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "500px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)", textAlign: "center" }}>
        <h1 style={{ marginBottom: "30px", color: "#333" }}>🎯 Quiz Platform</h1>
        <p style={{ color: "#666", marginBottom: "30px", fontSize: "16px" }}>Select your login type:</p>

        <div style={{ display: "flex", gap: "20px", justifyContent: "center" }}>
          <button
            onClick={() => onSelectType("ADMIN")}
            style={{
              padding: "20px 40px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              flex: 1
            }}
          >
            👨‍💼 Admin
          </button>

          <button
            onClick={() => onSelectType("STUDENT")}
            style={{
              padding: "20px 40px",
              background: "#764ba2",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              flex: 1
            }}
          >
            👨‍🎓 Student
          </button>
        </div>
      </div>
    </div>
  );
}

// Login Page
function LoginPage({ loginType, onLogin }) {
  const [email, setEmail] = useState(loginType === "ADMIN" ? "admin@quiz.com" : "student@quiz.com");
  const [password, setPassword] = useState(loginType === "ADMIN" ? "Admin@123" : "Student@123");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password, role: loginType });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("role", response.data.role);
      onLogin(response.data.user_id, response.data.role);
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters!");
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post(`${API_BASE}/auth/register`, { email, password, role: loginType });
      localStorage.setItem("token", response.data.access_token);
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("role", response.data.role);
      onLogin(response.data.user_id, response.data.role);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "white", borderRadius: "12px", padding: "40px", width: "100%", maxWidth: "400px", boxShadow: "0 10px 40px rgba(0,0,0,0.2)" }}>
        <h1 style={{ textAlign: "center", color: "#333", marginBottom: "10px" }}>🎯 Quiz Platform</h1>
        <p style={{ textAlign: "center", color: "#666", marginBottom: "30px", fontSize: "14px" }}>
          {isRegistering ? `Create ${loginType === "ADMIN" ? "Admin" : "Student"} Account` : `${loginType === "ADMIN" ? "Admin" : "Student"} Login`}
        </p>

        {error && <div style={{ background: "#fee", color: "#c00", padding: "12px", borderRadius: "6px", marginBottom: "20px" }}>{error}</div>}

        <form onSubmit={isRegistering ? handleRegister : handleLogin}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              required
            />
          </div>

          <div style={{ marginBottom: isRegistering ? "15px" : "30px" }}>
            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
              required
            />
          </div>

          {isRegistering && (
            <div style={{ marginBottom: "30px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", color: "#333" }}>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                style={{ width: "100%", padding: "10px", border: "1px solid #ddd", borderRadius: "6px", fontSize: "14px", boxSizing: "border-box" }}
                required
              />
            </div>
          )}

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
            {loading ? (isRegistering ? "Creating account..." : "Logging in...") : (isRegistering ? "Create Account" : "Login")}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#666", marginTop: "20px", fontSize: "13px" }}>
          {isRegistering ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setError("");
                  setEmail(loginType === "ADMIN" ? "admin@quiz.com" : "student@quiz.com");
                  setPassword(loginType === "ADMIN" ? "Admin@123" : "Student@123");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#667eea",
                  cursor: "pointer",
                  fontWeight: "bold",
                  textDecoration: "underline"
                }}
              >
                Login here
              </button>
            </>
          ) : (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => {
                  setIsRegistering(true);
                  setError("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                }}
                style={{
                  background: "none",
                  border: "none",
                  color: "#667eea",
                  cursor: "pointer",
                  fontWeight: "bold",
                  textDecoration: "underline"
                }}
              >
                Register here
              </button>
            </>
          )}
        </p>

        {!isRegistering && (
          <p style={{ textAlign: "center", color: "#999", marginTop: "15px", fontSize: "11px" }}>
            Demo: {loginType === "ADMIN" ? "admin@quiz.com / Admin@123" : "student@quiz.com / Student@123"}
          </p>
        )}
      </div>
    </div>
  );
}

// Admin Dashboard
function AdminDashboard({ onLogout }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", difficulty: "Easy", duration: 30, passing_score: 60 });
  const [newQuestion, setNewQuestion] = useState({ question_text: "", difficulty: "Easy", marks: 1, options: [{text: "", correct: false}, {text: "", correct: false}] });

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/quizzes`);
      setQuizzes(response.data);
    } catch (err) {
      console.error("Error fetching quizzes:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/admin/quizzes`, newQuiz);
      setNewQuiz({ title: "", description: "", difficulty: "Easy", duration: 30, passing_score: 60 });
      setShowCreateForm(false);
      fetchQuizzes();
    } catch (err) {
      console.error("Error creating quiz:", err);
    }
  };

  const handlePublish = async (quizId, quiz) => {
    if (!quiz.questions || quiz.questions.length === 0) {
      alert("❌ Cannot publish empty quiz! Please add at least 1 question.");
      return;
    }
    try {
      await axios.post(`${API_BASE}/admin/quizzes/${quizId}/publish`);
      fetchQuizzes();
      alert("✅ Quiz published successfully!");
    } catch (err) {
      console.error("Error publishing quiz:", err);
      alert("Error publishing quiz");
    }
  };

  const handleDelete = async (quizId) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`${API_BASE}/admin/quizzes/${quizId}`);
        fetchQuizzes();
      } catch (err) {
        console.error("Error deleting quiz:", err);
      }
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    if (!editingQuizId) return;

    const options = newQuestion.options.map(opt => ({
      option_text: opt.text,
      is_correct: opt.correct
    }));

    if (!options.some(o => o.is_correct)) {
      alert("Please mark at least one option as correct!");
      return;
    }

    try {
      await axios.post(`${API_BASE}/admin/quizzes/${editingQuizId}/add-question`, {
        question_text: newQuestion.question_text,
        difficulty: newQuestion.difficulty,
        marks: newQuestion.marks,
        options: options
      });
      setNewQuestion({ question_text: "", difficulty: "Easy", marks: 1, options: [{text: "", correct: false}, {text: "", correct: false}] });
      alert("Question added successfully!");
    } catch (err) {
      console.error("Error adding question:", err);
      alert("Error adding question");
    }
  };

  const addOptionField = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, { text: "", correct: false }]
    });
  };

  const removeOptionField = (idx) => {
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== idx)
    });
  };

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#333" }}>📚 Quiz Management</h1>
        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Logout
        </button>
      </div>

      <button
        onClick={() => setShowCreateForm(!showCreateForm)}
        style={{
          marginBottom: "20px",
          padding: "10px 20px",
          background: "#28a745",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontWeight: "bold"
        }}
      >
        {showCreateForm ? "Cancel" : "+ Create New Quiz"}
      </button>

      {showCreateForm && (
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>Create New Quiz</h3>
          <form onSubmit={handleCreateQuiz}>
            <input
              type="text"
              placeholder="Quiz Title"
              value={newQuiz.title}
              onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }}
              required
            />
            <textarea
              placeholder="Quiz Description"
              value={newQuiz.description}
              onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box", minHeight: "80px" }}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <select value={newQuiz.difficulty} onChange={(e) => setNewQuiz({ ...newQuiz, difficulty: e.target.value })} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <input type="number" placeholder="Duration (mins)" value={newQuiz.duration} onChange={(e) => setNewQuiz({ ...newQuiz, duration: parseInt(e.target.value) })} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
              <input type="number" placeholder="Pass Score %" value={newQuiz.passing_score} onChange={(e) => setNewQuiz({ ...newQuiz, passing_score: parseFloat(e.target.value) })} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
            </div>
            <button type="submit" style={{ width: "100%", padding: "12px", background: "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
              Create Quiz
            </button>
          </form>
        </div>
      )}

      {editingQuizId && (
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", border: "2px solid #667eea" }}>
          <h3 style={{ marginBottom: "20px", color: "#333" }}>Add Question to Quiz</h3>
          <form onSubmit={handleAddQuestion}>
            <textarea
              placeholder="Question text"
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
              style={{ width: "100%", padding: "10px", marginBottom: "15px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box", minHeight: "60px" }}
              required
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px", marginBottom: "15px" }}>
              <select value={newQuestion.difficulty} onChange={(e) => setNewQuestion({ ...newQuestion, difficulty: e.target.value })} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
              <input type="number" placeholder="Marks" value={newQuestion.marks} onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseFloat(e.target.value) })} style={{ padding: "10px", border: "1px solid #ddd", borderRadius: "6px" }} />
            </div>

            <div style={{ marginBottom: "15px", padding: "15px", background: "#f9f9f9", borderRadius: "6px" }}>
              <p style={{ marginBottom: "10px", fontWeight: "bold", color: "#333" }}>Options:</p>
              {newQuestion.options.map((opt, idx) => (
                <div key={idx} style={{ marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                  <input
                    type="radio"
                    name="correct-option"
                    checked={opt.correct}
                    onChange={() => {
                      const updated = newQuestion.options.map((o, i) => ({ ...o, correct: i === idx }));
                      setNewQuestion({ ...newQuestion, options: updated });
                    }}
                    style={{ cursor: "pointer" }}
                  />
                  <input
                    type="text"
                    placeholder={`Option ${idx + 1}`}
                    value={opt.text}
                    onChange={(e) => {
                      const updated = [...newQuestion.options];
                      updated[idx].text = e.target.value;
                      setNewQuestion({ ...newQuestion, options: updated });
                    }}
                    style={{ flex: 1, padding: "8px", border: "1px solid #ddd", borderRadius: "6px", boxSizing: "border-box" }}
                  />
                  {newQuestion.options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeOptionField(idx)}
                      style={{ padding: "8px 12px", background: "#dc3545", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={addOptionField}
                style={{ padding: "8px 15px", background: "#667eea", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "12px", marginTop: "10px" }}
              >
                + Add Option
              </button>
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
              <button type="submit" style={{ flex: 1, padding: "12px", background: "#28a745", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}>
                Add Question
              </button>
              <button type="button" onClick={() => setEditingQuizId(null)} style={{ flex: 1, padding: "12px", background: "#999", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>
                Done
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p>Loading quizzes...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
              <h3 style={{ color: "#333", marginBottom: "10px" }}>{quiz.title}</h3>
              <p style={{ color: "#666", fontSize: "14px", marginBottom: "10px" }}>{quiz.description}</p>
              <div style={{ fontSize: "13px", color: "#999", marginBottom: "15px" }}>
                <p>Status: <strong style={{ color: quiz.status === "PUBLISHED" ? "#28a745" : "#ffc107" }}>{quiz.status}</strong></p>
                <p>Difficulty: {quiz.difficulty} | Duration: {quiz.duration} mins</p>
              </div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button
                  onClick={() => setEditingQuizId(quiz.id)}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  ✏️ Questions
                </button>
                <button
                  onClick={() => {
                    // Show preview by creating a simple modal
                    const preview = `Quiz: ${quiz.title}\nQuestions: ${quiz.questions ? quiz.questions.length : 0}`;
                    alert(preview || "No preview available");
                  }}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px",
                    background: "#17a2b8",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  👁️ Preview
                </button>
                {quiz.status === "DRAFT" && (
                  <button
                    onClick={() => handlePublish(quiz.id, quiz)}
                    style={{
                      flex: 1,
                      minWidth: "90px",
                      padding: "8px",
                      background: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "13px"
                    }}
                  >
                    Publish
                  </button>
                )}
                <button
                  onClick={() => handleDelete(quiz.id)}
                  style={{
                    flex: 1,
                    minWidth: "90px",
                    padding: "8px",
                    background: "#dc3545",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Student Dashboard
function StudentDashboard({ onLogout }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuizId, setSelectedQuizId] = useState(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

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

  if (selectedQuizId) {
    return <QuizPage quizId={selectedQuizId} onBack={() => setSelectedQuizId(null)} onLogout={onLogout} />;
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <h1 style={{ color: "#333" }}>📚 Available Quizzes</h1>
        <button
          onClick={onLogout}
          style={{
            padding: "10px 20px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold"
          }}
        >
          Logout
        </button>
      </div>

      {loading ? (
        <p>Loading quizzes...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {quizzes.map((quiz) => (
            <div key={quiz.id} style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", cursor: "pointer" }} onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-5px)"}>
              <h3 style={{ color: "#333", marginBottom: "10px" }}>{quiz.title}</h3>
              <p style={{ color: "#666", marginBottom: "15px", fontSize: "14px" }}>{quiz.description}</p>

              <div style={{ fontSize: "13px", color: "#999", marginBottom: "15px" }}>
                <p>⏱️ Duration: {quiz.duration} mins</p>
                <p>📊 Difficulty: {quiz.difficulty}</p>
                <p>✅ Pass Score: {quiz.passing_score}%</p>
              </div>

              <button
                onClick={() => setSelectedQuizId(quiz.id)}
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
      )}

      {quizzes.length === 0 && <p style={{ textAlign: "center", color: "#999", marginTop: "40px" }}>No quizzes available. Ask your admin to publish some quizzes!</p>}
    </div>
  );
}

// Quiz Page
function QuizPage({ quizId, onBack, onLogout }) {
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [attemptId, setAttemptId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [timeLeft, setTimeLeft] = useState(null);
  const [isPreview, setIsPreview] = useState(false);

  const handleAnswer = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = React.useCallback(async () => {
    if (!quiz) return;
    const answerList = (quiz.questions || []).map((q) => ({
      question_id: q.id,
      selected_option_id: answers[q.id] || null
    }));

    try {
      const response = await axios.post(`${API_BASE}/quizzes/${quizId}/submit`, { answers: answerList });
      setSubmitted(true);
      setResult(response.data);
    } catch (err) {
      console.error("Error submitting:", err);
    }
  }, [quiz, quizId, answers]);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        if (!isPreview) {
          const res1 = await axios.post(`${API_BASE}/quizzes/${quizId}/start`);
          setAttemptId(res1.data.attempt_id);
          setTimeLeft(res1.data.duration || 30);
        }

        const res2 = await axios.get(`${API_BASE}/quizzes/${quizId}`);
        setQuiz(res2.data);
        if (isPreview) {
          setTimeLeft(null);
        }
      } catch (err) {
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [quizId, isPreview]);

  // Timer effect
  useEffect(() => {
    if (submitted || !timeLeft || isPreview || !quiz) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, timeLeft, isPreview, quiz]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && !submitted && !isPreview) {
      handleSubmit();
    }
  }, [timeLeft, submitted, isPreview, handleSubmit]);

  if (loading) return <div style={{ padding: "20px", textAlign: "center" }}>Loading quiz...</div>;
  if (!quiz) return <div>Quiz not found</div>;

  if (submitted && result) {
    const isPassed = result.status === "PASSED";

    return (
      <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ marginBottom: "20px", color: isPassed ? "#28a745" : "#dc3545", textAlign: "center" }}>
          {isPassed ? "🎉 Congratulations!" : "❌ You Failed"}
        </h1>

        <div style={{
          background: isPassed ? "#d4edda" : "#f8d7da",
          color: isPassed ? "#155724" : "#721c24",
          padding: "20px",
          borderRadius: "8px",
          marginBottom: "30px",
          textAlign: "center"
        }}>
          <h2 style={{ margin: "0 0 10px 0" }}>{result.percentage.toFixed(1)}%</h2>
          <p style={{ margin: "0", fontSize: "16px" }}>Score: {result.score.toFixed(1)}</p>
          <p style={{ margin: "0", fontSize: "16px" }}>Status: {result.status}</p>
        </div>

        <button
          onClick={() => setShowReview(!showReview)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold",
            marginBottom: "20px"
          }}
        >
          {showReview ? "Hide Answer Review" : "📋 View Answer Review"}
        </button>

        {showReview && result.review && (
          <div style={{ background: "white", padding: "20px", borderRadius: "8px", marginBottom: "20px", border: "1px solid #ddd" }}>
            <h3 style={{ marginBottom: "20px", color: "#333" }}>Answer Review</h3>
            {result.review.map((item, idx) => (
              <div key={idx} style={{ marginBottom: "25px", paddingBottom: "15px", borderBottom: "1px solid #eee" }}>
                <div style={{ marginBottom: "10px" }}>
                  <strong style={{ color: "#333", fontSize: "16px" }}>Q{idx + 1}: {item.question_text}</strong>
                  <span style={{ marginLeft: "15px", fontSize: "14px", fontWeight: "bold", color: item.is_correct ? "#28a745" : "#dc3545" }}>
                    {item.is_correct ? "✅ Correct" : "❌ Wrong"}
                  </span>
                </div>

                <div style={{ marginTop: "10px" }}>
                  {item.options.map((opt) => {
                    const isUserSelected = opt.id === item.user_answer_id;
                    const isCorrect = opt.is_correct;
                    let bgColor = "transparent";
                    let borderColor = "#ddd";

                    if (isCorrect) {
                      bgColor = "#d4edda";
                      borderColor = "#28a745";
                    }
                    if (isUserSelected && !isCorrect) {
                      bgColor = "#f8d7da";
                      borderColor = "#dc3545";
                    }

                    return (
                      <div
                        key={opt.id}
                        style={{
                          padding: "10px",
                          marginBottom: "8px",
                          background: bgColor,
                          border: `2px solid ${borderColor}`,
                          borderRadius: "6px",
                          fontSize: "14px"
                        }}
                      >
                        <span style={{ marginRight: "10px" }}>
                          {isCorrect && "✓"}
                          {isUserSelected && !isCorrect && "✗"}
                          {isUserSelected && "👤"}
                        </span>
                        {opt.text}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
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
          <button
            onClick={onLogout}
            style={{
              flex: 1,
              padding: "12px 30px",
              background: "#dc3545",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "16px",
              fontWeight: "bold"
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (isPreview) {
    return (
      <div style={{ padding: "40px", maxWidth: "900px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <h2 style={{ color: "#333", margin: "0" }}>{quiz.title}</h2>
          <button
            onClick={() => setIsPreview(false)}
            style={{
              padding: "10px 20px",
              background: "#667eea",
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
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <p style={{ color: "#666", marginBottom: "20px" }}>{quiz.description}</p>
          <div style={{ fontSize: "14px", color: "#999", marginBottom: "20px" }}>
            <p>Duration: {quiz.duration} mins | Difficulty: {quiz.difficulty} | Pass Score: {quiz.passing_score}%</p>
          </div>
          <h3 style={{ marginBottom: "15px", color: "#333" }}>Questions Preview:</h3>
          {quiz.questions.map((q, idx) => (
            <div key={q.id} style={{ marginBottom: "15px", paddingBottom: "15px", borderBottom: "1px solid #eee" }}>
              <strong>Q{idx + 1}: {q.question_text}</strong>
              <ul style={{ marginTop: "8px", marginLeft: "20px" }}>
                {q.options.map(o => <li key={o.id}>{o.option_text}</li>)}
              </ul>
            </div>
          ))}
          <button
            onClick={() => setIsPreview(false)}
            style={{
              width: "100%",
              padding: "12px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "20px"
            }}
          >
            Start Quiz Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "40px", maxWidth: "1000px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h2 style={{ color: "#333", margin: "0" }}>{quiz.title}</h2>
        {timeLeft !== null && (
          <div style={{
            padding: "10px 20px",
            background: timeLeft < 60 ? "#f8d7da" : "#e7f3ff",
            color: timeLeft < 60 ? "#721c24" : "#004085",
            borderRadius: "6px",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "200px 1fr", gap: "20px" }}>
        {/* Progress Indicator */}
        <div style={{ background: "white", padding: "15px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", height: "fit-content" }}>
          <p style={{ marginBottom: "10px", fontWeight: "bold", color: "#333", fontSize: "14px" }}>Progress</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "5px" }}>
            {quiz.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestion(idx)}
                style={{
                  padding: "8px",
                  background: answers[q.id] ? "#28a745" : idx === currentQuestion ? "#667eea" : "#e9ecef",
                  color: answers[q.id] || idx === currentQuestion ? "white" : "#333",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "11px",
                  fontWeight: "bold"
                }}
                title={answers[q.id] ? "Answered" : "Unanswered"}
              >
                {idx + 1}
              </button>
            ))}
          </div>
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
            ✓ {Object.keys(answers).length}/{quiz.questions.length}
          </p>
        </div>

        {/* Question Content */}
        <div style={{ background: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <div style={{ background: "#f0f0f0", padding: "10px 15px", borderRadius: "6px", marginBottom: "20px", fontSize: "14px" }}>
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
                    onClick={() => handleSubmit()}
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
      </div>
    </div>
  );
}

// Main App
export default function App() {
  const [page, setPage] = useState("type");
  const [loginType, setLoginType] = useState(null);
  const [role, setRole] = useState(null);

  const handleSelectType = (type) => {
    setLoginType(type);
    setPage("login");
  };

  const handleLogin = (userId, userRole) => {
    setRole(userRole);
    setPage(userRole === "ADMIN" ? "admin" : "student");
  };

  const handleLogout = () => {
    localStorage.clear();
    setPage("type");
    setLoginType(null);
    setRole(null);
  };

  return (
    <div>
      {page === "type" && <LoginTypeSelection onSelectType={handleSelectType} />}
      {page === "login" && <LoginPage loginType={loginType} onLogin={handleLogin} />}
      {page === "admin" && <AdminDashboard onLogout={handleLogout} />}
      {page === "student" && <StudentDashboard onLogout={handleLogout} />}
    </div>
  );
}
