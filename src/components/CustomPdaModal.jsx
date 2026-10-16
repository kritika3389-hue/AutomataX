import React, { useState } from 'react';
import { saveCustomPDA } from '../pda/pda-presets.js';

const TEMPLATES = {
  template_0n1n: {
    name: 'L = {0ⁿ 1ⁿ | n ≥ 1}',
    defaultInput: '000111',
    states: 'q0, q1, q2',
    startState: 'q0',
    acceptStates: 'q2',
    rules: [
      { from: 'q0', input: '0', pop: 'Z0', to: 'q0', push: 'XZ0' },
      { from: 'q0', input: '0', pop: 'X', to: 'q0', push: 'XX' },
      { from: 'q0', input: '1', pop: 'X', to: 'q1', push: 'ε' },
      { from: 'q1', input: '1', pop: 'X', to: 'q1', push: 'ε' },
      { from: 'q1', input: 'ε', pop: 'Z0', to: 'q2', push: 'Z0' }
    ]
  },
  template_0n1_2n: {
    name: 'L = {0ⁿ 1²ⁿ | n ≥ 1}',
    defaultInput: '001111',
    states: 'q0, q1, q2',
    startState: 'q0',
    acceptStates: 'q2',
    rules: [
      { from: 'q0', input: '0', pop: 'Z0', to: 'q0', push: 'XXZ0' },
      { from: 'q0', input: '0', pop: 'X', to: 'q0', push: 'XXX' },
      { from: 'q0', input: '1', pop: 'X', to: 'q1', push: 'ε' },
      { from: 'q1', input: '1', pop: 'X', to: 'q1', push: 'ε' },
      { from: 'q1', input: 'ε', pop: 'Z0', to: 'q2', push: 'Z0' }
    ]
  },
  template_0n1_3n: {
    name: 'L = {0ⁿ 1³ⁿ | n ≥ 1}',
    defaultInput: '00111111',
    states: 'q0, q1, q2',
    startState: 'q0',
    acceptStates: 'q2',
    rules: [
      { from: 'q0', input: '0', pop: 'Z0', to: 'q0', push: 'XXXZ0' },
      { from: 'q0', input: '0', pop: 'X', to: 'q0', push: 'XXXX' },
      { from: 'q0', input: '1', pop: 'X', to: 'q1', push: 'ε' },
      { from: 'q1', input: '1', pop: 'X', to: 'q1', push: 'ε' },
      { from: 'q1', input: 'ε', pop: 'Z0', to: 'q2', push: 'Z0' }
    ]
  },
  template_0_2n1n: {
    name: 'L = {0²ⁿ 1ⁿ | n ≥ 1}',
    defaultInput: '000011',
    states: 'q0, q1, q2, q3',
    startState: 'q0',
    acceptStates: 'q3',
    rules: [
      { from: 'q0', input: '0', pop: 'Z0', to: 'q1', push: 'Z0' },
      { from: 'q1', input: '0', pop: 'Z0', to: 'q0', push: 'XZ0' },
      { from: 'q0', input: '0', pop: 'X', to: 'q1', push: 'X' },
      { from: 'q1', input: '0', pop: 'X', to: 'q0', push: 'XX' },
      { from: 'q0', input: '1', pop: 'X', to: 'q2', push: 'ε' },
      { from: 'q2', input: '1', pop: 'X', to: 'q2', push: 'ε' },
      { from: 'q2', input: 'ε', pop: 'Z0', to: 'q3', push: 'Z0' }
    ]
  },
  template_wcwr: {
    name: 'L = {w c wᴿ | w ∈ {0,1}*}',
    defaultInput: '011c110',
    states: 'q0, q1, q2',
    startState: 'q0',
    acceptStates: 'q2',
    rules: [
      { from: 'q0', input: '0', pop: 'Z0', to: 'q0', push: '0Z0' },
      { from: 'q0', input: '1', pop: 'Z0', to: 'q0', push: '1Z0' },
      { from: 'q0', input: '0', pop: '0', to: 'q0', push: '00' },
      { from: 'q0', input: '1', pop: '1', to: 'q0', push: '11' },
      { from: 'q0', input: 'c', pop: 'Z0', to: 'q1', push: 'Z0' },
      { from: 'q0', input: 'c', pop: '0', to: 'q1', push: '0' },
      { from: 'q0', input: 'c', pop: '1', to: 'q1', push: '1' },
      { from: 'q1', input: '0', pop: '0', to: 'q1', push: 'ε' },
      { from: 'q1', input: '1', pop: '1', to: 'q1', push: 'ε' },
      { from: 'q1', input: 'ε', pop: 'Z0', to: 'q2', push: 'Z0' }
    ]
  },
  template_parens: {
    name: 'Balanced Parentheses ( )',
    defaultInput: '(()())',
    states: 'q0, q1',
    startState: 'q0',
    acceptStates: 'q1',
    rules: [
      { from: 'q0', input: '(', pop: 'Z0', to: 'q0', push: '(Z0' },
      { from: 'q0', input: '(', pop: '(', to: 'q0', push: '((' },
      { from: 'q0', input: ')', pop: '(', to: 'q0', push: 'ε' },
      { from: 'q0', input: 'ε', pop: 'Z0', to: 'q1', push: 'Z0' }
    ]
  }
};

export default function CustomPdaModal({
  isOpen,
  onClose,
  onSaveCustomPda
}) {
  const [name, setName] = useState('L = {0ⁿ 1³ⁿ | n ≥ 1}');
  const [defaultInput, setDefaultInput] = useState('00111111');
  const [states, setStates] = useState('q0, q1, q2');
  const [startState, setStartState] = useState('q0');
  const [acceptStates, setAcceptStates] = useState('q2');
  const [acceptMode, setAcceptMode] = useState('state');
  const [rules, setRules] = useState([
    { from: 'q0', input: '0', pop: 'Z0', to: 'q0', push: 'XXXZ0' },
    { from: 'q0', input: '0', pop: 'X', to: 'q0', push: 'XXXX' },
    { from: 'q0', input: '1', pop: 'X', to: 'q1', push: 'ε' },
    { from: 'q1', input: '1', pop: 'X', to: 'q1', push: 'ε' },
    { from: 'q1', input: 'ε', pop: 'Z0', to: 'q2', push: 'Z0' }
  ]);

  if (!isOpen) return null;

  const handleTemplateChange = (e) => {
    const key = e.target.value;
    if (!key || !TEMPLATES[key]) return;
    const t = TEMPLATES[key];
    setName(t.name);
    setDefaultInput(t.defaultInput);
    setStates(t.states);
    setStartState(t.startState);
    setAcceptStates(t.acceptStates);
    setRules([...t.rules]);
  };

  const handleAddRule = () => {
    setRules([...rules, { from: 'q0', input: '0', pop: 'Z0', to: 'q0', push: 'XXZ0' }]);
  };

  const handleRuleChange = (index, field, value) => {
    const updated = [...rules];
    updated[index] = { ...updated[index], [field]: value };
    setRules(updated);
  };

  const handleRemoveRule = (index) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const stateIds = states.split(',').map(s => s.trim()).filter(Boolean);
    const accStates = acceptStates.split(',').map(s => s.trim()).filter(Boolean);

    const statesList = stateIds.map(sid => ({
      id: sid,
      label: sid,
      isStart: sid === startState,
      isAccept: accStates.includes(sid),
      desc: sid === startState ? 'Start state' : (accStates.includes(sid) ? 'Accept state' : '')
    }));

    const transitions = rules.map(r => {
      let inp = (r.input || '').trim() || 'ε';
      let pop = (r.pop || '').trim() || 'Z0';
      let push = (r.push || '').trim() || 'ε';
      const pushArray = (push === 'ε' || push === '') ? [] : push.split('');

      return {
        from: r.from.trim(),
        to: r.to.trim(),
        input: inp,
        pop: pop,
        push: pushArray,
        label: `${inp}, ${pop} → ${push}`
      };
    });

    const customPDA = {
      id: `custom_pda_${Date.now()}`,
      name: name.trim() || 'Custom PDA',
      description: `User-defined custom PDA question for ${name}`,
      defaultInput: defaultInput.trim() || '001111',
      startState: startState.trim() || 'q0',
      startStack: 'Z0',
      acceptStates: accStates,
      acceptMode,
      states: statesList,
      transitions,
      isCustom: true,
      testCases: [
        { input: defaultInput.trim() || '001111', expected: true, label: 'Default custom test' }
      ]
    };

    saveCustomPDA(customPDA);
    onSaveCustomPda(customPDA);
    onClose();
  };

  return (
    <div
      id="custom-pda-modal"
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.id === 'custom-pda-modal') onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '900px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Create / Edit Custom Pushdown Automaton (PDA)</h3>
          <button
            id="btn-close-custom-pda"
            className="btn-ghost"
            style={{ padding: '0.3rem 0.6rem' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label className="form-label" htmlFor="custom-pda-name">Question Title / Language Name</label>
              <input
                type="text"
                id="custom-pda-name"
                className="form-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="form-hint">E.g., L = {'{0ⁿ 1³ⁿ | n ≥ 1}'} or L = {'{aⁿ bᵐ | n > m}'}</div>
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="form-label" htmlFor="custom-pda-default-input">Default Input String (w)</label>
              <input
                type="text"
                id="custom-pda-default-input"
                className="form-input"
                value={defaultInput}
                onChange={(e) => setDefaultInput(e.target.value)}
              />
              <div className="form-hint">Initial string loaded on tape</div>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="custom-pda-states">States (comma-separated)</label>
              <input
                type="text"
                id="custom-pda-states"
                className="form-input"
                value={states}
                onChange={(e) => setStates(e.target.value)}
              />
              <div className="form-hint">E.g., q0, q1, q2</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="custom-pda-start-state">Start State</label>
              <input
                type="text"
                id="custom-pda-start-state"
                className="form-input"
                value={startState}
                onChange={(e) => setStartState(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="custom-pda-accept-states">Accept State(s)</label>
              <input
                type="text"
                id="custom-pda-accept-states"
                className="form-input"
                value={acceptStates}
                onChange={(e) => setAcceptStates(e.target.value)}
              />
              <div className="form-hint">Comma separated if multiple</div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="custom-pda-accept-mode">Acceptance Mode</label>
              <select
                id="custom-pda-accept-mode"
                className="form-select"
                value={acceptMode}
                onChange={(e) => setAcceptMode(e.target.value)}
              >
                <option value="state">Final State</option>
                <option value="empty">Empty Stack</option>
                <option value="both">Both</option>
              </select>
            </div>
          </div>

          {/* Transition Rules Editor */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                Transition Rules: δ(Current State, Input, Pop) → (Next State, Push)
              </h4>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Quick Template:</label>
                <select
                  id="custom-pda-template-select"
                  className="form-select"
                  style={{ width: 'auto', padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                  defaultValue=""
                  onChange={handleTemplateChange}
                >
                  <option value="">-- Choose Template --</option>
                  <option value="template_0n1n">L = {'{0ⁿ 1ⁿ}'} (Equal counts)</option>
                  <option value="template_0n1_2n">L = {'{0ⁿ 1²ⁿ}'} (Double push)</option>
                  <option value="template_0n1_3n">L = {'{0ⁿ 1³ⁿ}'} (Triple push)</option>
                  <option value="template_0_2n1n">L = {'{0²ⁿ 1ⁿ}'} (Half ones)</option>
                  <option value="template_wcwr">L = {'{w c wᴿ}'} (Palindrome)</option>
                  <option value="template_parens">Balanced Parentheses ( )</option>
                </select>
                <button
                  type="button"
                  id="btn-add-pda-rule"
                  className="btn-secondary"
                  style={{ padding: '0.35rem 0.75rem' }}
                  onClick={handleAddRule}
                >
                  ➕ Add Rule
                </button>
              </div>
            </div>

            <div style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)' }}>
              <table className="transition-editor-table">
                <thead>
                  <tr>
                    <th style={{ width: '18%' }}>From State</th>
                    <th style={{ width: '18%' }}>Read Input (a or ε)</th>
                    <th style={{ width: '18%' }}>Pop Stack (X)</th>
                    <th style={{ width: '18%' }}>To State</th>
                    <th style={{ width: '20%' }}>Push Stack (e.g. XX, ε)</th>
                    <th style={{ width: '8%' }}></th>
                  </tr>
                </thead>
                <tbody id="custom-pda-rules-tbody">
                  {rules.map((rule, idx) => (
                    <tr key={idx} className="pda-rule-row">
                      <td>
                        <input
                          type="text"
                          className="table-input rule-from"
                          value={rule.from}
                          onChange={(e) => handleRuleChange(idx, 'from', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input rule-input"
                          value={rule.input}
                          onChange={(e) => handleRuleChange(idx, 'input', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input rule-pop"
                          value={rule.pop}
                          onChange={(e) => handleRuleChange(idx, 'pop', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input rule-to"
                          value={rule.to}
                          onChange={(e) => handleRuleChange(idx, 'to', e.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className="table-input rule-push"
                          value={rule.push}
                          onChange={(e) => handleRuleChange(idx, 'push', e.target.value)}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          className="btn-danger btn-remove-rule"
                          title="Remove rule"
                          onClick={() => handleRemoveRule(idx)}
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="form-hint" style={{ marginTop: '0.4rem' }}>
              Tip: Use <b>ε</b> for empty string. In "Push Stack", write symbols left-to-right with leftmost symbol being the new stack top (e.g. <code>XX</code> or <code>ε</code> to pop).
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button id="btn-cancel-custom-pda" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button id="btn-save-custom-pda" className="btn-primary" onClick={handleSave}>
            💾 Save & Run Custom Machine
          </button>
        </div>
      </div>
    </div>
  );
}
