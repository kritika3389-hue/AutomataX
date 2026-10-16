// CFL Pumping Lemma Computational Engine
export class PumpingEngine {
  constructor(preset) {
    this.preset = preset;
    this.p = preset.defaultP || 3;
    this.resetStringAndPartition();
  }

  setPreset(preset) {
    this.preset = preset;
    this.p = preset.defaultP || 3;
    this.resetStringAndPartition();
  }

  setP(newP) {
    this.p = Math.max(this.preset.minP || 2, Math.min(this.preset.maxP || 6, parseInt(newP, 10)));
    this.resetStringAndPartition();
  }

  resetStringAndPartition() {
    this.s = this.preset.generateString(this.p);
    
    // Choose sensible default partition satisfying |vwx| <= p and |vx| >= 1
    // For 000111222 with p=3: let v be one '0', w be '0', x be one '1'
    const len = this.s.length;
    
    // Default partition: pick v in first block, w between, x in second block
    // Ensure |vwx| <= p
    const i1 = Math.max(0, this.p - 2);
    const i2 = i1 + 1;
    const i3 = i2 + 1;
    const i4 = i1 + this.p;

    this.partition = {
      i1: i1,
      i2: i2,
      i3: i3,
      i4: Math.min(i4, len)
    };

    this.pumpI = 2; // Default to pumping i=2
  }

  setCustomString(newString) {
    if (!newString || newString.trim().length === 0) return;
    this.s = newString.trim();
    const len = this.s.length;
    const windowSize = Math.min(this.p, Math.max(2, Math.floor(len / 3)));
    const i1 = Math.min(len - 1, Math.max(0, Math.floor(len / 4)));
    const i4 = Math.min(len, i1 + windowSize);
    const i2 = Math.min(i4, i1 + 1);
    const i3 = Math.min(i4, i2 + 1);

    this.partition = {
      i1,
      i2,
      i3,
      i4
    };
  }

  getSegments() {
    const { i1, i2, i3, i4 } = this.partition;
    const u = this.s.slice(0, i1);
    const v = this.s.slice(i1, i2);
    const w = this.s.slice(i2, i3);
    const x = this.s.slice(i3, i4);
    const y = this.s.slice(i4);

    return { u, v, w, x, y };
  }

  setPartition(i1, i2, i3, i4) {
    const len = this.s.length;
    // Clamp indices
    const clampedI1 = Math.max(0, Math.min(i1, len));
    const clampedI2 = Math.max(clampedI1, Math.min(i2, len));
    const clampedI3 = Math.max(clampedI2, Math.min(i3, len));
    const clampedI4 = Math.max(clampedI3, Math.min(i4, len));

    this.partition = {
      i1: clampedI1,
      i2: clampedI2,
      i3: clampedI3,
      i4: clampedI4
    };
  }

  validateConditions() {
    const { u, v, w, x, y } = this.getSegments();
    const vwxLen = v.length + w.length + x.length;
    const vxLen = v.length + x.length;

    const cond1 = vwxLen <= this.p; // |vwx| <= p
    const cond2 = vxLen >= 1;        // |vx| >= 1

    return {
      isValid: cond1 && cond2,
      cond1: {
        pass: cond1,
        message: cond1 
          ? `✓ |vwx| = ${vwxLen} ≤ p (${this.p})` 
          : `✗ Violation: |vwx| = ${vwxLen} > p (${this.p}). CFL lemma requires |vwx| ≤ p!`
      },
      cond2: {
        pass: cond2,
        message: cond2 
          ? `✓ |vx| = ${vxLen} ≥ 1 (non-empty pumped string)` 
          : `✗ Violation: |vx| = 0. Both v and x cannot be empty (ε)!`
      },
      vwxLen,
      vxLen
    };
  }

  getPumpedString(i = null) {
    const factor = i !== null ? i : this.pumpI;
    const { u, v, w, x, y } = this.getSegments();

    const pumpedV = v.repeat(factor);
    const pumpedX = x.repeat(factor);
    const pumpedString = u + pumpedV + w + pumpedX + y;

    const membership = this.preset.checkMembership(pumpedString);
    const analysis = this.preset.analyzePartition(u, v, w, x, y, this.p);

    return {
      i: factor,
      u,
      v,
      w,
      x,
      y,
      pumpedV,
      pumpedX,
      pumpedString,
      inLang: membership.inLang,
      reason: membership.reason,
      counts: membership.counts || {},
      analysis
    };
  }

  /**
   * Exhaustively enumerate all valid partitions (v, w, x) satisfying:
   * |vwx| <= p and |vx| >= 1
   * and prove that EVERY partition fails for some i.
   */
  computeAllPartitionsProof() {
    const len = this.s.length;
    const partitions = [];
    let contradictedCount = 0;

    for (let i1 = 0; i1 < len; i1++) {
      for (let i4 = i1 + 1; i4 <= Math.min(len, i1 + this.p); i4++) {
        // vwx spans i1 to i4, so |vwx| = i4 - i1 <= p
        for (let i2 = i1; i2 <= i4; i2++) {
          for (let i3 = i2; i3 <= i4; i3++) {
            const vLen = i2 - i1;
            const xLen = i4 - i3;
            if (vLen + xLen < 1) continue; // |vx| >= 1

            const u = this.s.slice(0, i1);
            const v = this.s.slice(i1, i2);
            const w = this.s.slice(i2, i3);
            const x = this.s.slice(i3, i4);
            const y = this.s.slice(i4);

            // Test i = 2 and i = 0
            const testI2 = u + v.repeat(2) + w + x.repeat(2) + y;
            const resI2 = this.preset.checkMembership(testI2);

            let winningI = 2;
            let winningRes = resI2;

            if (resI2.inLang) {
              const testI0 = u + w + y;
              const resI0 = this.preset.checkMembership(testI0);
              winningI = 0;
              winningRes = resI0;
            }

            const refuted = !winningRes.inLang;
            if (refuted) contradictedCount++;

            partitions.push({
              i1, i2, i3, i4,
              u, v, w, x, y,
              winningI,
              resultStr: winningI === 2 ? testI2 : u + w + y,
              reason: winningRes.reason,
              refuted
            });
          }
        }
      }
    }

    return {
      totalPartitions: partitions.length,
      contradictedCount,
      successRate: partitions.length > 0 ? (contradictedCount / partitions.length) * 100 : 0,
      partitionsSample: partitions.slice(0, 30)
    };
  }
}
