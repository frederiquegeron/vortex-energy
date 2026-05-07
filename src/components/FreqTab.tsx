import React, { useState, useRef, useEffect } from 'react';
import { fmt, haptic } from '../utils';

export function FreqTab({ D }: { D: any }) {
  const FREQS = D.freqs;
  const [freqSel, setFreqSel] = useState(0);
  const f = FREQS[freqSel];

  return (
    <>
      <div className="freq-num-tabs">
        {FREQS.map((freq, i) => (
          <button key={i} className={`fntab${i === freqSel ? ' on' : ''}`} style={{color: freq.color}} onClick={() => { haptic(); setFreqSel(i); }} title={D.ttFreqTab}>
            <span className="fn-n">{freq.number}</span>
            <span className="fn-hz">{freq.freq}Hz</span>
          </button>
        ))}
      </div>
      <div className="freq-content">
        <div>
          <AudioPlayer block={f} main={true} D={D} />
          <div className="freq-benefits" style={{marginTop: '.8rem'}}>
            <h4 style={{color: f.color}}>{D.benefits}</h4>
            <div className="benefit-chips">
              {f.benefits.map((b, i) => <span key={i} className="benefit-chip">{b}</span>)}
            </div>
          </div>
          <div className="gates-list">
            <h4 style={{color: f.color}}>{D.gates}</h4>
            {f.gates.map((g, i) => (
              <div key={i} className="gate-item">
                <span>{g.t}</span>
                <span className="gate-time" style={{color: f.color}}>{g.d}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <AudioPlayer block={f.comp as any} main={false} D={D} />
        </div>
      </div>
    </>
  );
}

function AudioPlayer({ block, main, D }: { block: any, main: boolean, D: any }) {
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loop, setLoop] = useState(false);
  const [missingError, setMissingError] = useState(false);
  const [vol, setVolume] = useState(0.8);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const hz = block.freq;
  const col = main ? block.color : '#5B4BC0';
  const label = main ? D.primary : D.complementary;
  const src = `audio/${hz}hz.mp3`;

  useEffect(() => {
    // Reset when switching to a different freq
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioRef.current = new Audio(src);
    audioRef.current.volume = vol;
    audioRef.current.preload = 'metadata';
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setMissingError(false);

    const onTimeUpdate = () => setCurrentTime(audioRef.current?.currentTime || 0);
    const onLoaded = () => setDuration(audioRef.current?.duration || 0);
    const onEnded = () => {
      if (!loop) setPlaying(false);
    };
    const onError = () => setMissingError(true);

    audioRef.current.addEventListener('timeupdate', onTimeUpdate);
    audioRef.current.addEventListener('loadedmetadata', onLoaded);
    audioRef.current.addEventListener('ended', onEnded);
    audioRef.current.addEventListener('error', onError);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', onTimeUpdate);
        audioRef.current.removeEventListener('loadedmetadata', onLoaded);
        audioRef.current.removeEventListener('ended', onEnded);
        audioRef.current.removeEventListener('error', onError);
        audioRef.current.pause();
      }
    };
  }, [hz, src, loop]);

  const togglePlay = () => {
    haptic();
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setPlaying(true);
        setMissingError(false);
      }).catch(() => {
        setMissingError(true);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pos * duration;
  };

  const setVol = (v: number) => {
    setVolume(v);
    if (audioRef.current) audioRef.current.volume = v;
  };

  return (
    <div className="freq-player-block" style={{borderColor: `${col}35`}}>
      <style>{`.fpb::before { background: ${col} }`}</style>
      <div className="fpb-label">{label}</div>
      <div className="fpb-hz" style={{color: col}}>{hz} Hz</div>
      <div className="fpb-name">{block.name}</div>
      <div className="fpb-red">{block.reduction}</div>
      <div className="fpb-desc">{block.desc}</div>
      <div className="player-controls">
        <button className={`play-btn${playing ? ' playing' : ''}`} style={playing ? {background: col, color: '#0E0C1A'} : {color: col}} onClick={togglePlay} title={D.ttPlayPause}>
          <span className="play-icon">{playing ? '⏸' : '▶'}</span>
        </button>
        <div className="progress-wrap" title="Seek">
          <div className="progress-times"><span>{fmt(currentTime)}</span><span>{duration ? fmt(duration) : '—:——'}</span></div>
          <div className="progress-bar" onClick={handleSeek}>
            <div className="progress-fill" style={{width: `${duration ? (currentTime / duration * 100) : 0}%`, background: col}}></div>
          </div>
        </div>
      </div>
      <div className="vol-row">
        <span className="vol-icon">🔈</span>
        <input type="range" min="0" max="1" step="0.05" value={vol} onChange={(e) => setVol(parseFloat((e.target as HTMLInputElement).value))} title={D.ttVol} />
        <button className={`loop-btn${loop ? ' on' : ''}`} style={{color: col}} onClick={() => { haptic(); setLoop(!loop); if (audioRef.current) audioRef.current.loop = !loop; }} title={D.ttLoop}>
          ⟲ {D.loop}
        </button>
      </div>
      <div className="timer-row">
        <span className="timer-label">{D.session}</span>
        {[5, 10, 20, 30, 45, 60].map(m => (
          <button key={m} className="timer-btn" style={{color: col}} onClick={() => haptic()} title={D.ttTimer}>{m}{D.min}</button>
        ))}
      </div>
      {missingError && (
        <div className="file-missing">{D.fileMissing}<code>audio/{hz}hz.mp3</code></div>
      )}
    </div>
  );
}
