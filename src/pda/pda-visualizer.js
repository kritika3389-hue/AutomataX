// PDA Visualizer: SVG State Diagram, Stack Animation, Input Tape, and ID Trace Table

export class PDAVisualizer {
  constructor(containerElements) {
    this.svg = containerElements.diagramSvg;
    this.stackContainer = containerElements.stackTube;
    this.stackCountEl = containerElements.stackCount;
    this.tapeContainer = containerElements.tapeCells;
    this.traceTableBody = containerElements.traceTbody;
    this.currentIdEl = containerElements.currentIdText;
  }

  renderDiagram(pda, currentStateId, activeTransition = null, isRejected = false, isAccepted = false) {
    if (!this.svg) return;
    if (!pda || !pda.states || !pda.transitions) return;

    // Auto-calculate coordinates for custom states if missing
    const numStates = pda.states.length;
    pda.states.forEach((s, idx) => {
      if (!s.x || !s.y) {
        if (numStates <= 4) {
          s.x = 90 + idx * ((580 - 180) / Math.max(1, numStates - 1));
          s.y = 105;
        } else {
          const angle = (idx / numStates) * 2 * Math.PI - Math.PI / 2;
          s.x = 310 + 180 * Math.cos(angle);
          s.y = 105 + 60 * Math.sin(angle);
        }
      }
    });

    const width = this.svg.clientWidth || 600;
    const height = 185;
    this.svg.setAttribute('viewBox', `0 0 620 ${height}`);

    // Generate SVG content
    let svgContent = `
      <defs>
        <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#94a3b8" />
        </marker>
        <marker id="arrowhead-active" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill="#4f46e5" />
        </marker>
        <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#4f46e5" flood-opacity="0.25" />
        </filter>
        <filter id="glow-danger" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#e11d48" flood-opacity="0.35" />
        </filter>
        <filter id="glow-success" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#059669" flood-opacity="0.35" />
        </filter>
        <filter id="node-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" flood-color="#0f172a" flood-opacity="0.08" />
        </filter>
      </defs>
    `;

    // Group transitions by from -> to
    const groupedTransitions = {};
    pda.transitions.forEach(t => {
      const key = `${t.from}->${t.to}`;
      if (!groupedTransitions[key]) groupedTransitions[key] = [];
      groupedTransitions[key].push(t);
    });

    // Draw transitions
    Object.keys(groupedTransitions).forEach(key => {
      const [fromId, toId] = key.split('->');
      const fromState = pda.states.find(s => s.id === fromId);
      const toState = pda.states.find(s => s.id === toId);
      if (!fromState || !toState) return;

      const transitions = groupedTransitions[key];
      const isSelfLoop = fromId === toId;
      const isActive = activeTransition && transitions.some(t => 
        t.from === activeTransition.from && 
        t.to === activeTransition.to && 
        t.input === activeTransition.input && 
        t.pop === activeTransition.pop
      );

      const labels = transitions.map(t => t.label).join(' | ');

      if (isSelfLoop) {
        // Draw self loop above the state
        const cx = fromState.x;
        const cy = fromState.y - 32;
        const r = 26;
        const pathData = `M ${cx - 15} ${cy + 10} C ${cx - 35} ${cy - 45}, ${cx + 35} ${cy - 45}, ${cx + 15} ${cy + 10}`;
        const marker = isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)';
        const strokeColor = isActive ? '#4f46e5' : '#b4bcc8';
        const strokeWidth = isActive ? '2.5' : '1.8';

        svgContent += `
          <g class="transition-group ${isActive ? 'active-transition' : ''}">
            <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="${marker}" ${isActive ? 'filter="url(#glow)"' : ''} />
            <rect x="${cx - (labels.length * 4.2)}" y="${cy - 52}" width="${labels.length * 8.4 + 12}" height="20" rx="10" fill="${isActive ? '#eef2ff' : '#ffffff'}" stroke="${isActive ? '#a5b4fc' : '#e2e8f0'}" stroke-width="1" />
            <text x="${cx}" y="${cy - 38}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" fill="${isActive ? '#4338ca' : '#475569'}" font-weight="600">${labels}</text>
          </g>
        `;
      } else {
        // Straight or curved line between distinct states
        const dx = toState.x - fromState.x;
        const dy = toState.y - fromState.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Node radius is 32
        const r = 32;
        const startX = fromState.x + (dx / dist) * r;
        const startY = fromState.y + (dy / dist) * r;
        const endX = toState.x - (dx / dist) * r;
        const endY = toState.y - (dy / dist) * r;

        // Check if reciprocal transition exists (to avoid overlapping straight lines)
        const hasReciprocal = groupedTransitions[`${toId}->${fromId}`];
        const curvature = hasReciprocal ? 35 : (dx < 0 ? -35 : 0);
        
        let pathData = '';
        let labelX = (startX + endX) / 2;
        let labelY = (startY + endY) / 2 - 14;

        if (curvature !== 0) {
          const midX = (startX + endX) / 2;
          const midY = (startY + endY) / 2;
          const normalX = -dy / dist;
          const normalY = dx / dist;
          const controlX = midX + normalX * curvature;
          const controlY = midY + normalY * curvature;
          pathData = `M ${startX} ${startY} Q ${controlX} ${controlY} ${endX} ${endY}`;
          labelX = controlX;
          labelY = controlY + (curvature > 0 ? -12 : 20);
        } else {
          pathData = `M ${startX} ${startY} L ${endX} ${endY}`;
        }

        const marker = isActive ? 'url(#arrowhead-active)' : 'url(#arrowhead)';
        const strokeColor = isActive ? '#4f46e5' : '#b4bcc8';
        const strokeWidth = isActive ? '2.5' : '1.8';

        svgContent += `
          <g class="transition-group ${isActive ? 'active-transition' : ''}">
            <path d="${pathData}" fill="none" stroke="${strokeColor}" stroke-width="${strokeWidth}" marker-end="${marker}" ${isActive ? 'filter="url(#glow)"' : ''} />
            <rect x="${labelX - (labels.length * 4.2) - 6}" y="${labelY - 10}" width="${labels.length * 8.4 + 12}" height="20" rx="10" fill="${isActive ? '#eef2ff' : '#ffffff'}" stroke="${isActive ? '#a5b4fc' : '#e2e8f0'}" stroke-width="1" />
            <text x="${labelX}" y="${labelY + 4}" text-anchor="middle" font-family="'JetBrains Mono', monospace" font-size="11" fill="${isActive ? '#4338ca' : '#475569'}" font-weight="600">${labels}</text>
          </g>
        `;
      }
    });

    // Draw states (nodes)
    pda.states.forEach(state => {
      const isCurrent = state.id === currentStateId;
      const isAccept = state.isAccept;
      const isStart = state.isStart;
      const isRejectedCurrent = isCurrent && isRejected;
      const isAcceptedCurrent = isCurrent && isAccepted;

      const circleRadius = 30;

      // Start state arrow
      if (isStart) {
        svgContent += `
          <g class="start-arrow">
            <line x1="${state.x - 65}" y1="${state.y}" x2="${state.x - 33}" y2="${state.y}" stroke="#94a3b8" stroke-width="1.8" marker-end="url(#arrowhead)" />
            <text x="${state.x - 70}" y="${state.y + 4}" text-anchor="end" font-family="'Inter', sans-serif" font-size="11" fill="#64748b" font-weight="600">start</text>
          </g>
        `;
      }

      let strokeColor = isCurrent ? '#4f46e5' : (isAccept ? '#059669' : '#94a3b8');
      let fillColor = isCurrent ? '#eef2ff' : '#ffffff';
      let strokeWidth = isCurrent ? '2.5' : '1.8';
      let textColor = isCurrent ? '#4338ca' : '#0f172a';
      let filterUrl = isCurrent ? 'url(#glow)' : 'url(#node-shadow)';

      if (isRejectedCurrent) {
        strokeColor = '#e11d48';
        fillColor = '#fff1f2';
        textColor = '#be123c';
        strokeWidth = '2.8';
        filterUrl = 'url(#glow-danger)';
      } else if (isAcceptedCurrent) {
        strokeColor = '#059669';
        fillColor = '#ecfdf5';
        textColor = '#065f46';
        strokeWidth = '2.8';
        filterUrl = 'url(#glow-success)';
      }

      svgContent += `
        <g class="state-node ${isCurrent ? 'current-state' : ''} ${isRejectedCurrent ? 'rejected-state' : ''} ${isAcceptedCurrent ? 'accepted-state' : ''}" data-state-id="${state.id}" transform="translate(${state.x}, ${state.y})">
          ${isRejectedCurrent 
            ? `<circle r="${circleRadius + 8}" fill="none" stroke="#e11d48" stroke-width="2" opacity="0.45" class="pulse-ring pulse-rejected" />` 
            : (isAcceptedCurrent 
              ? `<circle r="${circleRadius + 8}" fill="none" stroke="#059669" stroke-width="2" opacity="0.45" class="pulse-ring pulse-accepted" />` 
              : (isCurrent ? `<circle r="${circleRadius + 8}" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.35" class="pulse-ring" />` : ''))}
          <circle r="${circleRadius}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${strokeWidth}" filter="${filterUrl}" />
          ${isAccept ? `<circle r="${circleRadius - 5}" fill="none" stroke="${strokeColor}" stroke-width="1.5" />` : ''}
          <text text-anchor="middle" dominant-baseline="central" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="700" fill="${textColor}">${state.label || state.id}</text>
          <text y="${circleRadius + 18}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" fill="${isRejectedCurrent ? '#e11d48' : '#64748b'}">${isRejectedCurrent ? 'Halted / Rejected' : (state.desc || '')}</text>
        </g>
      `;
    });

    this.svg.innerHTML = svgContent;
  }

  renderStack(stack) {
    if (!this.stackContainer) return;
    const stackItems = Array.isArray(stack) ? stack : [];

    if (this.stackCountEl) {
      this.stackCountEl.textContent = `Size: ${stackItems.length}`;
    }

    const stackKey = stackItems.join('|');
    if (this._lastRenderedStackKey === stackKey) {
      return;
    }
    this._lastRenderedStackKey = stackKey;

    if (stackItems.length === 0) {
      this.stackContainer.innerHTML = `
        <div class="empty-stack-msg">Stack is empty (ε)</div>
      `;
      return;
    }

    // Stack array has index 0 as top. Render from top to bottom
    let html = '';
    stackItems.forEach((symbol, idx) => {
      const isTop = idx === 0;
      const isBottom = idx === stackItems.length - 1;
      const isBaseSymbol = symbol === 'Z0' || symbol === 'Z₀';

      const symbolColorClass = isBaseSymbol ? 'symbol-z0' : (symbol === 'X' ? 'symbol-x' : 'symbol-custom');

      html += `
        <div class="stack-item ${isTop ? 'stack-top' : ''} ${symbolColorClass}">
          <div class="stack-item-slot-left">
            ${isTop ? '<span class="top-pointer-badge">TOP</span>' : ''}
          </div>
          <div class="stack-item-slot-center">
            <span class="stack-item-text">${symbol}</span>
          </div>
          <div class="stack-item-slot-right">
            ${isBottom && !isTop ? '<span class="bottom-label">BOT</span>' : ''}
          </div>
        </div>
      `;
    });

    this.stackContainer.innerHTML = html;
  }

  renderTape(inputString, headIndex, isRejected = false, isAccepted = false) {
    if (!this.tapeContainer) return;

    let html = '';
    const chars = inputString.length > 0 ? inputString.split('') : [];

    // If input is empty string
    if (chars.length === 0) {
      const statusClass = isRejected ? 'rejected-cell' : (isAccepted ? 'accepted-cell' : '');
      html += `
        <div class="tape-cell head-cell active-cell ${statusClass}">
          <div class="head-pointer">▼</div>
          <span class="char-text">ε</span>
          <span class="tape-index">0</span>
        </div>
      `;
    } else {
      chars.forEach((char, idx) => {
        const isCurrent = idx === headIndex;
        const isConsumed = idx < headIndex;
        let cellClass = '';
        if (isCurrent) {
          const statusClass = isRejected ? 'rejected-cell' : (isAccepted ? 'accepted-cell' : '');
          cellClass = `head-cell active-cell ${statusClass}`;
        } else if (isConsumed) {
          cellClass = 'consumed-cell';
        }

        html += `
          <div class="tape-cell ${cellClass}" data-idx="${idx}">
            ${isCurrent ? '<div class="head-pointer">▼</div>' : ''}
            <span class="char-text">${char}</span>
            <span class="tape-index">${idx}</span>
          </div>
        `;
      });

      // Show end-of-string marker ⊔
      const isPastEnd = headIndex >= chars.length;
      let endCellClass = 'end-marker';
      if (isPastEnd) {
        const statusClass = isRejected ? 'rejected-cell' : (isAccepted ? 'accepted-cell' : '');
        endCellClass += ` head-cell active-cell ${statusClass}`;
      }
      html += `
        <div class="tape-cell ${endCellClass}">
          ${isPastEnd ? '<div class="head-pointer">▼</div>' : ''}
          <span class="char-text">⊔</span>
          <span class="tape-index">end</span>
        </div>
      `;
    }

    this.tapeContainer.innerHTML = html;

    // Scroll tape container smoothly to keep head visible without moving browser window
    const activeCell = this.tapeContainer.querySelector('.active-cell');
    if (activeCell) {
      const containerWidth = this.tapeContainer.clientWidth;
      const cellLeft = activeCell.offsetLeft;
      const cellWidth = activeCell.offsetWidth;
      const targetScroll = cellLeft - (containerWidth / 2) + (cellWidth / 2);
      this.tapeContainer.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }

  renderTraceTable(precomputedTrace, currentStepIndex, onRowClick = null) {
    if (!this.traceTableBody) return;

    let html = '';
    precomputedTrace.forEach((node, idx) => {
      const isCurrent = idx === currentStepIndex;
      const stackStr = node.stack.length > 0 ? node.stack.join('') : 'ε';
      const remainingInput = node.inputIndex < (this.originalInput || '').length 
        ? (this.originalInput || '').slice(node.inputIndex) 
        : 'ε';

      const configStr = `(${node.state}, ${remainingInput}, ${stackStr})`;

      let statusBadge = '';
      if (node.isRejected) {
        statusBadge = '<span class="badge badge-reject">Rejected</span>';
      } else if (idx === precomputedTrace.length - 1 && !node.isRejected) {
        statusBadge = '<span class="badge badge-accept">Accepted</span>';
      } else if (idx === 0) {
        statusBadge = '<span class="badge badge-start">Start</span>';
      } else {
        statusBadge = `<span class="badge badge-step">Step ${node.step}</span>`;
      }

      html += `
        <tr class="trace-row ${isCurrent ? 'active-trace-row' : ''}" data-step-idx="${idx}">
          <td class="col-step">${idx}</td>
          <td class="col-state"><span class="state-pill">${node.state}</span></td>
          <td class="col-input"><code class="mono-code">${remainingInput}</code></td>
          <td class="col-stack"><code class="mono-code">${stackStr}</code></td>
          <td class="col-action" title="${configStr}">${node.note || ''}</td>
          <td class="col-status">${statusBadge}</td>
        </tr>
      `;
    });

    this.traceTableBody.innerHTML = html;

    // Add click listeners to jump
    if (onRowClick) {
      this.traceTableBody.querySelectorAll('.trace-row').forEach(row => {
        row.addEventListener('click', () => {
          const stepIdx = parseInt(row.dataset.stepIdx, 10);
          onRowClick(stepIdx);
        });
      });
    }

    // Scroll active row into view inside the table wrapper ONLY (never scrolls window)
    const activeRow = this.traceTableBody.querySelector('.active-trace-row');
    if (activeRow) {
      const tableWrapper = this.traceTableBody.closest('.table-wrapper');
      if (tableWrapper) {
        const rowTop = activeRow.offsetTop;
        const rowHeight = activeRow.offsetHeight;
        const wrapperScrollTop = tableWrapper.scrollTop;
        const wrapperHeight = tableWrapper.clientHeight;

        if (rowTop < wrapperScrollTop) {
          tableWrapper.scrollTo({ top: Math.max(0, rowTop - 20), behavior: 'smooth' });
        } else if (rowTop + rowHeight > wrapperScrollTop + wrapperHeight) {
          tableWrapper.scrollTo({ top: rowTop + rowHeight - wrapperHeight + 20, behavior: 'smooth' });
        }
      }
    }
  }

  updateCurrentID(config, originalInput, isRejected = false, isAccepted = false, failureNote = '', preset = null, activeNode = null) {
    if (!this.currentIdEl) return;
    
    const explanation = explainPdaConfig(config, originalInput, isRejected, isAccepted, failureNote, preset, activeNode);
    const baseFormula = `( ${config.state},  "${explanation.remaining}",  [ ${explanation.stackStr} ] )`;

    const boxEl = this.currentIdEl.closest('.current-id-box');
    if (boxEl) {
      boxEl.classList.remove('box-rejected', 'box-accepted', 'box-running');
      if (isRejected) {
        boxEl.classList.add('box-rejected');
      } else if (isAccepted) {
        boxEl.classList.add('box-accepted');
      } else {
        boxEl.classList.add('box-running');
      }
    }

    let formulaClass = '';
    let pillClass = 'pill-neutral';
    let pillIcon = '○';

    if (isRejected) {
      formulaClass = 'id-text-rejected';
      pillClass = 'pill-rejected';
      pillIcon = '✕';
    } else if (isAccepted) {
      formulaClass = 'id-text-accepted';
      pillClass = 'pill-accepted';
      pillIcon = '✓';
    }

    const cleanBadgeText = (explanation.whyBadge || '').replace(/^[✕✓○ℹ]\s*/, '');

    this.currentIdEl.innerHTML = `
      <div class="id-main-formula ${formulaClass}">${baseFormula}</div>
      <div class="id-status-pill ${pillClass}">
        <span class="status-icon">${pillIcon}</span> ${cleanBadgeText}
      </div>

      <div class="id-criteria-checklist">
        <div class="criteria-item ${explanation.tapeCriteria.pass ? 'pass' : 'fail'}">
          <span class="criteria-icon">${explanation.tapeCriteria.pass ? '✓' : '✕'}</span>
          <span class="criteria-label">${explanation.tapeCriteria.title}:</span>
          <span class="criteria-val">${explanation.tapeCriteria.status}</span>
        </div>
        <div class="criteria-item ${explanation.stateCriteria.pass ? 'pass' : 'fail'}">
          <span class="criteria-icon">${explanation.stateCriteria.pass ? '✓' : '✕'}</span>
          <span class="criteria-label">${explanation.stateCriteria.title}:</span>
          <span class="criteria-val">${explanation.stateCriteria.status}</span>
        </div>
        <div class="criteria-item ${explanation.stackCriteria.pass ? 'pass' : 'neutral'}">
          <span class="criteria-icon">${explanation.stackCriteria.pass ? '✓' : '•'}</span>
          <span class="criteria-label">${explanation.stackCriteria.title}:</span>
          <span class="criteria-val">${explanation.stackCriteria.status}</span>
        </div>
      </div>

      <div class="id-why-box why-${explanation.whyType}">
        <div class="why-title">
          <span class="why-icon">${isRejected ? '✕' : (isAccepted ? '✓' : 'ℹ')}</span>
          <span>${explanation.whyTitle}</span>
        </div>
        <div class="why-mechanical">${explanation.mechanicalReason}</div>
        <div class="why-mathematical">${explanation.mathematicalReason}</div>
      </div>
    `;
  }
}

export function explainPdaConfig(config, originalInput, isRejected, isAccepted, failureNote, preset, activeNode) {
  const inputVal = originalInput || '';
  const remaining = inputVal.slice(config.headIndex) || 'ε';
  const stack = config.stack || [];
  const stackTop = stack[0] || 'empty';
  const stackStr = stack.length > 0 ? stack.join('') : 'ε';
  const state = config.state;
  const isInputConsumed = config.headIndex >= inputVal.length;
  const isStateAccept = Boolean(preset?.acceptStates?.includes(state));
  const acceptMode = preset?.acceptMode || 'state';
  const isStackEmpty = stack.length === 0 || (stack.length === 1 && stack[0] === 'Z0' && acceptMode === 'empty');

  // Tape criteria
  const tapeCriteria = {
    pass: isInputConsumed,
    title: 'Tape Input',
    status: isInputConsumed ? 'All consumed (w = ε)' : `Remaining: "${remaining}"`
  };

  // State criteria
  const stateCriteria = {
    pass: isStateAccept,
    title: 'State in F',
    status: isStateAccept ? `${state} ∈ F (Accepting)` : `${state} ∉ F (Non-accepting)`
  };

  // Stack criteria
  let stackCriteria = {
    pass: true,
    title: 'Stack',
    status: `[ ${stackStr} ]`
  };
  if (acceptMode === 'empty') {
    stackCriteria.pass = isStackEmpty;
    stackCriteria.status = isStackEmpty ? 'Empty (Pass)' : `[ ${stackStr} ] (Not empty)`;
  } else if (acceptMode === 'both') {
    stackCriteria.pass = isStackEmpty;
    stackCriteria.status = isStackEmpty ? 'Empty (Pass)' : `[ ${stackStr} ] (Not empty)`;
  }

  // Generate Why Accepted / Rejected
  let whyTitle = '';
  let whyBadge = '';
  let whyType = 'running'; // 'rejected' | 'accepted' | 'running'
  let mechanicalReason = '';
  let mathematicalReason = '';

  const presetId = preset?.id || '';

  if (isRejected) {
    whyType = 'rejected';
    whyTitle = 'Why Rejected (w ∉ L):';
    whyBadge = '✕ Rejected (w ∉ L)';

    // 1. Mechanical reason
    if (!isInputConsumed) {
      const nextChar = remaining[0];
      mechanicalReason = `PDA halted in state '${state}' with unread input remaining ("${remaining}"). There is no transition defined for symbol '${nextChar}' with stack top '${stackTop}'.`;
    } else if (!isStateAccept) {
      mechanicalReason = `All tape symbols were consumed (w = ε), but the PDA halted in non-accepting state '${state}'. Under final-state acceptance, the automaton must reach an accepting state in {${preset?.acceptStates?.join(', ') || 'q2'}}.`;
    } else if (acceptMode === 'empty' && !isStackEmpty) {
      mechanicalReason = `All input symbols were consumed, but the stack is not empty ([ ${stackStr} ]). Acceptance by empty stack requires popping all stack symbols.`;
    } else {
      mechanicalReason = failureNote || 'No accepting transition path exists for this input string.';
    }

    // 2. Mathematical reason based on preset
    if (presetId.startsWith('0n1_2n')) {
      const count0 = (inputVal.match(/0/g) || []).length;
      const count1 = (inputVal.match(/1/g) || []).length;
      const first1 = inputVal.indexOf('1');
      const last0 = inputVal.lastIndexOf('0');

      if (first1 !== -1 && last0 !== -1 && first1 < last0) {
        mathematicalReason = `Language requires pattern 0ⁿ 1²ⁿ. Here, '0' appears after '1' (symbols out of order).`;
      } else if (count0 === 0) {
        mathematicalReason = `Language condition n ≥ 1 requires at least one '0' and two '1's (found 0 zeros).`;
      } else if (count1 !== 2 * count0) {
        mathematicalReason = `Count mismatch: string has ${count0} zero(s) (n = ${count0}), which requires exactly ${2 * count0} ones (2n = ${2 * count0}), but contains ${count1} one(s) (${count1 > 2 * count0 ? `${count1 - 2 * count0} extra` : `${2 * count0 - count1} missing`}).`;
      } else {
        mathematicalReason = `String violates the language condition L = {0ⁿ 1²ⁿ | n ≥ 1}.`;
      }
    } else if (presetId === '0n1n') {
      const count0 = (inputVal.match(/0/g) || []).length;
      const count1 = (inputVal.match(/1/g) || []).length;
      if (count0 === 0) {
        mathematicalReason = `Condition n ≥ 1 requires at least one '0' and one '1'.`;
      } else if (count0 !== count1) {
        mathematicalReason = `Count mismatch: N₀ = ${count0} ≠ N₁ = ${count1}. Equal counts of 0s and 1s are required.`;
      } else {
        mathematicalReason = `String violates pattern 0ⁿ 1ⁿ.`;
      }
    } else if (presetId === 'wcw_r') {
      if (!inputVal.includes('c')) {
        mathematicalReason = `Missing center marker 'c'. Language requires format w c wᴿ with a single center marker.`;
      } else {
        const parts = inputVal.split('c');
        if (parts.length > 2) {
          mathematicalReason = `Multiple center markers 'c' found. Language requires exactly one marker 'c'.`;
        } else {
          const w1 = parts[0];
          const w2 = parts[1];
          const w1Rev = w1.split('').reverse().join('');
          if (w2 !== w1Rev) {
            mathematicalReason = `Palindrome mismatch: left side "${w1}" reversed is "${w1Rev}", which does not match right side "${w2}".`;
          }
        }
      }
    } else if (presetId === 'balanced_parentheses') {
      mathematicalReason = `Parentheses are unbalanced or a closing parenthesis appeared without a matching opening parenthesis.`;
    } else {
      mathematicalReason = failureNote || `String does not satisfy the automaton language constraints.`;
    }
  } else if (isAccepted) {
    whyType = 'accepted';
    whyTitle = 'Why Accepted (w ∈ L):';
    whyBadge = '✓ Accepted (w ∈ L)';

    mechanicalReason = `All input symbols were consumed (w = ε), the stack was balanced, and the PDA reached final state '${state}' ∈ F.`;

    if (presetId.startsWith('0n1_2n')) {
      const count0 = (inputVal.match(/0/g) || []).length;
      mathematicalReason = `Satisfies L = {0ⁿ 1²ⁿ}: Contains ${count0} zero(s) followed by exactly ${2 * count0} one(s) (n = ${count0}, 2n = ${2 * count0}). Every '0' pushed two 'X's and every '1' popped one 'X', completely balancing the stack.`;
    } else if (presetId === '0n1n') {
      const count0 = (inputVal.match(/0/g) || []).length;
      mathematicalReason = `Satisfies L = {0ⁿ 1ⁿ}: Contains exactly ${count0} zero(s) and ${count0} one(s) (n = ${count0}). All pushed symbols were matched and popped.`;
    } else if (presetId === 'wcw_r') {
      const parts = inputVal.split('c');
      mathematicalReason = `Satisfies L = {w c wᴿ}: Substring "${parts[0]}" before 'c' is the exact reverse of "${parts[1]}" after 'c'.`;
    } else if (presetId === 'balanced_parentheses') {
      mathematicalReason = `Satisfies Balanced Parentheses: Every open parenthesis '(' was successfully paired and closed by a matching ')'.`;
    } else {
      mathematicalReason = `Input successfully satisfied all transition and acceptance constraints.`;
    }
  } else {
    // In progress or Step 0
    whyType = 'running';
    const isStep0 = config.step === 0;
    whyTitle = isStep0 ? 'Simulation Initialized:' : `Step ${config.step} in progress:`;
    whyBadge = isStep0 ? 'Ready at Step 0' : `Step ${config.step} (Running)`;

    if (isStep0) {
      mechanicalReason = `Tape is initialized at index 0. Current state is start state '${state}', and stack contains initial symbol [ ${stackStr} ].`;
      mathematicalReason = `Click Play or Step (→) to observe transition steps, stack pushes/pops, and state changes.`;
    } else {
      mechanicalReason = activeNode?.note || `Processing input. Remaining tape: "${remaining}".`;
      mathematicalReason = `To accept, the PDA must consume all remaining symbols "${remaining}" and enter an accept state in {${preset?.acceptStates?.join(', ') || 'q2'}}.`;
    }
  }

  return {
    remaining,
    stackStr,
    tapeCriteria,
    stateCriteria,
    stackCriteria,
    whyTitle,
    whyBadge,
    whyType,
    mechanicalReason,
    mathematicalReason
  };
}
