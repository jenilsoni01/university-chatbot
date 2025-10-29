import React, { useState, useRef, useEffect } from "react";
import "./App.css";

const App = () => {
  const [currentPage, setCurrentPage] = useState("home");
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleStartConversation = async () => {
    try {
      const response = await fetch(`${process.env.Backend_URL}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "jenil@123", 
        }),
      });

      const data = await response.json();
      console.log("Conversation started:", data);


      const id =
        data?.sessionId ||  data?.id || Date.now().toString();
      setUserId(id);

      setCurrentPage("chat");
      setMessages([
        {
          type: "bot",
          text:  data?.text || "Hello! Welcome to Gujarat University Chatbot. How can I assist you today?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    } catch (error) {
      console.error("Error starting conversation:", error);
      
      const id = Date.now().toString();
      setUserId(id);
      setCurrentPage("chat");
      setMessages([
        {
          type: "bot",
          text: "Hello! Welcome to Gujarat University Chatbot. How can I assist you today?",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      type: "user",
      text: inputValue,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Call your backend API here
      const response = await fetch(`${process.env.Backend_URL}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: userId, text: inputValue }),
      });

      const data = await response.json();
      console.log(data)


      const botMessage = {
        type: "bot",
        text: data?.rag_answer?.answer || data?.next_question || "I received your message!",
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage = {
        type: "bot",
        text: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToHome = () => {
    setCurrentPage("home");
    setMessages([]);
    setUserId(null);
  };

  return (
    <div className="app">
      {currentPage === "home" ? (
        <div className="home-page">
          <div className="animated-bg">
            <div className="circle circle1"></div>
            <div className="circle circle2"></div>
            <div className="circle circle3"></div>
            <div className="circle circle4"></div>
          </div>

          <div className="home-content">
            <div className="logo-container">
              <div className="logo">
                <div className="logo-icon">AI</div>
              </div>
              <div className="powered-by">Powered by Agen AI</div>
            </div>

            <h1 className="main-title">Gujarat University Chatbot</h1>
            <p className="subtitle">
              Your intelligent assistant for all university-related queries
            </p>

            <button className="start-button" onClick={handleStartConversation}>
              <span className="button-text">Start Conversation</span>
              <div className="button-glow"></div>
            </button>

            <div className="features">
              <div className="feature">
                <div className="feature-icon">💬</div>
                <div className="feature-text">24/7 Available</div>
              </div>
              <div className="feature">
                <div className="feature-icon">⚡</div>
                <div className="feature-text">Instant Responses</div>
              </div>
              <div className="feature">
                <div className="feature-icon">🎓</div>
                <div className="feature-text">University Expert</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="chat-page">
          <div className="chat-header">
            <button className="back-button" onClick={handleBackToHome}>
              ← Back
            </button>
            <div className="header-info">
              <div className="header-logo">AI</div>
              <div className="header-text">
                <h2>Gujarat University Chatbot</h2>
                <span className="status-indicator">● Online</span>
              </div>
            </div>
          </div>

          <div className="chat-container">
            <div className="messages-container">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`message ${
                    message.type === "user" ? "user-message" : "bot-message"
                  }`}
                >
                  <div className="message-avatar">
                    {message.type === "user" ? "👤" : "🤖"}
                  </div>
                  <div className="message-content">
                    <div className="message-text">{message.text}</div>
                    <div className="message-time">{message.timestamp}</div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message bot-message">
                  <div className="message-avatar">🤖</div>
                  <div className="message-content">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="input-container" onSubmit={handleSendMessage}>
              <input
                type="text"
                className="message-input"
                placeholder="Type your message here..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="submit"
                className="send-button"
                disabled={!inputValue.trim() || isLoading}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
