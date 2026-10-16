import React, { useState, useCallback } from 'react';
import Header from './components/Header.jsx';
import PdaSimulator from './components/PdaSimulator.jsx';
import PumpingSimulator from './components/PumpingSimulator.jsx';
import TheoryGuideModal from './components/TheoryGuideModal.jsx';
import FormalProofModal from './components/FormalProofModal.jsx';
import CustomPdaModal from './components/CustomPdaModal.jsx';
import CustomPumpingModal from './components/CustomPumpingModal.jsx';
import { PUMPING_PRESETS } from './pumping/pumping-presets.js';

export default function App() {
  const [activeTab, setActiveTab] = useState('pda');
  const [toast, setToast] = useState(null);

  // Modals state
  const [isTheoryOpen, setIsTheoryOpen] = useState(false);
  const [isProofOpen, setIsProofOpen] = useState(false);
  const [isCustomPdaOpen, setIsCustomPdaOpen] = useState(false);
  const [isCustomPumpingOpen, setIsCustomPumpingOpen] = useState(false);

  // Active Pumping preset for formal proof
  const [currentPumpingPreset, setCurrentPumpingPreset] = useState(PUMPING_PRESETS[0]);
  const [currentPumpingString, setCurrentPumpingString] = useState('000111222');

  const showToast = useCallback((message, icon = '✓') => {
    setToast({ message, icon });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 2800);
  }, []);

  const handlePumpingPresetChange = useCallback((preset, str) => {
    setCurrentPumpingPreset(preset);
    setCurrentPumpingString(str);
  }, []);

  const handleSaveCustomPda = (customPDA) => {
    showToast(`Custom Question "${customPDA.name}" Created & Running!`, '🚀');
    if (window._refreshPDAPresets) {
      window._refreshPDAPresets(customPDA.id);
    }
    if (window.confetti) window.confetti({ particleCount: 60, spread: 60 });
  };

  const handleSaveCustomLanguage = (customLang) => {
    showToast(`Custom CFL Question "${customLang.name}" Loaded!`, '🚀');
    if (window._refreshPumpingPresets) {
      window._refreshPumpingPresets(customLang.id);
    }
    if (window.confetti) window.confetti({ particleCount: 60, spread: 60 });
  };

  return (
    <>
      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          <span>{toast.icon}</span> <span>{toast.message}</span>
        </div>
      )}

      {/* App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onOpenProof={() => setIsProofOpen(true)}
      />

      {/* Main App Container */}
      <main className="app-container">
        <div style={{ display: activeTab === 'pda' ? 'block' : 'none' }}>
          <PdaSimulator
            onToast={showToast}
            onOpenCustomModal={() => setIsCustomPdaOpen(true)}
          />
        </div>

        <div style={{ display: activeTab === 'pumping' ? 'block' : 'none' }}>
          <PumpingSimulator
            onToast={showToast}
            onOpenCustomModal={() => setIsCustomPumpingOpen(true)}
            onOpenProofModal={() => setIsProofOpen(true)}
            onPumpingPresetChange={handlePumpingPresetChange}
          />
        </div>
      </main>

      {/* Modals */}
      <TheoryGuideModal
        isOpen={isTheoryOpen}
        onClose={() => setIsTheoryOpen(false)}
      />

      <FormalProofModal
        isOpen={isProofOpen}
        onClose={() => setIsProofOpen(false)}
        preset={currentPumpingPreset}
        pumpingString={currentPumpingString}
        onToast={showToast}
      />

      <CustomPdaModal
        isOpen={isCustomPdaOpen}
        onClose={() => setIsCustomPdaOpen(false)}
        onSaveCustomPda={handleSaveCustomPda}
      />

      <CustomPumpingModal
        isOpen={isCustomPumpingOpen}
        onClose={() => setIsCustomPumpingOpen(false)}
        onSaveCustomLanguage={handleSaveCustomLanguage}
      />
    </>
  );
}
