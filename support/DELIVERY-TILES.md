# Delivery marketplace · overlay tiles (2026-08-04)

## Law
Tasks and offers are thrown as **peek tiles** that overlay globe/map/CLI.
Never full-screen wall on first throw. Map stays usable.

## Module
`js/spacenet/offer-stack.js` → `window.SNOfferStack`

## Flow
1. User: `pizza` / order → SNMarket.fulfillFoodIntent
2. Pay → SNProfiles.placeOrder → **SNOfferStack.onOrderResult**
3. Peek task tile + stack card (Claim / Map / Open)
4. Vendor top-3 also appear as offer cards (Menu / Map)
5. Driver can Claim from tile without digging CLI

## CLI
- Task claim still works from CLI + tile button

## Test
1. Hard refresh
2. `locate` then `pizza` (or `order me a pizza`)
3. After pay: tile stack appears top-right
4. Tap Claim or Open · map routes via Map button
