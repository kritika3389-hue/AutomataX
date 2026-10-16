// Presets and formal proofs for CFL Pumping Lemma
export const PUMPING_DEFAULT_PRESETS = [
  {
    id: '0n1n2n',
    name: 'L = {0ⁿ 1ⁿ 2ⁿ | n ≥ 1}',
    formula: 'L = \\{0^n 1^n 2^n \\mid n \\ge 1\\}',
    defaultP: 3,
    minP: 2,
    maxP: 6,
    alphabet: ['0', '1', '2'],
    description: 'Proves that equal counts of three different symbols cannot be maintained with a single pushdown stack.',
    generateString: (p) => '0'.repeat(p) + '1'.repeat(p) + '2'.repeat(p),
    checkMembership: (str) => {
      if (!str || str.length === 0) return { inLang: false, reason: 'Empty string (requires n ≥ 1)' };
      const match = str.match(/^(0+)(1+)(2+)$/);
      if (!match) {
        return { inLang: false, reason: 'String not in form 0* 1* 2* (symbols out of order or illegal characters)' };
      }
      const count0 = match[1].length;
      const count1 = match[2].length;
      const count2 = match[3].length;
      if (count0 === count1 && count1 === count2 && count0 >= 1) {
        return { 
          inLang: true, 
          reason: `Valid string: n = ${count0} (N₀ = ${count0}, N₁ = ${count1}, N₂ = ${count2})`,
          counts: { '0': count0, '1': count1, '2': count2 }
        };
      } else {
        return { 
          inLang: false, 
          reason: `Counts mismatch: N₀=${count0}, N₁=${count1}, N₂=${count2} (requires N₀ = N₁ = N₂)`,
          counts: { '0': count0, '1': count1, '2': count2 }
        };
      }
    },
    analyzePartition: (u, v, w, x, y, p) => {
      const vx = v + x;
      const has0 = vx.includes('0');
      const has1 = vx.includes('1');
      const has2 = vx.includes('2');
      const symbolTypesInVx = [has0, has1, has2].filter(Boolean).length;
      
      let caseTitle = '';
      let caseDesc = '';
      let recommendedI = 2;

      if (symbolTypesInVx === 1) {
        const char = has0 ? '0' : (has1 ? '1' : '2');
        caseTitle = `Case 1: vx consists entirely of '${char}'s`;
        caseDesc = `The pumped portion vx contains only '${char}'s. When pumped with i = 2, the number of '${char}'s increases while the other two symbols remain at count ${p}. Hence, symbol counts cannot be equal.`;
        recommendedI = 2;
      } else if (symbolTypesInVx === 2) {
        if (has0 && has1) {
          caseTitle = 'Case 2A: vx contains only 0s and 1s (no 2s)';
          caseDesc = `Because |vwx| ≤ p, vwx cannot cross from 0s all the way into 2s. The symbol '2' is completely untouched, so N₂(s_i) remains strictly ${p}. When pumped with i = 2, N₀ + N₁ increases, so N₀ or N₁ exceeds ${p}. Therefore, N₀ = N₁ = N₂ fails.`;
          recommendedI = 2;
        } else if (has1 && has2) {
          caseTitle = 'Case 2B: vx contains only 1s and 2s (no 0s)';
          caseDesc = `Because |vwx| ≤ p, vwx cannot reach 0s. The symbol '0' is completely untouched, so N₀(s_i) remains strictly ${p}. Pumping with i = 0 gives fewer 1s/2s than 0s, and pumping with i = 2 gives more 1s/2s than 0s. Contradiction!`;
          recommendedI = 0;
        } else {
          caseTitle = 'Case 2C: vx contains 0s and 2s';
          caseDesc = `Impossible under |vwx| ≤ p constraint, since the entire block of 1^p (length ${p}) separates 0s from 2s!`;
          recommendedI = 2;
        }
      } else if (symbolTypesInVx === 3) {
        caseTitle = 'Case 3: vx contains all three symbols';
        caseDesc = `Impossible! Since |vwx| ≤ p and the middle block of '1's has length p, vwx cannot contain both '0' and '2'.`;
        recommendedI = 2;
      }

      return { caseTitle, caseDesc, recommendedI, symbolTypesInVx };
    },
    formalProofMarkdown: `## Formal Proof: $L = \\{0^n 1^n 2^n \\mid n \\ge 1\\}$ is Not Context-Free

### **Theorem:**
The language $L = \\{0^n 1^n 2^n \\mid n \\ge 1\\}$ is **not context-free**.

---

### **Proof by Contradiction (Pumping Lemma for CFLs):**

1. **Assumption:** Suppose for contradiction that $L$ is a context-free language.
2. **Pumping Length:** By the Pumping Lemma for Context-Free Languages, there exists a pumping length $p \\ge 1$.
3. **String Selection:** Choose the string $s = 0^p 1^p 2^p$.
   - Clearly, $s \\in L$ because the counts of $0, 1, 2$ are all equal to $p \\ge 1$.
   - The length of $s$ is $|s| = 3p \\ge p$, satisfying the condition.
4. **Decomposition:** According to the Pumping Lemma, $s$ can be written as $s = uvwxy$ such that:
   - $|vwx| \\le p$
   - $|vx| \\ge 1$ (meaning $v$ and $x$ are not both empty $\\varepsilon$)
   - For all $i \\ge 0$, the pumped string $s_i = uv^i wx^i y \\in L$.
5. **Case Analysis on $vwx$:**
   Since $|vwx| \\le p$, the substring $vwx$ has a length of at most $p$. In the string $s = 0^p 1^p 2^p$, the block of $1$s alone has length $p$. Therefore, $vwx$ **cannot contain occurrences of all three symbols** $0, 1,$ and $2$ simultaneously.
   - **Case 1 ($vx$ contains 1 symbol type):** Pumping with $i = 2$ gives $uv^2wx^2y$, which has more than $p$ of that symbol, but the others remain $p$. Thus $N_0 \\ne N_1$, so $uv^2wx^2y \\notin L$.
   - **Case 2 ($vx$ contains 2 symbol types):** At least one symbol is untouched ($= p$). Pumping $i = 2$ increases the touched symbols while the untouched remains $p$, breaking equality.
6. **Conclusion:** In all possible decompositions, there exists an $i \\ge 0$ such that $uv^i wx^i y \\notin L$.
   This contradicts the Pumping Lemma for Context-Free Languages.
$$\\mathbf{L = \\{0^n 1^n 2^n \\mid n \\ge 1\\} \\text{ is NOT Context-Free.}} \\quad \\blacksquare$`
  },

  {
    id: 'anbncn',
    name: 'L = {aⁿ bⁿ cⁿ | n ≥ 1}',
    formula: 'L = \\{a^n b^n c^n \\mid n \\ge 1\\}',
    defaultP: 3,
    minP: 2,
    maxP: 6,
    alphabet: ['a', 'b', 'c'],
    description: 'Alphabet {a, b, c} equivalent of the three-counter language.',
    generateString: (p) => 'a'.repeat(p) + 'b'.repeat(p) + 'c'.repeat(p),
    checkMembership: (str) => {
      const match = str.match(/^(a+)(b+)(c+)$/);
      if (!match) return { inLang: false, reason: 'Symbols not in form a* b* c*' };
      const ca = match[1].length, cb = match[2].length, cc = match[3].length;
      if (ca === cb && cb === cc && ca >= 1) {
        return { inLang: true, reason: `Valid: Na=Nb=Nc=${ca}`, counts: { a: ca, b: cb, c: cc } };
      }
      return { inLang: false, reason: `Mismatch: Na=${ca}, Nb=${cb}, Nc=${cc}`, counts: { a: ca, b: cb, c: cc } };
    },
    analyzePartition: (u, v, w, x, y, p) => {
      return {
        caseTitle: 'CFL Window Bound (|vwx| ≤ p)',
        caseDesc: 'Cannot span across all three distinct letters. Pumping changes at most 2 letters while the 3rd stays fixed.',
        recommendedI: 2
      };
    },
    formalProofMarkdown: `## Formal Proof: $L = \\{a^n b^n c^n \\mid n \\ge 1\\}$ is Not Context-Free
See identical structure to $0^n 1^n 2^n$.`
  },

  {
    id: 'ww',
    name: 'L = {w w | w ∈ {0, 1}*}',
    formula: 'L = \\{w w \\mid w \\in \\{0, 1\\}^*\\}',
    defaultP: 3,
    minP: 2,
    maxP: 5,
    alphabet: ['0', '1'],
    description: 'Direct string duplication. Cannot be verified by PDA because stack reverses order (w wᴿ is CFL, but w w is not).',
    generateString: (p) => '0'.repeat(p) + '1'.repeat(p) + '0'.repeat(p) + '1'.repeat(p),
    checkMembership: (str) => {
      if (str.length % 2 !== 0) return { inLang: false, reason: 'Odd length: cannot be partitioned into two identical halves' };
      const half = str.length / 2;
      const w1 = str.slice(0, half);
      const w2 = str.slice(half);
      if (w1 === w2) return { inLang: true, reason: `Valid ww with w="${w1}"` };
      return { inLang: false, reason: `Halves do not match: w₁="${w1}" ≠ w₂="${w2}"` };
    },
    analyzePartition: (u, v, w, x, y, p) => {
      return {
        caseTitle: 'Cross-boundary pumping',
        caseDesc: 'Pumping shifts the boundary of the two halves, causing symbols from the first block to bleed into the second half.',
        recommendedI: 2
      };
    },
    formalProofMarkdown: `## Formal Proof: $L = \\{w w \\mid w \\in \\{0, 1\\}^*\\}$ is Not Context-Free`
  }
];

const LOCAL_STORAGE_PUMPING_KEY = 'fla_custom_pumping_v1';

export function getCustomPumpingLanguages() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_PUMPING_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

export function saveCustomPumpingLanguage(lang) {
  try {
    const list = getCustomPumpingLanguages();
    const idx = list.findIndex(l => l.id === lang.id);
    if (idx >= 0) list[idx] = lang;
    else list.unshift(lang);
    localStorage.setItem(LOCAL_STORAGE_PUMPING_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

export function deleteCustomPumpingLanguage(id) {
  try {
    const list = getCustomPumpingLanguages().filter(l => l.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PUMPING_KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Creates an executable language object from user's custom question parameters
 */
export function buildCustomLanguageDefinition(config) {
  const id = config.id || `custom_${Date.now()}`;
  const name = config.name || 'Custom Language L';
  const customString = (config.customString || '000111222').trim();
  const defaultP = parseInt(config.p || 3, 10);
  const ruleType = config.ruleType || 'equal_counts'; // 'equal_counts' | 'regex' | 'ww' | 'ratio'

  return {
    id,
    name,
    formula: config.formula || name,
    description: config.description || `User-defined language with test string "${customString}"`,
    defaultP,
    minP: 1,
    maxP: 10,
    customString,
    ruleType,
    isCustom: true,
    
    generateString: (p) => {
      // If user typed a specific custom string, use it (or scale if possible)
      if (customString && customString.length > 0) {
        return customString;
      }
      return '0'.repeat(p) + '1'.repeat(p) + '2'.repeat(p);
    },

    checkMembership: (str) => {
      if (!str || str.length === 0) return { inLang: false, reason: 'Empty string (ε)' };

      // Compute character counts
      const counts = {};
      for (const ch of str) {
        counts[ch] = (counts[ch] || 0) + 1;
      }

      if (ruleType === 'ww') {
        if (str.length % 2 !== 0) return { inLang: false, reason: 'Odd length: cannot form w w', counts };
        const half = str.length / 2;
        const w1 = str.slice(0, half);
        const w2 = str.slice(half);
        if (w1 === w2) return { inLang: true, reason: `Valid w w (w="${w1}")`, counts };
        return { inLang: false, reason: `Halves mismatch: "${w1}" ≠ "${w2}"`, counts };
      }

      if (ruleType === 'ratio') {
        // Example: N_b = 2 * N_a
        const keys = Object.keys(counts);
        if (keys.length >= 2) {
          const k1 = keys[0];
          const k2 = keys[1];
          const c1 = counts[k1];
          const c2 = counts[k2];
          if (c2 === 2 * c1) {
            return { inLang: true, reason: `Valid ratio: N_${k2} = 2 × N_${k1} (${c2} = 2 × ${c1})`, counts };
          } else {
            return { inLang: false, reason: `Ratio violated: N_${k2}=${c2} ≠ 2 × N_${k1}=${2 * c1}`, counts };
          }
        }
      }

      // Default: Equal counts of distinct symbols appearing in original string
      const distinctChars = Object.keys(counts);
      const firstCount = counts[distinctChars[0]];
      const allEqual = distinctChars.every(ch => counts[ch] === firstCount);

      if (allEqual && distinctChars.length > 1) {
        return {
          inLang: true,
          reason: `Equal symbol counts (${distinctChars.map(c => `N_${c}=${counts[c]}`).join(', ')})`,
          counts
        };
      } else {
        return {
          inLang: false,
          reason: `Count mismatch: ${distinctChars.map(c => `N_${c}=${counts[c]}`).join(', ')}`,
          counts
        };
      }
    },

    analyzePartition: (u, v, w, x, y, p) => {
      const vx = v + x;
      return {
        caseTitle: `Custom Pumping Analysis for "${vx}"`,
        caseDesc: `Pumping the portion vx="${vx}" changes symbol frequencies. Since |vwx| ≤ p (${p}), vx cannot balance all segments simultaneously.`,
        recommendedI: 2
      };
    },

    formalProofMarkdown: `## Formal Proof for Custom Question: ${name}

### **Theorem:**
The language ${name} is **not context-free**.

### **Proof by Contradiction (Pumping Lemma for CFLs):**
1. Assume for contradiction that $L$ is a context-free language.
2. By the CFL Pumping Lemma, there exists an integer $p \\ge 1$.
3. Consider the string $s = \\text{"${customString}"} \\in L$ with $|s| \\ge p$.
4. Any partition $s = uvwxy$ with $|vwx| \\le p$ and $|vx| \\ge 1$ changes the balance of symbols when pumped with $i \\ne 1$.
5. Therefore, there exists $i \\ge 0$ such that $uv^i wx^i y \\notin L$.
6. Contradiction! Hence, the language is **not context-free**. $\\blacksquare$`
  };
}

export function getAllPumpingLanguages() {
  const custom = getCustomPumpingLanguages().map(buildCustomLanguageDefinition);
  return [...custom, ...PUMPING_DEFAULT_PRESETS];
}

export let PUMPING_PRESETS = getAllPumpingLanguages();

export function refreshPumpingPresets() {
  PUMPING_PRESETS = getAllPumpingLanguages();
  return PUMPING_PRESETS;
}
