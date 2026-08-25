# ESCALATION — owner: app still dead, no globe, no AI · 2026-08-25T03:25Z

**Phone:** Android 10 Chrome 151. `/api/fail` ×2 `ai-silent` on `20260825050800-loop`.
Heal: js loaded, ai keyed true, webgl true, line stayed `.gone`.

**Root cause:** `grid-os.js` calls `resize()` then `tick()`. **`function resize` does not exist.** IIFE throws `ReferenceError: resize is not defined`. Globe never paints. `wake()` never runs. Buttons never bind. Line stays hidden.

**Fix:** define `resize()` (DPR canvas), null-guards, `__SN_ALIVE`, HTML line visible, inline 2d globe+Grok fallback at 900ms if full OS dies. Build `20260825062500-alive`.

Do not restore os-bootloader.
