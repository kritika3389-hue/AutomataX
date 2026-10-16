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

  renderDiagram(pda, currentStateId, activeTransition = null) {
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

      svgContent += `
        <g class="state-node ${isCurrent ? 'current-state' : ''}" data-state-id="${state.id}" transform="translate(${state.x}, ${state.y})">
          ${isCurrent ? `<circle r="${circleRadius + 8}" fill="none" stroke="#6366f1" stroke-width="2" opacity="0.35" class="pulse-ring" />` : ''}
          <circle r="${circleRadius}" fill="${isCurrent ? '#eef2ff' : '#ffffff'}" stroke="${isCurrent ? '#4f46e5' : (isAccept ? '#059669' : '#94a3b8')}" stroke-width="${isCurrent ? '2.5' : '1.8'}" filter="${isCurrent ? 'url(#glow)' : 'url(#node-shadow)'}" />
          ${isAccept ? `<circle r="${circleRadius - 5}" fill="none" stroke="${isCurrent ? '#4f46e5' : '#059669'}" stroke-width="1.5" />` : ''}
          <text text-anchor="middle" dominant-baseline="central" font-family="'JetBrains Mono', monospace" font-size="15" font-weight="700" fill="${isCurrent ? '#4338ca' : '#0f172a'}">${state.label || state.id}</text>
          <text y="${circleRadius + 18}" text-anchor="middle" font-family="'Inter', sans-serif" font-size="10" fill="#64748b">${state.desc || ''}</text>
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

  renderTape(inputString, headIndex) {
    if (!this.tapeContainer) return;

    let html = '';
    const chars = inputString.length > 0 ? inputString.split('') : [];

    // If input is empty string
    if (chars.length === 0) {
      html += `
        <div class="tape-cell head-cell active-cell">
          <div class="head-pointer">▼</div>
          <span class="char-text">ε</span>
          <span class="tape-index">0</span>
        </div>
      `;
    } else {
      chars.forEach((char, idx) => {
        const isCurrent = idx === headIndex;
        const isConsumed = idx < headIndex;

        html += `
          <div class="tape-cell ${isCurrent ? 'head-cell active-cell' : ''} ${isConsumed ? 'consumed-cell' : ''}" data-idx="${idx}">
            ${isCurrent ? '<div class="head-pointer">▼</div>' : ''}
            <span class="char-text">${char}</span>
            <span class="tape-index">${idx}</span>
          </div>
        `;
      });

      // Show end-of-string marker $
      const isPastEnd = headIndex >= chars.length;
      html += `
        <div class="tape-cell end-marker ${isPastEnd ? 'head-cell active-cell' : ''}">
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

  updateCurrentID(config, originalInput) {
    if (!this.currentIdEl) return;
    const remaining = originalInput.slice(config.headIndex) || 'ε';
    const stackStr = config.stack.length > 0 ? config.stack.join('') : 'ε';
    this.currentIdEl.textContent = `( ${config.state},  "${remaining}",  [ ${stackStr} ] )`;
  }
}
