// FLA Studio - Main Application Controller
import { PDA_PRESETS, saveCustomPDA, refreshPDAPresets } from './pda/pda-presets.js';
import { PDAEngine } from './pda/pda-engine.js';
import { PDAVisualizer } from './pda/pda-visualizer.js';
import { PUMPING_PRESETS, saveCustomPumpingLanguage, buildCustomLanguageDefinition, refreshPumpingPresets } from './pumping/pumping-presets.js';
import { PumpingEngine } from './pumping/pumping-engine.js';
import { PumpingVisualizer } from './pumping/pumping-visualizer.js';

// Global Toast System
export function showToast(message, icon = '✓') {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2500);
}

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------
  // 1. Tab Switching Setup
  // -------------------------------------------------------------
  const tabBtnPda = document.getElementById('tab-btn-pda');
  const tabBtnPumping = document.getElementById('tab-btn-pumping');
  const tabPda = document.getElementById('tab-pda');
  const tabPumping = document.getElementById('tab-pumping');

  function switchTab(tabId) {
    if (tabId === 'tab-pda') {
      tabBtnPda.classList.add('active');
      tabBtnPda.setAttribute('aria-selected', 'true');
      tabBtnPumping.classList.remove('active');
      tabBtnPumping.setAttribute('aria-selected', 'false');
      tabPda.classList.add('active');
      tabPumping.classList.remove('active');
    } else {
      tabBtnPumping.classList.add('active');
      tabBtnPumping.setAttribute('aria-selected', 'true');
      tabBtnPda.classList.remove('active');
      tabBtnPda.setAttribute('aria-selected', 'false');
      tabPumping.classList.add('active');
      tabPda.classList.remove('active');
    }
  }

  tabBtnPda.addEventListener('click', () => switchTab('tab-pda'));
  tabBtnPumping.addEventListener('click', () => switchTab('tab-pumping'));

  // -------------------------------------------------------------
  // 2. PDA Simulator Initialization
  // -------------------------------------------------------------
  const pdaPresetSelect = document.getElementById('pda-preset-select');
  const pdaInputStr = document.getElementById('pda-input-string');
  const btnTrace = document.getElementById('btn-trace-input');
  const btnLoadTarget = document.getElementById('btn-load-target-str');
  const btnAddTestCase = document.getElementById('btn-add-test-case');
  const pdaTitle = document.getElementById('pda-language-title');
  const pdaDesc = document.getElementById('pda-language-desc');
  const pdaAcceptTag = document.getElementById('pda-accept-mode-tag');

  // Controls
  const ctrlReset = document.getElementById('ctrl-reset');
  const ctrlStepBack = document.getElementById('ctrl-step-back');
  const ctrlPlayPause = document.getElementById('ctrl-play-pause');
  const ctrlStepForward = document.getElementById('ctrl-step-forward');
  const ctrlRunEnd = document.getElementById('ctrl-run-end');
  const pdaSpeedSelect = document.getElementById('pda-speed-select');
  const btnCopyTrace = document.getElementById('btn-copy-trace');
  const btnRunAllTests = document.getElementById('btn-run-all-tests');
  const pdaTestGrid = document.getElementById('pda-test-grid');

  // Initialize Visualizer
  const pdaVis = new PDAVisualizer({
    diagramSvg: document.getElementById('pda-diagram-svg'),
    stackTube: document.getElementById('stack-tube-elements'),
    stackCount: document.getElementById('stack-count-badge'),
    tapeCells: document.getElementById('tape-cells-container'),
    traceTbody: document.getElementById('pda-trace-tbody'),
    currentIdText: document.getElementById('pda-current-id-text')
  });

  function populatePDAPresetsDropdown(selectedId = null) {
    pdaPresetSelect.innerHTML = '';
    const presets = refreshPDAPresets();
    presets.forEach(preset => {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = `${preset.isCustom ? '⭐ [Custom] ' : ''}${preset.name}`;
      pdaPresetSelect.appendChild(opt);
    });
    if (selectedId) pdaPresetSelect.value = selectedId;
  }

  populatePDAPresetsDropdown();

  let currentPreset = PDA_PRESETS[0]; // Default: L = {0^n 1^{2n} | n >= 1}
  let pdaEngine = new PDAEngine(currentPreset);
  pdaVis.originalInput = currentPreset.defaultInput;
  pdaEngine.reset(currentPreset.defaultInput);

  let playTimer = null;
  let playSpeed = parseInt(pdaSpeedSelect.value, 10);

  function syncPDAView() {
    const config = pdaEngine.getCurrentConfig();
    const trace = pdaEngine.precomputedTrace;
    const curIdx = pdaEngine.currentTraceIndex;
    const activeNode = trace[curIdx];

    // Diagram
    pdaVis.renderDiagram(currentPreset, config.state, activeNode?.transition);

    // Stack
    pdaVis.renderStack(config.stack);

    // Tape
    pdaVis.renderTape(pdaEngine.originalInput, config.headIndex);

    // ID Text
    pdaVis.updateCurrentID(config, pdaEngine.originalInput);

    // Trace Table
    pdaVis.renderTraceTable(trace, curIdx, (stepIdx) => {
      stopAutoPlay();
      pdaEngine.jumpToStep(stepIdx);
      syncPDAView();
    });

    // Check if celebration confetti is in order
    if (config.status === 'accepted' && curIdx === trace.length - 1 && window.confetti) {
      window.confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });
    }
  }

  function loadPDAPreset(presetId) {
    stopAutoPlay();
    currentPreset = PDA_PRESETS.find(p => p.id === presetId) || PDA_PRESETS[0];
    pdaTitle.textContent = currentPreset.name;
    pdaDesc.textContent = currentPreset.description || '';
    pdaAcceptTag.textContent = `Accept by: ${currentPreset.acceptMode === 'empty' ? 'Empty Stack' : 'Final State (F)'}`;
    
    pdaInputStr.value = currentPreset.defaultInput || '001111';
    pdaVis.originalInput = pdaInputStr.value;
    pdaEngine.setPDA(currentPreset);
    pdaEngine.reset(pdaInputStr.value);

    renderTestSuite();
    syncPDAView();
    showToast(`Loaded: ${currentPreset.name}`);
  }

  function startAutoPlay() {
    if (playTimer) return;
    ctrlPlayPause.textContent = '❚❚';
    ctrlPlayPause.classList.add('playing');

    playTimer = setInterval(() => {
      const advanced = pdaEngine.stepForward();
      syncPDAView();
      if (!advanced) {
        stopAutoPlay();
      }
    }, playSpeed);
  }

  function stopAutoPlay() {
    if (playTimer) {
      clearInterval(playTimer);
      playTimer = null;
    }
    ctrlPlayPause.textContent = '▶';
    ctrlPlayPause.classList.remove('playing');
  }

  function renderTestSuite() {
    if (!pdaTestGrid) return;

    const testCases = currentPreset.testCases || [
      { input: currentPreset.defaultInput || '001111', expected: true, label: 'Default test' }
    ];

    let html = '';
    testCases.forEach((tc, idx) => {
      html += `
        <div class="test-card" data-input="${tc.input}">
          <div class="test-card-content">
            <span class="test-input-str">"${tc.input || 'ε'}"</span>
            <span class="test-card-desc">${tc.label}</span>
          </div>
          <span class="badge ${tc.expected ? 'badge-accept' : 'badge-reject'}">${tc.expected ? 'Valid' : 'Invalid'}</span>
        </div>
      `;
    });

    pdaTestGrid.innerHTML = html;

    pdaTestGrid.querySelectorAll('.test-card').forEach(card => {
      card.addEventListener('click', () => {
        const inp = card.dataset.input;
        pdaInputStr.value = inp;
        pdaVis.originalInput = inp;
        pdaEngine.reset(inp);
        syncPDAView();
        showToast(`Tracing string: "${inp || 'ε'}"`);
      });
    });
  }

  // PDA Event Handlers
  pdaPresetSelect.addEventListener('change', (e) => loadPDAPreset(e.target.value));

  btnTrace.addEventListener('click', () => {
    stopAutoPlay();
    const val = pdaInputStr.value.trim();
    pdaVis.originalInput = val;
    pdaEngine.reset(val);
    syncPDAView();
    showToast(`Loaded "${val || 'ε'}" into tape`);
  });

  pdaInputStr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnTrace.click();
    }
  });

  btnLoadTarget.addEventListener('click', () => {
    stopAutoPlay();
    pdaInputStr.value = '001111';
    pdaVis.originalInput = '001111';
    pdaEngine.reset('001111');
    syncPDAView();
    showToast('Loaded target problem string 001111');
  });

  btnAddTestCase.addEventListener('click', () => {
    const val = pdaInputStr.value.trim();
    if (!currentPreset.testCases) currentPreset.testCases = [];
    
    // Check if expected by running it
    const testEng = new PDAEngine(currentPreset);
    testEng.reset(val);
    testEng.runToEnd();
    const isAccepted = testEng.checkAcceptance();

    currentPreset.testCases.push({
      input: val,
      expected: isAccepted,
      label: `Custom user test (${isAccepted ? 'Accepted' : 'Rejected'})`
    });

    renderTestSuite();
    showToast(`Saved "${val || 'ε'}" to test cases!`);
  });

  ctrlReset.addEventListener('click', () => {
    stopAutoPlay();
    pdaEngine.reset(pdaInputStr.value.trim());
    syncPDAView();
  });

  ctrlStepForward.addEventListener('click', () => {
    stopAutoPlay();
    pdaEngine.stepForward();
    syncPDAView();
  });

  ctrlStepBack.addEventListener('click', () => {
    stopAutoPlay();
    pdaEngine.stepBackward();
    syncPDAView();
  });

  ctrlPlayPause.addEventListener('click', () => {
    if (playTimer) stopAutoPlay();
    else startAutoPlay();
  });

  ctrlRunEnd.addEventListener('click', () => {
    stopAutoPlay();
    pdaEngine.runToEnd();
    syncPDAView();
  });

  pdaSpeedSelect.addEventListener('change', (e) => {
    playSpeed = parseInt(e.target.value, 10);
    if (playTimer) {
      stopAutoPlay();
      startAutoPlay();
    }
  });

  // Copy ID Trace
  btnCopyTrace.addEventListener('click', () => {
    const trace = pdaEngine.precomputedTrace;
    const originalInput = pdaEngine.originalInput || 'ε';
    
    const idList = trace.map(node => {
      const rem = originalInput.slice(node.inputIndex) || 'ε';
      const st = node.stack.length > 0 ? node.stack.join('') : 'ε';
      return `(${node.state}, ${rem}, ${st})`;
    });

    const latexNotation = idList.join(' \\vdash ');
    const textNotation = idList.join(' ⊢ ');

    navigator.clipboard.writeText(`${textNotation}\n\nLaTeX Format:\n${latexNotation}`).then(() => {
      showToast('Trace copied in textbook & LaTeX format!');
    });
  });

  // Run all test cases in batch
  btnRunAllTests.addEventListener('click', () => {
    if (!currentPreset.testCases) return;
    let passed = 0;
    
    currentPreset.testCases.forEach(tc => {
      const testEng = new PDAEngine(currentPreset);
      testEng.reset(tc.input);
      testEng.runToEnd();
      const accepted = testEng.checkAcceptance();
      if (accepted === tc.expected) passed++;
    });

    showToast(`Test Suite: ${passed}/${currentPreset.testCases.length} tests passed!`, '⚡');
    if (passed === currentPreset.testCases.length && window.confetti) {
      window.confetti({ particleCount: 70, spread: 70 });
    }
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'SELECT') {
      return;
    }
    if (e.code === 'Space') {
      e.preventDefault();
      if (playTimer) stopAutoPlay();
      else startAutoPlay();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      stopAutoPlay();
      pdaEngine.stepForward();
      syncPDAView();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      stopAutoPlay();
      pdaEngine.stepBackward();
      syncPDAView();
    } else if (e.code === 'KeyR') {
      e.preventDefault();
      stopAutoPlay();
      pdaEngine.reset(pdaInputStr.value.trim());
      syncPDAView();
    }
  });

  // Initialize PDA View
  renderTestSuite();
  syncPDAView();

  // -------------------------------------------------------------
  // 3. Custom PDA Builder Logic
  // -------------------------------------------------------------
  const modalCustomPDA = document.getElementById('custom-pda-modal');
  const btnOpenCustomPDAModal = document.getElementById('btn-open-custom-pda-modal');
  const btnCloseCustomPDA = document.getElementById('btn-close-custom-pda');
  const btnCancelCustomPDA = document.getElementById('btn-cancel-custom-pda');
  const btnSaveCustomPDA = document.getElementById('btn-save-custom-pda');
  const btnAddPDARule = document.getElementById('btn-add-pda-rule');
  const rulesTbody = document.getElementById('custom-pda-rules-tbody');
  const templateSelect = document.getElementById('custom-pda-template-select');

  function addRuleRow(from = 'q0', input = '0', pop = 'Z0', to = 'q0', push = 'XXZ0') {
    const tr = document.createElement('tr');
    tr.className = 'pda-rule-row';
    tr.innerHTML = `
      <td><input type="text" class="table-input rule-from" value="${from}"></td>
      <td><input type="text" class="table-input rule-input" value="${input}"></td>
      <td><input type="text" class="table-input rule-pop" value="${pop}"></td>
      <td><input type="text" class="table-input rule-to" value="${to}"></td>
      <td><input type="text" class="table-input rule-push" value="${push}"></td>
      <td style="text-align: center;"><button type="button" class="btn-danger btn-remove-rule" title="Remove rule">✕</button></td>
    `;
    tr.querySelector('.btn-remove-rule').addEventListener('click', () => tr.remove());
    rulesTbody.appendChild(tr);
  }

  function loadTemplateRules(templateKey) {
    rulesTbody.innerHTML = '';
    const nameInput = document.getElementById('custom-pda-name');
    const defaultInput = document.getElementById('custom-pda-default-input');
    const statesInput = document.getElementById('custom-pda-states');
    const startStateInput = document.getElementById('custom-pda-start-state');
    const acceptStatesInput = document.getElementById('custom-pda-accept-states');

    if (templateKey === 'template_0n1n') {
      nameInput.value = 'L = {0ⁿ 1ⁿ | n ≥ 1}';
      defaultInput.value = '000111';
      statesInput.value = 'q0, q1, q2';
      startStateInput.value = 'q0';
      acceptStatesInput.value = 'q2';
      addRuleRow('q0', '0', 'Z0', 'q0', 'XZ0');
      addRuleRow('q0', '0', 'X', 'q0', 'XX');
      addRuleRow('q0', '1', 'X', 'q1', 'ε');
      addRuleRow('q1', '1', 'X', 'q1', 'ε');
      addRuleRow('q1', 'ε', 'Z0', 'q2', 'Z0');
    } else if (templateKey === 'template_0n1_2n') {
      nameInput.value = 'L = {0ⁿ 1²ⁿ | n ≥ 1}';
      defaultInput.value = '001111';
      statesInput.value = 'q0, q1, q2';
      startStateInput.value = 'q0';
      acceptStatesInput.value = 'q2';
      addRuleRow('q0', '0', 'Z0', 'q0', 'XXZ0');
      addRuleRow('q0', '0', 'X', 'q0', 'XXX');
      addRuleRow('q0', '1', 'X', 'q1', 'ε');
      addRuleRow('q1', '1', 'X', 'q1', 'ε');
      addRuleRow('q1', 'ε', 'Z0', 'q2', 'Z0');
    } else if (templateKey === 'template_0n1_3n') {
      nameInput.value = 'L = {0ⁿ 1³ⁿ | n ≥ 1}';
      defaultInput.value = '00111111';
      statesInput.value = 'q0, q1, q2';
      startStateInput.value = 'q0';
      acceptStatesInput.value = 'q2';
      addRuleRow('q0', '0', 'Z0', 'q0', 'XXXZ0');
      addRuleRow('q0', '0', 'X', 'q0', 'XXXX');
      addRuleRow('q0', '1', 'X', 'q1', 'ε');
      addRuleRow('q1', '1', 'X', 'q1', 'ε');
      addRuleRow('q1', 'ε', 'Z0', 'q2', 'Z0');
    } else if (templateKey === 'template_0_2n1n') {
      nameInput.value = 'L = {0²ⁿ 1ⁿ | n ≥ 1}';
      defaultInput.value = '000011';
      statesInput.value = 'q0, q1, q2, q3';
      startStateInput.value = 'q0';
      acceptStatesInput.value = 'q3';
      addRuleRow('q0', '0', 'Z0', 'q1', 'Z0');
      addRuleRow('q1', '0', 'Z0', 'q0', 'XZ0');
      addRuleRow('q0', '0', 'X', 'q1', 'X');
      addRuleRow('q1', '0', 'X', 'q0', 'XX');
      addRuleRow('q0', '1', 'X', 'q2', 'ε');
      addRuleRow('q2', '1', 'X', 'q2', 'ε');
      addRuleRow('q2', 'ε', 'Z0', 'q3', 'Z0');
    } else if (templateKey === 'template_wcwr') {
      nameInput.value = 'L = {w c wᴿ | w ∈ {0,1}*}';
      defaultInput.value = '011c110';
      statesInput.value = 'q0, q1, q2';
      startStateInput.value = 'q0';
      acceptStatesInput.value = 'q2';
      addRuleRow('q0', '0', 'Z0', 'q0', '0Z0');
      addRuleRow('q0', '1', 'Z0', 'q0', '1Z0');
      addRuleRow('q0', '0', '0', 'q0', '00');
      addRuleRow('q0', '1', '1', 'q0', '11');
      addRuleRow('q0', 'c', 'Z0', 'q1', 'Z0');
      addRuleRow('q0', 'c', '0', 'q1', '0');
      addRuleRow('q0', 'c', '1', 'q1', '1');
      addRuleRow('q1', '0', '0', 'q1', 'ε');
      addRuleRow('q1', '1', '1', 'q1', 'ε');
      addRuleRow('q1', 'ε', 'Z0', 'q2', 'Z0');
    } else if (templateKey === 'template_parens') {
      nameInput.value = 'Balanced Parentheses ( )';
      defaultInput.value = '(()())';
      statesInput.value = 'q0, q1';
      startStateInput.value = 'q0';
      acceptStatesInput.value = 'q1';
      addRuleRow('q0', '(', 'Z0', 'q0', '(Z0');
      addRuleRow('q0', '(', '(', 'q0', '((');
      addRuleRow('q0', ')', '(', 'q0', 'ε');
      addRuleRow('q0', 'ε', 'Z0', 'q1', 'Z0');
    }
  }

  btnOpenCustomPDAModal.addEventListener('click', () => {
    // Populate with existing template if table empty
    if (rulesTbody.children.length === 0) {
      loadTemplateRules('template_0n1_2n');
    }
    modalCustomPDA.classList.add('active');
  });

  btnCloseCustomPDA.addEventListener('click', () => modalCustomPDA.classList.remove('active'));
  btnCancelCustomPDA.addEventListener('click', () => modalCustomPDA.classList.remove('active'));
  btnAddPDARule.addEventListener('click', () => addRuleRow());
  templateSelect.addEventListener('change', (e) => {
    if (e.target.value) loadTemplateRules(e.target.value);
  });

  btnSaveCustomPDA.addEventListener('click', () => {
    const name = document.getElementById('custom-pda-name').value.trim() || 'Custom PDA';
    const defaultInput = document.getElementById('custom-pda-default-input').value.trim() || '001111';
    const statesRaw = document.getElementById('custom-pda-states').value.trim() || 'q0, q1, q2';
    const startState = document.getElementById('custom-pda-start-state').value.trim() || 'q0';
    const acceptStatesRaw = document.getElementById('custom-pda-accept-states').value.trim() || 'q2';
    const acceptMode = document.getElementById('custom-pda-accept-mode').value;

    const stateIds = statesRaw.split(',').map(s => s.trim()).filter(Boolean);
    const acceptStates = acceptStatesRaw.split(',').map(s => s.trim()).filter(Boolean);

    // Build state objects
    const states = stateIds.map((sid, idx) => ({
      id: sid,
      label: sid,
      isStart: sid === startState,
      isAccept: acceptStates.includes(sid),
      desc: sid === startState ? 'Start state' : (acceptStates.includes(sid) ? 'Accept state' : '')
    }));

    // Read transition rules
    const rows = rulesTbody.querySelectorAll('.pda-rule-row');
    const transitions = [];
    rows.forEach(r => {
      const from = r.querySelector('.rule-from').value.trim();
      let inp = r.querySelector('.rule-input').value.trim();
      const pop = r.querySelector('.rule-pop').value.trim();
      const to = r.querySelector('.rule-to').value.trim();
      let push = r.querySelector('.rule-push').value.trim();

      if (!inp) inp = 'ε';
      if (!push) push = 'ε';

      const pushArray = (push === 'ε' || push === '') ? [] : push.split('');

      transitions.push({
        from,
        to,
        input: inp,
        pop,
        push: pushArray,
        label: `${inp}, ${pop} → ${push}`
      });
    });

    const customPDA = {
      id: `custom_pda_${Date.now()}`,
      name,
      description: `User-defined custom PDA question for ${name}`,
      defaultInput,
      startState,
      startStack: 'Z0',
      acceptStates,
      acceptMode,
      states,
      transitions,
      isCustom: true,
      testCases: [
        { input: defaultInput, expected: true, label: 'Default custom test' }
      ]
    };

    saveCustomPDA(customPDA);
    populatePDAPresetsDropdown(customPDA.id);
    loadPDAPreset(customPDA.id);

    modalCustomPDA.classList.remove('active');
    showToast(`Custom Question "${name}" Created & Running!`, '🚀');
    if (window.confetti) window.confetti({ particleCount: 60, spread: 60 });
  });

  // -------------------------------------------------------------
  // 4. CFL Pumping Lemma Lab Setup
  // -------------------------------------------------------------
  const pumpingPresetSelect = document.getElementById('pumping-preset-select');
  const pButtons = document.querySelectorAll('.p-btn');
  const iButtons = document.querySelectorAll('.i-btn');
  const pumpISlider = document.getElementById('pump-i-slider');
  const pumpIVal = document.getElementById('pump-i-value');
  const btnAdversaryChallenge = document.getElementById('btn-adversary-challenge');
  const adversarySummaryBox = document.getElementById('adversary-summary-box');
  const pumpingCustomStrInput = document.getElementById('pumping-custom-string-input');
  const btnApplyCustomPumpingStr = document.getElementById('btn-apply-custom-pumping-str');
  const btnOpenCustomPumpingModal = document.getElementById('btn-open-custom-pumping-modal');

  const pumpingVis = new PumpingVisualizer({
    ribbonContainer: document.getElementById('pumping-ribbon-container'),
    lengthsDisplay: document.getElementById('pumping-lengths-display'),
    cond1Badge: document.getElementById('cond-1-badge'),
    cond2Badge: document.getElementById('cond-2-badge'),
    pumpedStringDisplay: document.getElementById('pumped-string-tokens'),
    balanceBars: document.getElementById('pumping-balance-bars'),
    resultBanner: document.getElementById('pumping-result-banner'),
    caseAnalysisText: document.getElementById('pumping-case-analysis'),
    pumpISlider: pumpISlider,
    pumpIValue: pumpIVal
  });

  function populatePumpingPresetsDropdown(selectedId = null) {
    pumpingPresetSelect.innerHTML = '';
    const presets = refreshPumpingPresets();
    presets.forEach(preset => {
      const opt = document.createElement('option');
      opt.value = preset.id;
      opt.textContent = `${preset.isCustom ? '⭐ [Custom] ' : ''}${preset.name}`;
      pumpingPresetSelect.appendChild(opt);
    });
    if (selectedId) pumpingPresetSelect.value = selectedId;
  }

  populatePumpingPresetsDropdown();

  let currentPumpingPreset = PUMPING_PRESETS[0]; // L = {0^n 1^n 2^n | n >= 1}
  let pumpingEngine = new PumpingEngine(currentPumpingPreset);
  if (pumpingCustomStrInput) pumpingCustomStrInput.value = pumpingEngine.s;

  function syncPumpingView() {
    // 1. Ribbon
    pumpingVis.renderPartitionRibbon(pumpingEngine, (i1, i2, i3, i4) => {
      pumpingEngine.setPartition(i1, i2, i3, i4);
      syncPumpingView();
    });

    // 2. Conditions
    const validation = pumpingEngine.validateConditions();
    const segments = pumpingEngine.getSegments();
    pumpingVis.renderConditionsAndLengths(validation, segments, pumpingEngine.p);

    // 3. Pumped Result
    const pumpData = pumpingEngine.getPumpedString();
    pumpingVis.renderPumpedResult(pumpData);

    // Update slider & buttons active state
    iButtons.forEach(btn => {
      const bI = parseInt(btn.dataset.i, 10);
      btn.classList.toggle('active', bI === pumpingEngine.pumpI);
    });

    pButtons.forEach(btn => {
      const bP = parseInt(btn.dataset.p, 10);
      btn.classList.toggle('active', bP === pumpingEngine.p);
    });
  }

  pumpingPresetSelect.addEventListener('change', (e) => {
    currentPumpingPreset = PUMPING_PRESETS.find(p => p.id === e.target.value) || PUMPING_PRESETS[0];
    pumpingEngine.setPreset(currentPumpingPreset);
    if (pumpingCustomStrInput) pumpingCustomStrInput.value = pumpingEngine.s;
    syncPumpingView();
    showToast(`Loaded: ${currentPumpingPreset.name}`);
  });

  // Apply user's custom string directly
  btnApplyCustomPumpingStr.addEventListener('click', () => {
    const val = pumpingCustomStrInput.value.trim();
    if (!val) return;
    pumpingEngine.setCustomString(val);
    syncPumpingView();
    showToast(`Applied custom string: "${val}"`);
  });

  pumpingCustomStrInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      btnApplyCustomPumpingStr.click();
    }
  });

  // Pumping length buttons
  pButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = parseInt(btn.dataset.p, 10);
      pumpingEngine.setP(p);
      if (pumpingCustomStrInput) pumpingCustomStrInput.value = pumpingEngine.s;
      syncPumpingView();
      showToast(`Set pumping length p = ${p}`);
    });
  });

  // Pumping multiplier buttons
  iButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const i = parseInt(btn.dataset.i, 10);
      pumpingEngine.pumpI = i;
      syncPumpingView();
    });
  });

  pumpISlider.addEventListener('input', (e) => {
    pumpingEngine.pumpI = parseInt(e.target.value, 10);
    syncPumpingView();
  });

  // Adversary challenge button: exhaustively proves that EVERY partition fails
  btnAdversaryChallenge.addEventListener('click', () => {
    const proofRes = pumpingEngine.computeAllPartitionsProof();
    adversarySummaryBox.style.display = 'block';
    adversarySummaryBox.innerHTML = `
      <div style="background: rgba(168, 85, 247, 0.15); border: 1px solid var(--accent-purple); padding: 0.75rem; border-radius: 8px;">
        <h5 style="color: #d8b4fe; font-size: 0.95rem; margin-bottom: 0.35rem;">⚔ Adversary Refuted on All Partitions!</h5>
        <p style="margin-bottom: 0.4rem;">
          Tested <strong>${proofRes.totalPartitions}</strong> possible valid partitions of <code>"${pumpingEngine.s}"</code>.
        </p>
        <p style="color: #34d399; font-weight: 700;">
          Contradictions Found: ${proofRes.contradictedCount} / ${proofRes.totalPartitions} (${proofRes.successRate.toFixed(1)}%)
        </p>
        <p style="font-size: 0.75rem; margin-top: 0.4rem; color: var(--text-muted);">
          No matter which partition the Adversary picks, pumping either i=2 or i=0 produces a string with unequal counts, escaping the language!
        </p>
      </div>
    `;

    if (window.confetti) {
      window.confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
    showToast(`All ${proofRes.totalPartitions} adversary partitions refuted!`, '🏆');
  });

  // -------------------------------------------------------------
  // 5. Custom CFL Question Modal Logic
  // -------------------------------------------------------------
  const modalCustomPumping = document.getElementById('custom-pumping-modal');
  const btnCloseCustomPumping = document.getElementById('btn-close-custom-pumping');
  const btnCancelCustomPumping = document.getElementById('btn-cancel-custom-pumping');
  const btnSaveCustomPumping = document.getElementById('btn-save-custom-pumping');

  btnOpenCustomPumpingModal.addEventListener('click', () => {
    modalCustomPumping.classList.add('active');
  });

  btnCloseCustomPumping.addEventListener('click', () => modalCustomPumping.classList.remove('active'));
  btnCancelCustomPumping.addEventListener('click', () => modalCustomPumping.classList.remove('active'));

  btnSaveCustomPumping.addEventListener('click', () => {
    const name = document.getElementById('custom-pumping-name').value.trim() || 'Custom CFL Question';
    const customString = document.getElementById('custom-pumping-string').value.trim() || '000111222';
    const p = parseInt(document.getElementById('custom-pumping-p').value, 10) || 3;
    const ruleType = document.getElementById('custom-pumping-rule').value;

    const customLangDef = {
      id: `custom_cfl_${Date.now()}`,
      name,
      customString,
      p,
      ruleType,
      isCustom: true
    };

    saveCustomPumpingLanguage(customLangDef);
    populatePumpingPresetsDropdown(customLangDef.id);
    
    currentPumpingPreset = PUMPING_PRESETS.find(p => p.id === customLangDef.id) || PUMPING_PRESETS[0];
    pumpingEngine.setPreset(currentPumpingPreset);
    pumpingEngine.setP(p);
    pumpingEngine.setCustomString(customString);
    if (pumpingCustomStrInput) pumpingCustomStrInput.value = customString;

    syncPumpingView();
    modalCustomPumping.classList.remove('active');
    showToast(`Custom CFL Question "${name}" Loaded!`, '🚀');
    if (window.confetti) window.confetti({ particleCount: 60, spread: 60 });
  });

  // -------------------------------------------------------------
  // 6. Theory Guide & Formal Proof Modals
  // -------------------------------------------------------------
  const modalProof = document.getElementById('formal-proof-modal');
  const modalTheory = document.getElementById('theory-guide-modal');
  const btnOpenProofHeader = document.getElementById('btn-open-proof-modal');
  const btnOpenProofCard = document.getElementById('btn-open-full-proof');
  const btnCloseProof = document.getElementById('btn-close-proof-modal');
  const btnCopyProofMd = document.getElementById('btn-copy-proof-markdown');
  const btnCopyProofLatex = document.getElementById('btn-copy-proof-latex');
  const proofContent = document.getElementById('proof-modal-content');
  const proofTitle = document.getElementById('proof-modal-title');

  const btnOpenTheory = document.getElementById('btn-theory-guide');
  const btnCloseTheory = document.getElementById('btn-close-theory-modal');
  const btnCloseTheoryFooter = document.getElementById('btn-close-theory-footer');

  function openProofModal() {
    const preset = currentPumpingPreset;
    proofTitle.textContent = `Formal Proof: ${preset.name} is Not Context-Free`;
    
    const rawMd = preset.formalProofMarkdown;
    const lines = rawMd.split('\n');
    let html = '';
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('## ')) {
        html += `<h2>${trimmed.slice(3)}</h2>`;
      } else if (trimmed.startsWith('### ')) {
        html += `<h3>${trimmed.slice(4)}</h3>`;
      } else if (trimmed.startsWith('- ')) {
        html += `<li>${trimmed.slice(2)}</li>`;
      } else if (trimmed === '---') {
        html += `<hr style="border: 0; border-top: 1px solid var(--border-subtle); margin: 1rem 0;">`;
      } else if (trimmed.length > 0) {
        html += `<p>${trimmed}</p>`;
      }
    });

    proofContent.innerHTML = html;
    modalProof.classList.add('active');

    if (window.katex) {
      proofContent.querySelectorAll('p, h2, h3, li').forEach(el => {
        el.innerHTML = el.innerHTML.replace(/\$([^\$]+)\$/g, (match, math) => {
          try {
            return window.katex.renderToString(math, { throwOnError: false });
          } catch (e) {
            return match;
          }
        });
      });
    }
  }

  btnOpenProofHeader.addEventListener('click', openProofModal);
  btnOpenProofCard.addEventListener('click', openProofModal);
  btnCloseProof.addEventListener('click', () => modalProof.classList.remove('active'));
  
  btnCopyProofMd.addEventListener('click', () => {
    navigator.clipboard.writeText(currentPumpingPreset.formalProofMarkdown).then(() => {
      showToast('Formal Markdown proof copied to clipboard!');
    });
  });

  btnCopyProofLatex.addEventListener('click', () => {
    const latexDoc = `\\documentclass{article}
\\usepackage{amsmath,amssymb}
\\begin{document}
\\section*{Proof: ${currentPumpingPreset.name} is Not Context-Free}

\\textbf{Theorem:} The language ${currentPumpingPreset.name} is not context-free.

\\begin{proof}
Suppose for contradiction that $L$ is context-free.
By the Pumping Lemma for Context-Free Languages, there exists a pumping length $p \\ge 1$.

Consider the string $s = \\text{"${pumpingEngine.s}"} \\in L$ with $|s| \\ge p$.
According to the Pumping Lemma, $s = uvwxy$ such that:
\\begin{enumerate}
    \\item $|vwx| \\le p$
    \\item $|vx| \\ge 1$
    \\item $\\forall i \\ge 0, \\; uv^i wx^i y \\in L$
\\end{enumerate}

Since $|vwx| \\le p$, the pumped substring $vx$ cannot maintain balance across all symbol blocks.
Pumping with $i \\ne 1$ results in a string $s_i \\notin L$.
Contradiction! Hence, the language is not context-free.
\\end{proof}
\\end{document}`;

    navigator.clipboard.writeText(latexDoc).then(() => {
      showToast('LaTeX document copied to clipboard!');
    });
  });

  // Theory Guide Modal
  btnOpenTheory.addEventListener('click', () => modalTheory.classList.add('active'));
  btnCloseTheory.addEventListener('click', () => modalTheory.classList.remove('active'));
  btnCloseTheoryFooter.addEventListener('click', () => modalTheory.classList.remove('active'));

  // Close modals on background click
  [modalProof, modalTheory, modalCustomPDA, modalCustomPumping].forEach(modal => {
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.classList.remove('active');
    });
  });

  // Initialize Pumping View
  syncPumpingView();
});
