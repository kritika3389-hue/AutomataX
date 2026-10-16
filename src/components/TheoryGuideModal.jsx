import React from 'react';

export default function TheoryGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      id="theory-guide-modal"
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.id === 'theory-guide-modal') onClose();
      }}
    >
      <div className="modal-content">
        <div className="modal-header">
          <h3 className="modal-title">FLA Subject Reference & Theory Guide</h3>
          <button
            id="btn-close-theory-modal"
            className="btn-ghost"
            style={{ padding: '0.3rem 0.6rem' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <h3>1. Pushdown Automata (PDA)</h3>
          <p>
            A Pushdown Automaton is a 7-tuple: <code>M = (Q, Σ, Γ, δ, q₀, Z₀, F)</code>
          </p>
          <ul>
            <li><b>Q:</b> Finite set of states</li>
            <li><b>Σ:</b> Finite set of input symbols (input alphabet)</li>
            <li><b>Γ:</b> Finite set of stack symbols (stack alphabet)</li>
            <li><b>δ:</b> Transition function <code>Q × (Σ ∪ {'{ε}'}) × Γ → P(Q × Γ*)</code></li>
            <li><b>q₀ ∈ Q:</b> Start state</li>
            <li><b>Z₀ ∈ Γ:</b> Initial stack symbol</li>
            <li><b>F ⊆ Q:</b> Set of accepting / final states</li>
          </ul>

          <h3 style={{ marginTop: '1rem' }}>2. Instantaneous Description (ID)</h3>
          <p>
            The configuration of a PDA at any step is denoted by a triplet <code>(q, w, γ)</code>, where:
          </p>
          <ul>
            <li><b>q:</b> Current state</li>
            <li><b>w:</b> Remaining unread portion of the input string</li>
            <li><b>γ:</b> Complete contents of the pushdown stack (from top to bottom)</li>
          </ul>
          <p>A transition is denoted by the turnstile symbol <code>⊢</code>.</p>

          <h3 style={{ marginTop: '1rem' }}>3. Pumping Lemma for Context-Free Languages</h3>
          <p>
            If <i>L</i> is context-free, there exists <i>p ≥ 1</i> such that any string <i>s ∈ L</i> with <i>|s| ≥ p</i> can be written as <i>s = uvwxy</i> where:
          </p>
          <ul>
            <li><code>|vwx| ≤ p</code> (The window vwx spans at most p characters)</li>
            <li><code>|vx| ≥ 1</code> (At least one of v or x is non-empty)</li>
            <li><code>∀ i ≥ 0, uvⁱwxⁱy ∈ L</code> (Pumping v and x must stay inside L)</li>
          </ul>
          <p>
            To prove a language is <b>not context-free</b>, we show that <i>every</i> possible partition violating this condition leads to a contradiction for some <i>i</i> (usually <i>i = 2</i> or <i>i = 0</i>).
          </p>
        </div>
        <div className="modal-footer">
          <button id="btn-close-theory-footer" className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
