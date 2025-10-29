# 📚 University Chatbot System - Definitions & Glossary

## Table of Contents
1. [System Architecture Terms](#system-architecture-terms)
2. [AI/ML Components](#aiml-components)
3. [Backend Concepts](#backend-concepts)
4. [Slot System](#slot-system)
5. [API Endpoints](#api-endpoints)
6. [Models & Libraries](#models--libraries)

---

## System Architecture Terms

### **Frontend**
The user-facing interface built with React and Vite. Handles:
- Chat UI rendering
- User message input/output
- Session management on client side
- HTTP requests to backend API

### **Backend**
Node.js/Express server that orchestrates the chatbot logic. Responsibilities:
- Session lifecycle management
- Slot-filling orchestration
- API routing between frontend and AI agent
- MongoDB database operations
- Question generation based on slot completion

### **AI Agent**
FastAPI-based Python service hosting machine learning models. Provides:
- Intent classification
- Slot extraction from natural language
- RAG (Retrieval-Augmented Generation) pipeline
- Document processing and retrieval

### **Three-Tier Architecture**
```
Frontend (React) → Backend (Node.js) → AI Agent (FastAPI/Python)
```
Separation of concerns: UI, business logic, and ML models

---

## AI/ML Components

### **Intent Classification**
The process of determining what the user wants to accomplish with their query.

**Example:**
- Input: "What are the admission fees for MBA?"
- Output: `fees_info` (confidence: 0.95)

**12 Intent Categories:**
1. `admission_process` - Steps to apply
2. `eligibility` - Who can apply
3. `fees_info` - Cost information
4. `admission_dates` - Important deadlines
5. `user_info` - Personal details
6. `document_requirements` - Required documents
7. `evaluation_process` - How applications are assessed
8. `contact_info` - How to reach the university
9. `scholarship_info` - Financial aid details
10. `technical_support` - Help with the system
11. `academic_details` - Course information
12. `campus_life` - Facilities and activities

### **Slot Extraction**
Extracting structured information from unstructured natural language text.

**Example:**
- Input: "I want to study MBA in Ahmedabad with scholarship"
- Output:
```json
{
  "course": "MBA",
  "location": "Ahmedabad",
  "scholarship": "yes",
  "percentage": null,
  ...
}
```

### **RAG (Retrieval-Augmented Generation)**
A technique that combines document retrieval with LLM generation:

1. **Retrieval:** Find relevant document chunks using TF-IDF + cosine similarity
2. **Augmentation:** Add retrieved context to the prompt
3. **Generation:** LLM generates answer based on context + user query

**Benefits:**
- Factual accuracy (grounded in documents)
- Reduced hallucinations
- Domain-specific knowledge

### **TF-IDF (Term Frequency-Inverse Document Frequency)**
Statistical measure used to evaluate word importance in documents.

- **TF:** How often a term appears in a document
- **IDF:** How rare a term is across all documents
- Used for document ranking and retrieval

### **Cosine Similarity**
Measures similarity between two text vectors (0 to 1).
- 1.0 = identical
- 0.0 = completely different
- Used to find most relevant document chunks

### **OCR (Optical Character Recognition)**
Technology to extract text from images. Used in this system via Tesseract to read text from PDF images/scans.

---

## Backend Concepts

### **Session**
A persistent conversation state stored in MongoDB for each user.

**Session Object Structure:**
```javascript
{
  userId: "unique_user_id",
  slots: { course: "", percentage: "", ... }, // 14 slots
  log: [{ question: "...", answer: "...", timestamp: "..." }],
  intent: "fees_info",
  api_response: { answer: "...", context_used: {...} },
  isComplete: false,
  createdAt: Date,
  updatedAt: Date
}
```

### **Slot-Filling**
Conversational strategy where the system collects required information through sequential questions.

**Process:**
1. Check which slots are empty
2. Ask question for next empty slot
3. Extract information from user response
4. Update slot in database
5. Repeat until all slots filled

### **Conversation Log**
Array of Q&A pairs stored in session:
```javascript
log: [
  { question: "Which course are you interested in?", answer: "MBA" },
  { question: "What was your percentage?", answer: "85%" }
]
```
Used as context for RAG pipeline.

### **Session Lifecycle**
1. **Start:** User clicks "Start Conversation"
2. **Active:** Slot-filling in progress
3. **Complete:** All slots filled, RAG response generated
4. **Reset:** Clear all slots and start over

---

## Slot System

### **14 Required Slots**
Information fields collected from users:

| Slot | Description | Example |
|------|-------------|---------|
| `course` | Program name | "MBA", "B.Ed", "BCA" |
| `percentage` | Academic marks | "85%", "70" |
| `location` | Preferred city | "Ahmedabad", "Mumbai" |
| `college_name` | Specific institution | "A G Teachers College" |
| `type` | College type | "Grant-in-Aid", "Self-financed" |
| `mode_of_study` | Learning format | "Regular", "Distance" |
| `medium` | Language | "English", "Gujarati", "Hindi" |
| `timing` | Class schedule | "Morning", "Evening" |
| `gender` | College type | "Co-Ed", "Boys", "Girls" |
| `scholarship` | Financial aid interest | "Yes", "No" |
| `hostel` | Accommodation need | "Yes", "No" |
| `specialization` | Subject focus | "Finance", "Marketing" |
| `intake_year` | Admission year | "2025", "2026" |
| `budget` | Cost limit | "50000", "1 lakh" |

### **Slot Order**
Predefined sequence for asking questions (defined in `backend/utils/slot.utils.js`)

### **Slot Questions**
Template questions mapped to each slot:
```javascript
slotQuestions = {
  course: "Which course are you interested in?",
  percentage: "What was your percentage?",
  ...
}
```

---

## API Endpoints

### **Backend Endpoints (Node.js)**

#### `POST /api/chat/start`
Initialize new conversation session
- **Input:** `{ userId: string }`
- **Output:** `{ sessionId, message, text }`

#### `POST /api/chat/message`
Send user message and get response
- **Input:** `{ sessionId: string, text: string }`
- **Output:** `{ reply, next_question, current_slots }` OR `{ rag_answer }`

#### `POST /api/chat/reset`
Clear session and restart conversation
- **Input:** `{ sessionId: string }`
- **Output:** `{ message, next_question }`

#### `GET /api/chat/slots/:userId`
Get current slot values
- **Output:** `{ userId, slots }`

#### `GET /api/chat/logs/:userId`
Get conversation history
- **Output:** `{ userId, logs: string }`

#### `GET /api/chat/intent/:userId`
Get predicted intent
- **Output:** `{ userId, intent }`

### **AI Agent Endpoints (FastAPI)**

#### `POST /predict_intent`
Classify user intent
- **Input:** `{ query: string }`
- **Output:** `{ success: true, intent: { intent: string, confidence: float } }`

#### `POST /extract_slots`
Extract structured data from text
- **Input:** `{ query: string }`
- **Output:** `{ success: true, slots: [{slot_name, value}] }`

#### `POST /query`
RAG pipeline for final answer
- **Input:** `{ userId, user_query, slots, intent, logs }`
- **Output:** `{ userId, answer, context_used }`

#### `GET /health`
Check service status
- **Output:** `{ status: "ok" }`

---

## Models & Libraries

### **HuggingFace Transformers**
Library for using pre-trained NLP models
- Used for intent classification
- Model: `suplex-city/intent_classifier`

### **LangChain**
Framework for building LLM applications
- Simplifies prompt engineering
- Handles chat message formatting
- Used with Google Gemini API

### **Google Gemini 2.5 Flash**
Large Language Model by Google
- Used for slot extraction (structured output)
- Used for RAG answer generation
- Fast, cost-effective, multimodal

### **PyPDF2**
Python library for reading PDF files
- Extracts text from PDF pages
- Part of RAG document processing

### **Tesseract OCR**
Open-source OCR engine
- Extracts text from images in PDFs
- Handles scanned documents

### **scikit-learn**
Machine learning library
- TfidfVectorizer: Convert text to TF-IDF vectors
- cosine_similarity: Calculate text similarity
- Used for document retrieval

### **MongoDB & Mongoose**
NoSQL database and ODM (Object Document Mapper)
- Stores user sessions
- Flexible schema for conversation data
- Mongoose provides schema validation

### **Express.js**
Web framework for Node.js
- Handles HTTP routing
- Middleware for CORS, JSON parsing
- RESTful API creation

### **React**
Frontend library for UI
- Component-based architecture
- State management with `useState`
- Real-time chat interface

### **Vite**
Build tool for modern web apps
- Fast development server
- Hot module replacement (HMR)
- Optimized production builds

### **Axios**
HTTP client for making API requests
- Used in backend to call AI Agent APIs
- Promise-based interface
- Error handling

---

## Advanced Concepts

### **Context Window**
The amount of text an LLM can process at once. Gemini 2.5 Flash has large context window, allowing it to process:
- User query
- All 14 slot values
- Conversation logs
- Retrieved document chunks

### **Prompt Engineering**
Crafting instructions for LLMs to get desired output
- System prompts define behavior
- Few-shot examples improve accuracy
- JSON output formatting

### **Chunk Size**
Document split size (default: 500 words). Affects:
- Retrieval granularity
- Context relevance
- Processing speed

### **Top-K Retrieval**
Retrieving K most relevant chunks (default: K=3)
- Balance between context and noise
- More chunks = more context but slower

### **Session Persistence**
Storing conversation state across requests
- Enables multi-turn conversations
- Allows resume after disconnect
- Tracks user journey

### **Slot Overwriting**
When new information contradicts existing slot value:
```javascript
// User first says: "I want MBA"
slots.course = "MBA"

// User later says: "Actually, I prefer BCA"
slots.course = "BCA" // Overwrites previous value
```

### **Combined Context**
Merging multiple information sources for RAG:
```javascript
{
  user_query: "What are MBA fees?",
  slots: { course: "MBA", location: "Ahmedabad", ... },
  logs: "Q1: Which course? A1: MBA...",
  intent: "fees_info",
  admin_docs: "MBA fees at Gujarat University..."
}
```

---

## File Structure

### **Frontend Files**
- `App.jsx` - Main React component with chat logic
- `App.css` - Styling for chat interface
- `main.jsx` - React app entry point

### **Backend Files**
- `server.js` - Express server initialization
- `controllers/chat.controller.js` - Business logic handlers
- `services/*.service.js` - External API callers
- `models/session.model.js` - MongoDB schema
- `routes/chat.routes.js` - API route definitions
- `utils/slot.utils.js` - Slot configuration

### **Agent Files**
- `app.py` - FastAPI server
- `intent_model.py` - Intent classification logic
- `slot_model.py` - Slot extraction with Gemini
- `rag_pipeline.py` - Document retrieval + answer generation
- `requirements.txt` - Python dependencies
- `admin_docs/` - PDF documents for RAG

---

## Environment Variables

### **Backend (.env)**
```
MONGO_URI=mongodb://...           # Database connection
INTENT_API_URL=http://...         # AI Agent intent endpoint
SLOT_API_URL=http://...          # AI Agent slot endpoint
RAG_API_URL=http://...           # AI Agent RAG endpoint
PORT=5000                         # Server port
```

### **Agent (.env)**
```
GOOGLE_API_KEY=...               # Gemini API key
```

---

## Common Terms

- **API (Application Programming Interface):** Interface for software components to communicate
- **REST (Representational State Transfer):** Architectural style for web APIs
- **JSON (JavaScript Object Notation):** Data interchange format
- **CORS (Cross-Origin Resource Sharing):** Security feature allowing cross-domain requests
- **Endpoint:** Specific URL path for API operation
- **Payload:** Data sent in API request body
- **Middleware:** Function that processes requests before reaching route handler
- **Schema:** Structure definition for database documents
- **Vector:** Numerical representation of text
- **Embedding:** Dense vector representation capturing semantic meaning
- **Pipeline:** Sequence of data processing steps
- **Orchestration:** Coordinating multiple services/components
- **State Management:** Handling and syncing application data

---

## Acronyms

- **AI:** Artificial Intelligence
- **ML:** Machine Learning
- **NLP:** Natural Language Processing
- **LLM:** Large Language Model
- **RAG:** Retrieval-Augmented Generation
- **TF-IDF:** Term Frequency-Inverse Document Frequency
- **OCR:** Optical Character Recognition
- **API:** Application Programming Interface
- **REST:** Representational State Transfer
- **HTTP:** HyperText Transfer Protocol
- **JSON:** JavaScript Object Notation
- **CORS:** Cross-Origin Resource Sharing
- **ODM:** Object Document Mapper
- **ORM:** Object-Relational Mapping
- **CRUD:** Create, Read, Update, Delete
- **UI:** User Interface
- **UX:** User Experience
- **DB:** Database
- **PDF:** Portable Document Format

---

*This definitions document covers the core concepts and terminology used throughout the University Chatbot system. Refer to this guide for understanding technical discussions and code implementation.*
