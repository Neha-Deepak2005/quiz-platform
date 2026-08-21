import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE = "/api";

export default function App() {
  const [currentPage, setCurrentPage] = useState("login-type");
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerRole, setRegisterRole] = useState("STUDENT");

  // Admin state
  const [adminQuizzes, setAdminQuizzes] = useState([]);
  const [quizTitle, setQuizTitle] = useState("");
  const [quizDesc, setQuizDesc] = useState("");
  const [quizDuration, setQuizDuration] = useState("30");

  // Student state
  const [studentQuizzes, setStudentQuizzes] = useState([]);

  // Quiz taking state
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [quizResults, setQuizResults] = useState(null);

  // Fetch quizzes when admin dashboard loads
  useEffect(() => {
    if (currentPage === "admin-dashboard" && token) {
      fetchAdminQuizzes();
    }
  }, [currentPage, token]);

  // Fetch quizzes when student dashboard loads
  useEffect(() => {
    if (currentPage === "student-dashboard" && token) {
      fetchStudentQuizzes();
    }
  }, [currentPage, token]);

  // Quiz timer
  useEffect(() => {
    if (!currentQuiz || submitted || currentPage !== "quiz-taking") return;
    if (timeLeft === null && currentQuiz) {
      setTimeLeft(currentQuiz.duration * 60);
      return;
    }
    if (timeLeft <= 0) {
      handleSubmitQuiz();
      return;
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, currentQuiz, submitted, currentPage]);

  // Fetch quiz details when starting a quiz
  useEffect(() => {
    if (currentPage.startsWith("quiz-") && currentPage !== "quiz-taking" && !currentQuiz) {
      const quizId = parseInt(currentPage.split("-")[1]);
      fetchQuizDetails(quizId);
    }
  }, [currentPage, currentQuiz]);

  const fetchAdminQuizzes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminQuizzes(res.data);
    } catch (err) {
      console.error("Error fetching admin quizzes:", err);
    }
  };

  const fetchStudentQuizzes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/quizzes/published`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudentQuizzes(res.data);
    } catch (err) {
      console.error("Error fetching student quizzes:", err);
    }
  };

  const fetchQuizDetails = async (quizId) => {
    try {
      const res = await axios.get(`${API_BASE}/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentQuiz(res.data);
      setCurrentPage("quiz-taking");
    } catch (err) {
      alert("Error loading quiz");
      setCurrentPage("student-dashboard");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password
      });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("role", res.data.role);
      setToken(res.data.access_token);
      setRole(res.data.role);
      setEmail("");
      setPassword("");
      setCurrentPage(res.data.role === "ADMIN" ? "admin-dashboard" : "student-dashboard");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Login failed");
    }
    setLoading(false);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await axios.post(`${API_BASE}/auth/register`, {
        email,
        password,
        role: registerRole
      });
      setMessage("Registration successful! Please login.");
      setIsRegister(false);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Registration failed");
    }
    setLoading(false);
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_BASE}/admin/quizzes`, {
        title: quizTitle,
        description: quizDesc,
        duration: parseInt(quizDuration)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizTitle("");
      setQuizDesc("");
      setQuizDuration("30");
      fetchAdminQuizzes();
      setMessage("Quiz created successfully!");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to create quiz");
    }
  };

  const handleSubmitQuiz = async () => {
    if (!currentQuiz) return;
    setSubmitted(true);
    try {
      const res = await axios.post(`${API_BASE}/quizzes/${currentQuiz.id}/submit`, {
        answers: answers
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizResults(res.data);
      setCurrentPage("results");
    } catch (err) {
      alert("Error submitting quiz");
      setCurrentPage("student-dashboard");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    setToken(null);
    setRole(null);
    setCurrentPage("login-type");
    setEmail("");
    setPassword("");
    setMessage("");
    setAdminQuizzes([]);
    setStudentQuizzes([]);
    setCurrentQuiz(null);
    setAnswers({});
    setTimeLeft(null);
    setSubmitted(false);
    setQuizResults(null);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Login Type Selection Page
  if (currentPage === "login-type") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        margin: 0,
        padding: "20px"
      }}>
        <div style={{
          textAlign: "center",
          background: "white",
          padding: "60px 40px",
          borderRadius: "15px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: "400px",
          width: "100%"
        }}>
          <h1 style={{
            fontSize: "32px",
            fontWeight: "700",
            color: "#333",
            marginBottom: "10px"
          }}>Welcome to Quiz Platform</h1>
          <p style={{
            fontSize: "16px",
            color: "#666",
            marginBottom: "40px"
          }}>Select your login type to continue</p>

          <button
            onClick={() => setCurrentPage("login")}
            style={{
              width: "100%",
              padding: "15px",
              marginBottom: "15px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              background: "#667eea",
              color: "white",
              cursor: "pointer",
              transition: "background 0.3s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#5568d3"}
            onMouseLeave={(e) => e.target.style.background = "#667eea"}
          >
            👤 Student Login
          </button>

          <button
            onClick={() => setCurrentPage("login")}
            style={{
              width: "100%",
              padding: "15px",
              marginBottom: "15px",
              fontSize: "16px",
              fontWeight: "600",
              border: "none",
              borderRadius: "8px",
              background: "#764ba2",
              color: "white",
              cursor: "pointer",
              transition: "background 0.3s"
            }}
            onMouseEnter={(e) => e.target.style.background = "#65408a"}
            onMouseLeave={(e) => e.target.style.background = "#764ba2"}
          >
            👨‍💼 Admin Login
          </button>

          <p style={{
            fontSize: "12px",
            color: "#999",
            marginTop: "30px"
          }}>Demo Credentials:<br />
            Student: student@quiz.com / Student@123<br />
            Admin: admin@quiz.com / Admin@123
          </p>
        </div>
      </div>
    );
  }

  // Login/Register Page
  if (currentPage === "login") {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "20px"
      }}>
        <div style={{
          background: "white",
          padding: "40px",
          borderRadius: "15px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          width: "100%",
          maxWidth: "400px"
        }}>
          <h2 style={{
            textAlign: "center",
            color: "#333",
            marginBottom: "30px"
          }}>{isRegister ? "Register" : "Login"}</h2>

          {message && (
            <div style={{
              background: "#f8d7da",
              color: "#721c24",
              padding: "12px",
              borderRadius: "5px",
              marginBottom: "20px",
              fontSize: "14px"
            }}>
              {message}
            </div>
          )}

          <form onSubmit={isRegister ? handleRegister : handleLogin}>
            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "600"
              }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{
                display: "block",
                marginBottom: "8px",
                color: "#333",
                fontWeight: "600"
              }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #ddd",
                  borderRadius: "5px",
                  fontSize: "16px",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {isRegister && (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#333",
                    fontWeight: "600"
                  }}>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#333",
                    fontWeight: "600"
                  }}>Role</label>
                  <select
                    value={registerRole}
                    onChange={(e) => setRegisterRole(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      border: "1px solid #ddd",
                      borderRadius: "5px",
                      fontSize: "16px",
                      boxSizing: "border-box"
                    }}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                background: "#667eea",
                color: "white",
                border: "none",
                borderRadius: "5px",
                fontSize: "16px",
                fontWeight: "600",
                cursor: "pointer",
                opacity: loading ? 0.6 : 1
              }}
            >
              {loading ? "Loading..." : (isRegister ? "Register" : "Login")}
            </button>
          </form>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setMessage("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#667eea",
                cursor: "pointer",
                fontSize: "14px",
                textDecoration: "underline"
              }}
            >
              {isRegister ? "Back to Login" : "Create Account"}
            </button>
          </div>

          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <button
              onClick={() => {
                setCurrentPage("login-type");
                setMessage("");
              }}
              style={{
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "14px"
              }}
            >
              ← Back to Type Selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  if (currentPage === "admin-dashboard" && token) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <header style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h1>Admin Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </header>

        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            marginBottom: "30px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
          }}>
            <h2>Create New Quiz</h2>
            {message && (
              <div style={{
                background: "#d4edda",
                color: "#155724",
                padding: "12px",
                borderRadius: "5px",
                marginBottom: "20px"
              }}>
                {message}
              </div>
            )}
            <form onSubmit={handleCreateQuiz}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600"
                }}>Quiz Title</label>
                <input
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  required
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600"
                }}>Description</label>
                <textarea
                  value={quizDesc}
                  onChange={(e) => setQuizDesc(e.target.value)}
                  rows="4"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600"
                }}>Duration (minutes)</label>
                <input
                  type="number"
                  value={quizDuration}
                  onChange={(e) => setQuizDuration(e.target.value)}
                  min="1"
                  style={{
                    width: "100%",
                    padding: "10px",
                    border: "1px solid #ddd",
                    borderRadius: "5px",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  padding: "12px 30px",
                  background: "#667eea",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  fontWeight: "600"
                }}
              >
                Create Quiz
              </button>
            </form>
          </div>

          <div>
            <h2>Your Quizzes</h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px"
            }}>
              {adminQuizzes.map((quiz) => (
                <div key={quiz.id} style={{
                  background: "white",
                  padding: "20px",
                  borderRadius: "10px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
                }}>
                  <h3>{quiz.title}</h3>
                  <p style={{ color: "#666" }}>{quiz.description}</p>
                  <p style={{ fontSize: "14px", color: "#999" }}>
                    Duration: {quiz.duration} minutes | Status: {quiz.status}
                  </p>
                  <button
                    onClick={() => alert("Edit functionality coming soon")}
                    style={{
                      width: "100%",
                      padding: "10px",
                      background: "#667eea",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer"
                    }}
                  >
                    Edit Quiz
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Student Dashboard
  if (currentPage === "student-dashboard" && token) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <header style={{
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h1>Student Dashboard</h1>
          <button
            onClick={handleLogout}
            style={{
              padding: "10px 20px",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
        </header>

        <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
          <h2>Available Quizzes</h2>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: "20px"
          }}>
            {studentQuizzes.map((quiz) => (
              <div key={quiz.id} style={{
                background: "white",
                padding: "20px",
                borderRadius: "10px",
                boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
              }}>
                <h3>{quiz.title}</h3>
                <p style={{ color: "#666" }}>{quiz.description}</p>
                <p style={{ fontSize: "14px", color: "#999" }}>
                  Duration: {quiz.duration} minutes
                </p>
                <button
                  onClick={() => {
                    setCurrentQuestion(0);
                    setAnswers({});
                    setTimeLeft(null);
                    setSubmitted(false);
                    fetchQuizDetails(quiz.id);
                  }}
                  style={{
                    width: "100%",
                    padding: "10px",
                    background: "#667eea",
                    color: "white",
                    border: "none",
                    borderRadius: "5px",
                    cursor: "pointer"
                  }}
                >
                  Start Quiz
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Quiz Taking Page
  if (currentPage === "quiz-taking" && currentQuiz && token) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            background: "white",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <h2>{currentQuiz.title}</h2>
            <div style={{ fontSize: "20px", fontWeight: "bold", color: timeLeft < 60 ? "#d32f2f" : "#667eea" }}>
              {formatTime(timeLeft || 0)}
            </div>
          </div>

          <div style={{
            display: "flex",
            gap: "5px",
            marginBottom: "20px",
            flexWrap: "wrap"
          }}>
            {currentQuiz.questions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                style={{
                  width: "40px",
                  height: "40px",
                  padding: "0",
                  border: "none",
                  borderRadius: "5px",
                  background: answers[q.id] ? "#4caf50" : (idx === currentQuestion ? "#667eea" : "#ddd"),
                  color: answers[q.id] ? "white" : (idx === currentQuestion ? "white" : "#333"),
                  cursor: "pointer",
                  fontWeight: "bold"
                }}
              >
                {idx + 1}
              </button>
            ))}
          </div>

          <div style={{
            background: "white",
            padding: "30px",
            borderRadius: "10px",
            marginBottom: "20px"
          }}>
            <h3>{currentQuiz.questions[currentQuestion].question_text}</h3>
            <div style={{ marginTop: "20px" }}>
              {currentQuiz.questions[currentQuestion].options.map((option) => (
                <label key={option.id} style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "12px",
                  marginBottom: "10px",
                  border: "2px solid #ddd",
                  borderRadius: "5px",
                  cursor: "pointer",
                  background: answers[currentQuiz.questions[currentQuestion].id] === option.id ? "#e3f2fd" : "white",
                  borderColor: answers[currentQuiz.questions[currentQuestion].id] === option.id ? "#667eea" : "#ddd"
                }}>
                  <input
                    type="radio"
                    name={`question-${currentQuiz.questions[currentQuestion].id}`}
                    value={option.id}
                    checked={answers[currentQuiz.questions[currentQuestion].id] === option.id}
                    onChange={(e) => setAnswers({
                      ...answers,
                      [currentQuiz.questions[currentQuestion].id]: parseInt(e.target.value)
                    })}
                    style={{ marginRight: "10px" }}
                  />
                  {option.option_text}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              style={{
                padding: "10px 20px",
                background: "#ddd",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                opacity: currentQuestion === 0 ? 0.5 : 1
              }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentQuestion(Math.min(currentQuiz.questions.length - 1, currentQuestion + 1))}
              disabled={currentQuestion === currentQuiz.questions.length - 1}
              style={{
                padding: "10px 20px",
                background: "#ddd",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                opacity: currentQuestion === currentQuiz.questions.length - 1 ? 0.5 : 1,
                flex: 1
              }}
            >
              Next
            </button>
            <button
              onClick={handleSubmitQuiz}
              style={{
                padding: "10px 30px",
                background: "#4caf50",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontWeight: "bold"
              }}
            >
              Submit Quiz
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Results Page
  if (currentPage === "results" && quizResults && currentQuiz && token) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#f5f7fa",
        padding: "20px",
        fontFamily: "system-ui, -apple-system, sans-serif"
      }}>
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div style={{
            background: quizResults.status === "PASSED" ? "#c8e6c9" : "#ffcdd2",
            padding: "30px",
            borderRadius: "10px",
            textAlign: "center",
            marginBottom: "20px"
          }}>
            <h1 style={{
              fontSize: "36px",
              margin: "0 0 10px 0",
              color: quizResults.status === "PASSED" ? "#2e7d32" : "#c62828"
            }}>
              {quizResults.status === "PASSED" ? "✓ Passed" : "✗ Failed"}
            </h1>
            <p style={{ fontSize: "24px", margin: "0", color: quizResults.status === "PASSED" ? "#2e7d32" : "#c62828" }}>
              Score: {Math.round(quizResults.percentage)}%
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentPage("student-dashboard");
              setCurrentQuiz(null);
              setQuizResults(null);
            }}
            style={{
              width: "100%",
              padding: "15px",
              background: "#667eea",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "bold",
              marginTop: "20px"
            }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "system-ui, -apple-system, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1>Loading...</h1>
      </div>
    </div>
  );
}