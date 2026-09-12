'use strict';

const IDS = ['arithmetic', 'estimation', 'logic', 'patterns', 'matrix', 'spatial', 'planning', 'attention', 'sustained', 'processing', 'flexibility', 'memory', 'visualmem', 'dual', 'words', 'verbal', 'strategy', 'reflex'];
const META = {
  arithmetic: ['Arithmetic', '∑', 'Mental maths, percentages, ratios and compound changes.'],
  estimation: ['Estimation', '≈', 'Fast approximate calculation without over-solving.'],
  logic: ['Logic', '◇', 'Deduction, syllogisms and information sufficiency.'],
  patterns: ['Patterns', '⌁', 'Numerical sequences and interacting rules.'],
  matrix: ['IQ Matrix', '◫', 'Abstract 3×3 matrix reasoning with multi-rule transformations.'],
  spatial: ['Spatial Rotation', '⌑', 'Mentally rotate, mirror and transform asymmetric patterns.'],
  planning: ['Planning', '⌘', 'Find efficient routes through constrained spaces.'],
  attention: ['Attention', '◎', 'Stroop interference and response inhibition.'],
  sustained: ['Sustained Attention', '◉', 'Maintain vigilance and suppress no-go responses over time.'],
  processing: ['Processing Speed', '≋', 'Rapid same/different discrimination under pressure.'],
  flexibility: ['Flexibility', '⇄', 'Switch rules without carrying the old rule forward.'],
  memory: ['Working Memory', '▦', 'Hold and manipulate short sequences.'],
  visualmem: ['Visual Memory', '▥', 'Encode and recover briefly presented spatial patterns.'],
  dual: ['Dual Task', '⊕', 'Hold information while solving a second task under interference.'],
  words: ['Word Fluency', 'ABC', 'Timed anagrams and verbal retrieval.'],
  verbal: ['Verbal Reasoning', 'Aa', 'Analogies, semantic relationships and classification.'],
  strategy: ['Strategy', '↗', 'Expected value, downside and decision quality.'],
  reflex: ['Reflex', '⚡', 'Standardized reaction time with false-start control.']
};

// Every persisted result identifies the scoring series. Legacy values are retained.
const BUILD = '20260912.1';
const SCORING_VERSION = 2;
const GENERATOR_VERSION = 2;
const K = 'sharp-final-continuous-v1';
const QUALITY_KEY = 'sharp-final-quality-v1';
const WORD_CACHE_KEY = 'sharp-word-dict-v2';
const BACKUP_KEY = 'sharp-final-backup-v2';
const cl = (n, a, b) => Math.max(a, Math.min(b, n));
const avg = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const med = a => {
  const b = [...a].sort((x, y) => x - y),
    m = Math.floor(b.length / 2);
  return b.length ? b.length % 2 ? b[m] : (b[m - 1] + b[m]) / 2 : 0;
};
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;'
})[c]);
const mono = () => window.performance.now();
const iso = () => new Date().toISOString();
const clone = x => JSON.parse(JSON.stringify(x));
function uid() {
  return globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
// Mulberry32; trial seeds are recorded so content can be regenerated.
let rngState = 1;
function seedRng(seed) {
  rngState = seed >>> 0;
}
function random() {
  let t = rngState += 0x6D2B79F5;
  t = Math.imul(t ^ t >>> 15, t | 1);
  t ^= t + Math.imul(t ^ t >>> 7, t | 61);
  return ((t ^ t >>> 14) >>> 0) / 4294967296;
}
const ri = (a, b) => Math.floor(random() * (b - a + 1)) + a;
const pk = a => a[Math.floor(random() * a.length)];
function sh(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = ri(0, i);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
function newSeed() {
  const a = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(a);else a[0] = Math.random() * 4294967296;
  return a[0];
}
function dayKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
function validDay(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T12:00:00');
  return Number.isFinite(+d) && dayKey(d) === s;
}
function addDays(s, n) {
  const d = new Date(s + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dayKey(d);
}
function dayDistance(a, b) {
  const parts = s => s.split('-').map(Number);
  const [y, m, d] = parts(a),
    [yy, mm, dd] = parts(b);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(yy, mm - 1, dd)) / 86400000);
}
function days(s) {
  if (!s || !Number.isFinite(+new Date(s))) return 99;
  return cl(dayDistance(dayKey(), validDay(s) ? s : dayKey(new Date(s))), 0, 99);
}
function closestElement(target, selector) {
  const el = target?.nodeType === 1 ? target : target?.parentElement;
  return typeof el?.closest === 'function' ? el.closest(selector) : null;
}
function defaultDomain() {
  return {
    level: 2,
    score: 50,
    attempts: 0,
    last: null,
    best: 0,
    baseline: null,
    recent: [],
    scoringVersion: 1
  };
}
function qualityFresh() {
  return {
    calibration: [],
    recall: {
      items: [],
      pending: [],
      lastEncoded: null,
      correct: 0,
      total: 0
    },
    wordSource: DICTIONARY_VERSION
  };
}
function fresh() {
  return {
    schemaVersion: 2,
    revision: 0,
    build: BUILD,
    stats: {
      streak: 0,
      sessions: 0,
      minutes: 0,
      activeMinutes: 0,
      legacyMinutes: 0,
      last: null
    },
    domains: Object.fromEntries(IDS.map(id => [id, defaultDomain()])),
    history: [],
    trials: [],
    checkpoint: null,
    quality: qualityFresh()
  };
}
function recordObject(x) {
  return x && typeof x === 'object' && !Array.isArray(x);
}
function safeDate(x) {
  return typeof x === 'string' && Number.isFinite(+new Date(x)) ? x : null;
}
function validateState(raw, legacyQuality) {
  const issues = [],
    x = recordObject(raw) ? raw : {},
    out = fresh();
  if (!recordObject(raw)) issues.push('State was not an object');
  if (x.schemaVersion != null && x.schemaVersion !== 2) issues.push('unsupported schema version');
  const num = (v, def, lo, hi, label, integer = false) => {
    if (v == null) return def;
    if (!Number.isFinite(v) || v < lo || v > hi || integer && !Number.isInteger(v)) {
      issues.push(label);
      return def;
    }
    return v;
  };
  const list = (v, label) => {
    if (v == null) return [];
    if (!Array.isArray(v)) {
      issues.push(label);
      return [];
    }
    return v;
  };
  out.revision = num(x.revision, 0, 0, Number.MAX_SAFE_INTEGER, 'revision', true);
  const st = recordObject(x.stats) ? x.stats : {};
  if (x.stats != null && !recordObject(x.stats)) issues.push('invalid stats');
  if (st.last != null && !validDay(st.last)) issues.push('invalid streak date');
  if (x.domains != null && !recordObject(x.domains)) issues.push('invalid domains');
  out.stats = {
    streak: num(st.streak, 0, 0, 100000, 'streak', true),
    sessions: num(st.sessions, 0, 0, 10000000, 'sessions', true),
    minutes: num(st.minutes, 0, 0, 1e9, 'minutes'),
    activeMinutes: num(st.activeMinutes, 0, 0, 1e9, 'active minutes'),
    legacyMinutes: num(st.legacyMinutes, x.schemaVersion === 2 ? 0 : num(st.minutes, 0, 0, 1e9, 'legacy minutes'), 0, 1e9, 'legacy minutes'),
    last: validDay(st.last) ? st.last : null
  };
  function result(r, recent = false) {
    if (!recordObject(r) || !recent && !IDS.includes(r.id) || !Number.isFinite(r.acc) || r.acc < 0 || r.acc > 1 || !Number.isFinite(r.ms) || r.ms < 0 || !Number.isFinite(r.score) || r.score < 0 || r.score > 100 || !Number.isInteger(r.level) || r.level < 1 || r.level > 10) {
      issues.push('invalid block result');
      return null;
    }
    return {
      ...r,
      extra: recordObject(r.extra) ? r.extra : {},
      scoringVersion: r.scoringVersion === 2 ? 2 : 1
    };
  }
  for (const id of IDS) {
    const v = recordObject(x.domains?.[id]) ? x.domains[id] : {},
      d = defaultDomain();
    d.level = num(v.level, 2, 1, 10, id + ' level', true);
    d.score = num(v.score, 50, 0, 100, id + ' score');
    d.best = num(v.best, 0, 0, 100, id + ' best');
    d.attempts = num(v.attempts, 0, 0, 1e9, id + ' attempts', true);
    d.baseline = v.baseline == null ? null : num(v.baseline, d.score, 0, 100, id + ' baseline');
    d.last = safeDate(v.last);
    d.scoringVersion = v.scoringVersion === 2 ? 2 : 1;
    d.baselineLevel = num(v.baselineLevel, 2, 1, 10, id + ' baseline level', true);
    d.recent = list(v.recent, id + ' recent').map(r => result(r, true)).filter(Boolean).slice(-12);
    if (recordObject(v.legacy)) d.legacy = clone(v.legacy);
    out.domains[id] = d;
  }
  out.history = list(x.history, 'history').filter(h => {
    const ok = recordObject(h) && safeDate(h.date) && Array.isArray(h.results) && h.results.length && Number.isFinite(h.score) && h.score >= 0 && h.score <= 100 && ['standard', 'quick', 'focused', 'practice'].includes(h.mode);
    if (!ok) issues.push('invalid session');
    return ok;
  }).map(h => ({
    ...h,
    minutes: num(h.minutes, 0, 0, 100000, 'session minutes'),
    results: h.results.map(r => result(r)).filter(Boolean),
    scoringVersion: h.scoringVersion === 2 ? 2 : 1
  })).filter(h => h.results.length).slice(-60);
  // Migrate the UTC streak marker from its dated session where possible, without reducing the streak.
  if (x.schemaVersion !== 2 && out.stats.last && out.history.length) {
    const h = out.history.at(-1);
    if (h.date.slice(0, 10) === out.stats.last) out.stats.last = dayKey(new Date(h.date));
  }
  out.trials = list(x.trials, 'trials').filter(t => recordObject(t) && IDS.includes(t.domain) && typeof t.id === 'string' && safeDate(t.date)).slice(-600);
  const q = recordObject(x.quality) ? x.quality : recordObject(legacyQuality) ? legacyQuality : {};
  const qr = recordObject(q.recall) ? q.recall : {},
    quality = qualityFresh();
  quality.calibration = list(q.calibration, 'calibration').filter(c => {
    const valid = recordObject(c) && IDS.includes(c.domain) && Number.isFinite(c.conf) && c.conf >= 50 && c.conf <= 100 && typeof c.correct === 'boolean' && safeDate(c.date);
    if (!valid) issues.push('invalid calibration');
    return valid;
  }).slice(-500);
  const recallItem = i => recordObject(i) && typeof i.id === 'string' && /^[a-z]{2,20}$/.test(i.word) && Number.isInteger(i.code) && i.code >= 11 && i.code <= 98 && validDay(i.created) && validDay(i.due);
  const seen = new Set();
  quality.recall.items = list(qr.items, 'recall items').filter(i => {
    if (!recallItem(i)) {
      issues.push('recall item');
      return false;
    }
    if (!i.done && seen.has(i.word)) {
      issues.push('duplicate active recall word');
      return false;
    }
    if (!i.done) seen.add(i.word);
    return true;
  }).map(i => ({
    ...i,
    stage: i.stage === 1 ? 1 : 0,
    done: i.done === true
  })).slice(-120);
  const pending = list(qr.pending, 'pending encoding');
  quality.recall.pending = pending.length === 5 && pending.every(recallItem) && new Set(pending.map(i => i.word)).size === 5 && new Set(pending.map(i => i.code)).size === 5 && pending.every(i => !seen.has(i.word)) ? pending : [];
  if (pending.length && !quality.recall.pending.length) issues.push('pending encoding');
  quality.recall.lastEncoded = validDay(qr.lastEncoded) ? qr.lastEncoded : null;
  quality.recall.total = num(qr.total, 0, 0, 1e9, 'recall total', true);
  quality.recall.correct = num(qr.correct, 0, 0, quality.recall.total, 'recall correct', true);
  out.quality = quality;
  const cp = x.checkpoint;
  if (cp != null) {
    const valid = recordObject(cp) && typeof cp.sid === 'string' && ['standard', 'quick', 'focused'].includes(cp.mode) && Array.isArray(cp.ids) && cp.ids.length > 0 && cp.ids.length <= 300 && cp.ids.every(id => IDS.includes(id)) && Number.isInteger(cp.bi) && cp.bi >= 0 && cp.bi <= cp.ids.length && Array.isArray(cp.results) && safeDate(cp.started) && Number.isFinite(cp.engagedMs) && cp.engagedMs >= 0 && cp.engagedMs <= 1e9;
    if (valid) {
      out.checkpoint = {
        ...cp,
        results: cp.results.map(r => result(r)).filter(Boolean)
      };
      if (out.checkpoint.results.length !== cp.bi) {
        issues.push('checkpoint result count');
        out.checkpoint = null;
      }
    } else issues.push('invalid checkpoint');
  }
  return {
    state: out,
    issues
  };
}
let S = fresh(),
  QSTATE = S.quality;
const persistence = {
  expected: null,
  expectedQuality: null,
  blocked: false,
  dirty: false,
  message: '',
  rawBackup: null,
  queue: Promise.resolve()
};
function storageMessage(message) {
  persistence.message = message;
  document.dispatchEvent(new CustomEvent('sharp-storage'));
}
function loadState() {
  try {
    const raw = localStorage.getItem(K),
      qr = localStorage.getItem(QUALITY_KEY);
    persistence.expected = raw;
    persistence.expectedQuality = qr;
    let parsed = {},
      q = {};
    const errors = [];
    try {
      parsed = raw ? JSON.parse(raw) : fresh();
    } catch {
      errors.push('unreadable core data');
    }
    try {
      q = qr ? JSON.parse(qr) : {};
    } catch {
      errors.push('unreadable recall data');
    }
    const checked = validateState(parsed, q);
    S = checked.state;
    QSTATE = S.quality;
    if (raw && parsed?.schemaVersion !== 2 && !errors.length && !checked.issues.length) {
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify({
          core: raw,
          quality: qr,
          date: iso(),
          reason: ['Before current-series migration']
        }));
      } catch {
        persistence.blocked = true;
        storageMessage('A backup of your existing progress could not be saved. Export it before continuing; existing progress will not be overwritten.');
      }
    }
    if (parsed?.schemaVersion > 2) {
      persistence.blocked = true;
      storageMessage('This progress belongs to a newer SHARP version. Reload the latest app or export it before continuing.');
    }
    if (errors.length || checked.issues.length) {
      persistence.rawBackup = {
        core: raw,
        quality: qr,
        date: iso(),
        reason: [...errors, ...checked.issues]
      };
      try {
        localStorage.setItem(BACKUP_KEY, JSON.stringify(persistence.rawBackup));
        storageMessage('Some saved data needed repair. The original is in your recovery backup; export it before continuing.');
      } catch {
        persistence.blocked = true;
        storageMessage('Saved data needs repair. Export the recovery data first; the original will not be overwritten.');
      }
    }
  } catch {
    persistence.blocked = true;
    storageMessage('Browser storage is unavailable. Training can continue in memory; export your progress before closing.');
  }
}
function saveState() {
  S.quality = QSTATE;
  persistence.dirty = true;
  const snapshot = clone(S);
  persistence.queue = persistence.queue.then(async () => {
    if (persistence.blocked) throw new Error(persistence.message || 'Saving is blocked');
    if (!navigator.locks?.request) throw new Error('This browser cannot coordinate safe saves. Use a current Safari, Chrome or Firefox, or export this session.');
    await navigator.locks.request('sharp-progress-v2', async () => {
      if (localStorage.getItem(K) !== persistence.expected || localStorage.getItem(QUALITY_KEY) !== persistence.expectedQuality) {
        persistence.blocked = true;
        throw new Error('Progress changed in another tab. Export this tab if needed, then load the latest saved progress.');
      }
      snapshot.revision = (JSON.parse(persistence.expected || 'null')?.revision || 0) + 1;
      snapshot.build = BUILD;
      const raw = JSON.stringify(snapshot);
      localStorage.setItem(K, raw); // Canonical state and quality are one atomic write.
      persistence.expected = raw;
      S.revision = snapshot.revision;
      storageMessage('');
      try {
        const mirror = JSON.stringify(snapshot.quality);
        localStorage.setItem(QUALITY_KEY, mirror);
        persistence.expectedQuality = mirror;
      } catch {
        storageMessage('Progress is saved. The compatibility copy could not be updated; export a backup before using an older app version.');
      }
    });
    persistence.dirty = JSON.stringify({
      ...S,
      revision: snapshot.revision
    }) !== JSON.stringify(snapshot);
    if (!persistence.dirty) document.dispatchEvent(new CustomEvent('sharp-storage'));
    return true;
  }).catch(error => {
    persistence.dirty = true;
    storageMessage(error.message || 'Progress could not be saved. Retry or export before leaving.');
    return false;
  });
  return persistence.queue;
}
function normalizedDomain(id) {
  const d = S.domains[id];
  if (!d.attempts || d.scoringVersion !== SCORING_VERSION) return null;
  return cl(Math.round(50 + (d.score - (d.baseline ?? d.score)) * 1.15 + (id === 'reflex' ? 0 : (d.level - (d.baselineLevel ?? d.level)) * 3.5)), 0, 100);
}
function index() {
  const trained = IDS.filter(id => normalizedDomain(id) != null);
  return {
    trained,
    v: trained.length >= 8 ? cl(Math.round(avg(trained.map(normalizedDomain)) - (18 - trained.length) * .6), 0, 100) : null
  };
}
function priority(id) {
  return 100 - (normalizedDomain(id) ?? 50) + Math.min(days(S.domains[id].last), 30) * 1.5 + (normalizedDomain(id) == null ? 15 : 0);
}
function focus() {
  return IDS.filter(id => id !== 'reflex').sort((a, b) => priority(b) - priority(a))[0];
}
function weightedIds(n, pool = IDS) {
  const a = pool.map(id => ({
      id,
      weight: Math.max(1, priority(id))
    })),
    out = [];
  while (a.length && out.length < n) {
    let t = random() * a.reduce((s, x) => s + x.weight, 0),
      i = 0;
    while (i < a.length - 1 && t >= a[i].weight) {
      t -= a[i].weight;
      i++;
    }
    out.push(a.splice(i, 1)[0].id);
  }
  return out;
}
function fullIds() {
  return ['reflex', 'processing', 'sustained', 'attention', 'arithmetic', 'estimation', 'logic', 'patterns', 'matrix', 'spatial', 'memory', 'visualmem', 'words', 'verbal', 'flexibility', 'dual', 'planning', 'strategy', focus()];
}
function focusedIds() {
  const ranked = IDS.filter(id => id !== 'reflex').sort((a, b) => priority(b) - priority(a));
  return ranked.slice(0, 6);
}
function exportProgress(recovery = false) {
  const payload = recovery ? persistence.rawBackup || readBackup() : {
    format: 'sharp-progress',
    version: 2,
    exported: iso(),
    build: BUILD,
    state: {
      ...S,
      quality: QSTATE
    }
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json'
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement('a');
  a.href = url;
  a.download = `sharp-${recovery ? 'recovery' : 'progress'}-${dayKey()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function readBackup() {
  try {
    return JSON.parse(localStorage.getItem(BACKUP_KEY) || 'null');
  } catch {
    return persistence.rawBackup;
  }
}
function parseImport(text) {
  if (text.length > 8 * 1024 * 1024) throw new Error('That file is too large. Use a SHARP progress export.');
  const x = JSON.parse(text);
  if (x.format !== 'sharp-progress' || x.version !== 2 || !recordObject(x.state) || x.state.schemaVersion !== 2) throw new Error('Choose a SHARP progress export, not a recovery snapshot.');
  const v = validateState(x.state);
  if (v.issues.length) throw new Error('This file contains invalid progress data: ' + v.issues.slice(0, 3).join(', '));
  return v.state;
}
async function importProgress(state) {
  if (persistence.blocked) throw new Error('Load the latest saved progress before importing.');
  await persistence.queue;
  if (persistence.dirty) throw new Error('Export unsaved progress or retry saving before importing.');
  if (!navigator.locks?.request) throw new Error('This browser cannot safely import progress.');
  await navigator.locks.request('sharp-progress-v2', async () => {
    if (localStorage.getItem(K) !== persistence.expected) throw new Error('Another tab updated your progress. Load the latest saved progress first.');
    localStorage.setItem(BACKUP_KEY, JSON.stringify({
      date: iso(),
      core: persistence.expected,
      quality: persistence.expectedQuality,
      reason: ['Before progress import']
    }));
    const checked = validateState(state);
    if (checked.issues.length) throw new Error('Invalid import');
    state = checked.state;
    state.revision = (S.revision || 0) + 1;
    const raw = JSON.stringify(state);
    localStorage.setItem(K, raw);
    persistence.expected = raw;
    S = state;
    QSTATE = S.quality;
    try {
      const qr = JSON.stringify(QSTATE);
      localStorage.setItem(QUALITY_KEY, qr);
      persistence.expectedQuality = qr;
    } catch {}
  });
  storageMessage('Progress imported. Your previous progress is available as a recovery backup.');
}
