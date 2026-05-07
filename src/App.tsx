import React, { useState, useEffect } from 'react';
import { I18N } from './data';
import { haptic } from './utils';
import { VortexTab } from './components/VortexTab';
import { ReductionTab } from './components/ReductionTab';
import { YinYangTab } from './components/YinYangTab';
import { FreqTab } from './components/FreqTab';
import { EastWestTab } from './components/EastWestTab';
import { ResonanceTab } from './components/ResonanceTab';
import { FleurDeVieTab } from './components/FleurDeVieTab';

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('v369_lang') || 'fr');
  const [activeTab, setActiveTab] = useState(0);
  const [playerName, setPlayerName] = useState(localStorage.getItem('v369_player') || '');
  const [isDuel, setIsDuel] = useState(localStorage.getItem('v369_duel') === 'true');
  const [modalOpen, setModalOpen] = useState(false);
  
  const [tempPlayerName, setTempPlayerName] = useState(playerName);
  const [tempDuel, setTempDuel] = useState(isDuel);

  const D = I18N[lang] || I18N['en'];

  useEffect(() => {
    localStorage.setItem('v369_lang', lang);
  }, [lang]);

  const handleSaveProfile = () => {
    const finalName = tempPlayerName.trim() || 'Guest';
    setPlayerName(finalName);
    setIsDuel(tempDuel);
    localStorage.setItem('v369_player', finalName);
    localStorage.setItem('v369_duel', String(tempDuel));
    setModalOpen(false);
  };

  return (
    <>
      <header>
        <div className="logo">
          VORTEX 369<span>{D.subtitle}</span>
        </div>
        <nav id="mainNav">
          {D.tabs.map((tab: string, i: number) => (
            <button key={i} className={`ntab${activeTab === i ? ' on' : ''}`} onClick={() => { haptic(); setActiveTab(i); }}>
              {tab}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <select className="lang-sel" value={lang} onChange={e => { haptic(); setLang(e.target.value); }} title={D.ttLang}>
            {Object.keys(I18N).map(l => (
              <option key={l} value={l}>{l.toUpperCase()}</option>
            ))}
          </select>
          <span className="player-name" onClick={() => { haptic(); setTempPlayerName(playerName); setTempDuel(isDuel); setModalOpen(true); }} title={D.ttProfile}>
            {playerName || 'Guest'}
          </span>
        </div>
      </header>

      <main id="mainContent">
        <div className="panel on">
          {activeTab === 0 && <VortexTab D={D} />}
          {activeTab === 1 && <ReductionTab D={D} />}
          {activeTab === 2 && <YinYangTab D={D} />}
          {activeTab === 3 && <FreqTab D={D} />}
          {activeTab === 4 && <EastWestTab D={D} />}
          {activeTab === 5 && <ResonanceTab D={D} playerName={playerName} isDuel={isDuel} />}
          {activeTab === 6 && <FleurDeVieTab D={D} />}
        </div>
      </main>

      <footer>
        <div style={{ textAlign: 'center', marginBottom: '8px', fontSize: '0.9em', opacity: 0.8, fontStyle: 'italic', padding: '0 20px' }}>
          {D.teslaQuote}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', padding: '0 20px' }}>
          <span id="footerStatus">{D.resonance} · {D.stability}</span>
          <span>© 2026 · Layet · Tesla · Rodin</span>
        </div>
      </footer>

      <div className={`modal-bg ${modalOpen ? '' : 'hidden'}`}>
        <div className="modal">
          <h2>{D.profile}</h2>
          <input 
            type="text" 
            placeholder={D.username} 
            value={tempPlayerName} 
            onChange={(e) => setTempPlayerName(e.target.value)} 
          />
          <label className="modal-check">
            <input 
              type="checkbox" 
              checked={tempDuel} 
              onChange={(e) => setTempDuel(e.target.checked)} 
            />
            <span>{D.duelMode}</span>
          </label>
          <div className="modal-btns">
            <button className="modal-cancel" onClick={() => { haptic(); setModalOpen(false); }}>{D.cancel}</button>
            <button className="modal-save" onClick={() => { haptic(); handleSaveProfile(); }}>{D.save}</button>
          </div>
        </div>
      </div>
    </>
  );
}
