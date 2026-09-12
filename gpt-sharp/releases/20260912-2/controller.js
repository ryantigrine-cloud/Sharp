'use strict';

// One controller owns every session, phase, timeout and animation callback.
let active = null,
  page = 'today',
  generation = 0;
const jobs = new Map(),
  frames = new Set();
function clearTimers() {
  for (const [id, interval] of jobs) interval ? clearInterval(id) : clearTimeout(id);
  jobs.clear();
  for (const id of frames) cancelAnimationFrame(id);
  frames.clear();
}
function stopEngagement() {
  if (active?.engagedSince != null) {
    active.engagedMs += Math.max(0, Math.min(mono(), active.deadline ?? Infinity) - active.engagedSince);
    active.engagedSince = null;
  }
}
function engagedMs() {
  return active ? active.engagedMs + (active.engagedSince == null ? 0 : Math.max(0, Math.min(mono(), active.deadline ?? Infinity) - active.engagedSince)) : 0;
}
function phase(name) {
  stopEngagement();
  clearTimers();
  generation++;
  if (active) {
    active.phase = name;
    active.token = generation;
    active.accepting = false;
    active.deadline = null;
  }
}
function owned(fn, delay = 0, interval = false) {
  const owner = active,
    token = generation;
  let id;
  const run = () => {
    if (!interval) jobs.delete(id);
    if (owner === active && token === generation) fn();
  };
  id = interval ? setInterval(run, delay) : setTimeout(run, delay);
  jobs.set(id, interval);
  return id;
}
function presented(fn) {
  const owner = active,
    token = generation;
  let id = requestAnimationFrame(() => {
    frames.delete(id);
    if (owner === active && token === generation) fn();
  });
  frames.add(id);
}
function arm(seconds, onTimeout) {
  presented(() => {
    active.qStart = mono();
    active.engagedSince = mono();
    active.accepting = true;
    if (seconds != null) {
      active.limit = seconds;
      active.deadline = mono() + seconds * 1000;
      owned(onTimeout, seconds * 1000);
      owned(updateTimer, 100, true);
      updateTimer();
    }
  });
}
function trial(question, response, status, ms, extra = {}) {
  const t = {
    id: uid(),
    date: iso(),
    session: active.sid,
    block: active.blockId,
    domain: active.id,
    level: active.level,
    seed: active.seed,
    question: clone(question),
    response: response ?? null,
    status,
    correct: status === 'answered' && correct(question, response),
    ms: Math.max(0, ms || 0),
    build: BUILD,
    generatorVersion: GENERATOR_VERSION,
    scoringVersion: SCORING_VERSION,
    dictionaryVersion: active.id === 'words' ? DICTIONARY_VERSION : null,
    ...extra
  };
  active.trials.push(t);
  return t;
}
function checkpoint(preflight = false) {
  if (!active?.sid || !Array.isArray(active.ids) || active.practice || active.phase === 'sessionResult') return;
  S.checkpoint = {
    sid: active.sid,
    mode: active.mode,
    ids: [...active.ids],
    bi: active.results.length,
    results: clone(active.results),
    started: active.started,
    engagedMs: engagedMs(),
    preflight
  };
  saveState();
}
function archiveCheckpoint() {
  const cp = S.checkpoint;
  if (!cp) return;
  if (cp.results.length && !S.history.some(h => h.sid === cp.sid)) {
    S.history.push({
      sid: cp.sid,
      date: iso(),
      mode: cp.mode,
      results: cp.results,
      score: Math.round(avg(cp.results.map(r => r.score))),
      minutes: cp.engagedMs / 60000,
      completed: false,
      scoringVersion: SCORING_VERSION
    });
    S.history = S.history.slice(-60);
    S.stats.minutes += cp.engagedMs / 60000;
    S.stats.activeMinutes += cp.engagedMs / 60000;
  }
  S.checkpoint = null;
  saveState();
}
function start(mode, only, force = false) {
  if (active && active.phase !== 'resumeChoice' && active.phase !== 'sessionResult') return;
  if (!['focused', 'standard', 'quick', 'practice'].includes(mode) || only && !IDS.includes(only)) return;
  if (S.checkpoint && !only && !force) {
    phase('idle');
    active = {
      phase: 'resumeChoice',
      requested: {
        mode,
        only
      },
      engagedMs: 0
    };
    return render();
  }
  if (force) archiveCheckpoint();
  seedRng(newSeed());
  const ids = only ? [only] : mode === 'standard' ? fullIds() : mode === 'focused' ? focusedIds() : weightedIds(6);
  phase('idle');
  active = {
    sid: uid(),
    mode,
    practice: !!only,
    ids,
    bi: 0,
    results: [],
    started: iso(),
    engagedMs: 0,
    engagedSince: null,
    trials: [],
    phase: 'init'
  };
  checkpoint(mode === 'standard' && !only);
  if (mode === 'standard' && !only) return beginPreflight();
  begin();
}
function resumeSession() {
  const cp = S.checkpoint;
  if (!cp) return;
  phase('idle');
  active = {
    ...clone(cp),
    practice: false,
    engagedSince: null,
    trials: [],
    phase: 'init'
  };
  if (cp.preflight) return beginPreflight();
  if (active.bi >= active.ids.length) {
    if (active.mode === 'focused' && active.engagedMs < 600000) active.ids.push(...repeatFocusedIds());else return finishSession();
  }
  begin();
}
function countFor(id, mode) {
  if (id === 'attention') return 8;
  if (['words', 'sustained', 'dual'].includes(id)) return 1;
  if (id === 'reflex') return 5;
  return mode === 'quick' ? 4 : 5;
}
function begin() {
  if (!active) return;
  phase('init');
  const id = active.ids[active.bi];
  if (!IDS.includes(id)) return finishSession();
  Object.assign(active, {
    id,
    level: S.domains[id].level,
    blockId: `${active.sid}:${active.bi}`,
    q: null,
    qStart: null,
    qi: 0,
    count: countFor(id, active.mode),
    trials: [],
    good: 0,
    times: [],
    correctTimes: [],
    prevRule: null,
    confAsked: false,
    blockCommitted: false,
    seed: newSeed()
  });
  seedRng(active.seed);
  if (id === 'attention') resetStroop();
  if (id === 'reflex') return startReflex();
  if (id === 'words') return startWords();
  if (id === 'sustained') return startSustained();
  if (id === 'dual') return startDual();
  next();
}
function next() {
  if (!active || !['init', 'feedback', 'confidence'].includes(active.phase)) return;
  if (active.qi >= active.count || active.mode === 'focused' && active.qi > 0 && engagedMs() >= 900000) return finishBlock();
  active.seed = newSeed();
  seedRng(active.seed);
  active.q = gen(active.id, active.level, active.prevRule);
  if (!active.q) throw new Error('No question generator for ' + active.id);
  if (['memory', 'visualmem'].includes(active.q.kind)) {
    phase('encoding');
    render();
    arm(null, () => {});
    owned(() => {
      phase('question');
      active.memoryHidden = true;
      render();
      arm(timeLimit(active.id, active.level), timeoutQuestion);
    }, active.q.display);
    return;
  }
  phase('question');
  active.memoryHidden = false;
  render();
  arm(timeLimit(active.id, active.level), timeoutQuestion);
}
function answer(response) {
  if (active?.phase !== 'question' || !active.accepting) return;
  if (mono() >= active.deadline) return timeoutQuestion();
  if (!validResponse(active.q, response)) {
    announce('Enter a valid answer.');
    return;
  }
  settleQuestion(response, 'answered');
}
function timeoutQuestion() {
  if (active?.phase === 'question' && active.accepting) settleQuestion(null, 'timeout');
}
function settleQuestion(response, status) {
  const t = trial(active.q, response, status, Math.min(mono() - active.qStart, active.limit * 1000));
  if (t.correct) {
    active.good++;
    active.correctTimes.push(t.ms);
  }
  active.times.push(t.ms);
  if (active.id === 'flexibility') active.prevRule = active.q.meta.rule;
  active.qi++;
  phase('feedback');
  if (status === 'answered' && !active.practice && CONF_DOMAINS.has(active.id) && !active.confAsked && active.qi >= 2) {
    active.confAsked = true;
    active.pendingConfidence = t;
    phase('confidence');
    render();
    return;
  }
  showFeedback(t);
  owned(next, 360);
}
function commitConfidence(v) {
  if (active?.phase !== 'confidence' || ![50, 60, 70, 80, 90, 100].includes(Number(v))) return;
  const t = active.pendingConfidence;
  active.pendingConfidence = null;
  calibrationRecord(active.id, t, Number(v));
  phase('feedback');
  showFeedback(t);
  owned(next, 360);
}
function updateTimer() {
  if (!active?.deadline) return;
  const rem = Math.max(0, (active.deadline - mono()) / 1000),
    n = document.getElementById('timerNum'),
    fill = document.getElementById('timerFill');
  if (n) n.textContent = rem.toFixed(1) + 's';
  if (fill) {
    const p = cl(rem / active.limit * 100, 0, 100);
    fill.style.width = p + '%';
    fill.classList.toggle('low', p < 25);
  }
}
function startWords() {
  const rack = pk(DICTIONARY_RACKS),
    valid = wordsForRack(rack);
  if (valid.length < 12) throw new Error('Invalid bundled word rack');
  Object.assign(active, {
    q: {
      kind: 'words',
      prompt: rack,
      answer: null
    },
    wordBank: {
      l: rack.toUpperCase(),
      w: valid
    },
    wordLetters: sh(rack.toUpperCase().split('')),
    wordUsed: [],
    wordFound: [],
    wordTarget: cl(4 + Math.floor(active.level * .7), 4, 11)
  });
  phase('words');
  render();
  arm(Math.max(42, 74 - active.level * 3), finishWords);
}
function wordSubmit() {
  if (active?.phase !== 'words' || !active.accepting) return;
  if (mono() >= active.deadline) return finishWords();
  const w = active.wordUsed.map(i => active.wordLetters[i]).join('').toLowerCase();
  active.wordUsed = [];
  const ok = active.wordBank.w.includes(w) && !active.wordFound.includes(w);
  trial(active.q, w, 'answered', mono() - active.qStart, {
    correct: ok
  });
  if (ok) active.wordFound.push(w);
  announce(ok ? 'Accepted: ' + w : w.length < 3 ? 'Use at least three letters.' : active.wordFound.includes(w) ? 'Already found.' : 'Not in this challenge dictionary.');
  if (active.wordFound.length >= active.wordTarget) return finishWords();
  renderWordsControls();
}
function finishWords() {
  if (active?.phase !== 'words' || !active.accepting) return;
  const ms = Math.min(mono() - active.qStart, active.limit * 1000),
    acc = cl(active.wordFound.length / active.wordTarget, 0, 1);
  finishBlock({
    acc,
    ms,
    extra: {
      found: active.wordFound.length,
      target: active.wordTarget,
      rack: active.wordBank.l
    }
  });
}
function startSustained() {
  const l = active.level,
    total = cl(26 + l * 2, 28, 46);
  Object.assign(active, {
    susIndex: 0,
    susTotal: total,
    susInterval: cl(760 - l * 35, 420, 760),
    susTrials: [],
    susTapped: false,
    susRule: l >= 7 ? 'Tap BLUE shapes. Ignore every other colour.' : 'Tap every shape EXCEPT red.'
  });
  const goCount = Math.round(total * (l >= 7 ? .3 : .7)),
    colors = COLORS.map(c => ({
      name: c[0].toLowerCase(),
      hex: c[1]
    }));
  active.susBag = sh(Array.from({
    length: total
  }, (_, i) => {
    const go = i < goCount,
      pool = colors.filter(c => (l >= 7 ? c.name === 'blue' : c.name !== 'red') === go),
      c = pk(pool);
    return {
      kind: 'sustained',
      color: c.hex,
      colorName: c.name,
      prompt: pk(['●', '▲', '■']),
      answer: go ? 'tap' : 'withhold',
      meta: {
        go
      }
    };
  }));
  nextStimulus();
}
function nextStimulus() {
  if (!active) return;
  if (active.phase === 'sustained') {
    const q = active.q,
      ok = q.meta.go ? active.susTapped : !active.susTapped;
    const t = trial(q, active.susTapped ? 'tap' : 'withhold', q.meta.go && !active.susTapped ? 'timeout' : 'answered', active.susTapped ? active.susRT : active.susInterval, {
      correct: ok
    });
    active.susTrials.push(t);
  }
  if (active.susIndex >= active.susTotal) return finishSustained();
  active.q = active.susBag[active.susIndex++];
  active.susTapped = false;
  phase('sustained');
  render();
  arm(active.susInterval / 1000, nextStimulus);
}
function sustainedTap() {
  if (active?.phase !== 'sustained' || !active.accepting || active.susTapped || mono() >= active.deadline) return;
  active.susTapped = true;
  active.susRT = mono() - active.qStart;
  const el = document.querySelector('[data-sustained]');
  if (el) el.classList.add('tapped');
}
function finishSustained() {
  const ts = active.susTrials,
    go = ts.filter(t => t.question.meta.go),
    no = ts.filter(t => !t.question.meta.go),
    hits = go.filter(t => t.correct),
    half = Math.floor(ts.length / 2),
    first = ts.slice(0, half).filter(t => t.correct && t.response === 'tap'),
    second = ts.slice(half).filter(t => t.correct && t.response === 'tap');
  const hitRate = hits.length / go.length,
    commissionRate = no.filter(t => !t.correct).length / no.length,
    drift = first.length && second.length ? Math.max(0, med(second.map(t => t.ms)) - med(first.map(t => t.ms))) : null;
  finishBlock({
    acc: hitRate * (1 - commissionRate),
    ms: med(hits.map(t => t.ms)),
    extra: {
      hitRate,
      commissionRate,
      drift,
      go: go.length,
      noGo: no.length
    }
  });
}
function startDual() {
  Object.assign(active, {
    dualCycle: 0,
    dualCycles: active.mode === 'quick' ? 1 : 2,
    dualMathGood: 0,
    dualMathTotal: 0,
    dualRecallGood: 0,
    dualRecallTotal: 0
  });
  beginDualCycle();
}
function beginDualCycle() {
  if (active.dualCycle >= active.dualCycles) return finishDual();
  active.dualSeq = Array.from({
    length: cl(3 + Math.floor(active.level / 3), 3, 6)
  }, () => ri(1, 9));
  active.dualMathLeft = cl(2 + Math.floor(active.level / 3), 2, 5);
  phase('dualEncoding');
  render();
  arm(null, () => {});
  owned(nextDualMath, cl(2600 - active.level * 100, 1500, 2600));
}
function nextDualMath() {
  if (active.dualMathLeft <= 0) {
    active.q = {
      kind: 'memory',
      prompt: 'Enter the original sequence backwards',
      answer: [...active.dualSeq].reverse().join(''),
      input: {
        type: 'digits',
        signed: false
      }
    };
    phase('dualRecall');
    render();
    arm(timeLimit('dual', active.level), dualTimeout);
    return;
  }
  const a = ri(6, 25),
    b = ri(3, 18),
    plus = random() < .5;
  active.q = numberQ(`${a} ${plus ? '+' : '−'} ${b}`, plus ? a + b : a - b);
  active.q.input = {
    type: 'integer',
    signed: true
  };
  phase('dualMath');
  render();
  arm(cl(8 - active.level * .35, 4.5, 8), dualTimeout);
}
function dualAnswer(response, status = 'answered') {
  if (!active || !['dualMath', 'dualRecall'].includes(active.phase) || !active.accepting) return;
  if (status === 'answered' && mono() >= active.deadline) return dualTimeout();
  if (status === 'answered' && !validResponse(active.q, response)) {
    announce('Enter a valid answer.');
    return;
  }
  const math = active.phase === 'dualMath',
    t = trial(active.q, response, status, Math.min(mono() - active.qStart, active.limit * 1000), {
      stage: math ? 'math' : 'recall',
      cycle: active.dualCycle
    });
  if (t.correct) active.correctTimes.push(t.ms);
  active.times.push(t.ms);
  if (math) {
    active.dualMathTotal++;
    if (t.correct) active.dualMathGood++;
    active.dualMathLeft--;
  } else {
    active.dualRecallTotal++;
    if (t.correct) active.dualRecallGood++;
    active.dualCycle++;
  }
  phase('feedback');
  showFeedback(t);
  owned(math ? nextDualMath : beginDualCycle, 330);
}
function dualTimeout() {
  dualAnswer(null, 'timeout');
}
function finishDual() {
  const math = active.dualMathGood / active.dualMathTotal,
    recall = active.dualRecallGood / active.dualRecallTotal;
  finishBlock({
    acc: (math + recall) / 2,
    ms: med(active.correctTimes),
    extra: {
      math,
      recall
    }
  });
}
function finishBlock(o = {}) {
  if (!active || active.blockCommitted) return;
  active.blockCommitted = true;
  phase('committing');
  const id = active.id,
    d = S.domains[id],
    acc = o.acc ?? active.good / Math.max(1, active.qi),
    ms = o.ms ?? med(active.correctTimes),
    extra = o.extra || {};
  if (id === 'attention') extra.stroop = stroopSummary(active.trials);
  const res = {
    id,
    blockId: active.blockId,
    acc,
    ms,
    score: score(acc, ms, active.level, id, extra),
    level: active.level,
    next: active.level,
    extra,
    scoringVersion: SCORING_VERSION,
    build: BUILD
  };
  if (!active.practice) {
    if (d.scoringVersion !== SCORING_VERSION) {
      d.legacy = clone(d);
      delete d.legacy.legacy;
      d.scoringVersion = SCORING_VERSION;
      d.baseline = null;
      d.recent = [];
      d.attempts = 0;
      d.best = 0;
    }
    if (d.baseline == null) {
      d.baseline = res.score;
      d.baselineLevel = active.level;
    }
    d.score = d.attempts ? Math.round(d.score * .72 + res.score * .28) : res.score;
    res.next = stableAdapt(id, d, res);
    d.recent = [...d.recent, res].slice(-12);
    d.level = res.next;
    d.attempts++;
    d.last = iso();
    d.best = Math.max(d.best, res.score);
    S.trials = [...S.trials, ...active.trials].slice(-600);
  }
  active.results.push(res);
  phase('blockResult');
  checkpoint();
  render();
}
function repeatFocusedIds() {
  return [...new Set(active.ids)].slice(0, 6).sort((a, b) => priority(b) - priority(a));
}
function focusedDone() {
  return active.mode === 'focused' && engagedMs() >= 600000;
}
function nextBlock() {
  if (active?.phase !== 'blockResult') return;
  if (active.practice) {
    phase('idle');
    active = null;
    page = 'games';
    render();
    return;
  }
  if (focusedDone()) return finishSession();
  active.bi++;
  if (active.bi >= active.ids.length) {
    if (active.mode === 'focused') active.ids.push(...repeatFocusedIds());else return finishSession();
  }
  checkpoint();
  begin();
}
function finishSession() {
  if (!active || !active.results.length || active.phase === 'sessionResult') return;
  phase('committing');
  let h = S.history.find(h => h.sid === active.sid && h.completed !== false);
  if (!h) {
    const today = dayKey(),
      gap = S.stats.last ? dayDistance(today, S.stats.last) : 99;
    if (gap > 0 || gap === 99) S.stats.streak = gap === 1 ? S.stats.streak + 1 : 1;
    S.stats.last = today;
    S.stats.sessions++;
    const mins = engagedMs() / 60000;
    S.stats.minutes += mins;
    S.stats.activeMinutes += mins;
    h = {
      sid: active.sid,
      date: iso(),
      mode: active.mode,
      results: clone(active.results),
      score: Math.round(avg(active.results.map(r => r.score))),
      minutes: mins,
      wallMinutes: Math.max(0, (Date.now() - new Date(active.started)) / 60000),
      completed: true,
      scoringVersion: SCORING_VERSION,
      build: BUILD
    };
    S.history.push(h);
    S.history = S.history.slice(-60);
  }
  S.checkpoint = null;
  saveState();
  phase('sessionResult');
  active.h = h;
  render();
}
function beginPreflight() {
  active.recallDue = dueRecallItems();
  active.recallIndex = 0;
  showNextRecall();
}
function showNextRecall() {
  if (active.recallIndex < active.recallDue.length) {
    phase('recall');
    active.recallItem = active.recallDue[active.recallIndex];
    render();
    return;
  }
  const items = prepareEncoding();
  if (items.length) {
    active.encodeItems = items;
    phase('qualityEncoding');
    render();
    return;
  }
  checkpoint(false);
  begin();
}
function submitRecall(v) {
  if (active?.phase !== 'recall' || !/^\d{2}$/.test(v)) return;
  const item = active.recallItem,
    ok = recordRecall(item, v);
  active.recallIndex++;
  phase('feedback');
  showFeedback({
    correct: ok,
    question: {
      answer: item.code
    }
  });
  owned(showNextRecall, 400);
}
function finishEncoding() {
  if (active?.phase !== 'qualityEncoding') return;
  phase('init');
  commitEncoding();
  checkpoint(false);
  begin();
}
function interruptCurrent(reason) {
  if (!active || ['blockResult', 'sessionResult', 'paused', 'error', 'resumeChoice'].includes(active.phase)) return;
  const old = active.phase;
  if (active.reflexInput) releaseCapture();
  if (active.q && active.id) {
    trial(active.q, null, 'interrupted', active.qStart ? mono() - active.qStart : 0, {
      reason
    });
    if (!active.practice) S.trials = [...S.trials, ...active.trials].slice(-600);
  }
  phase('paused');
  active.resumePreflight = ['recall', 'qualityEncoding'].includes(old) || !active.id;
  active.pauseReason = reason;
  checkpoint(active.resumePreflight);
  render();
}
function continueSession() {
  if (active?.phase !== 'paused' && active?.phase !== 'error') return;
  if (active.resumePreflight) return beginPreflight();
  begin();
}
function leaveSession() {
  if (!active) return;
  if (active.reflexInput) releaseCapture();
  if (active.phase === 'sessionResult') {
    phase('idle');
    active = null;
    page = 'today';
    render();
    return;
  }
  const preflight = active.resumePreflight || ['recall', 'qualityEncoding'].includes(active.phase) || !active.id;
  phase('idle');
  checkpoint(preflight);
  active = null;
  page = 'today';
  render();
}
function handleRuntimeError(error) {
  const detail = {
    build: BUILD,
    domain: active?.id,
    phase: active?.phase,
    date: iso(),
    message: String(error?.message || error),
    stack: String(error?.stack || '')
  };
  console.error('SHARP diagnostic', detail);
  if (active) {
    if (active.reflexInput) releaseCapture();
    const preflight = !active.id;
    phase('error');
    active.resumePreflight = preflight;
    active.diagnostic = detail;
    checkpoint(preflight);
  } else {
    phase('idle');
    active = {
      phase: 'error',
      diagnostic: detail,
      engagedMs: 0
    };
  }
  render();
}
