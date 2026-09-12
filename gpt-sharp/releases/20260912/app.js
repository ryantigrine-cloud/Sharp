'use strict';

if (window.sharpBootFailed) throw new Error('A required SHARP file did not load. Reload to try again.');

function usableTarget(event, selector) {
  const el = closestElement(event.target, selector);
  return el?.isConnected ? el : null;
}
document.addEventListener('click', async event => {
  const el = usableTarget(event, 'button');
  if (!el || el.disabled) return;
  try {
    if (el.hasAttribute('data-export')) return exportProgress();
    if (el.hasAttribute('data-recovery-export')) {
      if (readBackup() || persistence.rawBackup) return exportProgress(true);
      announce('There is no recovery backup yet.');
      return;
    }
    if (el.hasAttribute('data-retry-save')) return saveState();
    if (el.hasAttribute('data-load-latest')) {
      if (persistence.dirty && !confirm('Replace this tab with the latest saved progress? Export this tab first if you need its unsaved changes.')) return;
      phase('idle');
      active = null;
      persistence.blocked = false;
      persistence.dirty = false;
      persistence.message = '';
      loadState();
      page = 'today';
      render();
      return;
    }
    if (el.dataset.nav) {
      leaveSession();
      page = el.dataset.nav;
      render();
      return;
    }
    if (el.dataset.start) return start(el.dataset.start);
    if (el.dataset.practice) return start('practice', el.dataset.practice);
    if (el.hasAttribute('data-resume')) return resumeSession();
    if (el.hasAttribute('data-start-new')) {
      const r = active?.requested;
      if (r) return start(r.mode, r.only, true);
      return;
    }
    if (el.hasAttribute('data-answer')) return answer(el.dataset.answer);
    if (el.hasAttribute('data-sign')) {
      const input = document.getElementById('ans');
      if (input) {
        input.value = input.value.startsWith('-') ? input.value.slice(1) : '-' + input.value;
        input.focus({
          preventScroll: true
        });
      }
      return;
    }
    if (el.hasAttribute('data-letter') && active?.phase === 'words' && active.accepting) {
      const i = Number(el.dataset.letter);
      if (Number.isInteger(i) && i >= 0 && i < active.wordLetters.length && !active.wordUsed.includes(i)) active.wordUsed.push(i);
      return renderWordsControls();
    }
    if (el.hasAttribute('data-word-back') && active?.phase === 'words') {
      active.wordUsed.pop();
      return renderWordsControls();
    }
    if (el.hasAttribute('data-word-shuffle') && active?.phase === 'words') {
      active.wordLetters = sh(active.wordLetters);
      active.wordUsed = [];
      return renderWordsControls();
    }
    if (el.hasAttribute('data-word-submit')) return wordSubmit();
    if (el.hasAttribute('data-sustained')) return sustainedTap();
    if (el.hasAttribute('data-confidence')) return commitConfidence(el.dataset.confidence);
    if (el.hasAttribute('data-encode-done')) return finishEncoding();
    if (el.hasAttribute('data-next')) return nextBlock();
    if (el.hasAttribute('data-continue')) return continueSession();
    if (el.hasAttribute('data-pause')) return interruptCurrent('Paused by you.');
    if (el.hasAttribute('data-exit')) return leaveSession();
    if (el.hasAttribute('data-done') || el.hasAttribute('data-home')) {
      if (active?.sid && active.phase !== 'sessionResult') leaveSession();else {
        phase('idle');
        active = null;
      }
      page = 'today';
      render();
      return;
    }
    if (el.hasAttribute('data-import-confirm')) {
      if (!importCandidate) return;
      const candidate = importCandidate;
      importCandidate = null;
      el.disabled = true;
      await importProgress(candidate);
      page = 'performance';
      render();
      return;
    }
    if (el.hasAttribute('data-import-cancel')) {
      importCandidate = null;
      page = 'performance';
      render();
      return;
    }
  } catch (error) {
    announce(error.message);
    if (el.hasAttribute('data-import-confirm')) {
      storageMessage(error.message);
      page = 'performance';
      render();
    } else handleRuntimeError(error);
  }
});
document.addEventListener('submit', event => {
  const form = usableTarget(event, 'form');
  if (!form) return;
  if (!['answerForm', 'dualForm', 'recallForm'].includes(form.id)) return;
  event.preventDefault();
  const value = form.querySelector('input')?.value.trim() || '';
  if (form.id === 'answerForm') answer(value);else if (form.id === 'dualForm') dualAnswer(value);else submitRecall(value);
});
document.addEventListener('change', async event => {
  const input = usableTarget(event, '#importFile');
  if (!input?.files?.[0]) return;
  const file = input.files[0],
    token = generation;
  try {
    if (file.size > 8 * 1024 * 1024) throw new Error('Choose a SHARP export smaller than 8 MB.');
    const state = parseImport(await file.text());
    if (generation !== token || active) return;
    importPreview(state);
  } catch (error) {
    storageMessage(error.message);
  }
});
document.addEventListener('pointerdown', event => {
  const pad = usableTarget(event, '[data-reflex-hold]');
  if (!pad) return;
  if (event.isPrimary === false) {
    reflexCancel('Multiple touches interrupted the trial. Use one finger.');
    return;
  }
  if (event.button !== 0) return;
  event.preventDefault();
  reflexBegin('pointer', event.pointerId, pad);
});
document.addEventListener('pointerup', event => {
  if (active?.reflexInput?.source === 'pointer') {
    event.preventDefault();
    reflexEnd('pointer', event.pointerId);
  }
});
document.addEventListener('pointercancel', event => {
  if (active?.reflexInput?.pointerId === event.pointerId) reflexCancel();
});
document.addEventListener('lostpointercapture', event => {
  if (active?.reflexInput?.pointerId === event.pointerId) reflexCancel();
}, true);
document.addEventListener('keydown', event => {
  const pad = usableTarget(event, '[data-reflex-hold]');
  if (!pad || ![' ', 'Enter'].includes(event.key)) return;
  event.preventDefault();
  if (!event.repeat) reflexBegin('keyboard', event.key, pad);
});
document.addEventListener('keyup', event => {
  if (active?.reflexInput?.source === 'keyboard' && active.reflexInput.pointerId === event.key) {
    event.preventDefault();
    reflexEnd('keyboard', event.key);
  }
});
for (const name of ['selectstart', 'contextmenu', 'dragstart']) document.addEventListener(name, event => {
  if (closestElement(event.target, '[data-reflex-hold]')) event.preventDefault();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) interruptCurrent('The app went into the background.');
});
window.addEventListener('pagehide', () => interruptCurrent('The page was closed or hidden.'));
window.addEventListener('orientationchange', () => interruptCurrent('The device orientation changed.'));
window.addEventListener('blur', () => {
  if (active?.reflexInput) interruptCurrent('The window lost focus.');
});
window.addEventListener('storage', event => {
  if (event.key !== K && event.key !== QUALITY_KEY) return;
  const expected = event.key === K ? persistence.expected : persistence.expectedQuality;
  if (event.newValue === expected) return;
  persistence.blocked = true;
  storageMessage('Progress changed in another tab. Export this tab if needed, then load the latest saved progress.');
  interruptCurrent('Another tab updated your saved progress.');
});
document.addEventListener('sharp-storage', renderStorageNotice);
window.addEventListener('error', event => {
  if (window.sharpReady) handleRuntimeError(event.error || new Error(event.message));
});
window.addEventListener('unhandledrejection', event => {
  if (window.sharpReady) {
    event.preventDefault();
    handleRuntimeError(event.reason);
  }
});
function updateViewport() {
  const vv = window.visualViewport;
  document.documentElement.style.setProperty('--usable-height', `${vv?.height || window.innerHeight}px`);
  const keyboard = !!document.activeElement?.matches?.('input') && (vv?.height || window.innerHeight) < window.innerHeight * .8;
  document.documentElement.classList.toggle('keyboard-open', keyboard);
}
window.visualViewport?.addEventListener('resize', updateViewport);
window.addEventListener('resize', updateViewport);
document.addEventListener('focusin', updateViewport);
document.addEventListener('focusout', updateViewport);
loadState();
updateViewport();
render();
window.sharpReady = true;
clearTimeout(window.sharpBootTimer);
