import React, { useState } from 'react';
import { saveCustomPumpingLanguage } from '../pumping/pumping-presets.js';

export default function CustomPumpingModal({
  isOpen,
  onClose,
  onSaveCustomLanguage
}) {
  const [name, setName] = useState('L = {aⁿ b²ⁿ cⁿ | n ≥ 1}');
  const [customString, setCustomString] = useState('aaabbbbbbccc');
  const [p, setP] = useState(3);
  const [ruleType, setRuleType] = useState('equal_counts');

  if (!isOpen) return null;

  const handleSave = () => {
    const customLangDef = {
      id: `custom_cfl_${Date.now()}`,
      name: name.trim() || 'Custom CFL Question',
      customString: customString.trim() || '000111222',
      p: parseInt(p, 10) || 3,
      ruleType,
      isCustom: true
    };

    saveCustomPumpingLanguage(customLangDef);
    onSaveCustomLanguage(customLangDef);
    onClose();
  };

  return (
    <div
      id="custom-pumping-modal"
      className="modal-overlay active"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target.id === 'custom-pumping-modal') onClose();
      }}
    >
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        <div className="modal-header">
          <h3 className="modal-title">Create Custom CFL Pumping Lemma Question</h3>
          <button
            id="btn-close-custom-pumping"
            className="btn-ghost"
            style={{ padding: '0.3rem 0.6rem' }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label" htmlFor="custom-pumping-name">Question Title / Language Formula</label>
            <input
              type="text"
              id="custom-pumping-name"
              className="form-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <div className="form-hint">E.g., L = {'{aⁿ b²ⁿ cⁿ | n ≥ 1}'} or L = {'{0ⁿ 1³ⁿ 2ⁿ}'} or L = {'{w w}'}</div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="custom-pumping-string">Your Test String (s)</label>
            <input
              type="text"
              id="custom-pumping-string"
              className="form-input mono-input"
              value={customString}
              onChange={(e) => setCustomString(e.target.value)}
            />
            <div className="form-hint">Type any custom string in the language to partition and pump!</div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="custom-pumping-p">Pumping Length (p)</label>
              <input
                type="number"
                id="custom-pumping-p"
                className="form-input"
                min="1"
                max="10"
                value={p}
                onChange={(e) => setP(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="custom-pumping-rule">Membership Condition Rule</label>
              <select
                id="custom-pumping-rule"
                className="form-select"
                value={ruleType}
                onChange={(e) => setRuleType(e.target.value)}
              >
                <option value="equal_counts">Equal Counts of All Symbols (e.g. Na = Nb = Nc)</option>
                <option value="ratio">Ratio: Double Second Symbol (e.g. Nb = 2 × Na)</option>
                <option value="ww">String Duplication (w w - First half equals second half)</option>
              </select>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button id="btn-cancel-custom-pumping" className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button id="btn-save-custom-pumping" className="btn-primary" onClick={handleSave}>
            💾 Save & Load Custom Language
          </button>
        </div>
      </div>
    </div>
  );
}
