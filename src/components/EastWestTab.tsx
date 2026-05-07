import React from 'react';

export function EastWestTab({ D }: { D: any }) {
  const cols = [
    {key: D.chineseTrad, col: '#C9A84C', items: D.ewItems[0]},
    {key: D.vortexTesla, col: '#C87941', items: D.ewItems[1]},
    {key: D.modernPhysics, col: '#5B4BC0', items: D.ewItems[2]},
    {key: D.concrete, col: '#0D7A6B', items: D.ewItems[3]},
  ];

  return (
    <>
      <div style={{textAlign: 'center', marginBottom: '1.2rem'}}>
        <div style={{fontSize: '10px', fontFamily: 'var(--display)', letterSpacing: '.2em', textTransform: 'uppercase', opacity: .35, marginBottom: '.5rem'}}>{D.ewAuthor}</div>
        <p style={{fontSize: '13px', fontStyle: 'italic', opacity: .55, maxWidth: '520px', margin: '0 auto', lineHeight: 1.7}}>
          "{D.ewIntro}"
        </p>
      </div>
      <div className="ew-grid">
        {cols.map((c, i) => (
          <div key={i} className="ew-card">
            <h4 style={{color: c.col, borderBottomColor: `${c.col}30`}}>{c.key}</h4>
            <ul>
              {c.items.map((item, j) => <li key={j}>{item}</li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="kirlian-box">
        <h4>{D.kirlian}</h4>
        <p style={{fontSize: '13px', lineHeight: 1.7, opacity: .65}} dangerouslySetInnerHTML={{__html: D.kirlianDesc}}></p>
      </div>
    </>
  );
}
