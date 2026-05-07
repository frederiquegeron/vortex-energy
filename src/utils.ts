export const clamp = (v: number, lo: number = 0, hi: number = 100) => Math.max(lo, Math.min(hi, v));

export const TAU = Math.PI * 2;

export function dr(n: number): number[] {
  n = Math.abs(Math.round(n));
  const s = [n];
  while (n >= 10) {
    n = String(n).split('').reduce((a, b) => a + parseInt(b, 10), 0);
    s.push(n);
  }
  return s;
}

export function drColor(n: number): string {
  if ([3, 6, 9].includes(n)) return '#C9A84C';
  if ([1, 2, 4, 5, 7, 8].includes(n)) return '#C87941';
  return '#888';
}

export function fmt(s: number): string {
  if (!isFinite(s) || isNaN(s)) return '0:00';
  return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export function nodePos(n: number, cx: number, cy: number, R: number) {
  const a = ((n === 9 ? 0 : n * 40) - 90) * Math.PI / 180;
  return { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
}

export const haptic = (ms = 15) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    try {
      navigator.vibrate(ms);
    } catch(e) {}
  }
};
