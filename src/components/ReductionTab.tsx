import React, { useState } from 'react';
import { dr, drColor, haptic } from '../utils';

export function ReductionTab({ D }: { D: any }) {
  const [inputVal, setInputVal] = useState<number>(369);
  const [selMult, setSelMult] = useState(9);

  const nines = Array.from({length: 12}, (_, i) => {
    const res = 9 * (i + 1);
    return <span key={i} className="nine-badge">{res}→{dr(res).at(-1)}</span>
  });
  
  const multRows = Array.from({length: 18}, (_, i) => {
    const res = selMult * (i + 1);
    const red = dr(res);
    const fin = red.at(-1)!;
    const col = drColor(fin);
    return (
      <tr key={i}>
        <td style={{opacity: .4}}>{i + 1}</td>
        <td>{res}</td>
        <td style={{opacity: .4, fontSize: '11px'}}>{red.length > 1 ? red.slice(0, -1).join('+') : '—'}</td>
        <td style={{color: col, fontFamily: 'var(--display)', fontWeight: 700}}>{fin}</td>
        <td style={{opacity: .35, fontSize: '10px'}}>{fin === 9 ? D.digit9 : [3, 6].includes(fin) ? D.digitAxis : D.digitFlux}</td>
      </tr>
    );
  });

  const currentRed = dr(inputVal || 1);

  return (
    <div className="red-grid">
      <div className="red-card">
        <h3>{D.tryNumber}</h3>
        <div className="red-input-row">
          <input type="number" value={inputVal} onChange={e => setInputVal(parseInt(e.target.value) || 1)} min="1" max="99999999" title={D.ttNumInput} />
          <button className="go-btn" onClick={() => haptic()} title={D.ttReduce}>{D.reduce}</button>
        </div>
        <div className="steps-row">
          {currentRed.map((v, i) => {
            const isLast = i === currentRed.length - 1 && currentRed.length > 1;
            const col = drColor(v);
            return (
              <React.Fragment key={i}>
                {i > 0 && <span className="s-arr">→</span>}
                {isLast ? (
                  <span className="s-final" style={{background: `${col}18`, color: col, borderColor: col}}>{v}</span>
                ) : (
                  <span className="s-num" style={{background: `${col}15`, color: col}}>{v}</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
      <div className="red-card">
        <h3>{D.ruleOf9}</h3>
        <p style={{fontSize:'13px', lineHeight: 1.7, opacity: .7, marginBottom: '.6rem'}}>{D.ruleOf9Desc}</p>
        <div className="nine-badges">{nines}</div>
      </div>
      <div className="red-card" style={{gridColumn: '1 / -1'}}>
        <h3>{D.multiples}</h3>
        <div className="mult-btns">
          {[2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <button key={n} className={`mult-btn${n === selMult ? ' on' : ''}`} onClick={() => { haptic(); setSelMult(n); }} title={D.ttMult}>{n}</button>
          ))}
        </div>
        <div style={{overflowX: 'auto'}}>
          <table>
            <thead>
              <tr>
                <th>n</th>
                <th>{D.result}</th>
                <th>{D.digitSum}</th>
                <th>{D.reduced}</th>
                <th>{D.pattern}</th>
              </tr>
            </thead>
            <tbody>{multRows}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
