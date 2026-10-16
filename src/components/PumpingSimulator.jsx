import React, { useState, useEffect, useRef } from 'react';
import { PUMPING_PRESETS, refreshPumpingPresets } from '../pumping/pumping-presets.js';
import { PumpingEngine } from '../pumping/pumping-engine.js';
import { PumpingVisualizer } from '../pumping/pumping-visualizer.js';
import Icon from './Icon.jsx';
import './PumpingSimulator.css';

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
      pumpISlider: null,
      pumpIValue: null
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

  const iOptions = [
    { i: 0, label: 'i = 0', hint: 'pump down' },
    { i: 1, label: 'i = 1', hint: 'original' },
    { i: 2, label: 'i = 2', hint: 'pump up' },
    { i: 3, label: 'i = 3', hint: 'pump up' }
  ];

  return (
    <section id="tab-pumping" className="tab-content active" role="tabpanel">
      {/* Page Heading */}
      <div className="page-head">
        <div className="page-head-info">
          <span className="eyebrow eyebrow-violet">
            <Icon name="scissors" size={13} /> CFL Pumping Lemma
          </span>
          <h2 className="page-title">Prove {currentPreset.name} is not context-free</h2>
          {currentPreset.description && <p className="page-desc">{currentPreset.description}</p>}
        </div>

        <div className="page-head-controls">
          <label className="select-label" htmlFor="pumping-preset-select">Language</label>
          <select
            id="pumping-preset-select"
            className="styled-select"
            aria-label="Target Non-CFL Language"
            value={selectedPresetId}
            onChange={handlePresetSelect}
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.isCustom ? '★ ' : ''}{p.name}
              </option>
            ))}
          </select>
          <button
            id="btn-open-custom-pumping-modal"
            className="btn btn-primary"
            onClick={onOpenCustomModal}
          >
            <Icon name="plus" size={15} /> Custom Language
          </button>
        </div>
      </div>

      <div className="pumping-grid">
        {/* Left Column */}
        <div className="pumping-main-column">
          {/* Step 1 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="step-badge">1</span>
                <span>Choose string &amp; partition s = uvwxy</span>
              </div>
              <div className="segmented" role="group" aria-label="Pumping length">
                <span className="segmented-label">p</span>
                {[2, 3, 4].map(pVal => (
                  <button
                    key={pVal}
                    className={`segmented-btn p-btn ${currentP === pVal ? 'active' : ''}`}
                    onClick={() => handleSetP(pVal)}
                  >
                    {pVal}
                  </button>
                ))}
              </div>
            </div>

            <div className="input-row">
              <div className="input-with-prefix">
                <span className="input-prefix">s =</span>
                <input
                  type="text"
                  id="pumping-custom-string-input"
                  className="mono-input"
                  placeholder="e.g. 000111222"
                  value={customStringInput}
                  onChange={(e) => setCustomStringInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCustomString()}
                  spellCheck="false"
                />
              </div>
              <button
                id="btn-apply-custom-pumping-str"
                className="btn btn-primary"
                onClick={handleApplyCustomString}
              >
                Apply
              </button>
            </div>

            {/* Partition Ribbon + Sliders */}
            <div className="ribbon-wrapper">
              <div id="pumping-ribbon-container" ref={ribbonRef} />
            </div>

            {/* Lengths & Conditions */}
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

          {/* Step 2 */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <span className="step-badge">2</span>
                <span>Pump the string sᵢ = uvⁱwxⁱy</span>
              </div>
            </div>

            <div className="pump-controls">
              <div className="segmented segmented-wide" role="group" aria-label="Pumping multiplier">
                {iOptions.map(item => (
                  <button
                    key={item.i}
                    className={`segmented-btn i-btn ${currentI === item.i ? 'active' : ''}`}
                    onClick={() => handleSetI(item.i)}
                  >
                    <span className="seg-main">{item.label}</span>
                    <span className="seg-sub">{item.hint}</span>
                  </button>
                ))}
              </div>

              <div className="slider-group-i">
                <label htmlFor="pump-i-slider">Multiplier</label>
                <input
                  type="range"
                  id="pump-i-slider"
                  ref={sliderIRef}
                  min="0"
                  max="5"
                  value={currentI}
                  onChange={handleSliderIChange}
                />
                <span className="slider-i-val" id="pump-i-value" ref={valIRef}>
                  i = {currentI}
                </span>
              </div>
            </div>

            <div className="pumped-string-viewer">
              <div className="pumped-string-title">Resulting string sᵢ</div>
              <div className="pumped-string-tokens" id="pumped-string-tokens" ref={pumpedStringRef} />
            </div>

            <div id="pumping-result-banner" className="result-banner result-contradiction" ref={resultBannerRef} />

            <div id="pumping-case-analysis" ref={caseAnalysisRef} />
          </div>
        </div>

        {/* Right Column */}
        <div className="pumping-side-column">
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="barChart" size={16} className="card-icon" />
                <span>Symbol Balance</span>
              </div>
            </div>
            <p className="card-hint">
              Compare symbol counts in sᵢ. Pumping breaks the balance the language requires.
            </p>
            <div className="balance-bars-track" id="pumping-balance-bars" ref={balanceBarsRef} />
          </div>

          <div className="card adversary-game-card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="swords" size={16} className="card-icon icon-violet" />
                <span>Adversary Game</span>
              </div>
            </div>

            <ol className="adversary-steps">
              <li className="adversary-step">
                <span className="step-num">1</span>
                <span>Adversary claims L is context-free with pumping length <b>p = {currentP}</b>.</span>
              </li>
              <li className="adversary-step">
                <span className="step-num">2</span>
                <span>You pick <code>s = {customStringInput || '000111222'}</code> ∈ L with |s| ≥ p.</span>
              </li>
              <li className="adversary-step">
                <span className="step-num">3</span>
                <span>Adversary splits s = uvwxy with |vwx| ≤ p and |vx| ≥ 1.</span>
              </li>
              <li className="adversary-step">
                <span className="step-num">4</span>
                <span>You choose <b>i</b> (usually 0 or 2) so that sᵢ ∉ L.</span>
              </li>
            </ol>

            <button
              id="btn-adversary-challenge"
              className="btn btn-violet btn-block"
              onClick={handleAdversaryChallenge}
            >
              <Icon name="swords" size={15} /> Test all adversary partitions
            </button>

            {adversaryResult && (
              <div id="adversary-summary-box" className="adversary-summary">
                <div className="adversary-summary-head">
                  <Icon name="check" size={16} />
                  <span>All partitions refuted</span>
                </div>
                <div className="adversary-stats">
                  <div>
                    <span className="stat-value">{adversaryResult.totalPartitions}</span>
                    <span className="stat-label">partitions tested</span>
                  </div>
                  <div>
                    <span className="stat-value stat-success">
                      {adversaryResult.successRate.toFixed(0)}%
                    </span>
                    <span className="stat-label">
                      {adversaryResult.contradictedCount} contradictions
                    </span>
                  </div>
                </div>
                <p className="adversary-note">
                  Whatever split the adversary picks for <code>{engineRef.current?.s}</code>, some i
                  pumps the string out of L.
                </p>
              </div>
            )}
          </div>

          <div className="card proof-cta">
            <div className="proof-cta-icon">
              <Icon name="fileText" size={20} />
            </div>
            <div className="proof-cta-body">
              <h4>Formal proof</h4>
              <p>Textbook-style proof with Markdown &amp; LaTeX export.</p>
            </div>
            <button
              id="btn-open-full-proof"
              className="btn btn-secondary"
              onClick={onOpenProofModal}
            >
              Open
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
