// [화면] 탭의 음성 빛 미리보기 (FEATURE 34): 게임에 써 넣는 셰이더(voiceHelper.ts)를 그대로 WebGL로 돌린다.
// 소리 크기는 말하는 듯한 가짜 값(말하기 2.4초, 쉬기 0.8초). 애니메이션 줄이기면 멈춘 한 장
import { useEffect, useRef } from 'react';
import { VOICE_HELPER } from './voiceHelper';

const FRAG = (() => {
  const s = VOICE_HELPER.join('\n');
  const a = s.indexOf('fragment_300="""') + 'fragment_300="""'.length;
  return s.slice(a, s.indexOf('"""', a));
})();
const VARS = (() => {
  const s = VOICE_HELPER.join('\n');
  const a = s.indexOf('variables="""') + 'variables="""'.length;
  return s
    .slice(a, s.indexOf('"""', a))
    .split('\n')
    .filter((l) => l.includes('uniform') || l.includes('varying'))
    .join('\n');
})();

const hex = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16) / 255);
// 말하는 듯한 소리 크기 (0~1)
export const fakeLevel = (t: number) => {
  const c = t % 3.2;
  if (c > 2.4) return 0;
  return Math.min(1, 0.35 + 0.4 * Math.abs(Math.sin(t * 7.3)) * Math.abs(Math.sin(t * 2.1 + 1)) + 0.25 * Math.abs(Math.sin(t * 13.1)));
};

export function VoiceGlowPreview({ w, h, shape, colors, strength, gain, idle }: { w: number; h: number; shape: number; colors: string[]; strength: number; gain: number; idle: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const opt = useRef({ shape, colors, strength, gain, idle });
  opt.current = { shape, colors, strength, gain, idle };
  useEffect(() => {
    const cv = ref.current;
    const gl = cv?.getContext('webgl', { premultipliedAlpha: true, alpha: true });
    if (!cv || !gl) return;
    const sh = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.warn('음성 빛 미리보기 셰이더', gl.getShaderInfoLog(s));
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, 'attribute vec2 a_uv; uniform mediump vec2 u_model_size; varying vec2 v_pk_pos; void main() { v_pk_pos = a_uv * u_model_size; gl_Position = vec4(a_uv.x * 2.0 - 1.0, 1.0 - a_uv.y * 2.0, 0.0, 1.0); }'));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, `precision mediump float;\n${VARS}\nvoid main() {\n${FRAG}\n}`));
    gl.linkProgram(prog);
    // 링크가 안 되면(조각 셰이더와 정밀도가 다른 uniform 등) 그리지 않음. 매 프레임 WebGL 경고가 쌓이지 않게
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return console.warn('음성 빛 미리보기 셰이더 링크', gl.getProgramInfoLog(prog));
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, 'a_uv');
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const U = (n: string) => gl.getUniformLocation(prog, n);
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let lv = 0, last = performance.now(), raf = 0;
    const t0 = performance.now();
    const frame = (now: number) => {
      const o = opt.current;
      const t = still ? 1.2 : (now - t0) / 1000;
      const dt = Math.min(0.2, (now - last) / 1000);
      last = now;
      const raw = Math.min(1, fakeLevel(t) * o.gain);
      lv = still ? raw : lv + (raw - lv) * (1 - Math.exp(-dt * (raw > lv ? 22 : 6)));
      const L = Math.max(lv, o.idle);
      gl.viewport(0, 0, cv.width, cv.height);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(U('u_model_size'), w, h);
      gl.uniform1f(U('u_pk_level'), L);
      gl.uniform1f(U('u_pk_time'), t);
      gl.uniform1f(U('u_pk_shape'), o.shape);
      gl.uniform1f(U('u_pk_strength'), o.strength * Math.min(1, L * 6));
      o.colors.slice(0, 4).forEach((c, i) => gl.uniform4f(U('u_pk_c' + i), ...(hex(c) as [number, number, number]), 1));
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!still) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [w, h]);
  return <canvas ref={ref} className="scv-voice" width={Math.max(1, Math.round(w))} height={Math.max(1, Math.round(h))} />;
}
