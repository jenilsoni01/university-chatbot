/** @format */

import mongoose from "mongoose";

const logSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  slots: {
    course: { type: String, default: "" },
    percentage: { type: String, default: "" },
    location: { type: String, default: "" },
    college_name: { type: String, default: "" },
    type: { type: String, default: "" },
    mode_of_study: { type: String, default: "" },
    medium: { type: String, default: "" },
    timing: { type: String, default: "" },
    gender: { type: String, default: "" },
    scholarship: { type: String, default: "" },
    hostel: { type: String, default: "" },
    specialization: { type: String, default: "" },
    intake_year: { type: String, default: "" },
    budget: { type: String, default: "" },
  },
  log: { type: [logSchema], default: [] },
  intent: { type: String, default: "" },
  api_response: { type: mongoose.Schema.Types.Mixed, default: null },
  isComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

sessionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Session = mongoose.model("Session", sessionSchema);
export default Session;
