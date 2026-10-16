import React from 'react';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenTheory,
  onOpenProof
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-badge">δ</div>
        <div className="brand-title">
          <h1>FLA Studio</h1>
          <p>Formal Languages & Automata Theory Simulator</p>
        </div>
      </div>

      {/* Module Switcher Tabs */}
      <nav className="header-tabs" role="tablist">
        <button
          id="tab-btn-pda"
          className={`tab-btn ${activeTab === 'pda' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'pda'}
          onClick={() => setActiveTab('pda')}
        >
          <span className="tab-icon">⚙</span>
          <span>PDA Simulator & Tracer</span>
          <span className="tab-badge">0ⁿ 1²ⁿ</span>
        </button>
        <button
          id="tab-btn-pumping"
          className={`tab-btn ${activeTab === 'pumping' ? 'active' : ''}`}
          role="tab"
          aria-selected={activeTab === 'pumping'}
          onClick={() => setActiveTab('pumping')}
        >
          <span className="tab-icon">⚡</span>
          <span>CFL Pumping Lemma</span>
          <span className="tab-badge">0ⁿ 1ⁿ 2ⁿ</span>
        </button>
      </nav>

      <div className="header-actions">
        <button id="btn-theory-guide" className="btn-ghost" onClick={onOpenTheory}>
          <span>📖</span> Theory Guide
        </button>
        <button id="btn-open-proof-modal" className="btn-ghost" onClick={onOpenProof}>
          <span>📝</span> Formal Proof
        </button>
      </div>
    </header>
  );
}
