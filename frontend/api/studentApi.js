import axios from "axios";

export const BACKEND = "https://focus-loop-app.onrender.com";

export async function getStatus(id) {
  const r = await axios.get(`${BACKEND}/student/${id}/status`);
  return r.data;
}

export async function dailyCheckin(student_id, score, mins) {
  const r = await axios.post(`${BACKEND}/daily-checkin`, {
    student_id,
    quiz_score: score,
    focus_minutes: mins,
  });
  return r.data;
}

export async function completeIntervention(student_id, intervention_id) {
  const r = await axios.post(`${BACKEND}/intervention/complete-intervention`, {
    student_id,
    intervention_id,
  });
  return r.data;
}