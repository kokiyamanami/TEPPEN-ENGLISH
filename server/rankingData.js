// ランキング用モックデータ（固定値。サーバー再起動しても順位が変わらないようMath.randomは使わない）
// TODO(将来): 実ユーザーの学習ログ集計に置き換え

const ALL_USERS_MOCK = [
  { name: '中村 早紀', weeklyStudyMin: 612 },
  { name: '小林 陽介', weeklyStudyMin: 145 },
  { name: '吉田 蓮', weeklyStudyMin: 388 },
  { name: '山本 直樹', weeklyStudyMin: 522 },
  { name: '加藤 沙織', weeklyStudyMin: 201 },
  { name: '斎藤 拓也', weeklyStudyMin: 467 },
  { name: '清水 美咲', weeklyStudyMin: 333 },
  { name: '井上 大和', weeklyStudyMin: 289 },
  { name: '木村 遥', weeklyStudyMin: 578 },
  { name: '林 健二', weeklyStudyMin: 176 },
  { name: '橋本 彩', weeklyStudyMin: 421 },
  { name: '近藤 亮', weeklyStudyMin: 254 },
  { name: '石田 優子', weeklyStudyMin: 495 },
  { name: '村上 隼人', weeklyStudyMin: 312 },
  { name: '原田 千尋', weeklyStudyMin: 158 },
  { name: '松田 亮太', weeklyStudyMin: 440 },
  { name: '藤田 恵', weeklyStudyMin: 367 },
  { name: '岡田 翔', weeklyStudyMin: 229 },
  { name: '西村 麻衣', weeklyStudyMin: 503 },
  { name: '後藤 太一', weeklyStudyMin: 194 },
  { name: '杉山 真央', weeklyStudyMin: 356 },
  { name: '三浦 陸', weeklyStudyMin: 271 },
  { name: '宮本 美穂', weeklyStudyMin: 488 },
  { name: '長谷川 蓮', weeklyStudyMin: 132 },
  { name: '福田 沙也', weeklyStudyMin: 399 },
  { name: '酒井 光', weeklyStudyMin: 245 },
  { name: '平野 美由紀', weeklyStudyMin: 561 },
  { name: '高木 涼太', weeklyStudyMin: 218 },
  { name: '大野 千夏', weeklyStudyMin: 305 },
  { name: '中川 悠斗', weeklyStudyMin: 452 },
];

const OTHER_GROUPS_MOCK = [
  { name: 'bグループ', memberCount: 6, weeklyStudyMin: 1840 },
  { name: 'cグループ', memberCount: 4, weeklyStudyMin: 1420 },
  { name: 'dグループ', memberCount: 5, weeklyStudyMin: 1965 },
  { name: 'eグループ', memberCount: 7, weeklyStudyMin: 2210 },
  { name: 'fグループ', memberCount: 5, weeklyStudyMin: 1580 },
];

module.exports = { ALL_USERS_MOCK, OTHER_GROUPS_MOCK };
