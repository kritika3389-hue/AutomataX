import React, { useState, useEffect, useRef } from 'react';
import { PDA_PRESETS, refreshPDAPresets } from '../pda/pda-presets.js';
import { PDAEngine } from '../pda/pda-engine.js';
import { PDAVisualizer } from '../pda/pda-visualizer.js';
import Icon from './Icon.jsx';

export default function PdaSimulator({ onToast, onOpenCustomModal }) {
  const [presets, setPresets] = useState(() => refreshPDAPresets());
  const [selectedPresetId, setSelectedPresetId] = useState(() => PDA_PRESETS[0].id);
  const [inputString, setInputString] = useState(() => PDA_PRESETS[0].defaultInput || '001111');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(600);
  const [testCases, setTestCases] = useState(() => PDA_PRESETS[0].testCases || []);

  // Element Refs for PDAVisualizer
  const svgRef = useRef(null);
  const stackTubeRef = useRef(null);
  const stackCountRef = useRef(null);
  const tapeCellsRef = useRef(null);
  const traceTbodyRef = useRef(null);
  const currentIdRef = useRef(null);

  const engineRef = useRef(null);
  const visRef = useRef(null);
  const playTimerRef = useRef(null);

  // Current active preset
  const currentPreset = presets.find(p => p.id === selectedPresetId) || presets[0];

  // Stop auto play
  const stopAutoPlay = () => {
    if (playTimerRef.current) {
      clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    setIsPlaying(false);
  };

  // Sync visualizer with engine
  const syncPDAView = () => {
    const engine = engineRef.current;
    const vis = visRef.current;
    if (!engine || !vis) return;

    const config = engine.getCurrentConfig();
    const trace = engine.precomputedTrace;
    const curIdx = engine.currentTraceIndex;
    const activeNode = trace[curIdx];

    vis.renderDiagram(currentPreset, config.state, activeNode?.transition);
    vis.renderStack(config.stack);
    vis.renderTape(engine.originalInput, config.headIndex);
    vis.updateCurrentID(config, engine.originalInput);
    vis.renderTraceTable(trace, curIdx, (stepIdx) => {
      stopAutoPlay();
      engine.jumpToStep(stepIdx);
      syncPDAView();
    });

    if (config.status === 'accepted' && curIdx === trace.length - 1 && window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  };

  // Start autoplay
  const startAutoPlay = () => {
    if (playTimerRef.current) return;
    setIsPlaying(true);

    playTimerRef.current = setInterval(() => {
      const advanced = engineRef.current.stepForward();
      syncPDAView();
      if (!advanced) {
        stopAutoPlay();
      }
    }, playSpeed);
  };

  // Initialize visualizer and engine on mount and preset changes
  useEffect(() => {
    visRef.current = new PDAVisualizer({
      diagramSvg: svgRef.current,
      stackTube: stackTubeRef.current,
      stackCount: stackCountRef.current,
      tapeCells: tapeCellsRef.current,
      traceTbody: traceTbodyRef.current,
      currentIdText: currentIdRef.current
    });

    engineRef.current = new PDAEngine(currentPreset);
    visRef.current.originalInput = inputString;
    engineRef.current.reset(inputString);
    syncPDAView();

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, []);

  // When selectedPresetId changes
  useEffect(() => {
    stopAutoPlay();
    const preset = presets.find(p => p.id === selectedPresetId) || presets[0];
    const initialInput = preset.defaultInput || '001111';
    setInputString(initialInput);
    setTestCases(preset.testCases || []);

    if (visRef.current) visRef.current.originalInput = initialInput;
    if (engineRef.current) {
      engineRef.current.setPDA(preset);
      engineRef.current.reset(initialInput);
      syncPDAView();
    }
  }, [selectedPresetId]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (playTimerRef.current) stopAutoPlay();
        else startAutoPlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stopAutoPlay();
        if (engineRef.current) {
          engineRef.current.stepForward();
          syncPDAView();
        }
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stopAutoPlay();
        if (engineRef.current) {
          engineRef.current.stepBackward();
          syncPDAView();
        }
      } else if (e.code === 'KeyR') {
        e.preventDefault();
        stopAutoPlay();
        if (engineRef.current) {
          engineRef.current.reset(inputString);
          syncPDAView();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputString, playSpeed]);

  const handlePresetSelect = (e) => {
    const pId = e.target.value;
    setSelectedPresetId(pId);
    const p = presets.find(item => item.id === pId);
    if (p) onToast(`Loaded: ${p.name}`, '✓');
  };

  const handleTraceInput = () => {
    stopAutoPlay();
    const val = inputString.trim();
    if (visRef.current) visRef.current.originalInput = val;
    if (engineRef.current) {
      engineRef.current.reset(val);
      syncPDAView();
    }
    onToast(`Loaded "${val || 'ε'}" into tape`, '▶');
  };

  const handleLoadTarget = () => {
    stopAutoPlay();
    const target = currentPreset.defaultInput || '001111';
    setInputString(target);
    if (visRef.current) visRef.current.originalInput = target;
    if (engineRef.current) {
      engineRef.current.reset(target);
      syncPDAView();
    }
    onToast(`Loaded target problem string ${target}`, '✓');
  };

  const handleAddTestCase = () => {
    const val = inputString.trim();
    const testEng = new PDAEngine(currentPreset);
    testEng.reset(val);
    testEng.runToEnd();
    const isAccepted = testEng.checkAcceptance();

    const newTC = {
      input: val,
      expected: isAccepted,
      label: `Custom user test (${isAccepted ? 'Accepted' : 'Rejected'})`
    };

    const updated = [...testCases, newTC];
    setTestCases(updated);
    if (!currentPreset.testCases) currentPreset.testCases = [];
    currentPreset.testCases.push(newTC);

    onToast(`Saved "${val || 'ε'}" to test cases!`, '💾');
  };

  const handleCopyTrace = () => {
    if (!engineRef.current) return;
    const trace = engineRef.current.precomputedTrace;
    const orig = engineRef.current.originalInput || 'ε';

    const idList = trace.map(node => {
      const rem = orig.slice(node.inputIndex) || 'ε';
      const st = node.stack.length > 0 ? node.stack.join('') : 'ε';
      return `(${node.state}, ${rem}, ${st})`;
    });

    const latexNotation = idList.join(' \\vdash ');
    const textNotation = idList.join(' ⊢ ');

    navigator.clipboard.writeText(`${textNotation}\n\nLaTeX Format:\n${latexNotation}`).then(() => {
      onToast('Trace copied in textbook & LaTeX format!', '📋');
    });
  };

  const handleRunAllTests = () => {
    if (!testCases.length) return;
    let passed = 0;

    testCases.forEach(tc => {
      const testEng = new PDAEngine(currentPreset);
      testEng.reset(tc.input);
      testEng.runToEnd();
      const accepted = testEng.checkAcceptance();
      if (accepted === tc.expected) passed++;
    });

    onToast(`Test Suite: ${passed}/${testCases.length} tests passed!`, '⚡');
    if (passed === testCases.length && window.confetti) {
      window.confetti({ particleCount: 70, spread: 70 });
    }
  };

  const handleTestCardClick = (inp) => {
    stopAutoPlay();
    setInputString(inp);
    if (visRef.current) visRef.current.originalInput = inp;
    if (engineRef.current) {
      engineRef.current.reset(inp);
      syncPDAView();
    }
    onToast(`Tracing string: "${inp || 'ε'}"`, '🔍');
  };

  // Re-fetch presets when a new custom PDA is saved
  const refreshPresetsList = (newPresetId) => {
    const list = refreshPDAPresets();
    setPresets(list);
    if (newPresetId) {
      setSelectedPresetId(newPresetId);
    }
  };

  // Expose refresh function to parent via ref/prop if needed
  useEffect(() => {
    window._refreshPDAPresets = refreshPresetsList;
    return () => {
      delete window._refreshPDAPresets;
    };
  }, []);

  const acceptLabel = currentPreset.acceptMode === 'empty'
    ? 'Empty stack'
    : currentPreset.acceptMode === 'both'
      ? 'Final state + empty stack'
      : 'Final state';

  return (
    <section id="tab-pda" className="tab-content active" role="tabpanel">
      {/* Page Heading */}
      <div className="page-head">
        <div className="page-head-info">
          <span className="eyebrow">
            <Icon name="cpu" size={13} /> Pushdown Automaton
          </span>
          <h2 className="page-title" id="pda-language-title">{currentPreset.name}</h2>
          {currentPreset.description && (
            <p className="page-desc" id="pda-language-desc">{currentPreset.description}</p>
          )}
        </div>

        <div className="page-head-controls">
          <label className="select-label" htmlFor="pda-preset-select">Problem</label>
          <select
            id="pda-preset-select"
            className="styled-select"
            aria-label="Select Problem Preset"
            value={selectedPresetId}
            onChange={handlePresetSelect}
          >
            {presets.map(p => (
              <option key={p.id} value={p.id}>
                {p.isCustom ? '★ ' : ''}{p.name}
              </option>
            ))}
          </select>
          <button id="btn-open-custom-pda-modal" className="btn btn-primary" onClick={onOpenCustomModal}>
            <Icon name="plus" size={15} /> Custom PDA
          </button>
        </div>
      </div>

      {/* Workspace: Input + Graph (left) | Stack (right) */}
      <div className="pda-workspace">
        <div className="pda-main-column">
          {/* Input Tape */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="type" size={16} className="card-icon" />
                <span>Input Tape</span>
              </div>
              <span className="chip chip-neutral" id="pda-accept-mode-tag">
                Accepts by: <b>{acceptLabel}</b>
              </span>
            </div>

            <div className="input-row">
              <div className="input-with-prefix">
                <span className="input-prefix">w =</span>
                <input
                  type="text"
                  id="pda-input-string"
                  className="mono-input"
                  value={inputString}
                  onChange={(e) => setInputString(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleTraceInput()}
                  placeholder="e.g. 001111"
                  spellCheck="false"
                />
              </div>
              <button id="btn-trace-input" className="btn btn-primary" onClick={handleTraceInput}>
                <Icon name="play" size={14} /> Trace
              </button>
              <button
                id="btn-load-target-str"
                className="btn btn-secondary"
                title={`Load default string ${currentPreset.defaultInput || '001111'}`}
                onClick={handleLoadTarget}
              >
                Default
              </button>
              <button
                id="btn-add-test-case"
                className="btn btn-secondary"
                title="Save this string as a test case"
                onClick={handleAddTestCase}
              >
                <Icon name="plus" size={14} /> Save as test
              </button>
            </div>

            <div className="tape-strip" id="tape-cells-container" ref={tapeCellsRef} />
          </div>

          {/* State Transition Graph */}
          <div className="card">
            <div className="card-header">
              <div className="card-title">
                <Icon name="graph" size={16} className="card-icon" />
                <span>State Transition Graph</span>
              </div>
              <div className="legend">
                <span className="legend-item"><i className="legend-dot dot-active" /> Active</span>
                <span className="legend-item"><i className="legend-dot dot-accept" /> Accepting</span>
              </div>
            </div>

            <div className="diagram-wrapper">
              <svg id="pda-diagram-svg" className="diagram-svg" ref={svgRef} />
            </div>

            {/* Playback Controls */}
            <div className="playback-controls">
              <div className="control-buttons">
                <button
                  id="ctrl-reset"
                  className="ctrl-btn"
                  title="Reset (R)"
                  onClick={() => {
                    stopAutoPlay();
                    engineRef.current.reset(inputString.trim());
                    syncPDAView();
                  }}
                >
                  <Icon name="reset" size={15} />
                </button>
                <button
                  id="ctrl-step-back"
                  className="ctrl-btn"
                  title="Step back (←)"
                  onClick={() => {
                    stopAutoPlay();
                    engineRef.current.stepBackward();
                    syncPDAView();
                  }}
                >
                  <Icon name="chevronLeft" size={17} />
                </button>
                <button
                  id="ctrl-play-pause"
                  className={`ctrl-btn btn-play ${isPlaying ? 'playing' : ''}`}
                  title="Play / Pause (Space)"
                  onClick={() => {
                    if (isPlaying) stopAutoPlay();
                    else startAutoPlay();
                  }}
                >
                  <Icon name={isPlaying ? 'pause' : 'play'} size={16} />
                </button>
                <button
                  id="ctrl-step-forward"
                  className="ctrl-btn"
                  title="Step forward (→)"
                  onClick={() => {
                    stopAutoPlay();
                    engineRef.current.stepForward();
                    syncPDAView();
                  }}
                >
                  <Icon name="chevronRight" size={17} />
                </button>
                <button
                  id="ctrl-run-end"
                  className="ctrl-btn"
                  title="Run to end"
                  onClick={() => {
                    stopAutoPlay();
                    engineRef.current.runToEnd();
                    syncPDAView();
                  }}
                >
                  <Icon name="fastForward" size={15} />
                </button>
              </div>

              <div className="kbd-hints">
                <kbd>Space</kbd> play <kbd>←</kbd><kbd>→</kbd> step <kbd>R</kbd> reset
              </div>

              <div className="speed-control">
                <label htmlFor="pda-speed-select">Speed</label>
                <select
                  id="pda-speed-select"
                  className="speed-select"
                  value={playSpeed}
                  onChange={(e) => {
                    const sp = parseInt(e.target.value, 10);
                    setPlaySpeed(sp);
                    if (isPlaying) {
                      stopAutoPlay();
                      startAutoPlay();
                    }
                  }}
                >
                  <option value={1200}>0.5×</option>
                  <option value={600}>1×</option>
                  <option value={300}>2×</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stack + Instantaneous Description */}
        <aside className="card stack-card">
          <div className="card-header">
            <div className="card-title">
              <Icon name="layers" size={16} className="card-icon" />
              <span>Stack</span>
            </div>
            <span id="stack-count-badge" className="chip chip-primary" ref={stackCountRef} />
          </div>

          <div className="stack-tube-outer">
            <div className="stack-tube" id="stack-tube-elements" ref={stackTubeRef} />
          </div>

          <div className="id-status-card">
            <div className="id-label">Instantaneous description (q, w, γ)</div>
            <div id="pda-current-id-text" className="current-id-text" ref={currentIdRef} />
          </div>
        </aside>
      </div>

      {/* Bottom: Trace (left) | Test Suite (right) */}
      <div className="pda-bottom">
        <div className="card trace-card">
          <div className="card-header">
            <div className="card-title">
              <Icon name="list" size={16} className="card-icon" />
              <span>Execution Trace</span>
            </div>
            <button
              id="btn-copy-trace"
              className="btn btn-ghost btn-sm"
              title="Copy trace in textbook & LaTeX format"
              onClick={handleCopyTrace}
            >
              <Icon name="copy" size={14} /> Copy
            </button>
          </div>

          <div className="table-wrapper">
            <table className="trace-table" id="pda-trace-table">
              <thead>
                <tr>
                  <th className="col-step">#</th>
                  <th className="col-state">State</th>
                  <th className="col-input">Remaining input</th>
                  <th className="col-stack">Stack</th>
                  <th className="col-action">Rule applied</th>
                  <th className="col-status">Status</th>
                </tr>
              </thead>
              <tbody id="pda-trace-tbody" ref={traceTbodyRef} />
            </table>
          </div>
        </div>

        <div className="card test-suite-panel">
          <div className="card-header">
            <div className="card-title">
              <Icon name="flask" size={16} className="card-icon" />
              <span>Test Suite</span>
              <span className="chip chip-neutral">{testCases.length}</span>
            </div>
            <button id="btn-run-all-tests" className="btn btn-secondary btn-sm" onClick={handleRunAllTests}>
              <Icon name="zap" size={14} /> Run all
            </button>
          </div>

          <p className="card-hint">Click a test case to load it into the tracer.</p>

          <div className="test-list" id="pda-test-grid">
            {testCases.map((tc, idx) => (
              <button
                key={idx}
                type="button"
                className="test-card"
                data-input={tc.input}
                onClick={() => handleTestCardClick(tc.input)}
              >
                <div className="test-card-content">
                  <span className="test-input-str">{tc.input || 'ε'}</span>
                  <span className="test-card-desc">{tc.label}</span>
                </div>
                <span className={`badge ${tc.expected ? 'badge-accept' : 'badge-reject'}`}>
                  {tc.expected ? 'Accept' : 'Reject'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
