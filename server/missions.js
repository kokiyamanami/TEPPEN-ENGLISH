const db = require('./db');
const { todayStr, mondayOfStr } = require('./dateUtil');

// AI添削（/api/grade）の合否を、クライアントの自己申告ではなくサーバー側で記録する。
// mission: 'daily:photo' | 'daily:question' | 'weekly' | 'monthly'
const WEEKLY_TEST_REQUIRED_STEP = 6;

function upsert(selectSql, selectArgs, updateSql, updateArgs, insertSql, insertArgs) {
  const existing = db.prepare(selectSql).get(...selectArgs);
  if (existing) db.prepare(updateSql).run(...updateArgs, existing.id);
  else db.prepare(insertSql).run(...insertArgs);
}

// 記録した場合はtrue、対象外・条件未達で記録しなかった場合はfalse
function recordMission(studentId, mission, pass) {
  const passInt = pass ? 1 : 0;
  const today = todayStr();

  if (mission === 'daily:photo' || mission === 'daily:question') {
    const type = mission.slice('daily:'.length);
    upsert(
      'SELECT id FROM daily_mission_results WHERE student_id = ? AND date = ? AND type = ?',
      [studentId, today, type],
      'UPDATE daily_mission_results SET pass = ? WHERE id = ?',
      [passInt],
      'INSERT INTO daily_mission_results (student_id, date, type, pass) VALUES (?, ?, ?, ?)',
      [studentId, today, type, passInt]
    );
    return true;
  }

  if (mission === 'weekly') {
    const weekStart = mondayOfStr();
    // STEP1〜6を完了していない生徒のテスト結果は記録しない
    const progress = db.prepare('SELECT completed_step FROM weekly_progress WHERE student_id = ? AND week_start = ?').get(studentId, weekStart);
    if (!progress || progress.completed_step < WEEKLY_TEST_REQUIRED_STEP) return false;
    upsert(
      'SELECT id FROM weekly_mission_results WHERE student_id = ? AND week_start = ?',
      [studentId, weekStart],
      'UPDATE weekly_mission_results SET pass = ?, date = ? WHERE id = ?',
      [passInt, today],
      'INSERT INTO weekly_mission_results (student_id, week_start, pass, date) VALUES (?, ?, ?, ?)',
      [studentId, weekStart, passInt, today]
    );
    return true;
  }

  if (mission === 'monthly') {
    const month = today.slice(0, 7);
    upsert(
      'SELECT id FROM monthly_mission_results WHERE student_id = ? AND month = ?',
      [studentId, month],
      'UPDATE monthly_mission_results SET pass = ?, date = ? WHERE id = ?',
      [passInt, today],
      'INSERT INTO monthly_mission_results (student_id, month, pass, date) VALUES (?, ?, ?, ?)',
      [studentId, month, passInt, today]
    );
    return true;
  }

  return false;
}

module.exports = { recordMission };
