# Product Requirements Document (PRD)
## Word Builder Game (Subwords Web Arena)

| Document Metadata | Value |
| :--- | :--- |
| **Product Name** | Word Builder (Subwords Web Arena) |
| **Document Version** | 2.0.0 (Web Revamp) |
| **Document Status** | Approved / Target Specification |
| **Author** | Lead Business Analyst & Product Architecture Team |
| **Target Audience** | Engineering, QA, UI/UX, Product Management, Stakeholders |
| **Last Updated** | November 2026 |

---

## 1. Executive Summary & Vision

### 1.1 Product Vision
Word Builder Web Arena is a competitive, responsive web application designed for word puzzle enthusiasts. Players compete to identify and submit valid English subwords constructed exclusively from the letters of a randomly selected 6+ letter root word within a configurable countdown timer.

### 1.2 Core Value Proposition & Upgrades (v2.0)
- **Modern Web Architecture**: Built as a responsive ReactJS web application (Vite + React 18/19 + Tailwind CSS) accessible across Desktop, Tablet, and Mobile browsers without app store downloads.
- **Compounding Multiplier Scoring**: Total score is computed as:
  $$\text{Score} = \left( \sum_{i=1}^{N} \text{Length}(W_i) \right) \times N$$
  Rewarding vocabulary breadth, speed, and finding longer words.
- **Competitor Word Lockout (Anti-Duplicate Stealing)**: Once a player claims a valid subword, that word is **locked out** and cannot be used by the competitor.
- **Configurable Session Time Limits**: Players can customize turn duration (30s, 60s, 90s, 120s, 180s) to match casual or competitive formats.
- **Dual-Tier Lexical Validation**: High-speed in-memory dictionary lookup ($O(1)$) with external Dictionary API fallback, guaranteeing sub-50ms validation.

---

## 2. Problem Statement & Market Solution

### 2.1 The Challenge
Traditional mobile word puzzle games force users to download native apps, suffer through intrusive video ads, and endure rigid, slow-paced game loops with static additive scoring.

### 2.2 The Solution
Subwords Web Arena runs instantly in any modern web browser with zero installation, featuring:
1. Fast, fluid turn-based competition with responsive letter tiles supporting click, touch, and physical keyboard input.
2. High-stakes word-stealing lockout dynamics.
3. Compounding exponential score multipliers that keep matches exciting until the final second.

---

## 3. User Personas & Target Audience

| Persona | Context & Behavior | Needs & Motivations | Features Benefiting Them |
| :--- | :--- | :--- | :--- |
| **Competitive Clara** | Competitive gamer; plays on desktop with mechanical keyboard. | Wants fast keyboard input, strict lexical validation, and high-scoring compounding combos. | Physical keyboard listeners (A-Z, Backspace, Enter), live multiplier display, word lockout. |
| **Casual Cody** | Mobile web user; plays on smartphone during quick breaks. | Wants an instant web link, large tactile touch tiles, and quick 60-second matches. | Zero-install web app, touch-friendly 3D letter tiles, configurable 30s/60s time limits. |
| **Solo Sam** | Solitary puzzle solver; enjoys brain training vs AI. | Wants to practice against balanced AI opponents of escalating difficulty. | Single-player PvC mode with Easy, Medium, and Hard AI bot tiers. |

---

## 4. Key Performance Indicators (KPIs)

- **Time to First Turn**: Under 5 seconds from visiting the web URL.
- **Word Validation Latency**: $< 50$ms for in-memory words, $< 800$ms for external API lookups.
- **Concurrent User Scalability**: $> 500$ concurrent game sessions supported per backend instance.
- **Browser Compatibility**: 100% functional on Chrome, Safari, Firefox, Edge, iOS Safari, Android Chrome.

---

## 5. Scope & Feature Specifications

### 5.1 Epic 1: Game Initialization & Lobby

#### User Story 1.1: Mode Selection
- **Single Player (Player vs AI)**: Play against the server-side algorithmic AI bot.
- **Two Player (Player vs Player)**: Shared-device turn-based arena with competitor word lockout.

#### User Story 1.2: Configurable Session Timers
- Preset buttons: **30s**, **60s**, **90s**, **120s**, **180s**.
- Configured value is saved in the `Game` document and strictly governs both players' turns.

#### User Story 1.3: AI Difficulty Tuning
- **Easy**: AI claims 3–5 short subwords (3–4 letters).
- **Medium**: AI claims 5–8 mixed subwords (3–6 letters).
- **Hard**: AI claims 8–12 subwords, prioritizing maximum length.

---

### 5.2 Epic 2: Core Gameplay Mechanics & Arena Rules

#### Rule 1: 6+ Letter Base Word
Every game randomly selects a base word of at least 6 characters (e.g., `PLANET`, `STREAM`, `CASTLE`, `WONDER`) from a curated 120+ word lexicon.

#### Rule 2: Subword Permutation & Multiset Subtraction
Candidate subwords must be at least 3 letters long and formed solely from available letters in the base word, respecting character frequencies:
$$\forall c \in \Sigma, \quad \text{Count}_{\text{subword}}(c) \le \text{Count}_{\text{baseword}}(c)$$

#### Rule 3: Competitor Word Lockout
- Subwords claimed by Player 1 cannot be submitted by Player 2 (or AI).
- Attempting to submit a competitor's word displays: `"Word already claimed by competitor!"`.
- Locked words appear in a dedicated "Claimed by Competitor" review ledger.

#### Rule 4: Word-Length Scoring Engine
- Each valid subword earns points equal to its character length (1 point per letter):
  $$\text{Points}(W_i) = \text{Length}(W_i)$$
  $$\text{Total Score} = \sum_{i=1}^{N} \text{Length}(W_i)$$
- Example:
  - Word 1: `ISLAND` (length 6) $\to 6 \times 1 = 6$ pts
  - Word 2: `LAND` (length 4) $\to 4 \times 1 = 4$ pts
  - Word 3: `AND` (length 3) $\to 3 \times 1 = 3$ pts
  - Total Player Score = $6 + 4 + 3 = 13$ points.
  - If a player finds five 3-letter words: Total Score = $3 \times 5 = 15$ points.

---

### 5.3 Epic 3: User Experience & Controls

- **Tactile Letter Tiles**: Click or tap letter tiles to spell subwords; remaining letter counts decrement dynamically.
- **Keyboard Controls**: Desktop players can type letters `A-Z`, press `Backspace` to delete, `Escape` to clear, and `Enter` to submit.
- **Circular Animated Timer**: Visual SVG ring shifting from Emerald ($> 30$s) to Amber (15–30s) to Red Pulse ($< 15$s).
- **Humanized Real-Time AI Playback (v2.1)**:
  - Eliminates the perception of an unfair instant bot by animating the AI's turn directly on the live arena board.
  - Realistic pacing: 1.1s – 1.9s jittered cognitive delay between words.
  - Letter-by-letter typing animation with synchronized audio tile clicks (`soundEffects.playTileClick()`).
  - Auditory confirmation chime upon successful word discovery (`soundEffects.playValidWord()`).
  - Dynamic live score multiplier updates and board tile frequency badges decrementing in real-time.
  - "Skip to Results" button allowing players to immediately fast-forward to the match summary.
- **Victory & Celebration Screen**: Confetti celebration, head-to-head score comparison, base word recap, and side-by-side subwords breakdown.

---

## 6. Non-Functional Requirements (NFRs)

1. **Responsiveness**: Fluid layout adapting seamlessly to 375px (mobile), 768px (tablet), and 1440px+ (desktop).
2. **Accessibility**: High contrast dark theme ($> 7:1$), full keyboard navigability, clear ARIA labels.
3. **Resilience**: Dual-tier dictionary lookup ensures offline/fallback resilience when external dictionary services are unreachable.
