import React from 'react';
import Icon from './Icon.jsx';

export default function Header({
  activeTab,
  setActiveTab,
  onOpenTheory,
  onOpenProof
}) {
  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="brand-section">
          <div className="brand-logo-badge">δ</div>
          <div className="brand-title">
            <h1>FLA Studio</h1>
            <p>Automata Theory Simulator</p>
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
            <Icon name="cpu" size={15} />
            <span>PDA Simulator</span>
          </button>
          <button
            id="tab-btn-pumping"
            className={`tab-btn ${activeTab === 'pumping' ? 'active' : ''}`}
            role="tab"
            aria-selected={activeTab === 'pumping'}
            onClick={() => setActiveTab('pumping')}
          >
            <Icon name="scissors" size={15} />
            <span>CFL Pumping Lemma</span>
          </button>
        </nav>

        <div className="header-actions">
          <button id="btn-theory-guide" className="btn btn-ghost" onClick={onOpenTheory}>
            <Icon name="book" size={15} />
            <span>Theory</span>
          </button>
          <button id="btn-open-proof-modal" className="btn btn-ghost" onClick={onOpenProof}>
            <Icon name="fileText" size={15} />
            <span>Formal Proof</span>
          </button>
        </div>
      </div>
    </header>
  );
}
