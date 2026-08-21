cat > frontend / src / App.js << 'EOF'
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = "/api";

export default function App() {
  const [currentPage, setCurrentPage] = useState("login-type");
  const [loginType, setLoginType] = useState("STUDENT");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userId, setUserId] = useState(localStorage.getItem("user_id"));
  const [userRole, setUserRole] = useState(localStorage.getItem("user_role"));
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [quizTimer, setQuizTimer] = useState(0);
  const [adminQuizzes, setAdminQuizzes] = useState([]);
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", difficulty: "Easy", duration: 30 });
  const [currentEditingQuiz, setCurrentEditingQuiz] = useState(null);
  const [newQuestion, setNewQuestion] = useState({ question_text: "", marks: 1.0, difficulty: "Easy" });
  const [options, setOptions] = useState([{ text: "", is_correct: false }]);
  const [showReview, setShowReview] = useState(false);

  useEffect(() => {
    if (token) {
      setCurrentPage(userRole === "ADMIN" ? "admin-dashboard" : "student-dashboard");
    }
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { email, password, role: loginType });
      const { access_token, user_id, role } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("user_role", role);
      setToken(access_token);
      setUserId(user_id);
      setUserRole(role);
      setCurrentPage(role === "ADMIN" ? "admin-dashboard" : "student-dashboard");
    } catch (error) {
      alert("Login failed: " + (error.response?.data?.detail || error.message));
    }
  }, [email, password, loginType]);

  const handleRegister = useCallback(async () => {
    if (password !== confirmPassword) {
      alert("Passwords don't match!");
      return;
    }
    if (password.length < 6) {
      alert("Password must be at least 6 characters!");
      return;
    }
    try {
      const response = await axios.post(`${API_BASE}/auth/register`, { email, password, role: "STUDENT" });
      const { access_token, user_id } = response.data;
      localStorage.setItem("token", access_token);
      localStorage.setItem("user_id", user_id);
      localStorage.setItem("user_role", "STUDENT");
      setToken(access_token);
      setUserId(user_id);
      setUserRole("STUDENT");
      setCurrentPage("student-dashboard");
    } catch (error) {
      alert("Registration failed: " + (error.response?.data?.detail || error.message));
    }
  }, [email, password, confirmPassword]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_role");
    setToken(null);
    setUserId(null);
    setUserRole(null);
    setCurrentPage("login-type");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }, []);

  const fetchAdminQuizzes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/quizzes`);
      setAdminQuizzes(response.data);
    } catch (error) {
      console.error("Failed to fetch admin quizzes:", error);
    }
  }, []);

  useEffect(() => {
    if (currentPage === "admin-dashboard") {
      fetchAdminQuizzes();
    }
  }, [currentPage, fetchAdminQuizzes]);

  const handleCreateQuiz = useCallback(async () => {
    try {
      await axios.post(`${API_BASE}/admin/quizzes`, newQuiz);
      setNewQuiz({ title: "", description: "", difficulty: "Easy", duration: 30 });
      fetchAdminQuizzes();
    } catch (error) {
      alert("Failed to create quiz: " + (error.response?.data?.detail || error.message));
    }
  }, [newQuiz, fetchAdminQuizzes]);

  const handleDeleteQuiz = useCallback(async (quizId) => {
    if (window.confirm("Are you sure you want to delete this quiz?")) {
      try {
        await axios.delete(`${API_BASE}/admin/quizzes/${quizId}`);
        fetchAdminQuizzes();
      } catch (error) {
        alert("Failed to delete quiz: " + (error.response?.data?.detail || error.message));
      }
    }
  }, [fetchAdminQuizzes]);

  const handlePublishQuiz = useCallback(async (quizId) => {
    try {
      await axios.post(`${API_BASE}/admin/quizzes/${quizId}/publish`);
      fetchAdminQuizzes();
      alert("Quiz published successfully!");
    } catch (error) {
      alert("Failed to publish quiz: " + (error.response?.data?.detail || error.message));
    }
  }, [fetchAdminQuizzes]);

  const handleAddQuestion = useCallback(async () => {
    if (!newQuestion.question_text) {
      alert("Please enter a question!");
      return;
    }
    try {
      await axios.post(`${API_BASE}/admin/quizzes/${currentEditingQuiz}/add-question`, {
        ...newQuestion,
        options
      });
      setNewQuestion({ question_text: "", marks: 1.0, difficulty: "Easy" });
      setOptions([{ text: "", is_correct: false }]);
      alert("Question added successfully!");
    } catch (error) {
      alert("Failed to add question: " + (error.response?.data?.detail || error.message));
    }
  }, [currentEditingQuiz, newQuestion, options]);

  const fetchPublishedQuizzes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/quizzes/published`);
      setQuizzes(response.data);
    } catch (error) {
      console.error("Failed to fetch quizzes:", error);
    }
  }, []);

  useEffect(() => {
    if (currentPage === "student-dashboard") {
      fetchPublishedQuizzes();
    }
  }, [currentPage, fetchPublishedQuizzes]);

  const handleStartQuiz = useCallback(async (quizId) => {
    try {
      const quizResponse = await axios.get(`${API_BASE}/quizzes/${quizId}`);
      const quiz = quizResponse.data;
      setCurrentQuiz(quiz);
      setQuizTimer(quiz.duration);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSubmitted(false);
      setResult(null);
      const attemptResponse = await axios.post(`${API_BASE}/quizzes/${quizId}/start`);
      setAttemptId(attemptResponse.data.attempt_id);
      setCurrentPage("quiz");
    } catch (error) {
      alert("Failed to start quiz: " + (error.response?.data?.detail || error.message));
    }
  }, []);

  useEffect(() => {
    if (currentPage !== "quiz" || submitted) return;
    const interval = setInterval(() => {
      setQuizTimer((prev) => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentPage, submitted]);

  const handleSubmit = useCallback(async () => {
    const answersArray = Object.entries(answers).map(([questionId, selectedOptionId]) => ({
      question_id: parseInt(questionId),
      selected_option_id: selectedOptionId ? parseInt(selectedOptionId) : null
    }));
    try {
      const response = await axios.post(`${API_BASE}/quizzes/${currentQuiz.id}/submit`, { answers: answersArray });
      setResult(response.data);
      setSubmitted(true);
    } catch (error) {
      alert("Failed to submit quiz: " + (error.response?.data?.detail || error.message));
    }
  }, [answers, currentQuiz]);

  const handleSelectOption = useCallback((questionId, optionId) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  }, []);

  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  }, [currentQuestionIndex, currentQuiz]);

  const handlePreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  }, [currentQuestionIndex]);

  const handleJumpToQuestion = useCallback((index) => {
    setCurrentQuestionIndex(index);
  }, []);

  if (currentPage === "login-type") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f5f5f5" }}>
        <div style={{ textAlign: "center", backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h1>Welcome to Quiz Platform</h1>
          <div style={{ marginTop: "30px", display: "flex", gap: "20px", justifyContent: "center" }}>
            <button onClick={() => { setLoginType("STUDENT"); setIsRegistering(false); setCurrentPage("login"); }} style={{ padding: "12px 24px", fontSize: "16px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Student
            </button>
            <button onClick={() => { setLoginType("ADMIN"); setIsRegistering(false); setCurrentPage("login"); }} style={{ padding: "12px 24px", fontSize: "16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
              Admin
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentPage === "login") {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f5f5f5" }}>
        <div style={{ width: "400px", backgroundColor: "white", padding: "40px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
          <h1>{isRegistering ? "Register" : "Login"} as {loginType}</h1>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ width: "100%", padding: "10px", marginTop: "15px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          {isRegistering && (<input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />)}
          <button onClick={isRegistering ? handleRegister : handleLogin} style={{ width: "100%", padding: "12px", marginTop: "15px", backgroundColor: isRegistering ? "#ffc107" : "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>{isRegistering ? "Register" : "Login"}</button>
          <button onClick={() => { setIsRegistering(!isRegistering); setEmail(""); setPassword(""); setConfirmPassword(""); }} style={{ width: "100%", padding: "12px", marginTop: "10px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>{isRegistering ? "Back to Login" : "Register Here"}</button>
          <button onClick={() => { setCurrentPage("login-type"); setEmail(""); setPassword(""); }} style={{ width: "100%", padding: "12px", marginTop: "10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Back</button>
        </div>
      </div>
    );
  }

  if (currentPage === "admin-dashboard") {
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1>Admin Dashboard</h1>
          <button onClick={handleLogout} style={{ padding: "10px 20px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Logout</button>
        </div>
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", marginBottom: "30px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
          <h2>Create New Quiz</h2>
          <input type="text" placeholder="Quiz Title" value={newQuiz.title} onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          <input type="text" placeholder="Description" value={newQuiz.description} onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          <select value={newQuiz.difficulty} onChange={(e) => setNewQuiz({ ...newQuiz, difficulty: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }}><option>Easy</option><option>Medium</option><option>Hard</option></select>
          <input type="number" placeholder="Duration (minutes)" value={newQuiz.duration} onChange={(e) => setNewQuiz({ ...newQuiz, duration: parseInt(e.target.value) })} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} />
          <button onClick={handleCreateQuiz} style={{ width: "100%", padding: "12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>Create Quiz</button>
        </div>
        <div><h2>My Quizzes</h2>{adminQuizzes.map((quiz) => (<div key={quiz.id} style={{ backgroundColor: "white", padding: "15px", marginBottom: "15px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}><h3>{quiz.title}</h3><p>{quiz.description}</p><p>Status: {quiz.status}</p><div style={{ display: "flex", gap: "10px" }}><button onClick={() => setCurrentEditingQuiz(quiz.id)} style={{ padding: "8px 16px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Add Question</button>{quiz.status === "DRAFT" && (<button onClick={() => handlePublishQuiz(quiz.id)} style={{ padding: "8px 16px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Publish</button>)}<button onClick={() => handleDeleteQuiz(quiz.id)} style={{ padding: "8px 16px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Delete</button></div></div>))}</div>
        {currentEditingQuiz && (<div style={{ backgroundColor: "white", padding: "20px", marginTop: "20px", borderRadius: "8px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}><h2>Add Question to Quiz</h2><input type="text" placeholder="Question Text" value={newQuestion.question_text} onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} /><input type="number" placeholder="Marks" value={newQuestion.marks} onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseFloat(e.target.value) })} style={{ width: "100%", padding: "10px", marginBottom: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} /><h3>Options</h3>{options.map((option, index) => (<div key={index} style={{ marginBottom: "10px", display: "flex", gap: "10px", alignItems: "center" }}><input type="text" placeholder={`Option ${index + 1}`} value={option.text} onChange={(e) => { const newOptions = [...options]; newOptions[index].text = e.target.value; setOptions(newOptions); }} style={{ flex: 1, padding: "10px", border: "1px solid #ddd", borderRadius: "4px", boxSizing: "border-box" }} /><label style={{ display: "flex", alignItems: "center", gap: "5px" }}><input type="radio" name="correctAnswer" checked={option.is_correct} onChange={() => { const newOptions = options.map((o, i) => ({ ...o, is_correct: i === index })); setOptions(newOptions); }} />Correct</label></div>))}<button onClick={() => setOptions([...options, { text: "", is_correct: false }])} style={{ width: "100%", padding: "10px", marginBottom: "10px", backgroundColor: "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Add Option</button><button onClick={handleAddQuestion} style={{ width: "100%", padding: "12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>Add Question</button><button onClick={() => setCurrentEditingQuiz(null)} style={{ width: "100%", padding: "10px", marginTop: "10px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Done</button></div>)}
      </div>
    );
  }

  if (currentPage === "student-dashboard") {
    return (
      <div style={{ padding: "20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
          <h1>Browse Quizzes</h1>
          <button onClick={handleLogout} style={{ padding: "10px 20px", backgroundColor: "#dc3545", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>Logout</button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
          {quizzes.map((quiz) => (<div key={quiz.id} style={{ backgroundColor: "white", padding: "20px", borderRadius: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}><h3>{quiz.title}</h3><p>{quiz.description}</p><p><strong>Difficulty:</strong> {quiz.difficulty}</p><p><strong>Duration:</strong> {quiz.duration} minutes</p><button onClick={() => handleStartQuiz(quiz.id)} style={{ width: "100%", padding: "12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>Start Quiz</button></div>))}
        </div>
      </div>
    );
  }

  if (currentPage === "quiz") {
    const question = currentQuiz.questions[currentQuestionIndex];
    const minutes = Math.floor(quizTimer / 60);
    const seconds = quizTimer % 60;

    if (submitted) {
      return (
        <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
          <h1>Quiz Results</h1>
          <div style={{ backgroundColor: result.status === "PASSED" ? "#d4edda" : "#f8d7da", padding: "20px", borderRadius: "8px", marginBottom: "20px" }}>
            <h2>{result.status === "PASSED" ? "✓ PASSED" : "✗ FAILED"}</h2>
            <p>Score: {result.score}/{currentQuiz.questions.reduce((sum, q) => sum + q.marks, 0)}</p>
            <p>Percentage: {result.percentage.toFixed(2)}%</p>
          </div>
          <button onClick={() => setShowReview(!showReview)} style={{ padding: "10px 20px", backgroundColor: "#17a2b8", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", marginBottom: "20px" }}>
            {showReview ? "Hide Answer Review" : "View Answer Review"}
          </button>
          {showReview && (
            <div>
              {currentQuiz.questions.map((q, idx) => {
                const userAnswer = answers[q.id];
                const correctOption = q.options.find((o) => o.is_correct);
                const userOption = q.options.find((o) => o.id === parseInt(userAnswer));
                return (
                  <div key={q.id} style={{ backgroundColor: "white", padding: "15px", marginBottom: "15px", borderRadius: "8px", border: `3px solid ${userOption?.is_correct ? "#28a745" : "#dc3545"}` }}>
                    <p><strong>Q{idx + 1}: {q.question_text}</strong></p>
                    <p style={{ color: "#28a745" }}>✓ Correct Answer: {correctOption?.option_text}</p>
                    {userOption ? (
                      <p style={{ color: userOption.is_correct ? "#28a745" : "#dc3545" }}>
                        Your Answer: {userOption.option_text}
                      </p>
                    ) : (
                      <p style={{ color: "#dc3545" }}>You didn't answer this question</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <button onClick={() => { setCurrentPage("student-dashboard"); setCurrentQuiz(null); }} style={{ width: "100%", padding: "12px", backgroundColor: "#007bff", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>
            Back to Quizzes
          </button>
        </div>
      );
    }

    return (
      <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5" }}>
        <div style={{ width: "200px", backgroundColor: "white", padding: "20px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", overflowY: "auto" }}>
          <h3>Progress</h3>
          <div style={{ marginTop: "15px" }}>
            {currentQuiz.questions.map((q, idx) => (
              <button
                key={q.id}
                onClick={() => handleJumpToQuestion(idx)}
                style={{
                  width: "100%",
                  padding: "10px",
                  marginBottom: "8px",
                  backgroundColor: answers[q.id] ? "#28a745" : "#e0e0e0",
                  color: answers[q.id] ? "white" : "black",
                  border: currentQuestionIndex === idx ? "3px solid #007bff" : "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: currentQuestionIndex === idx ? "bold" : "normal"
                }}
              >
                Q{idx + 1}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "40px" }}>
          <div style={{ textAlign: "center", backgroundColor: quizTimer < 60 ? "#dc3545" : "#007bff", color: "white", padding: "15px", borderRadius: "8px", marginBottom: "20px" }}>
            <h2>Time Remaining: {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}</h2>
          </div>
          <div style={{ flex: 1 }}>
            <h2>Question {currentQuestionIndex + 1} of {currentQuiz.questions.length}</h2>
            <h3 style={{ marginTop: "20px" }}>{question.question_text}</h3>
            <div style={{ marginTop: "20px" }}>
              {question.options.map((option) => (
                <label key={option.id} style={{ display: "block", marginBottom: "15px", padding: "12px", border: "2px solid #ddd", borderRadius: "4px", cursor: "pointer", backgroundColor: answers[question.id] === option.id ? "#e7f3ff" : "white" }}>
                  <input
                    type="radio"
                    name="option"
                    value={option.id}
                    checked={answers[question.id] === option.id}
                    onChange={() => handleSelectOption(question.id, option.id)}
                    style={{ marginRight: "10px", cursor: "pointer" }}
                  />
                  {option.option_text}
                </label>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "15px", marginTop: "30px" }}>
            <button onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0} style={{ flex: 1, padding: "12px", backgroundColor: currentQuestionIndex === 0 ? "#ccc" : "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: currentQuestionIndex === 0 ? "not-allowed" : "pointer", fontSize: "16px" }}>
              Previousss
            </button>
            <button onClick={handleNextQuestion} disabled={currentQuestionIndex === currentQuiz.questions.length - 1} style={{ flex: 1, padding: "12px", backgroundColor: currentQuestionIndex === currentQuiz.questions.length - 1 ? "#ccc" : "#6c757d", color: "white", border: "none", borderRadius: "4px", cursor: currentQuestionIndex === currentQuiz.questions.length - 1 ? "not-allowed" : "pointer", fontSize: "16px" }}>
              Next
            </button>
            <button onClick={handleSubmit} style={{ flex: 1, padding: "12px", backgroundColor: "#28a745", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "16px" }}>
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }
}
EOF