/** @format */

export const slotOrder = [
  "course",
  "percentage",
  "location",
  "college_name",
  "type",
  "mode_of_study",
  "medium",
  "timing",
  "gender",
  "scholarship",
  "hostel",
  "specialization",
  "intake_year",
  "budget",
];

export const slotQuestions = {
  course: "Great! Could you please tell me which course you're interested in?",
  percentage: "Got it. What was your percentage or overall marks?",
  location: "Which city or location are you looking to study in?",
  college_name: "Do you have any specific college in mind?",
  type: "What type of college are you looking for? (For example, Grant-in-Aid, Self-financed, etc.)",
  mode_of_study: "Would you prefer regular classes or distance learning?",
  medium: "Which medium of instruction do you prefer? (English, Hindi, Gujarati, etc.)",
  timing: "What timing works best for you — morning or evening classes?",
  gender: "Are you looking for a boys' college, girls' college, or co-education?",
  scholarship: "Would you like to explore any scholarship options?",
  hostel: "Do you need hostel accommodation?",
  specialization: "Is there any particular specialization you're interested in?",
  budget: "Lastly, what's your budget range for the course?",
  intake_year: "IN Which Year you want to take admission",
};

export function getNextEmptySlot(slots) {
  return slotOrder.find((s) => !slots[s] || slots[s].trim() === "") || null;
}

export function checkSlotsComplete(slots) {
  return slotOrder.every((s) => slots[s] && slots[s].trim() !== "");
}
