import os
import json
import re
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from pydantic import BaseModel

load_dotenv()
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
if not GOOGLE_API_KEY:
    raise EnvironmentError("GOOGLE_API_KEY not found in environment!")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
    api_key=GOOGLE_API_KEY,
)

class AdmissionQuery(BaseModel):
    slot_name: str
    value: str | None

def extract_slots(user_query: str):
    messages = [
        (
            "system",
            """
You are a helpful assistant for a university admission chatbot. 
Your job is to extract structured slot information from a user's query and output a JSON array.

Rules:
1. Extract all available information from the user's query into the 'value' field.
2. If information is not provided, set 'value' = null.
3. Always include all listed slots.
4. Only return valid JSON — no text, comments, or explanations.

Include these slots:
- course
- percentage
- location
- college_name
- type
- mode_of_study
- medium
- timing
- gender
- scholarship
- hostel
- specialization
- intake_year
- budget

Examples:

Example 1:
Query: "Hi, I'm looking for an MBA in Mumbai."
Output:
[
    {"slot_name": "course", "value": "MBA"},
    {"slot_name": "percentage", "value": null},
    {"slot_name": "location", "value": "Mumbai"},
    {"slot_name": "college_name", "value": null},
    {"slot_name": "type", "value": null},
    {"slot_name": "mode_of_study", "value": null},
    {"slot_name": "medium", "value": null},
    {"slot_name": "timing", "value": null},
    {"slot_name": "gender", "value": null},
    {"slot_name": "scholarship", "value": null},
    {"slot_name": "hostel", "value": null},
    {"slot_name": "specialization", "value": null},
    {"slot_name": "intake_year", "value": null},
    {"slot_name": "budget", "value": null}
]

Example 2:
Query: "I want admission in A G Teachers College for B.Ed."
Output:
[
    {"slot_name": "course", "value": "B.Ed"},
    {"slot_name": "percentage", "value": null},
    {"slot_name": "location", "value": "Ahmedabad"},
    {"slot_name": "college_name", "value": "A G Teachers College"},
    {"slot_name": "type", "value": "Grant in Aid - Regular"},
    {"slot_name": "mode_of_study", "value": "Morning"},
    {"slot_name": "medium", "value": "Gujarati"},
    {"slot_name": "timing", "value": "Morning"},
    {"slot_name": "gender", "value": "Co-Ed"},
    {"slot_name": "scholarship", "value": null},
    {"slot_name": "hostel", "value": null},
    {"slot_name": "specialization", "value": null},
    {"slot_name": "intake_year", "value": null},
    {"slot_name": "budget", "value": null}
]

Only return valid JSON.
            """
        ),
        ("human", user_query),
    ]

    ai_msg = llm.invoke(messages)
    response_text = ai_msg.content

    match = re.search(r"\[.*\]", response_text, re.DOTALL)
    if not match:
        raise ValueError("No JSON array found in model response")

    clean_json = match.group(0).strip("` \n")
    try:
        slots_data = json.loads(clean_json)
    except json.JSONDecodeError:
        raise ValueError(f"JSON parse error: {response_text}")

    admission_query = [AdmissionQuery(**slot) for slot in slots_data]
    return [slot.dict() for slot in admission_query]
