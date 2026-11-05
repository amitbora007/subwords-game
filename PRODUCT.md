# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Competitive Clara**: Plays on desktop with a physical keyboard. Values rapid subword entry, zero latency, strict lexical validation, live score calculation, and word lockout dynamics.
- **Casual Cody**: Plays on mobile touchscreens during short breaks. Values instant browser loading with zero installation, large tactile 3D touch tiles, and quick 30s/60s matches.
- **Solo Sam**: Solitary puzzle solver looking for cognitive exercise. Values balanced, humanized single-player matches against AI bot tiers (Easy, Medium, Hard).

## Product Purpose

Word Builder (Subwords Web Arena) is a fast, competitive, responsive web application for word puzzle players. Competitors race against a countdown timer to construct valid English subwords from the letters of a randomly selected 6+ letter root word. Success means finding the highest total point yield through breadth and longer words while locking competitors out of shared anagrams.

## Positioning

Unlike native app-store word games laden with video ads, intrusive monetizations, and slow animations:
- Zero-installation instant browser play across desktop, tablet, and mobile.
- **Competitor Word Lockout**: Claiming a valid word locks it out from the competitor permanently for the match.
- **Length-Based Scoring Engine**: Points compound with word length ($\sum \text{Length}(W_i)$), rewarding longer words.
- **Humanized Real-Time AI Playback**: AI opponents do not calculate instantly in a black box; turns are simulated in real time with human-like cognitive delays (1.1s–1.9s), keystroke cadence, and Web Audio click chimes.

## Operating Context

- **Environments**: Cross-browser desktop (Chrome, Firefox, Safari, Edge) and mobile (iOS Safari, Android Chrome).
- **Physical Controls**: Desktop keyboard listeners (`A-Z`, `Backspace`, `Escape` to clear, `Enter` to submit) alongside touch and mouse tile clicking.
- **Match Modes**: Single-player vs AI and 2-Player pass-and-play on a shared device.
- **Session Durations**: Configurable timer limits (30s, 60s, 90s, 120s, 180s).

## Capabilities and Constraints

- **Lexicon & Anagram Rules**: Base word must be $\ge 6$ letters from curated 120+ root words; subwords must be $\ge 3$ letters and conform to multiset frequency subtraction ($\text{Count}_{\text{subword}}(c) \le \text{Count}_{\text{baseword}}(c)$).
- **Validation Engine**: Fast dual-tier validation — sub-50ms in-memory dictionary lookup backed by external Dictionary API fallback.
- **Scoring Engine**: Direct length scoring where each valid word earns 1 pt per letter.
- **State Management**: Turn-based state tracking player turns, word ledgers, competitor locked words, and timer sync.

## Brand Commitments

- **Name**: Word Builder (Subwords Web Arena).
- **Voice & Tone**: High-energy, clean, retro-modern esports arcade. Focused and tactile; zero distractions.
- **Aesthetic Direction**: Cyberpunk Emerald Arcade — deep midnight canvas (`#020617` / `#0f172a`), emerald accents (`#10b981`), amber player/timer accents (`#f59e0b`), coral danger/lockout alerts (`#ef4444`), and gold victory highlights (`#eab308`).
- **Typography Hierarchy**: `Chakra Petch` (Google Fonts) for titles, letter tiles, timers, and score numerals; `Inter` (Google Fonts) for UI copy, forms, and ledger items.

## Evidence on Hand

- **Existing Production Codebase**:
  - React 19 + TypeScript + Vite + Tailwind CSS frontend (`/frontend`).
  - Python FastAPI backend (`/backend`).
  - Curated base word lexicon (`/backend/app/lexicon.txt`).
- **Product & Design Specifications**:
  - Product Requirements Document (`/docs/PRD.md`).
  - System Architecture & LLD Document (`/docs/DESIGN.md`).

## Product Principles

1. **Zero-Friction Immediacy**: Under 5 seconds from URL arrival to gameplay; no downloads, account walls, or interstitial ad popups.
2. **Tactile Multisensory Feedback**: Every keystroke, tile tap, and valid word discovery responds instantly with visual animation and zero-asset synthesized Web Audio tones.
3. **Transparent & Humanized Competition**: Clear rules with real-time lockout alerts; AI behaves like a human opponent rather than an instant database query.
4. **Resilient Responsive Layout**: Rock-solid layout stability (zero CLS) across 375px mobile touchscreens, tablets, and 12-column desktop split dashboards.

## Accessibility & Inclusion

- High-contrast dark theme exceeding WCAG AAA standards ($> 7:1$).
- Full keyboard parity: every gameplay action is executable via physical keyboard shortcuts.
- Minimum 44px touch targets on mobile viewports.
- State communication is never color-alone: color tokens are paired with iconography (checkmarks, lock icons, warning badges) and clear copy.
