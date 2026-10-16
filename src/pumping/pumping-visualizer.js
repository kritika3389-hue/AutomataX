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

  renderPumpedResult(pumpData) {
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

    // Result banner
    if (this.resultBannerEl) {
      if (!pumpData.inLang) {
        this.resultBannerEl.className = 'result-banner result-contradiction';
        this.resultBannerEl.innerHTML = `
          <div class="banner-icon">⚡</div>
          <div class="banner-body">
            <h4>Contradiction Reached: s_${pumpData.i} ∉ L !</h4>
            <p>${pumpData.reason}</p>
            <div class="banner-conclusion">
              Since <strong>uv<sup>${pumpData.i}</sup>wx<sup>${pumpData.i}</sup>y ∉ L</strong>, the Pumping Lemma condition is broken!
            </div>
          </div>
        `;
      } else {
        this.resultBannerEl.className = 'result-banner result-valid';
        this.resultBannerEl.innerHTML = `
          <div class="banner-icon">ℹ</div>
          <div class="banner-body">
            <h4>String s_${pumpData.i} ∈ L (No contradiction yet)</h4>
            <p>${pumpData.reason}</p>
            <div class="banner-hint">
              Try setting <strong>i = 2</strong> or <strong>i = 0</strong> to break symbol equality!
            </div>
          </div>
        `;
      }
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
