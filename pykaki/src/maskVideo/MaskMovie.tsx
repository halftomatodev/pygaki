// "왼쪽 색 + 오른쪽 투명도" 영상(렌파이 side_mask)을 투명하게 합쳐서 보여 주는 미리보기.
// 브라우저는 이 꼴을 모르니, 숨긴 <video>의 프레임마다 캔버스에서 왼쪽 색에 오른쪽 밝기를 투명도로 넣는다.
// 미리보기용이라 가로를 maxW 이하로 줄여서 그린다 (CPU로 해도 가볍게)
import { useEffect, useRef } from 'react';

export function MaskMovie({ src, className, style, maxW = 480 }: { src: string; className?: string; style?: React.CSSProperties; maxW?: number }) {
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = cv.current;
    if (!canvas) return;
    const v = document.createElement('video');
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.src = src;
    const work = document.createElement('canvas');
    const wx = work.getContext('2d', { willReadFrequently: true })!;
    const ox = canvas.getContext('2d')!;
    let stop = false;
    let raf = 0;
    const paint = () => {
      if (stop) return;
      const vw = v.videoWidth >> 1;
      const vh = v.videoHeight;
      if (vw && vh && v.readyState >= 2) {
        const w = Math.max(1, Math.min(maxW, vw));
        const h = Math.max(1, Math.round((vh * w) / vw));
        if (canvas.width !== w || canvas.height !== h) (canvas.width = w), (canvas.height = h), canvas.style.setProperty('--nat-w', vw + 'px'); // 그림 크기 그대로일 때 원래 가로
        if (work.width !== w * 2 || work.height !== h) (work.width = w * 2), (work.height = h);
        wx.drawImage(v, 0, 0, w * 2, h);
        const col = wx.getImageData(0, 0, w, h);
        const mask = wx.getImageData(w, 0, w, h).data;
        const d = col.data;
        for (let p = 0; p < d.length; p += 4) d[p + 3] = mask[p];
        ox.putImageData(col, 0, 0);
      }
      next();
    };
    const next = () => {
      if (stop) return;
      if ('requestVideoFrameCallback' in v) (v as any).requestVideoFrameCallback(paint);
      else raf = requestAnimationFrame(paint);
    };
    v.play().catch(() => {});
    next();
    return () => {
      stop = true;
      cancelAnimationFrame(raf);
      v.pause();
      v.removeAttribute('src');
      v.load();
    };
  }, [src, maxW]);
  return <canvas ref={cv} className={className} style={style} />;
}
