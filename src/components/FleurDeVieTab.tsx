import React, { useRef, useState, useEffect } from 'react';
import { TAU, nodePos, haptic } from '../utils';

export function FleurDeVieTab({ D }: { D: any }) {
  const FOL_FREQS = D.folFreqs;
  const NODES = D.nodes;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const [activeIdx, setActiveIdx] = useState(4);
  const [dropdown, setDropdown] = useState(false);
  const [showNodes, setShowNodes] = useState(true);
  const [showInfo, setShowInfo] = useState(typeof window !== 'undefined' ? window.innerWidth > 768 : true);
  const [showHowTo, setShowHowTo] = useState(false);
  
  const [playing, setPlaying] = useState(false);
  const [wave, setWave] = useState<OscillatorType>('sine');
  const [vol, setVol] = useState(0.7);

  const pointerRef = useRef({ x: 0, y: 0, down: false, dist: 0 });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const lfoRef = useRef<OscillatorNode | null>(null);
  const masterRef = useRef<GainNode | null>(null);

  const tRef = useRef(0);
  const reqRef = useRef<number | null>(null);
  
  const cur = FOL_FREQS[activeIdx];

  const particles = useRef(Array.from({ length: 350 }, () => ({
    angle: Math.random() * TAU,
    radius: Math.random() * 500 + 120,
    speed: (Math.random() * 0.003 + 0.001) * (Math.random() > 0.5 ? 1 : -1),
    size: Math.random() * 1.6 + 0.5,
    phase: Math.random() * TAU,
  })));

  useEffect(() => {
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    if (!wrap || !canvas) return;

    const resize = () => {
      canvas.width = wrap.offsetWidth;
      canvas.height = wrap.offsetHeight;
    };
    
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    return () => ro.disconnect();
  }, []);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const W = canvas.width, H = canvas.height;
    if (!W || !H) {
      reqRef.current = requestAnimationFrame(draw);
      return;
    }

    tRef.current += 0.008;
    const t = tRef.current;
    const cx = W / 2, cy = H / 2;
    const hz = cur.hz;

    ctx.fillStyle = 'rgba(13,12,11,0.17)';
    ctx.fillRect(0, 0, W, H);

    let rgb = cur.rgb;
    if (!rgb) {
      const r = Math.floor(Math.sin(t) * 127 + 128);
      const g = Math.floor(Math.sin(t + 2.094) * 127 + 128);
      const b = Math.floor(Math.sin(t + 4.189) * 127 + 128);
      rgb = `${r},${g},${b}`;
    }

    const { dist: pDist, down: pDown } = pointerRef.current;
    const breath = Math.sin(t * (hz / 100));
    const micro = Math.sin(t * (hz / 10));
    const distF = pDown ? Math.min(pDist / (Math.max(W, H) / 2), 1) : 0;
    const FOL_R_BASE = 0.095;
    const R = Math.min(W, H) * FOL_R_BASE * (1 + breath * 0.04) * (1 + distF * 0.22);

    ctx.save();
    ctx.translate(cx, cy);

    const gi = playing ? 0.18 + breath * 0.06 + distF * 0.1 : 0.05;
    const gGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 5);
    gGlow.addColorStop(0, `rgba(${rgb},${gi})`);
    gGlow.addColorStop(0.4, `rgba(139,115,85,${gi * 0.5})`);
    gGlow.addColorStop(1, 'rgba(13,12,11,0)');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = gGlow;
    ctx.fillRect(-W, -H, W * 2, H * 2);

    ctx.globalCompositeOperation = 'screen';
    particles.current.forEach(p => {
      p.angle += p.speed;
      const waveAmt = Math.sin(p.phase + t * 4) * (playing ? 13 : 2);
      const px = Math.cos(p.angle) * (p.radius + waveAmt);
      const py = Math.sin(p.angle) * (p.radius + waveAmt);
      const op = Math.max(0, 1 - Math.hypot(px, py) / (Math.max(W, H) / 2));
      ctx.shadowBlur = playing ? 10 : 0;
      ctx.shadowColor = `rgba(${rgb},0.8)`;
      ctx.fillStyle = `rgba(${rgb},${op * (0.3 + breath * 0.15)})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size, 0, TAU);
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    ctx.globalCompositeOperation = 'lighter';
    const rotSpd = playing ? (pDown ? 0.07 : 0.035) : 0.012;
    ctx.rotate(t * rotSpd);
    
    const vib = playing ? micro * 1.2 : 0;
    const alpha = playing ? 0.5 + breath * 0.12 : 0.18;
    const drawC = (x: number, y: number, r: number, lw: number, a: number | string) => {
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU);
      ctx.lineWidth = lw; ctx.strokeStyle = typeof a === 'string' ? a : `rgba(${rgb},${a})`; ctx.stroke();
    };

    const RINGS = 2;
    const centers = [];
    for (let u = -RINGS; u <= RINGS; u++) {
      for (let v = -RINGS; v <= RINGS; v++) {
        if (Math.abs(u + v) <= RINGS) {
          centers.push({ x: u * R + v * (R / 2), y: v * (R * Math.sqrt(3) / 2) });
        }
      }
    }

    if (playing) {
      ctx.beginPath();
      for (let i = 0; i < centers.length; i++) {
        for (let j = i + 1; j < centers.length; j++) {
          const d = Math.hypot(centers[i].x - centers[j].x, centers[i].y - centers[j].y);
          if (Math.abs(d - R) < 1) {
            ctx.moveTo(centers[i].x, centers[i].y);
            ctx.lineTo(centers[j].x, centers[j].y);
          }
        }
      }
      ctx.strokeStyle = 'rgba(139,115,85,0.1)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    centers.forEach(c => drawC(c.x, c.y, R + vib, 1, alpha));
    drawC(0, 0, R * RINGS + vib, 1.5, alpha * 0.8);
    drawC(0, 0, R * RINGS + R * 0.1 + vib, 0.5, alpha * 0.35);
    drawC(0, 0, R, 1.8, alpha * 1.2);

    const pulse = Math.sin(t * 1.5) * 0.05 + 1;
    ctx.globalCompositeOperation = 'source-over';
    drawC(0, 0, R * 3, 1, `rgba(${rgb},${0.25 * pulse})`);
    ctx.beginPath(); ctx.arc(0, 0, 5, 0, TAU);
    ctx.fillStyle = `rgba(${rgb},0.9)`;
    ctx.shadowBlur = 12; ctx.shadowColor = `rgba(${rgb},1)`;
    ctx.fill(); ctx.shadowBlur = 0;

    if (showNodes) {
      const nodeR = Math.min(W, H) * 0.36;
      ctx.beginPath(); ctx.arc(0, 0, nodeR, 0, TAU);
      ctx.strokeStyle = `rgba(${rgb},0.1)`; ctx.lineWidth = 0.8; ctx.stroke();
      
      NODES.forEach(node => {
        const p = nodePos(node.id, 0, 0, nodeR);
        const is369 = [3, 6, 9].includes(node.id);
        const pr = is369 && playing ? 1 + Math.abs(breath) * 0.15 : 1;
        const r2 = 13 * pr;
        
        ctx.beginPath(); ctx.arc(p.x, p.y, r2, 0, TAU);
        ctx.fillStyle = node.color + '18'; ctx.fill();
        ctx.strokeStyle = node.color; ctx.lineWidth = is369 ? 1.5 : 0.8;
        ctx.shadowBlur = is369 && playing ? 8 : 0; ctx.shadowColor = node.color;
        ctx.stroke(); ctx.shadowBlur = 0;
        
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#F4EDD8';
        ctx.font = `${is369 ? '700' : '500'} ${r2 * 0.85}px Cinzel,serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(node.id), p.x, p.y + 0.5);
        ctx.globalCompositeOperation = 'lighter';
      });
    }

    ctx.restore();
    reqRef.current = requestAnimationFrame(draw);
  };

  useEffect(() => {
    reqRef.current = requestAnimationFrame(draw);
    return () => {
      if (reqRef.current) cancelAnimationFrame(reqRef.current);
    };
  }, [playing, showNodes, cur]);

  const onPointerDown = (e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    const dist = Math.hypot(x, y);
    pointerRef.current = { x, y, down: true, dist };
    
    if (lfoRef.current && audioCtxRef.current) {
      const mx = Math.min(dist / (Math.max(r.width, r.height) / 2), 1);
      lfoRef.current.frequency.setTargetAtTime(cur.hz / 100 + mx * cur.hz / 100, audioCtxRef.current.currentTime, 0.1);
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointerRef.current.down) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    const dist = Math.hypot(x, y);
    pointerRef.current = { x, y, down: true, dist };
  };

  const onPointerUp = () => pointerRef.current.down = false;

  const toggleAudio = async () => {
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new Ctx();
      audioCtxRef.current = ctx;
      
      const osc = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const modGain = ctx.createGain();
      const lfoGain = ctx.createGain();
      const master = ctx.createGain();
      
      oscRef.current = osc;
      lfoRef.current = lfo;
      masterRef.current = master;
      
      osc.type = wave;
      osc.frequency.setValueAtTime(cur.hz, ctx.currentTime);
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(cur.hz / 100, ctx.currentTime);
      
      modGain.gain.setValueAtTime(0.6, ctx.currentTime);
      lfoGain.gain.setValueAtTime(0.18, ctx.currentTime);
      master.gain.setValueAtTime(0, ctx.currentTime);
      
      lfo.connect(lfoGain);
      lfoGain.connect(modGain.gain);
      osc.connect(modGain);
      modGain.connect(master);
      master.connect(ctx.destination);
      
      osc.start();
      lfo.start();
    }
    
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();
    
    if (playing) {
      masterRef.current?.gain.setTargetAtTime(0, ctx.currentTime, 0.5);
      setPlaying(false);
    } else {
      masterRef.current?.gain.setTargetAtTime(vol, ctx.currentTime, 0.8);
      setPlaying(true);
    }
  };

  const handleDropdownSelect = (i: number) => {
    setActiveIdx(i);
    setDropdown(false);
    if (oscRef.current && audioCtxRef.current) {
      oscRef.current.frequency.setTargetAtTime(FOL_FREQS[i].hz, audioCtxRef.current.currentTime, 0.5);
    }
  };

  const handleWaveSelect = (w: OscillatorType) => {
    setWave(w);
    if (oscRef.current) oscRef.current.type = w;
  };

  const handleVolChange = (v: number) => {
    setVol(v);
    if (masterRef.current && audioCtxRef.current && playing) {
      masterRef.current.gain.setTargetAtTime(v, audioCtxRef.current.currentTime, 0.1);
    }
  };

  return (
    <div className="fol-wrap" ref={wrapRef}>
      <div className="fol-bg"></div>
      <canvas 
        ref={canvasRef} 
        id="folCanvas"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      ></canvas>
      <div className="fol-ui">
        <div className="fol-header">
          <div className="fol-freq-sel">
            <div className="fol-freq-title">{D.solfeggioSeries} · {String(activeIdx + 1).padStart(2, '0')}</div>
            <button className="fol-freq-btn" onClick={() => { haptic(); setDropdown(!dropdown); }} title={D.ttFolDd}>
              <span className="fol-hz">{cur.hz}</span>
              <span className="fol-unit">Hz {dropdown ? '▲' : '▼'}</span>
            </button>
            <div className="fol-name">{cur.name}</div>
            {dropdown && (
              <div className="fol-dropdown">
                {FOL_FREQS.map((f: any, i: number) => (
                  <button key={i} className={`fol-dd-item${i === activeIdx ? ' on' : ''}`} onClick={() => { haptic(); handleDropdownSelect(i); }} title={D.ttFolDd}>
                    <span className="di-hz">{f.hz}</span>
                    <span className="di-name">{f.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="fol-header-btns">
            <button className={`fol-icon-btn${showNodes ? ' on' : ''}`} onClick={() => { haptic(); setShowNodes(!showNodes); }} title={D.ttFol369}>369</button>
            <button className={`fol-icon-btn${showInfo ? ' on' : ''}`} onClick={() => { haptic(); setShowInfo(!showInfo); }} title={D.ttFolInfo}>ℹ</button>
          </div>
        </div>
        <div className={`fol-info-panel${showInfo ? '' : ' hidden'}`}>
          <div className="fol-info-hz">{cur.hz} Hz</div>
          <div className="fol-info-desc">{cur.desc}</div>
          
          <div style={{marginTop: '1.2rem', padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', borderLeft: '2px solid rgba(255,255,255,0.1)'}}>
            <div 
              style={{fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.6, fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}
              onClick={() => { haptic(); setShowHowTo(!showHowTo); }}
            >
              {D.folHowToTitle}
              <span>{showHowTo ? '▲' : '▼'}</span>
            </div>
            {showHowTo && (
              <div style={{fontSize: '12px', lineHeight: 1.6, opacity: 0.8, marginTop: '8px', paddingTop: '8px', borderTop: '0.5px solid rgba(255,255,255,0.1)'}}>
                {D.folHowToContent}
              </div>
            )}
          </div>
        </div>
        <div className="fol-footer">
          <button className={`fol-play-btn${playing ? ' playing' : ''}`} onClick={() => { haptic(); toggleAudio(); }} title={D.ttPlayPause}>
            <span style={{fontSize: '16px'}}>{playing ? '◈' : '◉'}</span>
            <span>{playing ? D.freqActive : D.anchorEarth}</span>
          </button>
          <div className={`fol-controls${playing ? '' : ' hidden'}`}>
            {(['sine', 'triangle', 'square'] as OscillatorType[]).map(w => (
              <button key={w} className={`wave-btn${wave === w ? ' on' : ''}`} onClick={() => { haptic(); handleWaveSelect(w); }} title={D.ttFolWave}>{w}</button>
            ))}
            <div className="divider"></div>
            <span style={{fontSize: '12px', opacity: .4, color: '#8b7355'}}>🔈</span>
            <input type="range" min="0" max="1" step="0.01" value={vol} onChange={(e: any) => handleVolChange(parseFloat(e.target.value))} style={{width: '80px', height: '2px', accentColor: '#8b7355'}} title={D.ttVol} />
          </div>
        </div>
      </div>
    </div>
  );
}
