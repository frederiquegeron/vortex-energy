import React, { useEffect, useRef, useState } from 'react';
import { nodePos, TAU, clamp, haptic } from '../utils';

let audioCtx: AudioContext | null = null;
const getAudioCtx = () => {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

const playSynth = (freq: number, type: OscillatorType, dur: number, vol: number = 0.1, env: 'percussive' | 'pad' = 'percussive') => {
  try {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (env === 'percussive') {
      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    } else {
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + dur * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    }
    
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch(e) {}
};

export function ResonanceTab({ D, playerName, isDuel }: { D: any, playerName: string, isDuel: boolean }) {
  const NODES = D.nodes;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [resonance, setResonance] = useState(0);
  const [leftPol, setLeftPol] = useState(50);
  const [rightPol, setRightPol] = useState(50);
  const [stability, setStability] = useState(75);
  const [aiRes, setAiRes] = useState(0);
  
  const [gateOpen, setGateOpen] = useState(false);
  const [resResult, setResResult] = useState<string | null>(null);
  const [resAlive, setResAlive] = useState(true);
  
  const [flashNode, setFlashNode] = useState<number | null>(null);

  useEffect(() => {
    if (!resAlive) return;
    const interval = setInterval(() => {
      setLeftPol(prev => clamp(prev + (50 - prev) * 0.02));
      setRightPol(prev => clamp(prev + (50 - prev) * 0.02));
      setResonance(prev => clamp(prev - (stability < 40 ? 0.5 : 0.1)));
      if (isDuel) {
        setAiRes(prev => {
          const next = clamp(prev + 0.35 + (Math.random() - 0.3) * 0.4);
          if (next >= 100 && !gateOpen) {
            setResResult('defeat');
            setResAlive(false);
          }
          return next;
        });
      }
    }, 250);
    return () => clearInterval(interval);
  }, [resAlive, stability, isDuel, gateOpen]);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const cx = 230, cy = 230, R = 180, nr = 22;
    ctx.clearRect(0, 0, 460, 460);
    ctx.fillStyle = 'rgba(14,12,26,0.96)'; ctx.fillRect(0, 0, 460, 460);

    const bal = Math.abs(leftPol - rightPol) <= 20;
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
    ctx.strokeStyle = 'rgba(201,168,76,0.1)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R + 10, 0, TAU);
    ctx.strokeStyle = bal ? 'rgba(13,122,107,0.35)' : 'rgba(139,48,24,0.25)';
    ctx.setLineDash(bal ? [] : [8, 8]); ctx.lineWidth = 1.5; ctx.stroke(); ctx.setLineDash([]);

    const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 75);
    grd.addColorStop(0, `rgba(201,168,76,${gateOpen ? 0.35 : 0.1})`);
    grd.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.beginPath(); ctx.arc(cx, cy, 75, 0, TAU);
    ctx.fillStyle = grd; ctx.fill();
    ctx.strokeStyle = gateOpen ? 'rgba(201,168,76,0.8)' : 'rgba(201,168,76,0.12)';
    ctx.lineWidth = gateOpen ? 2.5 : 0.8; ctx.stroke();

    if (bal) {
      const p3 = nodePos(3, cx, cy, R), p6 = nodePos(6, cx, cy, R), p9 = nodePos(9, cx, cy, R);
      ctx.setLineDash([4, 5]); ctx.strokeStyle = 'rgba(201,168,76,0.25)'; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(p6.x, p6.y); ctx.lineTo(p9.x, p9.y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p9.x, p9.y); ctx.stroke();
      ctx.setLineDash([]);
    }

    NODES.forEach(node => {
      const p = nodePos(node.id, cx, cy, R);
      const fl = flashNode === node.id;
      if (fl) { ctx.beginPath(); ctx.arc(p.x, p.y, nr + 14, 0, TAU); ctx.fillStyle = node.color + '25'; ctx.fill(); }
      ctx.beginPath(); ctx.arc(p.x, p.y, fl ? nr + 4 : nr, 0, TAU);
      ctx.fillStyle = node.color + '18'; ctx.fill();
      ctx.strokeStyle = node.color; ctx.lineWidth = fl ? 2.5 : 1.5;
      ctx.shadowBlur = fl ? 14 : 5; ctx.shadowColor = node.color;
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#F4EDD8';
      ctx.font = `${node.id === 9 ? '700' : '600'} ${node.id === 9 ? '17px' : '14px'} Cinzel,serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(node.id), p.x, p.y + 0.5);
    });
  };

  useEffect(() => { draw(); }, [leftPol, rightPol, gateOpen, flashNode, resonance]);

  const activateNode = (n: number, fromKey = false) => {
    if (!resAlive) return;
    haptic();
    setFlashNode(n);
    setTimeout(() => setFlashNode(null), 380);
    
    const nodeObj = NODES.find((x: any) => x.id === n);
    const hz = nodeObj?.freq || 432;
    
    setLeftPol(prev => {
      let nextLeftPol = prev;
      setRightPol(rightPolVal => {
        let nextRightPol = rightPolVal;
        
        const wasBal = Math.abs(nextLeftPol - nextRightPol) <= 20;
        
        if (n === 6) nextLeftPol = clamp(nextLeftPol + 15);
        else if (n === 3) nextRightPol = clamp(nextRightPol + 15);
        else if (n === 9) {
          if (wasBal) {
            setResonance(r => {
              const res = clamp(r + 12);
              if (res >= 100) triggerGate();
              return res;
            });
            setStability(s => clamp(s + 5));
          } else {
            setStability(s => clamp(s - 15));
          }
        }
        else if (n === 7) setResonance(r => clamp(r - 2));
        else if (n === 5) setStability(s => clamp(s + 10));
        else if (n === 4) { setResonance(r => clamp(r - 3)); setStability(s => clamp(s + 8)); }
        else setResonance(r => clamp(r - 1 + Math.random()));
        
        const isBal = Math.abs(nextLeftPol - nextRightPol) <= 20;
        
        // Audio cues
        if (n === 9 && wasBal) {
            // Raising resonance
            playSynth(963, 'triangle', 1.2, 0.15, 'pad');
            playSynth(hz, 'sine', 0.8, 0.1, 'percussive');
        } else {
            // Normal hit
            playSynth(hz, 'sine', 0.6, 0.08, 'percussive');
        }

        if (!wasBal && isBal) {
            // Achieving balance
            playSynth(639, 'sine', 2.0, 0.1, 'pad'); // Harmony achieved
            playSynth(hz * 1.5, 'sine', 1.0, 0.05, 'pad');
        }
        
        return nextRightPol;
      });
      return nextLeftPol;
    });
  };

  const triggerGate = () => {
    setGateOpen(true);
    setResAlive(false);
    if (isDuel) setResResult('victory');
    
    // Gate open sound
    playSynth(432, 'sine', 4.0, 0.2, 'pad');
    playSynth(528, 'triangle', 4.0, 0.1, 'pad');
    playSynth(852, 'sine', 4.0, 0.15, 'pad');

    setTimeout(() => resetGame(), 5000);
  };

  const resetGame = () => {
    haptic(20);
    setResonance(0); setLeftPol(50); setRightPol(50); setStability(75); setAiRes(0);
    setGateOpen(false); setResResult(null); setResAlive(true);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const n = parseInt(e.key);
      if (n >= 1 && n <= 9) activateNode(n, true);
      if (e.key === 'r' || e.key === 'R') resetGame();
      if (e.key === ' ') {
        e.preventDefault();
        if (stability > 50) setResonance(r => clamp(r + 5));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [resAlive, stability]);

  const onCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (460 / rect.width);
    const my = (e.clientY - rect.top) * (460 / rect.height);
    const cx = 230, cy = 230, R = 180, nr = 22;
    for (const node of NODES) {
      const p = nodePos(node.id, cx, cy, R);
      if (Math.hypot(mx - p.x, my - p.y) < nr + 8) {
        activateNode(node.id);
        break;
      }
    }
  };

  const bal = Math.abs(leftPol - rightPol) <= 20;

  return (
    <div className="res-layout">
      <div>
        <canvas ref={canvasRef} id="resCanvas" width="460" height="460" onClick={onCanvasClick} title={D.ttResCanvas}></canvas>
        <div className="res-kbd">{D.resKbd}</div>
      </div>
      <div className="res-panel">
        <div className="res-intro" style={{
          fontSize: '13px', lineHeight: 1.6, opacity: 0.7, marginBottom: '20px', padding: '0 10px', textAlign: 'center'
        }}>
          {D.resIntro}
        </div>
        <div className="res-hint" style={{
          borderColor: bal ? '#0D7A6B40' : '#8B301840',
          color: bal ? '#0D7A6B' : '#8B3018',
          background: bal ? 'rgba(13,122,107,0.08)' : 'rgba(139,48,24,0.05)'
        }}>
          {bal ? D.raiseEnergy : D.balance}
        </div>
        <div className="meter-group">
          <Meter label={D.resonance} val={resonance} col="#C9A84C" />
          <Meter label={D.stability} val={stability} col="#0D7A6B" />
          <Meter label={D.leftPolarity} val={leftPol} col="#5B4BC0" />
          <Meter label={D.rightPolarity} val={rightPol} col="#A0406A" />
        </div>
        {isDuel && (
          <div className="duel-section">
            <h4>{D.duelMode}</h4>
            <Meter label={playerName || D.player} val={resonance} col="#C9A84C" />
            <Meter label={D.opponent} val={aiRes} col="#8B3018" />
          </div>
        )}
        <div>
          {gateOpen && <div className="gate-msg"><div className="gate-title">{D.gateOpen}</div></div>}
          {!gateOpen && resResult && (
            <div className="gate-msg" style={{
              borderColor: resResult === 'defeat' ? '#8B3018' : '#C9A84C',
              background: resResult === 'defeat' ? 'rgba(139,48,24,0.12)' : 'rgba(201,168,76,0.12)'
            }}>
              <div className="gate-title" style={{color: resResult === 'defeat' ? '#8B3018' : '#C9A84C'}}>
                {resResult === 'victory' ? D.victory : resResult === 'defeat' ? D.defeat : D.draw}
              </div>
            </div>
          )}
        </div>
        <button className="res-reset" onClick={() => resetGame()} title={D.ttReset}>{D.reset}</button>
      </div>
    </div>
  );
}

function Meter({ label, val, col }: { label: string, val: number, col: string }) {
  return (
    <div className="meter-item">
      <div className="meter-top">
        <span style={{color: col + '40'}}>{label}</span>
        <span className="meter-val" style={{color: col}}>{Math.round(val)}</span>
      </div>
      <div className="meter-bar">
        <div className="meter-fill" style={{background: col, width: `${clamp(val)}%`, boxShadow: `0 0 6px ${col}60`}}></div>
      </div>
    </div>
  );
}
