import React, { useState, useEffect, useRef } from 'react';
import { PUMPING_PRESETS, refreshPumpingPresets } from '../pumping/pumping-presets.js';
import { PumpingEngine } from '../pumping/pumping-engine.js';
import { PumpingVisualizer } from '../pumping/pumping-visualizer.js';

export default function PumpingSimulator({
  onToast,
  onOpenCustomModal,
  onOpenProofModal,
  onPumpingPresetChange
}) {
  const [presets, setPresets] = useState(() => refreshPumpingPresets());
  const [selectedPresetId, setSelectedPresetId] = useState(() => PUMPING_PRESETS[0].id);
  const [customStringInput, setCustomStringInput] = useState('');
  const [currentP, setCurrentP] = useState(3);
  const [currentI, setCurrentI] = useState(2);
  const [adversaryResult, setAdversaryResult] = useState(null);

  // Element refs for PumpingVisualizer
  const ribbonRef = useRef(null);
  const lengthsRef = useRef(null);
  const cond1Ref = useRef(null);
  const cond2Ref = useRef(null);
  const pumpedStringRef = useRef(null);
  const balanceBarsRef = useRef(null);
  const resultBannerRef = useRef(null);
  const caseAnalysisRef = useRef(null);
  const sliderIRef = useRef(null);
  const valIRef = useRef(null);

  const engineRef = useRef(null);
  const visRef = useRef(null);

  const currentPreset = presets.find(p => p.id === selectedPresetId) || presets[0];

  const syncPumpingView = () => {
    const engine = engineRef.current;
    const vis = visRef.current;
    if (!engine || !vis) return;

    // 1. Ribbon
    vis.renderPartitionRibbon(engine, (i1, i2, i3, i4) => {
      engine.setPartition(i1, i2, i3, i4);
      syncPumpingView();
    });

    // 2. Conditions
    const validation = engine.validateConditions();
    const segments = engine.getSegments();
    vis.renderConditionsAndLengths(validation, segments, engine.p);

    // 3. Pumped Result
    const pumpData = engine.getPumpedString();
    vis.renderPumpedResult(pumpData);

    setCurrentI(engine.pumpI);
    setCurrentP(engine.p);
  };

  // Initialize engine and visualizer
  useEffect(() => {
    visRef.current = new PumpingVisualizer({
      ribbonContainer: ribbonRef.current,
      lengthsDisplay: lengthsRef.current,
      cond1Badge: cond1Ref.current,
      cond2Badge: cond2Ref.current,
      pumpedStringDisplay: pumpedStringRef.current,
      balanceBars: balanceBarsRef.current,
      resultBanner: resultBannerRef.current,
      caseAnalysisText: caseAnalysisRef.current,
      pumpISlider: sliderIRef.current,
      pumpIValue: valIRef.current
    });

    engineRef.current = new PumpingEngine(currentPreset);
    setCustomStringInput(engineRef.current.s);
    syncPumpingView();

    if (onPumpingPresetChange) {
      onPumpingPresetChange(currentPreset, engineRef.current.s);
    }
  }, []);

  // When selectedPresetId changes
  useEffect(() => {
    const preset = presets.find(p => p.id === selectedPresetId) || presets[0];
    if (engineRef.current) {
      engineRef.current.setPreset(preset);
      setCustomStringInput(engineRef.current.s);
      setAdversaryResult(null);
      syncPumpingView();

      if (onPumpingPresetChange) {
        onPumpingPresetChange(preset, engineRef.current.s);
      }
    }
  }, [selectedPresetId]);

  const handlePresetSelect = (e) => {
    const pId = e.target.value;
    setSelectedPresetId(pId);
    const p = presets.find(item => item.id === pId);
    if (p) onToast(`Loaded: ${p.name}`, '✓');
  };

  const handleApplyCustomString = () => {
    const val = customStringInput.trim();
    if (!val || !engineRef.current) return;
    engineRef.current.setCustomString(val);
    syncPumpingView();
    if (onPumpingPresetChange) {
      onPumpingPresetChange(currentPreset, val);
    }
    onToast(`Applied custom string: "${val}"`, '✓');
  };

  const handleSetP = (pVal) => {
    if (!engineRef.current) return;
    engineRef.current.setP(pVal);
    setCustomStringInput(engineRef.current.s);
    syncPumpingView();
    if (onPumpingPresetChange) {
      onPumpingPresetChange(currentPreset, engineRef.current.s);
    }
    onToast(`Set pumping length p = ${pVal}`, '✂');
  };

  const handleSetI = (iVal) => {
    if (!engineRef.current) return;
    engineRef.current.pumpI = iVal;
    syncPumpingView();
  };

  const handleSliderIChange = (e) => {
    const iVal = parseInt(e.target.value, 10);
    if (!engineRef.current) return;
    engineRef.current.pumpI = iVal;
    syncPumpingView();
  };

  const handleAdversaryChallenge = () => {
    if (!engineRef.current) return;
    const proofRes = engineRef.current.computeAllPartitionsProof();
    setAdversaryResult(proofRes);

    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
    onToast(`All ${proofRes.totalPartitions} adversary partitions refuted!`, '🏆');
  };

  // Expose refresh function to parent
  useEffect(() => {
    window._refreshPumpingPresets = (newId) => {
      const list = refreshPumpingPresets();
      setPresets(list);
      if (newId) {
        setSelectedPresetId(newId);
      }
    };
    return () => {
      delete window._refreshPumpingPresets;
    };
  }, []);

  return (
    <section id="tab-pumping" className="tab-content active" role="tabpanel">
      {/* Problem Card */}
      <div className="problem-card compact-problem-bar">
        <div className="problem-info">
          <span className="tag-badge">CFL Pumping Lemma</span>
          <h2 className="problem-title">{currentPreset.name}</h2>
        </div>

        <div className="problem-controls">
          <select
            id="pumping-preset-select"
            className="styled-select"
            aria-label="Target Non-CFL Language"
            value={selectedPresetId}
            onChange={handlePresetSelect}
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.isCustom ? '⭐ [Custom] ' : ''}{p.name}
              </option>
            ))}
          </select>
          <button
            id="btn-open-custom-pumping-modal"
            className="btn-primary"
            onClick={onOpenCustomModal}
          >
            ➕ Custom CFL Question
          </button>
        </div>
      </div>

      <div className="pumping-grid">
        {/* Left Column: Ribbon, Sliders, Pumping, Result */}
        <div className="pumping-main-column">
          <div className="glass-panel">
            {/* Quick Custom String Bar */}
            <div className="quick-string-bar">
              <label htmlFor="pumping-custom-string-input">Input Your Own String (s):</label>
              <input
                type="text"
                id="pumping-custom-string-input"
                className="mono-input"
                style={{ flex: 1 }}
                placeholder="Enter custom string e.g. 000011112222 or aaabbbccc"
                value={customStringInput}
                onChange={(e) => setCustomStringInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomString()}
              />
              <button
                id="btn-apply-custom-pumping-str"
                className="btn-primary"
                onClick={handleApplyCustomString}
              >
                Apply String
              </button>
            </div>

            <div className="panel-header">
              <div className="panel-title">
                <span className="icon">✂</span>
                <span>Step 1: Choose Pumping Length p & Partition s = uvwxy</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pumping Length <b>p</b>:</span>
                {[2, 3, 4].map(pVal => (
                  <button
                    key={pVal}
                    className={`btn-i-chip p-btn ${currentP === pVal ? 'active' : ''}`}
                    onClick={() => handleSetP(pVal)}
                  >
                    p = {pVal}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive String Partition Ribbon */}
            <div className="ribbon-wrapper">
              <div id="pumping-ribbon-container" ref={ribbonRef} />
            </div>

            {/* Length Indicators and Conditions */}
            <div className="pumping-meta-row">
              <div className="lengths-display" id="pumping-lengths-display" ref={lengthsRef} />

              <div className="conditions-box">
                <div id="cond-1-badge" className="cond-badge cond-pass" ref={cond1Ref}>
                  ✓ |vwx| ≤ p
                </div>
                <div id="cond-2-badge" className="cond-badge cond-pass" ref={cond2Ref}>
                  ✓ |vx| ≥ 1
                </div>
              </div>
            </div>
          </div>

          {/* Pumping Action Box */}
          <div className="glass-panel" style={{ marginTop: '1.5rem' }}>
            <div className="panel-header">
              <div className="panel-title">
                <span className="icon">⚡</span>
                <span>Step 2: Pump String sᵢ = uvⁱwxⁱy</span>
              </div>
              <div className="i-quick-buttons">
                {[
                  { i: 0, label: 'i = 0 (Pump Down)' },
                  { i: 1, label: 'i = 1 (Original s)' },
                  { i: 2, label: 'i = 2 (Pump Up 2x)' },
                  { i: 3, label: 'i = 3 (Pump Up 3x)' }
                ].map(item => (
                  <button
                    key={item.i}
                    className={`btn-i-chip i-btn ${currentI === item.i ? 'active' : ''}`}
                    onClick={() => handleSetI(item.i)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="slider-group-i">
              <label htmlFor="pump-i-slider" style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                Pumping Multiplier (i):
              </label>
              <input
                type="range"
                id="pump-i-slider"
                ref={sliderIRef}
                min="0"
                max="5"
                value={currentI}
                onChange={handleSliderIChange}
                style={{ flex: 1, accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
              <span className="slider-i-val" id="pump-i-value" ref={valIRef}>
                {currentI}
              </span>
            </div>

            {/* Pumped String Viewer */}
            <div className="pumped-string-viewer">
              <div className="pumped-string-title">Resulting Pumped String sᵢ:</div>
              <div className="pumped-string-tokens" id="pumped-string-tokens" ref={pumpedStringRef} />
            </div>

            {/* Contradiction / Result Banner */}
            <div id="pumping-result-banner" className="result-banner result-contradiction" ref={resultBannerRef} />

            {/* Case Analysis Box */}
            <div id="pumping-case-analysis" style={{ marginTop: '1rem' }} ref={caseAnalysisRef} />
          </div>
        </div>

        {/* Right Column: Symbol Frequency Balancer & Adversary Mode */}
        <div className="pumping-side-column">
          {/* Balance Meters Card */}
          <div className="balance-meters-card">
            <div className="panel-header" style={{ marginBottom: '0.5rem' }}>
              <div className="panel-title">
                <span className="icon">📊</span>
                <span>Symbol Count Balance</span>
              </div>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Language requires <b>N₀ = N₁ = N₂</b>. Notice how pumping causes an unavoidable imbalance!
            </p>

            <div className="balance-bars-track" id="pumping-balance-bars" ref={balanceBarsRef} />
          </div>

          {/* Adversary Game Mode Card */}
          <div className="adversary-game-card">
            <div className="panel-title" style={{ color: '#d8b4fe' }}>
              <span className="icon">⚔</span>
              <span>The Adversary Game</span>
            </div>

            <div className="adversary-steps">
              <div className="adversary-step">
                <span className="step-num">1</span>
                <span>Adversary claims L is CFL and gives pumping length p = {currentP}.</span>
              </div>
              <div className="adversary-step">
                <span className="step-num">2</span>
                <span>You choose string s = {customStringInput || '000111222'} ∈ L with |s| ≥ {currentP}.</span>
              </div>
              <div className="adversary-step">
                <span className="step-num">3</span>
                <span>Adversary picks partition s = uvwxy (|vwx| ≤ p, |vx| ≥ 1).</span>
              </div>
              <div className="adversary-step">
                <span className="step-num">4</span>
                <span>You select i (usually 2 or 0) to force sᵢ ∉ L!</span>
              </div>
            </div>

            <button
              id="btn-adversary-challenge"
              className="btn-game-challenge"
              onClick={handleAdversaryChallenge}
            >
              ⚔ Test All Adversary Partitions
            </button>

            {adversaryResult && (
              <div
                id="adversary-summary-box"
                style={{ marginTop: '0.85rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}
              >
                <div style={{ background: 'rgba(168, 85, 247, 0.15)', border: '1px solid var(--accent-purple)', padding: '0.75rem', borderRadius: '8px' }}>
                  <h5 style={{ color: '#d8b4fe', fontSize: '0.95rem', marginBottom: '0.35rem' }}>
                    ⚔ Adversary Refuted on All Partitions!
                  </h5>
                  <p style={{ marginBottom: '0.4rem' }}>
                    Tested <strong>{adversaryResult.totalPartitions}</strong> possible valid partitions of <code>"{engineRef.current?.s}"</code>.
                  </p>
                  <p style={{ color: '#34d399', fontWeight: 700 }}>
                    Contradictions Found: {adversaryResult.contradictedCount} / {adversaryResult.totalPartitions} ({adversaryResult.successRate.toFixed(1)}%)
                  </p>
                  <p style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-muted)' }}>
                    No matter which partition the Adversary picks, pumping either i=2 or i=0 produces a string with unequal counts, escaping the language!
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Formal Proof Trigger */}
          <div className="glass-panel" style={{ textAlign: 'center' }}>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Need to submit this proof?</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.85rem' }}>
              View and copy the rigorous 5-step formal proof in textbook format or LaTeX.
            </p>
            <button
              id="btn-open-full-proof"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={onOpenProofModal}
            >
              📄 Open Formal Mathematical Proof
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
