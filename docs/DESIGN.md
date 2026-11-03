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

### 1.2 Compounding Multiplier Scoring Engine

The scoring system dynamically rewards both finding longer words and accumulating higher word counts:
$$\text{Score}(P) = \left( \sum_{i=1}^{N} \text{Length}(W_i) \right) \times N$$

```
Example Progression:
- Word 1 (Length 5): Sum = 5,  Count = 1  => Score = 5 * 1 = 5
- Word 2 (Length 3): Sum = 8,  Count = 2  => Score = 8 * 2 = 16
- Word 3 (Length 4): Sum = 12, Count = 3  => Score = 12 * 3 = 36
- Word 4 (Length 6): Sum = 18, Count = 4  => Score = 18 * 4 = 72
```
Each valid subword proportionally increases the value of every existing word found in that session.

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

### 2.3 Responsive Layout Grids

```
+--------------------------------------------------------------+
| [W] SUBWORDS v2.0                                    [Rules] |
+--------------------------------------------------------------+
| [ Player 1: 36 pts ]                  [ Player 2: 16 pts ]   |
+--------------------------------------------------------------+
| ROOT BASE WORD (6+ Letters)                (Time Left: 01:24)|
|   [ P ]  [ L ]  [ A ]  [ N ]  [ E ]  [ T ]  [ S ]             |
+--------------------------------------------------------------+
| [                     P L A N E                     ] [Sub]  |
+--------------------------------------------------------------+
| MULTIPLIER: SUM (12) x COUNT (3) = 36 pts                    |
+--------------------------------------------------------------+
| Your Subwords (3):               | Claimed by Opponent (1):  |
|  [✓ PLANES +18] [✓ NET +9]...    |  [🔒 PLANT]               |
+--------------------------------------------------------------+
```

1. **Desktop (1024px – 1440px+)**: Centered container, horizontal scoreboard comparison, full tile row, multi-column word ledger.
2. **Tablet (768px – 1023px)**: Adaptive wrapping tile grid, vertical ledger stack.
3. **Mobile (< 768px)**: Large touch-friendly tiles ($44 \times 52\text{px}$ minimum), on-screen backspace/submit actions, vertical scrollable ledger.
