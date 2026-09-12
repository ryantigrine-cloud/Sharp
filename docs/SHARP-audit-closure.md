# Audit implementation map

The audit refers to baseline `f1c0c13de7c97338fd90a22b8bf3d611a576ec1f`. The following changes are in `gpt-sharp/releases/20260912/`. Deployment and physical-device limits are recorded in `SHARP-20260912.md`.

| Finding | Implementation and verification |
|---|---|
| F01 | Element-safe delegated event targets and scoped selection suppression; Text/Document/Window regression. |
| F02 | Recoverable error screen, diagnostics, navigation, checkpoint and export; invalidated timer regression. |
| F03 | Recall advances through owned callbacks; cancel/start-new regression. |
| F04 | Session/phase ownership for all game callbacks; same-domain restart and Dual timer regression. Dictionary is synchronous. |
| F05 | Pointer cancellation repeats without scoring; regression includes green cancellation. |
| F06 | Explicit Reflex cooldown; exactly five valid trials finish. |
| F07 | Mounted Reflex pad and capture handling; lost capture, background and off-pad release tests. |
| F08 | Exact arithmetic, verified against independent prompt calculations. |
| F09 | Decimal, signed integer and digit-sequence input metadata; native input modes and sign toggle. |
| F10 | Matrix alternative-rule screening; independent rule oracle. |
| F11 | Real detours, varied endpoints and parity-consistent distractors; independent path oracle. |
| F12 | Unique maximum expected value, no hidden tolerance/tie preference; independent displayed-EV oracle. |
| F13 | Unique active recall cues and distinct pending cues/codes. |
| F14 | Resumable pending encoding and mastery-based recall retirement. |
| F15 | Timed memory and visual recall with a single settlement path. |
| F16 | Balanced eight-trial Stroop blocks, omission records and minimum samples for interference. |
| F17 | Accuracy-gated speed credit and correct-response medians; all-wrong scoring regressions. |
| F18 | Reflex fixed protocol, no speed-only level promotions; false starts reduce score. |
| F19 | Promotion evidence restricted to current level/scoring version. |
| F20 | Mixed Strategy outcomes; non-disclosing analogy directions; asymmetric spatial content; switch/repeat mixture. |
| F21 | Visible save failure/retry/export; atomic canonical core+quality save. |
| F22 | Schema checks, bounds, safe history rendering and quarantine before repair. |
| F23 | Bundled checked vocabulary/racks and source notices; offline browser test. |
| F24 | Final Sharpness clamp and current-series coverage; negative-index regression. |
| F25 | Explicit load chain, single function definitions and one controller; no monkey-patch/recovery injection. |
| F26 | Monotonic frame-boundary timing; pause/restart on interruption; active minutes; wall-clock-jump regression. |
| F27 | Bounded versioned trial snapshots and export; legacy results labelled and preserved. |
| F28 | Local calendar keys/date arithmetic, migration-safe streak marker, multiple timezone/DST tests. |
| F29 | Seeded Fisher–Yates and weighted sampling without replacement. |
| F30 | Real game buttons, labelled inputs/options/grids, live feedback, keyboard Reflex, zoom and scrollable layouts. Browser tests supplement, but do not replace, physical iPhone/VoiceOver review. |
| F31 | Export/import, pre-import backup, block checkpoints/partial history and stale-tab write rejection. |
| F32 | Static, semantic, state and Chromium/WebKit CI; versioned assets and rollback notes. Required-check/Pages administration remains an external configuration limit; exact-commit release is manually gated. |

No claim is made that the finite generator samples prove the absence of every possible future defect. The suite preserves explicit regressions for the observed failures and independently checks the key correctness properties.
