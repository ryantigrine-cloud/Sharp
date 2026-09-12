'use strict';

const root = document.getElementById('root');
function nav() {
  return `<nav class="nav" aria-label="Main navigation">${[['today', '⌂', 'Today'], ['train', '▶', 'Train'], ['performance', '⌁', 'Performance'], ['games', '◇', 'Games']].map(x => `<button data-nav="${x[0]}" ${page === x[0] ? 'aria-current="page" class="on"' : ''}><b aria-hidden="true">${x[1]}</b>${x[2]}</button>`).join('')}</nav>`;
}
function shell(content) {
  return `<main class="app"><div class="top"><div class="logo">SHARP</div><span class="build">Build ${BUILD}</span></div>${content}</main>${nav()}`;
}
function drow(id) {
  const d = S.domains[id],
    n = normalizedDomain(id),
    legacy = d.legacy || (d.scoringVersion === 1 && d.attempts ? d : null);
  return `<div class="drow"><div class="dtop"><span>${META[id][0]}${id === 'reflex' ? '' : ` · L${d.level}`}</span><b>${n ?? 'BASELINE NEEDED'}</b></div><div class="bar" aria-hidden="true"><i style="width:${n ?? 0}%"></i></div>${legacy ? `<small>Previous series: ${Math.round(legacy.score)}/100 · preserved</small>` : ''}</div>`;
}
function game(id) {
  const d = S.domains[id];
  return `<button class="game practice" data-practice="${id}"><span class="ico" aria-hidden="true">${META[id][1]}</span><span><span class="gameTitle">${META[id][0]}</span><span class="gameDescription">${META[id][2]}</span></span><span class="lvl">${id === 'reflex' ? '5 trials' : `Level ${d.level}`}</span></button>`;
}
function headProgress(showTimer = true) {
  const progress = cl((active.bi + active.qi / Math.max(1, active.count)) / active.ids.length * 100, 0, 100);
  return `<div class="shead"><button class="x" data-exit aria-label="Save and exit session">×</button><div><div class="prog" role="progressbar" aria-label="Session blocks" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><i style="width:${progress}%"></i></div>${showTimer ? '<div class="prog" aria-hidden="true" style="margin-top:7px"><i id="timerFill" style="width:100%"></i></div>' : ''}</div><div class="timer" id="timerNum" aria-label="Time remaining"></div></div><div class="sessionTools"><span>${active.mode === 'focused' ? `${(engagedMs() / 60000).toFixed(1)} / 10 active minutes` : modeLabel(active.mode)}</span><button class="textButton" data-pause>Pause</button></div>`;
}
function gridDescription(key, n) {
  const on = String(key).split('').flatMap((v, i) => v === '1' ? [`row ${Math.floor(i / n) + 1} column ${i % n + 1}`] : []);
  return `${n} by ${n} grid. Filled cells: ${on.join('; ') || 'none'}`;
}
function gridHtml(key, n) {
  return `<div class="miniGrid" role="img" aria-label="${esc(gridDescription(key, n))}" style="grid-template-columns:repeat(${n},1fr)">${String(key).split('').map(x => `<i aria-hidden="true" class="${x === '1' ? 'on' : ''}"></i>`).join('')}</div>`;
}
function questionVisual(q) {
  if (q.kind === 'matrix') return `<div class="matrix">${q.cells.map((x, i) => `<div aria-label="Row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}" class="mcell ${i === 8 ? 'miss' : ''}">${esc(x)}</div>`).join('')}</div>`;
  if (q.kind === 'matrixGrid') return `<div class="matrix">${q.cells.map((x, i) => `<div aria-label="Row ${Math.floor(i / 3) + 1}, column ${i % 3 + 1}" class="mcell ${i === 8 ? 'miss' : ''}">${i === 8 ? '?' : gridHtml(x, q.n)}</div>`).join('')}</div>`;
  if (q.kind === 'spatial') return `<div style="margin:18px auto">${gridHtml(q.baseKey, q.n)}<div class="eye" style="margin-top:12px">${esc(q.sub)}</div></div>`;
  if (q.kind === 'route') {
    let walls = new Set(q.walls);
    return `<div class="routeGrid" style="grid-template-columns:repeat(${q.n},1fr)">${Array.from({
      length: q.n * q.n
    }, (_, i) => `<div role="img" aria-label="Row ${Math.floor(i / q.n) + 1}, column ${i % q.n + 1}: ${i === q.start ? 'start' : i === q.goal ? 'goal' : walls.has(i) ? 'blocked' : 'open'}" class="routeCell ${i === q.start ? 'start' : i === q.goal ? 'goal' : walls.has(i) ? 'wall' : ''}">${i === q.start ? 'S' : i === q.goal ? 'G' : ''}</div>`).join('')}</div>`;
  }
  if (q.kind === 'stroop') return `<div class="q" style="color:${q.ink};margin-top:18px">${esc(q.prompt)}</div>`;
  return `<div class="q ${String(q.prompt).length > 42 ? 'compact' : ''}" style="margin-top:16px">${esc(q.prompt)}</div>`;
}
function numberForm(q, id = 'answerForm') {
  const digits = q.kind === 'memory' || q.input?.type === 'digits',
    signed = !digits && q.input?.signed !== false,
    decimal = !digits && q.input?.type !== 'integer';
  return `<form class="form" id="${id}"><label class="sr-only" for="ans">${digits ? 'Reverse sequence' : 'Answer'}</label><input class="input" id="ans" name="answer" type="text" inputmode="${decimal ? 'decimal' : 'numeric'}" autocomplete="off" autocapitalize="off" spellcheck="false" ${digits ? 'pattern="[0-9]+" maxlength="12"' : ''} placeholder="${digits ? 'Reverse sequence' : 'Answer'}" required>${signed ? '<button type="button" class="btn secondary sign" data-sign aria-label="Toggle positive or negative answer">±</button>' : ''}<button class="btn primary submit" type="submit" aria-label="Submit answer">→</button></form>`;
}
function answerUI(q) {
  if (q.kind === 'matrix') return `<div class="matrixAnswers">${q.options.map((o, i) => `<button class="matrixOption" aria-label="Option ${i + 1}: ${esc(o)}" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  if (['matrixGrid', 'spatial', 'visualmem'].includes(q.kind)) return `<div class="patternAnswers">${q.options.map((o, i) => `<button class="patternOption" aria-label="Option ${i + 1}. ${esc(gridDescription(o, q.n))}" data-answer="${esc(o)}">${gridHtml(o, q.n)}</button>`).join('')}</div>`;
  if (['choice', 'route', 'stroop'].includes(q.kind)) return `<div class="options">${q.options.map(o => `<button class="option" data-answer="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
  return numberForm(q);
}
function wordsControls() {
  const cur = active.wordUsed.map(i => active.wordLetters[i]).join('');
  return `<div class="wordbuild" aria-label="Current word">${esc(cur) || '&nbsp;'}</div><div class="tiles">${active.wordLetters.map((c, i) => `<button class="tile" data-letter="${i}" aria-label="Letter ${c}, tile ${i + 1}" ${active.wordUsed.includes(i) ? 'disabled' : ''}>${c}</button>`).join('')}</div><div class="wordactions"><button class="btn secondary" data-word-back aria-label="Remove last letter">⌫</button><button class="btn secondary" data-word-shuffle>Shuffle</button><button class="btn primary" data-word-submit aria-label="Submit word">↵</button></div><p>${active.wordFound.length}/${active.wordTarget} target words</p><div class="found">${esc(active.wordFound.join(' · '))}</div>`;
}
function renderWordsControls() {
  const el = document.getElementById('wordControls');
  if (!el) return;
  const focused = document.activeElement,
    letter = focused?.dataset?.letter,
    back = focused?.hasAttribute?.('data-word-back'),
    shuffle = focused?.hasAttribute?.('data-word-shuffle'),
    submit = focused?.hasAttribute?.('data-word-submit');
  el.innerHTML = wordsControls();
  const next = el.querySelector(back ? '[data-word-back]' : shuffle ? '[data-word-shuffle]' : submit ? '[data-word-submit]' : letter != null ? '[data-letter]:not(:disabled)' : '[data-word-submit]');
  next?.focus({
    preventScroll: true
  });
}
function wordsScreen() {
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">Word Fluency · Level ${active.level}</div><h2>Anagram Sprint</h2><p>Build words of three or more letters. This challenge uses a fixed common-word dictionary.</p><div id="wordControls">${wordsControls()}</div></div>`);
  updateTimer();
}
function upcoming() {
  if (active.practice || active.mode === 'focused' && focusedDone()) return null;
  return active.ids[active.bi + 1] || (active.mode === 'focused' ? repeatFocusedIds()[0] : null);
}
function blockResult() {
  const r = active.results.at(-1),
    next = upcoming(),
    s = r.extra.stroop;
  root.innerHTML = `<main class="app"><div class="score"><div class="eye">${active.practice ? 'Practice' : 'Block complete'}</div><h1 class="resultTitle">${META[r.id][0]}</h1><div class="n">${r.score}<span>/100</span></div></div><div class="grid2">${metric('Accuracy', Math.round(r.acc * 100) + '%')}${metric('Correct-response median', r.ms ? `${(r.ms / 1000).toFixed(2)}s` : '—')}${metric(r.id === 'reflex' ? 'Protocol' : 'Level', r.id === 'reflex' ? 'Hold & release' : `${r.level} → ${r.next}`)}${metric('Personal index', normalizedDomain(r.id) ?? '—')}</div>${s ? `<p>Stroop: ${s.congruent} congruent / ${s.incongruent} incongruent trials. Interference: ${s.interference == null ? 'not enough correct samples' : Math.round(s.interference) + ' ms'}. Timeouts count as errors.</p>` : ''}<p>${r.id === 'reflex' ? 'Reaction timing is a browser estimate. Keep the same device and input method for comparisons.' : r.next > r.level ? 'Promotion earned from three blocks at this level.' : r.next < r.level ? 'Difficulty reduced after repeated low accuracy.' : 'Level held for more evidence.'}</p>${next ? `<section class="card"><div class="eye">Up next</div><h2>${META[next][0]}</h2></section>` : ''}<button class="btn primary full" data-next>${active.practice ? 'Back to Games' : next ? 'Start ' + META[next][0] : 'Finish session'}</button>${active.practice ? '' : '<button class="btn secondary full" data-exit>Save and exit</button>'}</main>`;
}
function sessionResult() {
  const h = active.h;
  root.innerHTML = `<main class="app"><div class="score"><div class="eye">Session complete</div><h1 class="resultTitle">${modeLabel(h.mode)}</h1><div class="n">${h.score}<span>/100</span></div><p>${h.results.length} blocks · ${h.minutes.toFixed(1)} active minutes</p></div><div class="grid2">${metric('Streak', S.stats.streak + ' days')}${metric('Completed sessions', S.stats.sessions)}</div><button class="btn primary full" data-done>Return to Today</button></main>`;
}
function modeLabel(mode) {
  return {
    focused: 'Focused Daily',
    standard: 'Full Daily',
    quick: 'Quick',
    practice: 'Practice'
  }[mode] || 'Training';
}
function metric(label, value) {
  return `<div class="metric"><small>${esc(label)}</small><strong>${esc(value)}</strong></div>`;
}
function resumeCard() {
  return S.checkpoint ? `<section class="card"><h2>Continue your session</h2><p>${modeLabel(S.checkpoint.mode)} · ${S.checkpoint.results.length} completed blocks saved. The unfinished block will restart.</p><button class="btn secondary" data-resume>Resume saved session</button></section>` : '';
}
function today() {
  const f = focus(),
    ix = index();
  root.innerHTML = shell(`<section class="hero"><div class="eye">Daily cognitive training</div><h1>Make time<br>to think.</h1><p>Practise attention, memory and reasoning. Track your own progress over time.</p></section>${resumeCard()}<section class="card focus"><div class="eye">Focused Daily · about 10–15 minutes</div><h2 style="margin-top:10px">Start with ${META[f][0]}</h2><p>Six weak or neglected domains. Short blocks repeat until you reach ten active minutes, then finish at a block boundary.</p><button class="btn primary full" data-start="focused">Start Focused Daily</button><div class="row"><button class="btn secondary" data-start="quick">Quick</button><button class="btn secondary" data-start="standard">Full Daily</button></div></section><div class="section"><h3>Current signal</h3><span>Personal baseline = 50</span></div><div class="grid3">${metric('Sharpness', ix.v ?? '—')}${metric('Streak', S.stats.streak + 'd')}${metric('Active minutes', Math.round(S.stats.activeMinutes))}</div><p class="fine">Scores describe your performance in SHARP. They are not an IQ or clinical assessment. Older scores remain in Performance as a separate series.</p>`);
}
function train() {
  root.innerHTML = shell(`<section class="hero"><div class="eye">Session control</div><h1>Choose your<br>session.</h1></section>${resumeCard()}<section class="card"><div class="eye">Focused Daily</div><h2>About 10–15 minutes</h2><p>Six priorities selected using weakness and time since last training. Ten active minutes, with a finish at the end of a block.</p><button class="btn primary full" data-start="focused">Start Focused Daily</button></section><section class="card"><div class="eye">Quick</div><h2>Six short blocks</h2><p>A varied selection weighted toward weak or neglected domains. Duration depends on the tasks and your pace.</p><button class="btn secondary full" data-start="quick">Start Quick</button></section><section class="card"><div class="eye">Full Daily</div><h2>All 18 domains</h2><p>Baseline probes, core cognition, executive pressure and one weakness bonus. Includes delayed recall and new encoding when due.</p><button class="btn secondary full" data-start="standard">Start Full Daily</button></section>`);
}
function performancePage() {
  const ix = index(),
    c = calibrationSummary(),
    r = QSTATE.recall,
    hist = [...S.history].reverse().slice(0, 12);
  root.innerHTML = shell(`<section class="hero"><div class="eye">Performance</div><h1>${ix.v ?? '—'} <span class="outOf">/100</span></h1><p>${ix.v == null ? 'Train eight domains in the current series to establish Sharpness.' : '50 represents your personal baseline in this series.'} The corrected scoring starts a new series; previous scores are preserved below.</p></section><div class="grid3">${metric('Sessions', S.stats.sessions)}${metric('Current coverage', ix.trained.length + '/18')}${metric('Streak', S.stats.streak + 'd')}</div><div class="section"><h3>Domain profile</h3></div><section class="card">${IDS.map(drow).join('')}</section><div class="section"><h3>Judgement quality</h3></div><div class="grid2">${metric('Confidence / accuracy', c.n ? `${Math.round(c.confidence)}% / ${Math.round(c.accuracy)}%` : '—')}${metric('Delayed recall', r.total ? Math.round(r.correct / r.total * 100) + '%' : '—')}</div><p>${c.n} confidence ratings · ${r.total} recall attempts · ${dueRecallItems().length} recall items due. Incorrect recall remains scheduled until answered successfully.</p><div class="section"><h3>Recent sessions</h3></div>${hist.map(h => `<section class="card"><h3>${modeLabel(h.mode)}${h.completed === false ? ' · partial' : ''}</h3><p>${new Date(h.date).toLocaleDateString()} · ${h.results.length} blocks · ${h.score}/100 · ${h.scoringVersion === SCORING_VERSION ? 'current series' : 'previous series'}</p></section>`).join('') || '<p>No completed sessions yet.</p>'}<div class="section"><h3>Your progress</h3></div><section class="card"><p>Progress is saved on this browser. ${Math.round(S.stats.legacyMinutes)} minutes from the previous series are preserved separately from current active minutes. Export a copy to move it to another device or keep a backup. Exports include the latest 600 trial records and 60 session summaries.</p><button class="btn primary" data-export>Export progress</button><label class="importLabel">Import a progress file<input type="file" id="importFile" accept="application/json,.json"></label><button class="btn secondary full" data-recovery-export>Export recovery backup</button></section>`);
}
function gamesPage() {
  root.innerHTML = shell(`<section class="hero"><div class="eye">Practice lab</div><h1>Train one<br>system.</h1><p>Practice leaves saved scores, levels and streak unchanged.</p></section>${IDS.map(game).join('')}`);
}
function sessionFrame(content, timer = true, hasInput = false) {
  return `<main class="app${hasInput ? ' input-session' : ''}"><section class="session">${headProgress(timer)}${content}</section></main>`;
}
function questionScreen() {
  const q = active.q,
    encoding = active.phase === 'encoding';
  let content;
  if (q.kind === 'memory') content = encoding ? `<div class="q">${esc(q.prompt)}</div><p>Memorise this sequence.</p>` : '<h2>Enter the sequence backwards</h2>';else if (q.kind === 'visualmem') content = encoding ? gridHtml(q.pattern, q.n) : '<h2>Which pattern did you see?</h2>';else content = questionVisual(q);
  const controls = encoding ? '' : answerUI(q);
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">${META[active.id][0]} · Level ${active.level} · ${active.qi + 1}/${active.count}</div>${content}<p class="sub">${esc(q.sub || '')}</p></div>${controls}`, !encoding, controls.includes('<form '));
  if (!encoding) focusInput();
}
function dualScreen() {
  const encoding = active.phase === 'dualEncoding';
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">Dual Task · Level ${active.level}</div>${encoding ? `<h2>Memorise and hold</h2><div class="q">${active.dualSeq.join('   ')}</div><p>Recall it backwards after the arithmetic.</p>` : `<div class="q compact">${esc(active.q.prompt)}</div><p>${active.phase === 'dualMath' ? 'Solve this while holding the sequence.' : 'Enter the original sequence backwards.'}</p>`}</div>${encoding ? '' : numberForm(active.q, 'dualForm')}`, !encoding, !encoding);
  if (!encoding) focusInput();
}
function reflexScreen() {
  root.innerHTML = sessionFrame(`<div class="sessionTools"><span>Hold, then release on green</span><span id="reflexCount">1/5</span></div><div class="reflexWrap"><button type="button" class="reflexPad" data-reflex-hold><span class="bolt" aria-hidden="true">●</span><h2>PRESS AND HOLD</h2><p>Release when green.</p></button></div>`, false);
}
function sustainedScreen() {
  const q = active.q;
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">Sustained Attention · ${active.susIndex}/${active.susTotal}</div><h2>${esc(active.susRule)}</h2><button data-sustained class="sustainedPad" aria-label="${esc(q.colorName)} shape; tap to respond" style="color:${q.color}">${esc(q.prompt)}</button></div>`, false);
}
function confidenceScreen() {
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">Confidence calibration</div><h2>How confident are you?</h2><p>Your answer is locked. What is the probability it is correct?</p></div><div class="options">${[50, 60, 70, 80, 90, 100].map(v => `<button class="option" data-confidence="${v}">${v}%</button>`).join('')}</div>`, false);
}
function recallScreen() {
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">Delayed recall</div><h2>${esc(active.recallItem.word.toUpperCase())}</h2><p>What two-digit code was paired with this word?</p></div><form class="form" id="recallForm"><label class="sr-only" for="ans">Two-digit code</label><input class="input" id="ans" inputmode="numeric" type="text" autocomplete="off" pattern="[0-9]{2}" maxlength="2" required><button class="btn primary submit" aria-label="Submit recall" type="submit">→</button></form>`, false, true);
  focusInput();
}
function encodeScreen() {
  root.innerHTML = sessionFrame(`<div class="qwrap"><div class="eye">Delayed recall · encoding</div><h2>Memorise these five pairs</h2><p>They will be due tomorrow after you confirm. You can leave and return to this unfinished set.</p><div class="pairs">${active.encodeItems.map(i => `<div class="card"><b>${esc(i.word.toUpperCase())}</b><strong>${i.code}</strong></div>`).join('')}</div></div><button class="btn primary full" data-encode-done>I’ve encoded them</button>`, false);
}
function pausedScreen() {
  root.innerHTML = `<main class="app"><section class="hero"><div class="eye">Session paused</div><h1>Ready when<br>you are.</h1><p>${esc(active.pauseReason || 'Take a break.')} ${active.resumePreflight ? 'Continue your recall or encoding.' : 'The current block will restart so interrupted timing does not affect your score.'} Completed blocks are saved.</p></section><button class="btn primary full" data-continue>Continue session</button><button class="btn secondary full" data-exit>Save and exit</button></main>`;
}
function errorScreen() {
  const d = active.diagnostic;
  root.innerHTML = `<main class="app"><section class="hero"><div class="eye">Session interrupted</div><h1>Let’s recover.</h1><p>An unexpected problem stopped this block. Completed blocks are kept in your saved checkpoint.</p></section>${active.sid ? '<button class="btn primary full" data-continue>Restart current block</button>' : ''}<button class="btn secondary full" data-home>Return to Today</button><button class="btn secondary full" data-export>Export progress</button><details class="card"><summary>Problem details</summary><pre>${esc(JSON.stringify(d, null, 2))}</pre></details></main>`;
}
function resumeChoiceScreen() {
  root.innerHTML = `<main class="app"><section class="hero"><h1>A session is<br>saved.</h1><p>Resume it from the next unfinished block, or keep its completed blocks as a partial session and start a new one.</p></section><button class="btn primary full" data-resume>Resume saved session</button><button class="btn secondary full" data-start-new>Start new session</button><button class="btn secondary full" data-home>Return to Today</button></main>`;
}
function render() {
  root.dataset.generation = String(generation);
  const p = active?.phase;
  if (p === 'question' || p === 'encoding') questionScreen();else if (['dualEncoding', 'dualMath', 'dualRecall'].includes(p)) dualScreen();else if (p?.startsWith('reflex')) reflexScreen();else if (p === 'words') wordsScreen();else if (p === 'sustained') sustainedScreen();else if (p === 'confidence') confidenceScreen();else if (p === 'recall') recallScreen();else if (p === 'qualityEncoding') encodeScreen();else if (p === 'blockResult') blockResult();else if (p === 'sessionResult') sessionResult();else if (p === 'paused') pausedScreen();else if (p === 'error') errorScreen();else if (p === 'resumeChoice') resumeChoiceScreen();else ({
    today,
    train,
    performance: performancePage,
    games: gamesPage
  }[page] || today)();
  const heading = root.querySelector('h1,h2');
  if (heading) heading.setAttribute('tabindex', '-1');
  if (['blockResult', 'sessionResult', 'paused', 'error'].includes(p)) heading?.focus({
    preventScroll: true
  });
  renderStorageNotice();
}
function focusInput() {
  presented(() => {
    const input = document.getElementById('ans');
    input?.focus({
      preventScroll: true
    });
  });
}
function announce(text) {
  const el = document.getElementById('announcement');
  if (el) el.textContent = text;
}
function showFeedback(t) {
  const text = t.correct ? 'Correct' : 'Answer: ' + t.question.answer;
  announce(text);
  root.querySelectorAll('button,input').forEach(el => {
    if (!el.hasAttribute('data-exit') && !el.hasAttribute('data-pause')) el.disabled = true;
  });
  let el = document.getElementById('feedback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'feedback';
    root.appendChild(el);
  }
  el.className = 'feedback ' + (t.correct ? 'ok' : 'no');
  el.textContent = text;
}
function renderStorageNotice() {
  const el = document.getElementById('storageNotice');
  if (!el) return;
  el.hidden = !persistence.message && !persistence.dirty;
  el.innerHTML = persistence.message ? `<p>${esc(persistence.message)}</p><button data-export>Export progress</button> <button data-retry-save>Retry save</button> <button data-load-latest>Load latest saved progress</button>` : persistence.dirty ? '<p>Saving progress…</p>' : '';
}
let importCandidate = null;
function importPreview(state) {
  importCandidate = state;
  root.innerHTML = shell(`<section class="hero"><h1>Import progress</h1><p>This replaces the progress on this browser with ${state.stats.sessions} sessions and ${state.history.length} retained session summaries. Your current progress will be backed up first.</p></section><button class="btn primary full" data-import-confirm>Replace progress with this file</button><button class="btn secondary full" data-import-cancel>Cancel import</button>`);
}
