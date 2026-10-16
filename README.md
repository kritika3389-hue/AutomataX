# ⚡ AutomataX (FLA Studio)

<div align="center">

[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![JavaScript](https://img.shields.io/badge/ES6+-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![CSS3](https://img.shields.io/badge/Vanilla-CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://www.w3.org/Style/CSS/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**An interactive visual simulator for Formal Languages & Automata Theory (FLA).**  
Featuring full execution tracing for **Pushdown Automata (PDA)** and an interactive **Context-Free Language (CFL) Pumping Lemma adversary lab**.

[Features](#-key-features) • [Quick Start](#-quick-start) • [PDA Simulator](#-pushdown-automata-pda-simulator) • [Pumping Lemma Lab](#-cfl-pumping-lemma-lab) • [Keyboard Shortcuts](#-keyboard-shortcuts) • [Architecture](#-project-architecture)

</div>

---

## 📖 Overview

**AutomataX** (FLA Studio) is built for computer science students, educators, and researchers studying Formal Languages, Automata Theory, and Computability. It bridges the gap between abstract textbook mathematics and visual intuition by offering real-time step-by-step simulations, animated stack visualizations, instantaneous description (ID) generators, and exhaustive adversary partition refutations.

---

## ✨ Key Features

### ⚙ 1. Pushdown Automata (PDA) Simulator & Tracer
* **Dynamic SVG State Transition Graph**: Auto-positions states, renders curved/straight transitions, loops, and highlights active states and active transition edges with glow animations.
* **Animated Glassmorphic Stack Tube**: Visualizes the pushdown stack in real-time ($Z_0$, symbols, and top pointer) as input is consumed.
* **Input Tape with Moving Head**: Displays remaining symbols and an active pointer scanning each character.
* **Instantaneous Description (ID) Generator**: Formats configurations as $(q, w, \gamma)$ in both standard textbook notation ($\vdash$) and copyable **$\LaTeX$** format.
* **Interactive Trace Table**: Chronological table of steps showing current state, remaining input, stack contents, and transition rule. Click any row to jump directly to that step!
* **Edge-Case Test Suite & Batch Runner**: Built-in test vectors for every language (valid & invalid strings) with one-click batch verification and celebration confetti.
* **Custom PDA Machine Builder**: Create, edit, and test your own PDA machines with custom states, alphabet, stack alphabet, acceptance modes (Final State or Empty Stack), and transition tables.

### ⚡ 2. Context-Free Language (CFL) Pumping Lemma Lab
* **Interactive String Partition Ribbon**: Draggable sliders to inspect and adjust the partition $s = uvwxy$.
* **Live Constraint Validation**: Automatically checks the two core Pumping Lemma conditions:
  $$\text{Condition 1: } |vwx| \le p$$
  $$\text{Condition 2: } |vx| \ge 1$$
* **Real-Time Pumping Multipliers**: Test pump factors $i \in \{0, 1, 2, 3, 4, 5\}$ and visualize $s_i = uv^i wx^i y$ with color-coded segment tags.
* **Symbol Count Balancer**: Live bar meters comparing symbol frequencies (e.g., $N_0$, $N_1$, $N_2$) to clearly demonstrate why pumping breaks equality.
* **The Adversary Game**: Exhaustively tests **all possible valid partitions** of the string and mathematically proves that every partition leads to an unavoidable contradiction!
* **5-Step Rigorous Formal Proof**: Formatted mathematical proof with KaTeX rendering, exportable to **Markdown** or complete **$\LaTeX$ document** format (`.tex`).
* **Custom CFL Question Creator**: Define your own target non-CFL languages and explore their pumping behavior.

### 📖 3. Reference & Theory Guide
* Quick reference for formal 7-tuples $M = (Q, \Sigma, \Gamma, \delta, q_0, Z_0, F)$.
* Turnstile derivation semantics $(\vdash, \vdash^*)$.
* Textbook Pumping Lemma definition and proof structure.

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18.0 or higher)
* `npm` (bundled with Node.js)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/kritika3389-hue/AutomataX.git

# 2. Navigate to the project directory
cd AutomataX

# 3. Install dependencies
npm install

# 4. Start the local development server
npm run dev
```

Visit **`http://localhost:5173/`** in your browser.

### Building for Production

```bash
# Compile and bundle the application into dist/
npm run build

# Preview the production build locally
npm run preview
```

---

## 🎯 Supported Languages & Presets

### Pushdown Automata (PDA) Presets

| Language | Model | Alphabet ($\Sigma$) | Stack ($\Gamma$) | Acceptance |
| :--- | :--- | :--- | :--- | :--- |
| $L = \{0^n 1^{2n} \mid n \ge 1\}$ | Double-Push Model (2 $X$ per 0) | $\{0, 1\}$ | $\{Z_0, X\}$ | Final State ($q_2$) |
| $L = \{0^n 1^{2n} \mid n \ge 1\}$ | Alternating States Model (1 $X$ popped per 2 ones) | $\{0, 1\}$ | $\{Z_0, X\}$ | Final State ($q_3$) |
| $L = \{0^n 1^n \mid n \ge 1\}$ | Standard Equal Counts | $\{0, 1\}$ | $\{Z_0, X\}$ | Final State ($q_2$) |
| $L = \{0^n 1^{3n} \mid n \ge 1\}$ | Triple-Push Model (3 $X$ per 0) | $\{0, 1\}$ | $\{Z_0, X\}$ | Final State ($q_2$) |
| $L = \{w c w^R \mid w \in \{0, 1\}^*\}$ | Palindrome with Center Marker | $\{0, 1, c\}$ | $\{Z_0, 0, 1\}$ | Final State ($q_2$) |
| Balanced Parentheses | Dyck Language ($()$) | $\{(, )\}$ | $\{Z_0, (\}$ | Final State ($q_1$) |
| *Custom Machines* | User-defined transitions & states | Custom | Custom | State / Empty Stack |

### CFL Pumping Lemma Proof Presets

| Target Non-CFL Language | Selected String ($s$) | Pumping Length ($p$) | Contradiction Mechanism |
| :--- | :--- | :--- | :--- |
| $L = \{0^n 1^n 2^n \mid n \ge 1\}$ | $0^p 1^p 2^p$ | $p = 3$ | Window $|vwx| \le p$ cannot cover 0s, 1s, and 2s simultaneously |
| $L = \{a^n b^n c^n \mid n \ge 1\}$ | $a^p b^p c^p$ | $p = 3$ | Pumping $i \ne 1$ breaks $N_a = N_b = N_c$ |
| $L = \{a^n b^{2n} c^n \mid n \ge 1\}$ | $a^p b^{2p} c^p$ | $p = 3$ | Unbalanced ratio $N_b \ne 2N_a$ or $N_b \ne 2N_c$ |
| $L = \{w w \mid w \in \{0, 1\}^*\}$ | $0^p 1^p 0^p 1^p$ | $p = 4$ | Pumping across center boundary disrupts word duplication |
| *Custom Questions* | User-specified string & rule | Custom | Exhaustive partition refutation |

---

## ⌨ Keyboard Shortcuts

| Shortcut | Action | Description |
| :---: | :---: | :--- |
| <kbd>Space</kbd> | **Play / Pause** | Toggles automatic step-by-step execution |
| <kbd>→</kbd> | **Step Forward** | Advances the machine by one transition |
| <kbd>←</kbd> | **Step Backward** | Rewinds the machine by one step |
| <kbd>R</kbd> | **Reset** | Resets the simulation to step #0 |
| <kbd>Enter</kbd> | **Trace String** | When typing in the tape input, immediately runs simulation |

---

## 🏗 Project Architecture

```
AutomataX/
├── index.html                   # HTML entry point with KaTeX & font preloads
├── vite.config.js               # Vite configuration with React plugin
├── package.json                 # Project dependencies & scripts
├── public/                      # Static assets & icons
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── main.jsx                 # React DOM mount point
    ├── App.jsx                  # Main application coordinator (tabs, modals, toasts)
    ├── style.css                # Pure Vanilla CSS design system (glassmorphism & dark theme)
    ├── components/
    │   ├── Header.jsx           # Top navigation bar & tab switcher
    │   ├── PdaSimulator.jsx     # Full PDA workspace (tape, graph, stack, trace, test suite)
    │   ├── PumpingSimulator.jsx # CFL Pumping Lemma adversary lab (ribbon, bars, adversary)
    │   ├── TheoryGuideModal.jsx # Formal theory cheat sheet modal
    │   ├── FormalProofModal.jsx # KaTeX-rendered mathematical proof modal with LaTeX export
    │   ├── CustomPdaModal.jsx   # Custom PDA machine editor & rule builder
    │   └── CustomPumpingModal.jsx# Custom non-CFL question creator
    ├── pda/
    │   ├── pda-engine.js        # Pure JS deterministic/non-deterministic execution engine
    │   ├── pda-presets.js       # Predefined PDA problem definitions & test suites
    │   └── pda-visualizer.js    # Canvas/SVG layout math, node curves, and stack tube renderers
    └── pumping/
        ├── pumping-engine.js    # Mathematical partitioning algorithms & adversary solver
        ├── pumping-presets.js   # Pumping Lemma problems, proofs, and LaTeX templates
        └── pumping-visualizer.js# Ribbon partitions, frequency bars, and condition visualizers
```

---

## 🛠 Tech Stack

* **Framework**: [React 19](https://react.dev/)
* **Build Tool**: [Vite 6](https://vitejs.dev/)
* **Styling**: Vanilla CSS (Custom design tokens, CSS Grid/Flexbox, Dark Glassmorphism)
* **Math Typesetting**: [$\KaTeX$](https://katex.org/)
* **Visual Effects**: [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti)
* **Typography**: Google Fonts (*Outfit*, *Inter*, *JetBrains Mono*)

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add new PDA problems, improve visualization algorithms, or introduce new formal language simulators:

1. Fork the Project (`https://github.com/kritika3389-hue/AutomataX/fork`)
2. Create your Feature Branch (`git checkout -b feature/NewAutomaton`)
3. Commit your Changes (`git commit -m 'Add new automaton preset'`)
4. Push to the Branch (`git push origin feature/NewAutomaton`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<div align="center">
  <sub>Developed with ❤️ for Formal Languages & Automata Theory students and researchers.</sub>
</div>
