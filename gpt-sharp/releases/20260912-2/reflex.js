'use strict';

function startReflex() {
  Object.assign(active, {
    q: {kind: 'reflex', prompt: 'Release on green', answer: 'release'},
    reflexTimes: [],
    reflexFalse: 0,
    reflexMiss: 0,
    reflexInput: null,
    reflexSource: null
  });
  phase('reflexReady');
  render();
  paintReflex();
}
function paintReflex(message) {
  const pad = document.querySelector('[data-reflex-hold]');
  if (!pad) return;
  const p = active.phase,
    go = p === 'reflexGo',
    waiting = p === 'reflexWait',
    ready = p === 'reflexReady';
  pad.classList.toggle('go', go);
  pad.classList.toggle('bad', p === 'reflexCooldown');
  pad.setAttribute('aria-label', go ? 'Release now' : waiting ? 'Keep holding until green' : 'Hold, then release when green. Space or Enter also works.');
  const heading = pad.querySelector('h2'),
    note = pad.querySelector('p'),
    num = document.getElementById('reflexCount');
  if (heading) heading.textContent = go ? 'RELEASE NOW' : waiting ? 'KEEP HOLDING' : ready ? 'PRESS AND HOLD' : 'WAIT';
  if (note) note.textContent = message || (go ? 'Release as soon as you see green.' : waiting ? 'Wait for green.' : 'Hold here, or focus and hold Space or Enter.');
  if (num) num.textContent = `${Math.min(5, active.reflexTimes.length + 1)}/5`;
}
function reflexBegin(source, pointerId, pad) {
  if (active?.phase !== 'reflexReady' || active.reflexInput) return;
  // Keep one input method for a block; keyboard timing is recorded separately.
  if (active.reflexSource && active.reflexSource !== source) {
    announce('Use the same input method for these five trials.');
    return;
  }
  active.reflexSource = source;
  active.reflexInput = {
    source,
    pointerId,
    pad
  };
  phase('reflexWait');
  active.engagedSince = mono();
  active.holdStart = mono();
  paintReflex();
  if (source === 'pointer') {
    try {
      pad.setPointerCapture(pointerId);
    } catch {
      return reflexCancel('Pointer capture was interrupted. Try again.');
    }
  }
  owned(() => {
    phase('reflexGo');
    presented(() => {
      active.reflexGo = mono();
      active.engagedSince = mono();
      active.accepting = true;
      paintReflex();
      owned(() => reflexMiss(), 3000);
    });
  }, ri(900, 2400));
}
function releaseCapture() {
  const held = active.reflexInput;
  active.reflexInput = null;
  if (held?.source === 'pointer') {
    try {
      if (held.pad.hasPointerCapture(held.pointerId)) held.pad.releasePointerCapture(held.pointerId);
    } catch {}
  }
}
function reflexEnd(source, pointerId) {
  const held = active?.reflexInput;
  if (!held || held.source !== source || source === 'pointer' && held.pointerId !== pointerId) return;
  const p = active.phase,
    valid = p === 'reflexGo' && active.accepting;
  if (p !== 'reflexWait' && p !== 'reflexGo') return;
  const ms = valid ? mono() - active.reflexGo : mono() - active.holdStart;
  releaseCapture();
  if (valid) {
    active.reflexTimes.push(ms);
    trial({
      kind: 'reflex',
      prompt: 'Release on green',
      answer: 'release'
    }, 'release', 'answered', ms, {
      correct: true,
      input: source
    });
  } else {
    active.reflexFalse++;
    trial({
      kind: 'reflex',
      prompt: 'Wait for green',
      answer: 'hold'
    }, 'release', 'false-start', ms, {
      correct: false,
      input: source
    });
  }
  if (active.reflexTimes.length === 5) return finishReflex();
  phase('reflexCooldown');
  paintReflex(valid ? `${Math.round(ms)} ms` : 'Too early. This trial repeats.');
  announce(valid ? `${Math.round(ms)} milliseconds` : 'Too early.');
  owned(() => {
    phase('reflexReady');
    paintReflex();
  }, 450);
}
function reflexCancel(reason = 'Touch interrupted. This trial will repeat without a penalty.') {
  if (!active?.reflexInput) return;
  const source = active.reflexInput.source;
  releaseCapture();
  trial({
    kind: 'reflex',
    prompt: 'Release on green',
    answer: 'release'
  }, null, 'interrupted', 0, {
    correct: false,
    input: source,
    reason
  });
  phase('reflexCooldown');
  paintReflex(reason);
  announce(reason);
  owned(() => {
    phase('reflexReady');
    paintReflex();
  }, 450);
}
function reflexMiss() {
  if (active?.phase !== 'reflexGo' || !active.accepting) return;
  active.reflexMiss++;
  releaseCapture();
  trial({
    kind: 'reflex',
    prompt: 'Release on green',
    answer: 'release'
  }, null, 'timeout', 3000, {
    correct: false,
    input: active.reflexSource
  });
  phase('reflexCooldown');
  paintReflex('No release registered. This trial repeats.');
  owned(() => {
    phase('reflexReady');
    paintReflex();
  }, 450);
}
function finishReflex() {
  const acc = 5 / (5 + active.reflexFalse + active.reflexMiss);
  finishBlock({
    acc,
    ms: med(active.reflexTimes),
    extra: {
      valid: 5,
      falseStarts: active.reflexFalse,
      misses: active.reflexMiss,
      input: active.reflexSource,
      protocol: 'hold-release-v2'
    }
  });
}
