'use strict';

const RECALL_POOL = ['orbit', 'cedar', 'anchor', 'velvet', 'cobalt', 'harbor', 'falcon', 'marble', 'canyon', 'lantern', 'summit', 'coral', 'silver', 'meadow', 'rocket', 'island', 'pepper', 'magnet', 'timber', 'castle', 'river', 'planet', 'bridge', 'forest', 'signal', 'copper', 'garden', 'helmet', 'pocket', 'winter', 'saddle', 'violet', 'candle', 'ocean', 'mirror', 'engine', 'valley', 'pencil', 'desert', 'compass', 'tunnel', 'cloud', 'camera', 'stone', 'yellow', 'circle', 'window', 'market', 'shadow', 'spring', 'button', 'ladder', 'coffee', 'paper', 'eagle', 'pillow', 'hammer', 'basket', 'orange', 'ticket', 'guitar', 'bottle', 'tower', 'beacon', 'thread', 'ribbon', 'cactus', 'temple', 'helmet', 'dragon', 'crystal', 'bucket', 'feather', 'cotton', 'spoon', 'branch', 'needle', 'barrel', 'tablet', 'socket', 'plaza', 'panda', 'sailor', 'cabin', 'arrow', 'beetle', 'stripe', 'flame', 'wallet', 'puzzle', 'radar', 'museum', 'notebook', 'matrix', 'quartz', 'oyster', 'planet', 'hazel', 'crown', 'spectrum'];
const CONF_DOMAINS = new Set(['logic', 'matrix', 'verbal', 'strategy']);
function dueRecallItems() {
  const today = dayKey();
  return QSTATE.recall.items.filter(i => !i.done && i.due <= today).slice(0, 5);
}
function calibrationSummary() {
  const a = QSTATE.calibration;
  return {
    n: a.length,
    confidence: avg(a.map(c => c.conf)),
    accuracy: avg(a.map(c => c.correct ? 100 : 0)),
    gap: avg(a.map(c => c.conf - (c.correct ? 100 : 0)))
  };
}
function prepareEncoding() {
  const r = QSTATE.recall,
    today = dayKey();
  if (r.pending.length) return r.pending;
  if (r.lastEncoded === today) return [];
  const used = new Set(r.items.filter(i => !i.done).map(i => i.word));
  const pool = sh([...new Set(RECALL_POOL)].filter(w => !used.has(w)));
  if (pool.length < 5) return [];
  const codes = sh(Array.from({
    length: 88
  }, (_, i) => i + 11));
  r.pending = pool.slice(0, 5).map((word, i) => ({
    id: uid(),
    word,
    code: codes[i],
    created: today,
    due: addDays(today, 1),
    stage: 0,
    done: false
  }));
  saveState();
  return r.pending;
}
function commitEncoding() {
  const r = QSTATE.recall;
  if (r.pending.length !== 5) return false;
  const today = dayKey();
  r.items.push(...r.pending.map(i => ({
    ...i,
    created: today,
    due: addDays(today, 1)
  })));
  r.items = r.items.filter(i => !i.done || days(i.created) < 30).slice(-120);
  r.pending = [];
  r.lastEncoded = today;
  saveState();
  return true;
}
function recordRecall(item, response) {
  const ok = /^\d{2}$/.test(String(response)) && Number(response) === item.code,
    r = QSTATE.recall;
  r.total++;
  if (ok) r.correct++;
  if (ok) {
    if (item.stage === 0) {
      item.stage = 1;
      item.due = addDays(dayKey(), 3);
    } else item.done = true;
  } else {
    item.due = addDays(dayKey(), 1);
    item.done = false;
  }
  saveState();
  return ok;
}
function wordsForRack(rack) {
  const counts = {};
  for (const ch of rack) counts[ch] = (counts[ch] || 0) + 1;
  return DICTIONARY_WORDS.filter(w => {
    const c = {
      ...counts
    };
    for (const ch of w) {
      if (!c[ch]) return false;
      c[ch]--;
    }
    return true;
  });
}
function calibrationRecord(domain, pending, conf) {
  QSTATE.calibration.push({
    id: pending.id,
    domain,
    conf: Number(conf),
    correct: pending.correct,
    date: iso(),
    scoringVersion: SCORING_VERSION
  });
  QSTATE.calibration = QSTATE.calibration.slice(-500);
  saveState();
}
