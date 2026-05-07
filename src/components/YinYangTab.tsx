import React from 'react';

export function YinYangTab({ D }: { D: any }) {
  const yang = [1, 2, 4, 8, 7, 5, 1, 2, 4, 8, 7, 5];
  const raw = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512, 1024, 2048];
  const yin = [1, 5, 7, 8, 4, 2, 1, 5, 7, 8, 4, 2];
  const yinRaw = ['1', '½', '¼', '⅛', '1/16', '1/32', '1/64', '1/128', '1/256', '1/512', '1/1024', '1/2048'];
  
  return (
    <>
      <blockquote className="yy-quote">
        {D.yyQuote}
        <cite>— Maxence Layet</cite>
      </blockquote>
      <div className="yy-seqs">
        <div className="yy-seq-card">
          <h4 style={{color: '#C87941'}}>{D.yangSeq}</h4>
          <div className="yy-chips">
            {yang.map((v, i) => (
              <div key={i} className="yy-chip">
                <div className="yy-num" style={{background: 'rgba(200,121,65,.15)', borderColor: '#C87941', color: '#C87941'}}>{v}</div>
                <div className="yy-raw">{raw[i] > 9999 ? raw[i].toLocaleString() : raw[i]}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="yy-seq-card">
          <h4 style={{color: '#5B4BC0'}}>{D.yinSeq}</h4>
          <div className="yy-chips">
            {yin.map((v, i) => (
              <div key={i} className="yy-chip">
                <div className="yy-num" style={{background: 'rgba(91,75,192,.15)', borderColor: '#5B4BC0', color: '#5B4BC0'}}>{v}</div>
                <div className="yy-raw">{yinRaw[i]}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <h3 style={{fontFamily: 'var(--display)', fontSize: '10px', letterSpacing: '.15em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: '.8rem'}}>
        {D.sacredPairs}
      </h3>
      <div className="pairs-row">
        {[[1, 8], [2, 7], [4, 5]].map(([a, b], i) => (
          <div key={i} className="pair-card">
            <div className="pair-num" style={{color: '#C87941'}}>{a}</div>
            <div className="pair-label">Yang · Yin</div>
            <div className="pair-num" style={{color: '#5B4BC0'}}>{b}</div>
            <div className="pair-sum">{a}+{b} = 9</div>
          </div>
        ))}
      </div>
      <div className="never-box">
        <strong>{D.never369}</strong>
        {D.never369Desc}
      </div>
    </>
  );
}
