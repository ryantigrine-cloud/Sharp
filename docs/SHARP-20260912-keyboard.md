# SHARP 20260912.2 — iPhone answer entry

Opening the maths keyboard could pan the full-height document until the question disappeared. Tapping Submit could then blur the input, resize the page and move the button before the click completed.

Numeric answer screens now use a fixed panel sized and positioned from the visual viewport. Its question area can scroll independently for long prompts, while the answer row remains above the keyboard. Visual viewport scroll events are handled alongside resize events. Pinch zoom retains normal pan behaviour. This applies to arithmetic, other typed answers, Dual Task and delayed recall.

Pointer-down on an answer-screen button preserves the focused answer field. WebKit can suppress the resulting touch click, so a completed touch tap activates the actual button explicitly, preserving native form validation and submit. Delayed compatibility clicks are suppressed, while keyboard activation remains available. Movement, cancellation, multiple fingers, or a changed question invalidate the pending tap. Dragging away does not submit. Existing answer/timeout settlement guards are unchanged.

The production entry selects a new immutable release directory, `gpt-sharp/releases/20260912-2/`; `20260912/` remains available for rollback. Scores, progression, storage keys and game content are unchanged.

Validation covers the existing generator/state/persistence suite and Chromium/WebKit browser flows, plus simulated keyboard height and Safari pan offsets, long prompts, single touch/mouse submission, required-field validation, sign toggling, keyboard Enter, drag cancellation and zoom. These tests model keyboard geometry; a physical iPhone keyboard remains a device check rather than something browser emulation can fully reproduce.
