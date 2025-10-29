from transformers import pipeline

MODEL_PATH = "suplex-city/intent_classifier"  

intent_model = pipeline("text-classification", model=MODEL_PATH)

LABEL_TO_INTENT = {
    "LABEL_0": "admission_process",
    "LABEL_1": "eligibility",
    "LABEL_2": "fees_info",
    "LABEL_3": "admission_dates",
    "LABEL_4": "user_info",
    "LABEL_5": "document_requirements",
    "LABEL_6": "evaluation_process",
    "LABEL_7": "contact_info",
    "LABEL_8": "scholarship_info",
    "LABEL_9": "technical_support",
    "LABEL_10": "academic_details",
    "LABEL_11": "campus_life"
}

def predict_intent(query: str):
   
    result = intent_model(query)[0]
    label = result["label"]
    confidence = result["score"]

    intent_name = LABEL_TO_INTENT.get(label, label)

    return {"intent": intent_name, "confidence": confidence}

