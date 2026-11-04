# System & UI/UX Design Document
## Word Builder Web Arena (Subwords)

| Document Metadata | Details |
| :--- | :--- |
| **System** | Subwords Web Arena Detailed Design |
| **Design Version** | 2.0.0 (Web Revamp) |
| **Scope** | Low-Level System Design (LLD), Algorithmic Complexity & UI/UX Design System |
| **Last Updated** | November 2026 |

---

## 1. Algorithmic Design & Mathematical Model

### 1.1 Letter Multiset Subtraction Algorithm (`can_form_word`)

The engine verifies that candidate subwords are legal anagrams using character frequency counters:
$$\forall c \in \Sigma, \quad \text{Count}_{\text{subword}}(c) \le \text{Count}_{\text{baseword}}(c)$$

```python
from collections import Counter

def can_form_word(main_word: str, sub_word: str) -> bool:
    main_counts = Counter(main_word.lower().strip())
    sub_counts = Counter(sub_word.lower().strip())
    for char, count in sub_counts.items():
        if main_counts[char] < count:
            return False
    return True
```
- **Time Complexity**: $O(M + N)$ where $M$ is the length of `main_word` and $N$ is the length of `sub_word`.
- **Space Complexity**: $O(|\Sigma|) = O(1)$ bounded by 26 English lowercase characters.

---

### 1.2 Word-Length Scoring Engine

The scoring system calculates points directly from the length of each valid submitted word (1 point per letter):
$$\text{Score}(P) = \sum_{i=1}^{N} \text{Length}(W_i)$$

```
Example:
- Player 1: ISLAND (6L), LAND (4L), AND (3L)
  Score = 6*1 + 4*1 + 3*1 = 13 points
- Player 2: LAD (3L), LID (3L), AID (3L), NIL (3L), SIN (3L)
  Score = 3 * 5 = 15 points
```
Each valid subword contributes points equal to its letter count. Longer words yield proportionally higher individual scores.

---

### 1.3 Competitor Word Lockout Rule (Anti-Duplicate Stealing)

To incentivize fast word finding and competitive aggression:
$$\text{Allowed}(W, P_1) \iff W \notin \text{Words}(P_1) \land W \notin \text{ValidWords}(P_2)$$
If a player attempts to submit a word previously claimed by the opponent:
- Return HTTP 200 with `{ "valid": false, "reason": "Word already claimed by competitor!", "points": 0 }`.
- Rendered on the client with a locked badge in the competitor's ledger.

---

## 2. Frontend UI/UX Design System

### 2.1 Design Tokens & Aesthetic Philosophy
Word Builder Web Arena uses a **Cyberpunk Emerald Arcade** theme:
- Deep Midnight Navy backdrop (`#020617` / `#0f172a`) to eliminate glare and eye strain.
- Vibrant Emerald Green (`#10b981`) for primary actions, scores, and active letter tiles.
- Bright Amber (`#f59e0b`) for secondary players, timers, and multiplier highlights.
- Coral Red (`#ef4444`) for lockout warnings and timer danger states ($< 15$s).
- Golden Trophy Yellow (`#eab308`) for victory banners and fireworks.

| Token | Hex Value | Semantic Usage |
| :--- | :--- | :--- |
| `game-dark` | `#020617` / `#0f172a` | Global canvas background |
| `game-card` | `#1e293b` | Elevated cards, glassmorphic panels |
| `game-border` | `#334155` | Subtle separators, tile outlines |
| `game-emerald` | `#10b981` | Active player, valid subwords, primary CTA |
| `game-amber` | `#f59e0b` | Player 2, countdown timer, multipliers |
| `game-coral` | `#ef4444` | Invalid words, locked competitor words |
| `game-gold` | `#eab308` | Winner trophy, celebration highlights |

---

### 2.2 Typography Hierarchy

- **Game Display Font**: `Chakra Petch` (Google Fonts) — bold, athletic, esports-inspired typeface used for titles, letter tiles, timers, and score displays.
- **Interface Font**: `Inter` (Google Fonts) — clean, highly legible grotesque sans-serif for descriptions, inputs, and ledger items.

---

### 2.3 Responsive Layout Grids & Multi-Device Architecture

```
DESKTOP (>= 1024px) 12-Column Split Dashboard (max-w-7xl):
+---------------------------------------------------------------------------------+
| [W] SUBWORDS v2.0                                                       [Rules] |
+---------------------------------------------------+-----------------------------+
| LEFT ARENA (Cols 1-7)                             | RIGHT HUD (Cols 8-12 Sticky)|
| +-----------------------------------------------+ | +-------------------------+ |
| | [P1: 13 pts (Active)]    [P2: 15 pts]         | | | TOTAL SCORE: 13 pts     | |
| +-----------------------------------------------+ | | 3 Words | 1pt/L | 13 pts| |
| | BASE WORD (7 Letters)        (Time: 01:24)    | | +-------------------------+ |
| |   [ P ]  [ L ]  [ A ]  [ N ]  [ E ]  [ T ]    | | | YOUR SUBWORDS (3):      | |
| +-----------------------------------------------+ | | [✓ PLANET +6] [✓ PLAN +4] |
| | [ TYPE OR TAP TILES...          ] [⌫] [Submit]| | | [✓ TEA +3]              | |
| +-----------------------------------------------+ | +-------------------------+ |
| | Valid word! +6 pts            Total: 13 pts   | | | LOCKED OUT BY OPPONENT: | |
| +-----------------------------------------------+ | | [🔒 PLANT] [🔒 NET]     | |
| | Press Enter to submit     [Finish Turn Early ->| | +-------------------------+ |
| +-----------------------------------------------+ | | Shortcuts: Enter / Esc  | |
+---------------------------------------------------+-----------------------------+

MOBILE & TABLET (< 1024px) Single-Column Unified Flow:
+-------------------------------------------------------------+
| [P1: 13 pts (Active)]                 [P2: 15 pts]          |
| Base Word: [ P ] [ L ] [ A ] [ N ] [ E ] [ T ] [ S ]        |
| [ Input Field...               ] [⌫] [Submit ↵]             |
| Total Score Card: 13 pts (1 pt / letter)                    |
| Your Subwords (3) & Locked Competitor Words                 |
| [Finish Turn Button]                                        |
+-------------------------------------------------------------+
```

1. **Widescreen & Desktop ($\ge 1024\text{px}$)**:
   - 12-column split dashboard layout (`max-w-7xl` container) eliminating empty margins.
   - Left side (Cols 1–7) holds the interactive play arena (Scoreboard, Base Word, Input, Feedback, Turn Controls).
   - Right side (Cols 8–12) holds the sticky HUD (Score breakdown, word ledger with height budgeting, competitor lockout, keyboard shortcuts).
2. **Tablet ($640\text{px} - 1023\text{px}$)**:
   - Fluid centered layout (`max-w-2xl` to `max-w-3xl`) with stacked action arena and full-width ledger.
3. **Mobile ($< 640\text{px}$, 375px–430px)**:
   - Touch-optimized vertical stack with minimum $44\text{px}$ tap targets, responsive tile dimensions ($40\times 48\text{px}$ to $44\times 52\text{px}$), and on-screen tactile backspace/clear actions.
4. **Layout Shift (CLS = 0) Stability**:
   - `html { scrollbar-gutter: stable; }` prevents horizontal width shifts when scrollbars appear.
   - `<main>` anchors with `justify-start` in active game view to stop vertical viewport jumping.
   - Tabular numerals (`tabular-nums font-mono`) prevent width jitter on scores and countdown timers.

---

## 3. Humanized AI Playback & Audio Synthesis Architecture

### 3.1 Pacing & Cognitive Simulation Model
To prevent player alienation caused by instant computer calculation, the AI's turn is simulated on the client with human-like cognitive delays and typing cadence:
- **Pre-Word Contemplation**: Jittered delay before beginning a word:
  $$t_{\text{think}} = 1100\text{ms} + \text{random}(0, 800)\text{ms} \quad (1.1\text{s} - 1.9\text{s})$$
- **Letter-by-Letter Keystroke Cadence**:
  $$t_{\text{type}} = 140\text{ms} + \text{random}(0, 60)\text{ms} \quad (140\text{ms} - 200\text{ms per character})$$
- **Word Discovery Pause**: Brief pause after successful submission:
  $$t_{\text{celebrate}} = 600\text{ms}$$

### 3.2 Dynamic Board Synchronization
During AI playback:
1. `isAiPlaying` flag activates the AI live console and switches the active turn badge to an amber pulsing indicator.
2. `activeInputWord = isAiPlaying ? aiTypingWord : currentWord` dynamically updates the letter tile frequency badges on the board in real-time as each letter is typed.
3. `aiLiveScore` calculates compounding points incrementally as each word is confirmed, reflecting in Player 2's header score card.
4. `aiRevealedWords` populates the word ledger one-by-one.

### 3.3 Audio Feedback Synthesis (Zero Asset Footprint)
Implemented using pure browser Web Audio API:
- `soundEffects.playTileClick()`: Sine oscillator burst at 600Hz decaying in 40ms.
- `soundEffects.playValidWord()`: Dual harmonious chimes at 523Hz (C5) and 659Hz (E5).

### 3.4 Fast-Forward & Skip Interrupt Control
A `skipAiRef` boolean latch listens to the "Skip to Results" button. When triggered, the animation loop breaks immediately, the final server game state is applied, and the player is transitioned directly to `ResultsView`.
