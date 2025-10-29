/** @format */

import express from "express";
import {
  startChat,
  handleMessage,
  resetSession,
  getUserSlots,
  getSessionLogsAsString,
  getSessionIntent,
} from "../controllers/chat.controller.js";

const router = express.Router();

router.post("/start", startChat);
router.post("/message", handleMessage);
router.post("/reset", resetSession);
router.get("/slots/:userId", getUserSlots);
router.get("/logs/:userId", getSessionLogsAsString);
router.get("/intent/:userId", getSessionIntent);

export default router;
