// PDA Presets for Formal Languages and Automata Theory
export const PDA_DEFAULT_PRESETS = [
  {
    id: '0n1_2n_double_push',
    name: 'L = {0ⁿ 1²ⁿ | n ≥ 1} (Double-Push Model)',
    description: 'Pushes two stack symbols for each "0" read, then pops one symbol for each "1" read.',
    formula: 'L = \\{0^n 1^{2n} \\mid n \\ge 1\\}',
    defaultInput: '001111',
    alphabet: ['0', '1'],
    stackAlphabet: ['Z0', 'X'],
    startState: 'q0',
    startStack: 'Z0',
    acceptStates: ['q2'],
    acceptMode: 'state', // 'state' or 'empty' or 'both'
    explanation: `For every '0' scanned, we push two 'X' symbols onto the stack. When '1's start arriving, we pop one 'X' per '1'. If stack returns to Z₀ when input finishes, the number of 1s was exactly twice the number of 0s.`,
    formal7Tuple: {
      states: 'Q = \\{q_0, q_1, q_2\\}',
      inputAlphabet: '\\Sigma = \\{0, 1\\}',
      stackAlphabet: '\\Gamma = \\{Z_0, X\\}',
      startState: 'q_0',
      startStack: 'Z_0',
      acceptStates: 'F = \\{q_2\\}'
    },
    states: [
      { id: 'q0', label: 'q₀', x: 90, y: 105, isStart: true, isAccept: false, desc: 'Read 0s, push 2 X per 0' },
      { id: 'q1', label: 'q₁', x: 290, y: 105, isStart: false, isAccept: false, desc: 'Read 1s, pop 1 X per 1' },
      { id: 'q2', label: 'q₂', x: 490, y: 105, isStart: false, isAccept: true, desc: 'Acceptance state' }
    ],
    transitions: [
      { from: 'q0', to: 'q0', input: '0', pop: 'Z0', push: ['X', 'X', 'Z0'], label: '0, Z₀ → XXZ₀' },
      { from: 'q0', to: 'q0', input: '0', pop: 'X', push: ['X', 'X', 'X'], label: '0, X → XXX' },
      { from: 'q0', to: 'q1', input: '1', pop: 'X', push: [], label: '1, X → ε' },
      { from: 'q1', to: 'q1', input: '1', pop: 'X', push: [], label: '1, X → ε' },
      { from: 'q1', to: 'q2', input: 'ε', pop: 'Z0', push: ['Z0'], label: 'ε, Z₀ → Z₀' }
    ],
    testCases: [
      { input: '001111', expected: true, label: 'n=2 (001111)' },
      { input: '011', expected: true, label: 'n=1 minimal valid' },
      { input: '000111111', expected: true, label: 'n=3 valid' },
      { input: '01', expected: false, label: 'n=1, only one 1 (rejected)' },
      { input: '0011', expected: false, label: 'n=2, only two 1s (rejected)' },
      { input: '00111', expected: false, label: 'n=2, three 1s (rejected)' },
      { input: '0011111', expected: false, label: 'n=2, five 1s (rejected)' },
      { input: '11', expected: false, label: 'no 0s, n≥1 violated (rejected)' },
      { input: '', expected: false, label: 'empty string ε, n≥1 violated' }
    ]
  },
  {
    id: '0n1_2n_alternating',
    name: 'L = {0ⁿ 1²ⁿ | n ≥ 1} (Alternating States Model)',
    description: 'Pushes one "X" per "0". Uses two states to count pairs of "1"s, popping one "X" every two "1"s.',
    formula: 'L = \\{0^n 1^{2n} \\mid n \\ge 1\\}',
    defaultInput: '001111',
    alphabet: ['0', '1'],
    stackAlphabet: ['Z0', 'X'],
    startState: 'q0',
    startStack: 'Z0',
    acceptStates: ['q3'],
    acceptMode: 'state',
    explanation: `Pushes 1 'X' for each '0'. Then for every two '1's, alternates between q₁ (odd 1) and q₂ (even 1, pops 1 'X'). Accepts at q₃ on empty input when stack top is Z₀.`,
    formal7Tuple: {
      states: 'Q = \\{q_0, q_1, q_2, q_3\\}',
      inputAlphabet: '\\Sigma = \\{0, 1\\}',
      stackAlphabet: '\\Gamma = \\{Z_0, X\\}',
      startState: 'q_0',
      startStack: 'Z_0',
      acceptStates: 'F = \\{q_3\\}'
    },
    states: [
      { id: 'q0', label: 'q₀', x: 80, y: 105, isStart: true, isAccept: false, desc: 'Read 0s, push X' },
      { id: 'q1', label: 'q₁', x: 220, y: 65, isStart: false, isAccept: false, desc: 'First 1 of pair (no pop)' },
      { id: 'q2', label: 'q₂', x: 360, y: 105, isStart: false, isAccept: false, desc: 'Second 1 of pair (pop X)' },
      { id: 'q3', label: 'q₃', x: 500, y: 105, isStart: false, isAccept: true, desc: 'Acceptance state' }
    ],
    transitions: [
      { from: 'q0', to: 'q0', input: '0', pop: 'Z0', push: ['X', 'Z0'], label: '0, Z₀ → XZ₀' },
      { from: 'q0', to: 'q0', input: '0', pop: 'X', push: ['X', 'X'], label: '0, X → XX' },
      { from: 'q0', to: 'q1', input: '1', pop: 'X', push: ['X'], label: '1, X → X' },
      { from: 'q1', to: 'q2', input: '1', pop: 'X', push: [], label: '1, X → ε' },
      { from: 'q2', to: 'q1', input: '1', pop: 'X', push: ['X'], label: '1, X → X' },
      { from: 'q2', to: 'q3', input: 'ε', pop: 'Z0', push: ['Z0'], label: 'ε, Z₀ → Z₀' }
    ],
    testCases: [
      { input: '001111', expected: true, label: 'n=2 (001111)' },
      { input: '011', expected: true, label: 'n=1 (011)' },
      { input: '00111', expected: false, label: 'Odd 1s (rejected)' },
      { input: '0011', expected: false, label: 'Fewer 1s (rejected)' },
      { input: '', expected: false, label: 'ε rejected' }
    ]
  },
  {
    id: '0n1n',
    name: 'L = {0ⁿ 1ⁿ | n ≥ 1} (Equal 0s and 1s)',
    description: 'The canonical context-free language. Pushes one "X" per "0" and pops one "X" per "1".',
    formula: 'L = \\{0^n 1^n \\mid n \\ge 1\\}',
    defaultInput: '000111',
    alphabet: ['0', '1'],
    stackAlphabet: ['Z0', 'X'],
    startState: 'q0',
    startStack: 'Z0',
    acceptStates: ['q2'],
    acceptMode: 'state',
    explanation: `For every '0', push 'X'. On first '1', transition to q₁ and pop 'X'. Continue popping 'X' for each '1'. Transition to q₂ on ε with Z₀ on stack.`,
    formal7Tuple: {
      states: 'Q = \\{q_0, q_1, q_2\\}',
      inputAlphabet: '\\Sigma = \\{0, 1\\}',
      stackAlphabet: '\\Gamma = \\{Z_0, X\\}',
      startState: 'q_0',
      startStack: 'Z_0',
      acceptStates: 'F = \\{q_2\\}'
    },
    states: [
      { id: 'q0', label: 'q₀', x: 90, y: 105, isStart: true, isAccept: false, desc: 'Push X for each 0' },
      { id: 'q1', label: 'q₁', x: 290, y: 105, isStart: false, isAccept: false, desc: 'Pop X for each 1' },
      { id: 'q2', label: 'q₂', x: 490, y: 105, isStart: false, isAccept: true, desc: 'Accept' }
    ],
    transitions: [
      { from: 'q0', to: 'q0', input: '0', pop: 'Z0', push: ['X', 'Z0'], label: '0, Z₀ → XZ₀' },
      { from: 'q0', to: 'q0', input: '0', pop: 'X', push: ['X', 'X'], label: '0, X → XX' },
      { from: 'q0', to: 'q1', input: '1', pop: 'X', push: [], label: '1, X → ε' },
      { from: 'q1', to: 'q1', input: '1', pop: 'X', push: [], label: '1, X → ε' },
      { from: 'q1', to: 'q2', input: 'ε', pop: 'Z0', push: ['Z0'], label: 'ε, Z₀ → Z₀' }
    ],
    testCases: [
      { input: '000111', expected: true, label: 'n=3' },
      { input: '01', expected: true, label: 'n=1' },
      { input: '00111', expected: false, label: 'More 1s' },
      { input: '00011', expected: false, label: 'More 0s' }
    ]
  },
  {
    id: 'wcw_r',
    name: 'L = {w c wᴿ | w ∈ {0,1}*} (Palindromes with Center Marker)',
    description: 'Deterministic palindrome recognizer using center marker "c".',
    formula: 'L = \\{w c w^R \\mid w \\in \\{0,1\\}^*\\}',
    defaultInput: '011c110',
    alphabet: ['0', '1', 'c'],
    stackAlphabet: ['Z0', '0', '1'],
    startState: 'q0',
    startStack: 'Z0',
    acceptStates: ['q2'],
    acceptMode: 'state',
    explanation: `Before marker 'c', push symbols of w onto stack. Upon seeing 'c', switch to q₁. After 'c', verify each symbol matches top of stack and pop. Accept when stack is Z₀ at end of input.`,
    formal7Tuple: {
      states: 'Q = \\{q_0, q_1, q_2\\}',
      inputAlphabet: '\\Sigma = \\{0, 1, c\\}',
      stackAlphabet: '\\Gamma = \\{Z_0, 0, 1\\}',
      startState: 'q_0',
      startStack: 'Z_0',
      acceptStates: 'F = \\{q_2\\}'
    },
    states: [
      { id: 'q0', label: 'q₀', x: 90, y: 105, isStart: true, isAccept: false, desc: 'Push w' },
      { id: 'q1', label: 'q₁', x: 290, y: 105, isStart: false, isAccept: false, desc: 'Match wᴿ' },
      { id: 'q2', label: 'q₂', x: 490, y: 105, isStart: false, isAccept: true, desc: 'Accept' }
    ],
    transitions: [
      { from: 'q0', to: 'q0', input: '0', pop: 'Z0', push: ['0', 'Z0'], label: '0, Z₀ → 0Z₀' },
      { from: 'q0', to: 'q0', input: '1', pop: 'Z0', push: ['1', 'Z0'], label: '1, Z₀ → 1Z₀' },
      { from: 'q0', to: 'q0', input: '0', pop: '0', push: ['0', '0'], label: '0, 0 → 00' },
      { from: 'q0', to: 'q0', input: '0', pop: '1', push: ['0', '1'], label: '0, 1 → 01' },
      { from: 'q0', to: 'q0', input: '1', pop: '0', push: ['1', '0'], label: '1, 0 → 10' },
      { from: 'q0', to: 'q0', input: '1', pop: '1', push: ['1', '1'], label: '1, 1 → 11' },
      { from: 'q0', to: 'q1', input: 'c', pop: 'Z0', push: ['Z0'], label: 'c, Z₀ → Z₀' },
      { from: 'q0', to: 'q1', input: 'c', pop: '0', push: ['0'], label: 'c, 0 → 0' },
      { from: 'q0', to: 'q1', input: 'c', pop: '1', push: ['1'], label: 'c, 1 → 1' },
      { from: 'q1', to: 'q1', input: '0', pop: '0', push: [], label: '0, 0 → ε' },
      { from: 'q1', to: 'q1', input: '1', pop: '1', push: [], label: '1, 1 → ε' },
      { from: 'q1', to: 'q2', input: 'ε', pop: 'Z0', push: ['Z0'], label: 'ε, Z₀ → Z₀' }
    ],
    testCases: [
      { input: '011c110', expected: true, label: 'w = 011' },
      { input: 'c', expected: true, label: 'w = ε' },
      { input: '101c101', expected: true, label: 'w = 101' },
      { input: '01c01', expected: false, label: 'Not reversed (01 != 10)' }
    ]
  },
  {
    id: 'balanced_parentheses',
    name: 'Balanced Parentheses L = { ( )ⁿ }',
    description: 'Pushes on "(" and pops on ")". Accepts well-formed parenthesized expressions.',
    formula: 'L = \\{ w \\in \\{(, )\\}^* \\mid \\text{balanced} \\}',
    defaultInput: '(()())',
    alphabet: ['(', ')'],
    stackAlphabet: ['Z0', '('],
    startState: 'q0',
    startStack: 'Z0',
    acceptStates: ['q1'],
    acceptMode: 'state',
    explanation: `For every open paren '(', push onto stack. For every close paren ')', pop. Transition to accept state q₁ when input empty and stack is Z₀.`,
    formal7Tuple: {
      states: 'Q = \\{q_0, q_1\\}',
      inputAlphabet: '\\Sigma = \\{(, )\\}',
      stackAlphabet: '\\Gamma = \\{Z_0, (\\}',
      startState: 'q_0',
      startStack: 'Z_0',
      acceptStates: 'F = \\{q_1\\}'
    },
    states: [
      { id: 'q0', label: 'q₀', x: 160, y: 105, isStart: true, isAccept: false, desc: 'Process parens' },
      { id: 'q1', label: 'q₁', x: 420, y: 105, isStart: false, isAccept: true, desc: 'Balanced accept' }
    ],
    transitions: [
      { from: 'q0', to: 'q0', input: '(', pop: 'Z0', push: ['(', 'Z0'], label: '(, Z₀ → (Z₀' },
      { from: 'q0', to: 'q0', input: '(', pop: '(', push: ['(', '('], label: '(, ( → ((' },
      { from: 'q0', to: 'q0', input: ')', pop: '(', push: [], label: '), ( → ε' },
      { from: 'q0', to: 'q1', input: 'ε', pop: 'Z0', push: ['Z0'], label: 'ε, Z₀ → Z₀' }
    ],
    testCases: [
      { input: '(()())', expected: true, label: 'Nested & sequential' },
      { input: '()', expected: true, label: 'Single pair' },
      { input: '((()))', expected: true, label: 'Deep nest' },
      { input: '())', expected: false, label: 'Extra close' },
      { input: '(()', expected: false, label: 'Extra open' }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'fla_custom_pdas_v1';

export function getCustomPDAs() {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load custom PDAs from localStorage', e);
    return [];
  }
}

export function saveCustomPDA(pda) {
  try {
    const customList = getCustomPDAs();
    const existingIdx = customList.findIndex(p => p.id === pda.id);
    if (existingIdx >= 0) {
      customList[existingIdx] = pda;
    } else {
      customList.unshift(pda);
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customList));
    return true;
  } catch (e) {
    console.error('Failed to save custom PDA', e);
    return false;
  }
}

export function deleteCustomPDA(pdaId) {
  try {
    const customList = getCustomPDAs().filter(p => p.id !== pdaId);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customList));
    return true;
  } catch (e) {
    return false;
  }
}

export function getAllPDAs() {
  const custom = getCustomPDAs();
  return [...custom, ...PDA_DEFAULT_PRESETS];
}

export let PDA_PRESETS = getAllPDAs();

export function refreshPDAPresets() {
  PDA_PRESETS = getAllPDAs();
  return PDA_PRESETS;
}
