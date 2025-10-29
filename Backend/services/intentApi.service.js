/** @format */

import axios from "axios";

export async function predictIntentAPI(text) {
  try {
    const response = await axios.post(
      `${process.env.INTENT_API_URL}/predict_intent`,
      { query: text }
    );
    return response.data.intent || "unknown";
  } catch (err) {
    console.error("Intent API failed:", err);
    return "unknown";
  }
}
