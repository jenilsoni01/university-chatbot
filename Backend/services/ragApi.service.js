/** @format */

import axios from "axios";

export async function callRAGModelAPI(payload) {
  try {
    const response = await axios.post(
      `${process.env.RAG_API_URL}/query`,
      payload
    );
    return response.data;
  } catch (err) {
    console.error("RAG API failed:", err);
    return { answer: "RAG API failed", context_used: {} };
  }
}
