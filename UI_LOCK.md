# SpaceNet UI LOCK — 2026-09-07 16:23 EEST

Owner: Notis. This chrome is frozen until Notis unlocks it.

Locked live shell: index.html build 4174 · snapshot index.lock.html

## Visible chrome (do not move, hide, restyle, or replace)
- Canvas globe `#g` full viewport
- Brand island: ASTRANOV SPACENET GROK · V1 (tap = cache wipe + reboot)
- JOBS pill top-left (`#sn-tasks-btn`)
- AV€ pill top-right (`#sn-money`)
- LOGIN `#sn-me` bottom-left · GPS `#gps` bottom-right
- Dock: `#plus` · `#in` Talk to Astranov SpaceNet Grok · `#go` mic
- Grid globe with continent labels. No HUD. No twin CLI.

## Required IDs
g, city, island, ver, heal, sn-money, sn-tasks-btn, sn-me, gps, plus, in, go, line, panel, dock, f

## Forbidden
- PLACEHOLDER / stub index under 4 KB
- fetch + document.write of `/sn-index/cN.txt` or `/index.partN.txt`
- Twin CLI / Command the HUD / os-bootloader chrome
- Auto-talk on boot
- Moving LOGIN / GPS / JOBS / AV€ / + / mic

## Unlock
Only Notis. Write UI_UNLOCK in a commit message and delete this file.
