import React, { useEffect, useRef, useState } from 'react';
import { nodePos, TAU, dr, haptic } from '../utils';

export function VortexTab({ D }: { D: any }) {
  const NODES = D.nodes;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const infoWrapRef = useRef<HTMLDivElement>(null);
  const [animating, setAnimating] = useState(true);
  const [showTri, setShowTri] = useState(true);
  const [showAmber, setShowAmber] = useState(true);
  const [showIndigo, setShowIndigo] = useState(true);
  const [showPath, setShowPath] = useState(true);
  const [activeNode, setActiveNode] = useState<number | null>(null);

  const tRef = useRef(0);
  const reqRef = useRef<number | null>(null);

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    if (animating) tRef.current += 0.007;
    const vortexT = tRef.current;

    const cx = 250, cy = 250, R = 200, nr = 22, FOL_R = 38;
    ctx.clearRect(0, 0, 500, 500);

    // bg
    ctx.fillStyle = 'rgba(14,12,26,0.95)'; ctx.fillRect(0, 0, 500, 500);
    ctx.beginPath(); ctx.arc(cx, cy, R + 12, 0, TAU);
    ctx.strokeStyle = 'rgba(201,168,76,0.1)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, TAU);
    ctx.strokeStyle = 'rgba(201,168,76,0.18)'; ctx.lineWidth = 0.5; ctx.stroke();

    if (showTri) {
      ctx.beginPath();
      const pa = nodePos(3, cx, cy, R), pb = nodePos(6, cx, cy, R), pc = nodePos(9, cx, cy, R);
      ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.lineTo(pc.x, pc.y); ctx.closePath();
      ctx.fillStyle = 'rgba(201,168,76,0.06)'; ctx.fill();
      ctx.strokeStyle = 'rgba(201,168,76,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    }
    if (showAmber) {
      const p = [1, 4, 7].map(n => nodePos(n, cx, cy, R));
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.lineTo(p[2].x, p[2].y); ctx.closePath();
      ctx.fillStyle = 'rgba(200,121,65,0.04)'; ctx.fill();
      ctx.strokeStyle = 'rgba(200,121,65,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    }
    if (showIndigo) {
      const p = [2, 5, 8].map(n => nodePos(n, cx, cy, R));
      ctx.beginPath(); ctx.moveTo(p[0].x, p[0].y); ctx.lineTo(p[1].x, p[1].y); ctx.lineTo(p[2].x, p[2].y); ctx.closePath();
      ctx.fillStyle = 'rgba(91,75,192,0.04)'; ctx.fill();
      ctx.strokeStyle = 'rgba(91,75,192,0.45)'; ctx.lineWidth = 1; ctx.stroke();
    }

    if (showPath) {
      const seq = [1, 2, 4, 8, 7, 5];
      ctx.beginPath();
      seq.forEach((n, i) => { const p = nodePos(n, cx, cy, R); i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y); });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(200,121,65,0.5)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -(vortexT * 80 % 30);
      ctx.stroke();
      ctx.setLineDash([]);

      if (animating) {
        seq.forEach((n, i) => {
          const next = seq[(i + 1) % seq.length];
          const p1 = nodePos(n, cx, cy, R), p2 = nodePos(next, cx, cy, R);
          const prog = (vortexT * 0.4 + i * 0.18) % 1;
          const px = p1.x + (p2.x - p1.x) * prog, py = p1.y + (p2.y - p1.y) * prog;
          ctx.beginPath(); ctx.arc(px, py, 4, 0, TAU);
          ctx.fillStyle = 'rgba(201,168,76,0.85)';
          ctx.shadowBlur = 8; ctx.shadowColor = '#C9A84C';
          ctx.fill(); ctx.shadowBlur = 0;
        });
      }
    }

    const pulse = Math.sin(vortexT * 1.2) * 0.05 + 1;
    ctx.save(); ctx.translate(cx, cy);
    const outerRot = vortexT * 0.35, innerRot = -vortexT * 0.52;
    const PETAL_COLS = ['#C9A84C','#0D7A6B','#5B4BC0','#C87941','#A0406A','#8B3018'];
    const folCenters = [{x:0,y:0}];
    for(let i=0;i<6;i++){const a=i*60*Math.PI/180;folCenters.push({x:FOL_R*Math.cos(a),y:FOL_R*Math.sin(a)});}
    for(let i=0;i<6;i++){const a=i*60*Math.PI/180;folCenters.push({x:2*FOL_R*Math.cos(a),y:2*FOL_R*Math.sin(a)});}
    for(let i=0;i<6;i++){const a=(i*60+30)*Math.PI/180;folCenters.push({x:Math.sqrt(3)*FOL_R*Math.cos(a),y:Math.sqrt(3)*FOL_R*Math.sin(a)});}

    ctx.save(); ctx.rotate(innerRot);
    folCenters.slice(7).forEach((c,i)=>{
      ctx.beginPath();ctx.arc(c.x,c.y,FOL_R,0,TAU);
      ctx.strokeStyle=PETAL_COLS[i%6]+'80';ctx.lineWidth=0.8;ctx.stroke();
    });
    ctx.restore();

    ctx.save(); ctx.rotate(outerRot);
    folCenters.slice(1,7).forEach((c,i)=>{
      ctx.beginPath();ctx.arc(c.x,c.y,FOL_R,0,TAU);
      ctx.strokeStyle=PETAL_COLS[i]+'CC';ctx.lineWidth=1.3;ctx.stroke();
    });
    ctx.restore();

    folCenters.slice(1,7).forEach((c,i)=>{
      const next=folCenters[1+((i+1)%6)];
      ctx.beginPath();ctx.moveTo(c.x,c.y);ctx.lineTo(next.x,next.y);
      ctx.strokeStyle='rgba(201,168,76,0.15)';ctx.lineWidth=0.5;ctx.stroke();
    });

    ctx.beginPath();ctx.arc(0,0,FOL_R,0,TAU);
    ctx.strokeStyle='rgba(201,168,76,0.6)';ctx.lineWidth=1.5;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,FOL_R*3,0,TAU);
    ctx.strokeStyle=`rgba(201,168,76,${0.25*pulse})`;ctx.lineWidth=1;ctx.stroke();
    ctx.beginPath();ctx.arc(0,0,5,0,TAU);
    ctx.fillStyle='#C9A84C';ctx.shadowBlur=10;ctx.shadowColor='#C9A84C';ctx.fill();ctx.shadowBlur=0;
    ctx.restore();

    NODES.forEach(node => {
      const p = nodePos(node.id, cx, cy, R);
      const isAct = activeNode === node.id;
      const r = isAct ? 24 : 20;
      ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU);
      ctx.fillStyle = node.color + '22'; ctx.fill();
      ctx.strokeStyle = node.color; ctx.lineWidth = isAct ? 2.5 : 1.5;
      ctx.shadowBlur = isAct ? 12 : 5; ctx.shadowColor = node.color;
      ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#F4EDD8';
      ctx.font = `${node.id===9?'700':'600'} ${node.id===9?'16px':'14px'} Cinzel,serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(String(node.id), p.x, p.y + 0.5);
    });

    if (animating) {
      reqRef.current = requestAnimationFrame(draw);
    }
  };

  useEffect(() => {
    draw();
    return () => { if (reqRef.current) cancelAnimationFrame(reqRef.current) };
  }, [animating, showTri, showAmber, showIndigo, showPath, activeNode]);

  const onCanvasClick = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = (e.clientX - rect.left) * (500 / rect.width);
    const my = (e.clientY - rect.top) * (500 / rect.height);
    const cx = 250, cy = 250, R = 200, nr = 22;
    for (const node of NODES) {
      const p = nodePos(node.id, cx, cy, R);
      if (Math.hypot(mx - p.x, my - p.y) < nr + 6) {
        haptic();
        setActiveNode(activeNode === node.id ? null : node.id);
        break;
      }
    }
  };

  const activeNodeData = activeNode ? NODES.find((n: any) => n.id === activeNode) : null;

  useEffect(() => {
    if (activeNodeData && infoWrapRef.current) {
      if (window.innerWidth <= 768) {
        infoWrapRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [activeNodeData]);

  const handleShare = () => {
    haptic();
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        const file = new File([blob], 'vortex-369.png', { type: 'image/png' });
        if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Vortex 369',
            text: 'Vortex 369 visualization',
            files: [file],
          });
        } else {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'vortex-369.png';
          a.click();
          URL.revokeObjectURL(url);
        }
      } catch (err) {
        console.error('Share failed', err);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vortex-369.png';
        a.click();
        URL.revokeObjectURL(url);
      }
    }, 'image/png');
  };

  return (
    <div className="vortex-layout">
      <div>
        <canvas ref={canvasRef} id="vortexCanvas" width="500" height="500" onClick={onCanvasClick} title={D.ttVortexCanvas}></canvas>
        <div className="vortex-controls">
          <button className={`toggle-btn${animating ? ' on' : ''}`} onClick={() => { haptic(); setAnimating(!animating); }} title={D.ttAnimate}>{animating ? D.pauseFlow : D.animateFlow}</button>
          <button className={`toggle-btn${showTri ? ' on' : ''}`} onClick={() => { haptic(); setShowTri(!showTri); }} title={D.ttTri}>{D.axisCosmic} 3·6·9</button>
          <button className={`toggle-btn${showAmber ? ' on' : ''}`} onClick={() => { haptic(); setShowAmber(!showAmber); }} title={D.ttAmber}>Triangle 1·4·7</button>
          <button className={`toggle-btn${showIndigo ? ' on' : ''}`} onClick={() => { haptic(); setShowIndigo(!showIndigo); }} title={D.ttIndigo}>Triangle 2·5·8</button>
          <button className={`toggle-btn${showPath ? ' on' : ''}`} onClick={() => { haptic(); setShowPath(!showPath); }} title={D.ttPath}>{D.fluxYang}</button>
          <button className="toggle-btn" onClick={handleShare} title={D.ttShare}>
            <svg style={{width:'1em', height:'1em', display:'inline-block', verticalAlign:'middle', marginRight:'6px', position:'relative', top:'-1px'}} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path><polyline points="16 6 12 2 8 6"></polyline><line x1="12" y1="2" x2="12" y2="15"></line>
            </svg>
            {D.share || 'Share'}
          </button>
        </div>
      </div>
      <div className="node-info" ref={infoWrapRef}>
        {!activeNodeData ? (
          <div className="ni-hint">{D.selectNode}</div>
        ) : (
          <>
            <div className="ni-num" style={{color: activeNodeData.color}}>{activeNodeData.id}</div>
            <div className="ni-hz" style={{color: activeNodeData.color}}>{activeNodeData.freq} Hz</div>
            <div style={{fontFamily: 'var(--display)', fontSize: '9px', letterSpacing: '.1em', textTransform: 'uppercase', color: activeNodeData.color, opacity: 0.7, margin: '.3rem 0'}}>{D.cosmicRole}</div>
            <div className="ni-role">{activeNodeData.role}</div>
            <div className="ni-reduction" style={{color: activeNodeData.color}}>→ {dr(activeNodeData.freq).join(' → ')}</div>
            <div className="ni-quote" style={{borderColor: `${activeNodeData.color}50`, color: `${activeNodeData.color}99`}}>{activeNodeData.quote}</div>
            
            <div className="ni-tuning-fork" 
                  onClick={() => {
                     haptic();
                     try {
                        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                        const osc = ctx.createOscillator();
                        const gain = ctx.createGain();
                        osc.type = 'sine';
                        osc.frequency.value = activeNodeData.freq;
                        osc.connect(gain);
                        gain.connect(ctx.destination);
                        gain.gain.setValueAtTime(0, ctx.currentTime);
                        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.1);
                        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 4.0);
                        osc.start();
                        osc.stop(ctx.currentTime + 4.0);
                     } catch(e) {}
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = activeNodeData.color + '15')}
                  onMouseOut={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.2)')}
                  style={{cursor: 'pointer', transition: 'all 0.3s ease', marginTop: '1.5rem', border: `1px solid ${activeNodeData.color}40`, borderRadius: '8px', padding: '1.5rem', textAlign: 'center', background: 'rgba(0,0,0,0.2)', position: 'relative', overflow: 'hidden'}}
            >
              <div style={{position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.1, backgroundImage: 'radial-gradient(circle at center, white 1px, transparent 1px)', backgroundSize: '10px 10px', pointerEvents: 'none'}}></div>
              <div style={{opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem'}}>{D.tuningFork}</div>
              
              <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
                <svg width="60" height="150" viewBox="0 0 60 150" fill="none" stroke={activeNodeData.color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ filter: `drop-shadow(0 0 12px ${activeNodeData.color}60)` }}>
                  <line x1="30" y1="145" x2="30" y2="90" />
                  <circle cx="30" cy="145" r="4" fill={activeNodeData.color} />
                  <path d="M12 20 L12 70 C12 100 48 100 48 70 L48 20" />
                  
                  <text x="-45" y="22" fontSize="14" fill={activeNodeData.color} stroke="none" fontFamily="var(--display)" transform="rotate(-90)" fontWeight="600" letterSpacing="1px" opacity="0.9">{activeNodeData.freq} Hz</text>
                  <text x="-45" y="45" fontSize="16" fill={activeNodeData.color} stroke="none" fontFamily="var(--display)" transform="rotate(-90)" fontWeight="700" opacity="0.9">{activeNodeData.note}</text>
                </svg>
              </div>

              <div style={{marginTop: '1rem', fontSize: '12px', opacity: 0.5, fontStyle: 'italic'}}>{D.tapToPlay}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
