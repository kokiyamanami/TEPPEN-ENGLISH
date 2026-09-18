const db = require('./db');

const DEFAULT_GOAL = { study: 90, speak: 30 };
const REST_LIMIT_PER_MONTH = 4;

function goalHistory(studentId) {
  return db
    .prepare('SELECT effective_from as "from", study_goal as study, speak_goal as speak FROM goal_history WHERE student_id = ? ORDER BY effective_from, id')
    .all(studentId);
}

function restDays(studentId) {
  return db.prepare('SELECT date FROM rest_days WHERE student_id = ? ORDER BY date').all(studentId).map((r) => r.date);
}

function currentGoal(history) {
  return history.length ? history[history.length - 1] : DEFAULT_GOAL;
}

module.exports = { DEFAULT_GOAL, REST_LIMIT_PER_MONTH, goalHistory, restDays, currentGoal };
