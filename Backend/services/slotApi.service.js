/** @format */

import axios from "axios";

export async function extractSlotsFromText(text) {
  try {
    const response = await axios.post(
      `${process.env.SLOT_API_URL}/extract_slots`,
      { query: text }
    );
    return response.data;
  } catch (err) {
    console.error("Slot extraction failed:", err);
    return { slots: {} };
  }
}
