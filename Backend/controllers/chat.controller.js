/** @format */

import Session from "../models/session.model.js";
import { extractSlotsFromText } from "../services/slotApi.service.js";
import { callRAGModelAPI } from "../services/ragApi.service.js";
import { predictIntentAPI } from "../services/intentApi.service.js";
import {
  checkSlotsComplete,
  slotOrder,
  slotQuestions,
  getNextEmptySlot,
} from "../utils/slot.utils.js";
export async function startChat(req, res) {
  const { userId } = req.body;
  if (!userId) return res.status(400).json({ error: "userId required" });

  let session = await Session.findOne({ userId });
  if (!session) {
    session = new Session({ userId });
    await session.save();
  }

  return res.json({
    message: "Session started",
    sessionId: session._id,
    text: "Welcome to the Gujarat University Admission Chatbot! You can ask any question about Gujarat University and its colleges.",
  });
}
export async function handleMessage(req, res) {
  try {
    const { sessionId, text } = req.body;
    console.log("Received handleMessage request:")
    if (!sessionId || typeof text === "undefined") {
      return res.status(400).json({ error: "sessionId and text required" });
    }

    const session = await Session.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const lastQuestion =
      session.log.length > 0
        ? session.log[session.log.length - 1].question
        : "User Query";

    const combinedText = `This is question ${lastQuestion} and user gave this answer : ${text} according to question and answer ectract slot`;

    const slotApiResult = await extractSlotsFromText(combinedText);
    let extractedSlots = slotApiResult?.slots || [];
    if (Array.isArray(extractedSlots)) {
      const flatSlots = {};
      for (const s of extractedSlots) {
        if (s.slot_name && s.value !== undefined && s.value !== null) {
          flatSlots[s.slot_name] = s.value;
        }
      }
      extractedSlots = flatSlots;
    }

    console.log("Flattened Extracted Slots:", extractedSlots);

    let updated = false;
    const newSlots = { ...session.slots };

    for (const [slotName, value] of Object.entries(extractedSlots)) {
      const cleanValue = value?.toString().trim();
      if (!cleanValue) continue;

      if (
        slotName in newSlots &&
        (!newSlots[slotName] || newSlots[slotName].trim() === "")
      ) {
        console.log(`Updating slot "${slotName}" → "${cleanValue}"`);
        newSlots[slotName] = cleanValue;
        updated = true;
      } else if (slotName in newSlots && newSlots[slotName] !== cleanValue) {
        console.log(`Overwriting slot "${slotName}" → "${cleanValue}"`);
        newSlots[slotName] = cleanValue;
        updated = true;
      } else {
        console.log(`❌ Not updating slot "${slotName}"`);
      }
    }

    if (updated) {
      session.slots = newSlots;
      session.markModified("slots");
    }
    session.log.push({
      question:
        session.log.length > 0
          ? session.log[session.log.length - 1].question
          : "User Query",
      answer: text,
    });

    await session.save();

    const nextSlot = getNextEmptySlot(session.slots);
    const allFilled = checkSlotsComplete(session.slots);

    if (allFilled) {
      session.isComplete = true;

      const intentText = Object.values(session.slots).join(" ");
      const intentResult = await predictIntentAPI(intentText);
      session.intent = JSON.stringify(intentResult);

      const logsString = session.log
        .map(
          (entry, index) =>
            `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.answer}`
        )
        .join("\n\n");
        
    const payload = {
      userId: session.userId.toString(),
      user_query: intentText, 
      slots: session.slots,
      intent:
        typeof session.intent === "object"
          ? JSON.stringify(session.intent)
          : session.intent,
      logs: logsString,
    };


      const ragAnswer = await callRAGModelAPI(payload);

      await session.save();
      return res.json({
        reply: "✅ All slots are filled! Here are your results:",
        rag_answer: ragAnswer,
        sessionId: session._id,
      });
    }

    const question = nextSlot
      ? slotQuestions[nextSlot]
      : "Thank you. Processing...";

    return res.json({
      reply: "Got it! I've updated your information.",
      next_question: question,
      sessionId: session._id,
      current_slots: session.slots,
    });
  } catch (error) {
    console.error("❌ handleMessage error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function resetSession(req, res) {
  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  const session = await Session.findById(sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });

  slotOrder.forEach((s) => (session.slots[s] = ""));
  session.log = [];
  session.intent = "";
  session.api_response = null;
  session.isComplete = false;

  await session.save();
  return res.json({
    message: "Session reset",
    next_question: slotQuestions[slotOrder[0]],
  });
}

export const getUserSlots = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const session = await Session.findOne({ userId });
  if (!session) return res.status(404).json({ error: "Session not found" });

  return res.json({ userId: session.userId, slots: session.slots });
};

export const getSessionLogsAsString = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const session = await Session.findOne({ userId });
  if (!session) return res.status(404).json({ error: "Session not found" });

  const logsString = session.log
    .map(
      (entry, index) =>
        `Q${index + 1}: ${entry.question}\nA${index + 1}: ${entry.answer}`
    )
    .join("\n\n");
  return res.json({ userId: session.userId, logs: logsString });
};

export const getSessionIntent = async (req, res) => {
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ error: "userId is required" });

  const session = await Session.findOne({ userId });
  if (!session) return res.status(404).json({ error: "Session not found" });

  return res.json({
    userId: session.userId,
    intent: session.intent || "No intent found",
  });
};
