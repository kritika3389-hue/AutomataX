// CFL Pumping Lemma Visualizer

export class PumpingVisualizer {
  constructor(elements) {
    this.ribbonEl = elements.ribbonContainer;
    this.lengthsEl = elements.lengthsDisplay;
    this.cond1El = elements.cond1Badge;
    this.cond2El = elements.cond2Badge;
    this.pumpedStringEl = elements.pumpedStringDisplay;
    this.balanceBarsEl = elements.balanceBars;
    this.resultBannerEl = elements.resultBanner;
    this.caseAnalysisEl = elements.caseAnalysisText;
    this.sliderI = elements.pumpISlider;
    this.valI = elements.pumpIValue;
  }

  renderPartitionRibbon(pumpingEngine, onPartitionChange) {
    if (!this.ribbonEl) return;

    const s = pumpingEngine.s;
    const { i1, i2, i3, i4 } = pumpingEngine.partition;
    const len = s.length;

    let html = `
      <div class="ribbon-chars">
    `;

    for (let idx = 0; idx < len; idx++) {
      const char = s[idx];
      let seg = 'u';
      if (idx >= i1 && idx < i2) seg = 'v';
      else if (idx >= i2 && idx < i3) seg = 'w';
      else if (idx >= i3 && idx < i4) seg = 'x';
      else if (idx >= i4) seg = 'y';

      html += `
        <div class="ribbon-char seg-${seg}" data-idx="${idx}">
          <span class="char-val">${char}</span>
          <span class="char-seg-tag">${seg}</span>
        </div>
      `;
    }

    html += `</div>`;

    // Sliders for partition boundaries i1, i2, i3, i4
    html += `
      <div class="partition-controls">
        <div class="control-row">
          <label><span class="badge-seg seg-u">u / v split (i₁)</span>: <b id="val-i1">${i1}</b></label>
          <input type="range" class="part-slider" id="slider-i1" min="0" max="${len}" value="${i1}">
        </div>
        <div class="control-row">
          <label><span class="badge-seg seg-v">v / w split (i₂)</span>: <b id="val-i2">${i2}</b></label>
          <input type="range" class="part-slider" id="slider-i2" min="0" max="${len}" value="${i2}">
        </div>
        <div class="control-row">
          <label><span class="badge-seg seg-w">w / x split (i₃</span>: <b id="val-i3">${i3}</b></label>
          <input type="range" class="part-slider" id="slider-i3" min="0" max="${len}" value="${i3}">
        </div>
        <div class="control-row">
          <label><span class="badge-seg seg-x">x / y split (i₄)</span>: <b id="val-i4">${i4}</b></label>
          <input type="range" class="part-slider" id="slider-i4" min="0" max="${len}" value="${i4}">
        </div>
      </div>
    `;

    this.ribbonEl.innerHTML = html;

    // Attach slider events
    const s1 = this.ribbonEl.querySelector('#slider-i1');
    const s2 = this.ribbonEl.querySelector('#slider-i2');
    const s3 = this.ribbonEl.querySelector('#slider-i3');
    const s4 = this.ribbonEl.querySelector('#slider-i4');

    const updateFromSliders = () => {
      let v1 = parseInt(s1.value, 10);
      let v2 = parseInt(s2.value, 10);
      let v3 = parseInt(s3.value, 10);
      let v4 = parseInt(s4.value, 10);

      // Enforce order 0 <= v1 <= v2 <= v3 <= v4 <= len
      if (v2 < v1) v2 = v1;
      if (v3 < v2) v3 = v2;
      if (v4 < v3) v4 = v3;

      s1.value = v1;
      s2.value = v2;
      s3.value = v3;
      s4.value = v4;

      onPartitionChange(v1, v2, v3, v4);
    };

    [s1, s2, s3, s4].forEach(slider => {
      slider.addEventListener('input', updateFromSliders);
    });
  }

  renderConditionsAndLengths(validation, segments, p) {
    if (this.lengthsEl) {
      this.lengthsEl.innerHTML = `
        <div class="seg-len-pill seg-u">|u| = ${segments.u.length} ("${segments.u || 'ε'}")</div>
        <div class="seg-len-pill seg-v">|v| = ${segments.v.length} ("${segments.v || 'ε'}")</div>
        <div class="seg-len-pill seg-w">|w| = ${segments.w.length} ("${segments.w || 'ε'}")</div>
        <div class="seg-len-pill seg-x">|x| = ${segments.x.length} ("${segments.x || 'ε'}")</div>
        <div class="seg-len-pill seg-y">|y| = ${segments.y.length} ("${segments.y || 'ε'}")</div>
      `;
    }

    if (this.cond1El) {
      this.cond1El.className = `cond-badge ${validation.cond1.pass ? 'cond-pass' : 'cond-fail'}`;
      this.cond1El.innerHTML = validation.cond1.message;
    }

    if (this.cond2El) {
      this.cond2El.className = `cond-badge ${validation.cond2.pass ? 'cond-pass' : 'cond-fail'}`;
      this.cond2El.innerHTML = validation.cond2.message;
    }
  }

  renderPumpedResult(pumpData, pumpingEngine = null) {
    if (this.valI) this.valI.textContent = pumpData.i;
    if (this.sliderI) this.sliderI.value = pumpData.i;

    // Render string with styled segments
    if (this.pumpedStringEl) {
      let html = '';
      if (pumpData.u) html += `<span class="pump-seg seg-u" title="u">${pumpData.u}</span>`;
      if (pumpData.v && pumpData.i > 0) {
        html += `<span class="pump-seg seg-v" title="v^${pumpData.i}">${pumpData.pumpedV}<small class="sub-i">v<sup>${pumpData.i}</sup></small></span>`;
      } else if (pumpData.i === 0 && pumpData.v) {
        html += `<span class="pump-seg seg-v empty-seg" title="v^0">(v removed)</span>`;
      }
      if (pumpData.w) html += `<span class="pump-seg seg-w" title="w">${pumpData.w}</span>`;
      if (pumpData.x && pumpData.i > 0) {
        html += `<span class="pump-seg seg-x" title="x^${pumpData.i}">${pumpData.pumpedX}<small class="sub-i">x<sup>${pumpData.i}</sup></small></span>`;
      } else if (pumpData.i === 0 && pumpData.x) {
        html += `<span class="pump-seg seg-x empty-seg" title="x^0">(x removed)</span>`;
      }
      if (pumpData.y) html += `<span class="pump-seg seg-y" title="y">${pumpData.y}</span>`;

      if (pumpData.pumpedString === '') {
        html = '<span class="empty-seg">ε (Empty String)</span>';
      }

      this.pumpedStringEl.innerHTML = html;
    }

    // Render symbol frequency comparison bars for ANY custom symbols
    if (this.balanceBarsEl && pumpData.counts) {
      const keys = Object.keys(pumpData.counts);
      let maxVal = Math.max(...Object.values(pumpData.counts), 1);
      const palette = ['#06b6d4', '#a855f7', '#f59e0b', '#10b981', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];
      
      let barsHtml = '';
      keys.forEach((k, idx) => {
        const count = pumpData.counts[k] || 0;
        const pct = Math.min(100, Math.round((count / (maxVal * 1.2)) * 100));
        const color = palette[idx % palette.length];
        barsHtml += `
          <div class="balance-col">
            <div class="bar-track">
              <div class="bar-fill fill-${k}" style="height: ${pct}%; background: ${color};">
                <span class="bar-count">${count}</span>
              </div>
            </div>
            <div class="bar-label">Symbol '${k}'</div>
          </div>
        `;
      });

      this.balanceBarsEl.innerHTML = barsHtml;
    }

    // Result banner: Comprehensive Configuration & Why Accepted/Rejected Breakdown
    if (this.resultBannerEl) {
      const p = pumpingEngine ? pumpingEngine.p : 3;
      const validation = pumpingEngine ? pumpingEngine.validateConditions() : { cond1: { pass: true }, cond2: { pass: true } };
      const cond1Pass = validation.cond1.pass;
      const cond2Pass = validation.cond2.pass;
      const vwxLen = (pumpData.v?.length || 0) + (pumpData.w?.length || 0) + (pumpData.x?.length || 0);
      const vxLen = (pumpData.v?.length || 0) + (pumpData.x?.length || 0);

      const countsKeys = pumpData.counts ? Object.keys(pumpData.counts) : [];
      let countsHtml = '';
      if (countsKeys.length > 0) {
        countsHtml = `<div class="why-counts-badges">` +
          countsKeys.map(k => `<span class="why-count-pill"><span class="cnt-sym">N<sub>${k}</sub></span> = <b>${pumpData.counts[k]}</b></span>`).join('') +
          `</div>`;
      }

      let whyExplanation = '';
      let proofConclusion = '';

      if (!pumpData.inLang) {
        this.resultBannerEl.className = 'result-banner result-contradiction';
        whyExplanation = `Pumping with <b>i = ${pumpData.i}</b> produced string <code>s_${pumpData.i} = "${pumpData.pumpedString || 'ε'}"</code>. <b>${pumpData.reason}</b>. Because |vwx| ≤ p (${p}), the substring vwx cannot reach across all required distinct symbol blocks of the string. Thus, pumping alters only a subset of symbol counts while leaving untouched symbols fixed, permanently destroying required symbol equality.`;
        proofConclusion = `Formal Proof Verdict: The CFL Pumping Lemma states that if L were context-free, s_i MUST belong to L for EVERY integer i ≥ 0. Since s_${pumpData.i} ∉ L, this partition fails. By adversary exhaustive search, every possible partition fails; therefore, the language is PROVEN NOT CONTEXT-FREE. ∎`;
      } else {
        this.resultBannerEl.className = 'result-banner result-valid';
        whyExplanation = `For <b>i = ${pumpData.i}</b>, the pumped string <code>s_${pumpData.i} = "${pumpData.pumpedString || 'ε'}"</code> currently satisfies the language condition (<b>${pumpData.reason}</b>).`;
        proofConclusion = `Pumping Lemma Requirement: To prove a language is context-free, s_i must remain in L for ALL i ≥ 0. However, this language is non-CFL! Try setting i = 2 (pump up) or i = 0 (pump down) to break equality and witness the contradiction.`;
      }

      this.resultBannerEl.innerHTML = `
        <div class="pumping-config-breakdown">
          <!-- 1. Configuration ID -->
          <div class="pumping-config-header">
            <div class="pumping-config-title">
              <span class="pumping-tag-badge">CONFIGURATION</span>
              <code class="pumping-config-tuple">(u="${pumpData.u || 'ε'}", v="${pumpData.v || 'ε'}", w="${pumpData.w || 'ε'}", x="${pumpData.x || 'ε'}", y="${pumpData.y || 'ε'}", i=${pumpData.i})</code>
            </div>
            <span class="pumping-verdict-chip ${pumpData.inLang ? 'chip-success' : 'chip-danger'}">
              ${pumpData.inLang ? '✓ In Language (s_i ∈ L)' : '⚡ Contradiction (s_i ∉ L — REJECTED)'}
            </span>
          </div>

          <!-- 2. Three Formal Criteria Checklist -->
          <div class="pumping-criteria-checklist">
            <div class="pumping-crit-item ${cond1Pass ? 'pass' : 'fail'}">
              <span class="crit-icon">${cond1Pass ? '✓' : '✕'}</span>
              <span class="crit-label">Condition 1 (|vwx| ≤ p):</span>
              <span class="crit-val">|vwx| = ${vwxLen} ≤ ${p} (${cond1Pass ? 'Pass' : 'Violation'})</span>
            </div>
            <div class="pumping-crit-item ${cond2Pass ? 'pass' : 'fail'}">
              <span class="crit-icon">${cond2Pass ? '✓' : '✕'}</span>
              <span class="crit-label">Condition 2 (|vx| ≥ 1):</span>
              <span class="crit-val">|vx| = ${vxLen} ≥ 1 (${cond2Pass ? 'Pass' : 'Violation'})</span>
            </div>
            <div class="pumping-crit-item ${pumpData.inLang ? 'pass' : 'fail'}">
              <span class="crit-icon">${pumpData.inLang ? '✓' : '⚡'}</span>
              <span class="crit-label">Condition 3 (s_i ∈ L):</span>
              <span class="crit-val">${pumpData.inLang ? `s_${pumpData.i} ∈ L (Holds for i=${pumpData.i})` : `s_${pumpData.i} ∉ L (Contradiction)`}</span>
            </div>
          </div>

          <!-- 3. "Why Accepted / Rejected" Explanation -->
          <div class="pumping-why-box ${pumpData.inLang ? 'why-valid' : 'why-contradiction'}">
            <div class="pumping-why-title">
              <span class="pumping-why-icon">${pumpData.inLang ? 'ℹ' : '⚡'}</span>
              <span>${pumpData.inLang ? `Why s_${pumpData.i} is Accepted for i = ${pumpData.i}:` : `Why s_${pumpData.i} is Rejected from L (Contradiction Proven):`}</span>
            </div>
            ${countsHtml}
            <p class="pumping-why-text">${whyExplanation}</p>
            <div class="pumping-proof-note">${proofConclusion}</div>
          </div>
        </div>
      `;
    }

    // Case Analysis box
    if (this.caseAnalysisEl && pumpData.analysis) {
      this.caseAnalysisEl.innerHTML = `
        <div class="analysis-card">
          <div class="analysis-header">${pumpData.analysis.caseTitle}</div>
          <p class="analysis-body">${pumpData.analysis.caseDesc}</p>
          <div class="recommended-i-hint">
            <strong>Optimal Pumping Factor:</strong> Try <code>i = ${pumpData.analysis.recommendedI}</code>
          </div>
        </div>
      `;
    }
  }
}
