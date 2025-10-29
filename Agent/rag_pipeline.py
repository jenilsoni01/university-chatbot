
import os
import json
from PyPDF2 import PdfReader
from PIL import Image
from io import BytesIO
import pytesseract
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI


load_dotenv()
TOP_K = 3
ADMIN_DOCS_PATH = "./admin_docs/"
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY not found!")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=GOOGLE_API_KEY,
)

def extract_text_from_pdf(pdf_path: str) -> str:
    """Extract text from PDF pages."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def extract_text_from_images_in_pdf(pdf_path: str) -> str:
    """Extract text from images in PDF pages, handles list or dict."""
    reader = PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        images = getattr(page, "images", [])
        if isinstance(images, dict):
            images = images.values()  
        for image_file_object in images:
            try:
                image = Image.open(BytesIO(image_file_object.data))
                text += pytesseract.image_to_string(image)
            except Exception:
                continue  
    return text

def extract_all_admin_docs_text() -> str:
    """Extract text from all PDFs in admin docs folder."""
    combined_text = ""
    for file_name in os.listdir(ADMIN_DOCS_PATH):
        if file_name.lower().endswith(".pdf"):
            path = os.path.join(ADMIN_DOCS_PATH, file_name)
            combined_text += extract_text_from_pdf(path)
            combined_text += extract_text_from_images_in_pdf(path)
    return combined_text

def chunk_text(text: str, chunk_size: int = 500) -> list[str]:
    """Split text into chunks of roughly chunk_size words."""
    words = text.split()
    return [" ".join(words[i:i+chunk_size]) for i in range(0, len(words), chunk_size)]

def retrieve_top_k_chunks(question: str, chunks: list[str], k: int = TOP_K) -> list[str]:
    """Retrieve top-k relevant chunks based on TF-IDF cosine similarity."""
    vectorizer = TfidfVectorizer()
    vectors = vectorizer.fit_transform([question] + chunks)
    sim_scores = cosine_similarity(vectors[0:1], vectors[1:]).flatten()
    top_indices = sim_scores.argsort()[-k:][::-1]
    return [chunks[i] for i in top_indices]

def query_gemini_model(context: str) -> str:
    """Query Gemini LLM with provided context."""
    messages = [
        ("system", "You are a helpful assistant. Answer based on the provided context."),
        ("human", context)
    ]
    ai_msg = llm.invoke(messages)
    return ai_msg.content

def rag_pipeline(user_query: str, session_data: dict) -> dict:
    """
    Complete RAG pipeline:
    - Uses provided slots, intent, and logs (logs must be a string)
    - Retrieves top-K admin document chunks
    - Queries Gemini LLM
    """
    slots = session_data.get("slots", {})
    logs = session_data.get("logs", "")
    intent = session_data.get("intent", "")

    admin_text = extract_all_admin_docs_text()
    chunks = chunk_text(admin_text)
    top_chunks = retrieve_top_k_chunks(user_query, chunks, k=TOP_K)
    admin_context = "\n\n".join(top_chunks)

    combined_context = {
        "user_query": user_query,
        "slots": slots,
        "logs": logs, 
        "intent": intent,
        "admin_docs": admin_context
    }

    answer = query_gemini_model(json.dumps(combined_context))
    return {"answer": answer, "context_used": combined_context}
