// 웹 버전 빌드(../dist/index.html)를 앱의 web/index.html로 복사한다. 먼저 pykaki 폴더에서 npm run build
const fs = require('node:fs');
const path = require('node:path');
const src = path.join(__dirname, '..', 'dist', 'index.html');
if (!fs.existsSync(src)) {
  console.error('웹 빌드가 없어요. pykaki 폴더에서 npm run build를 먼저 하세요: ' + src);
  process.exit(1);
}
fs.mkdirSync(path.join(__dirname, 'web'), { recursive: true });
fs.copyFileSync(src, path.join(__dirname, 'web', 'index.html'));
console.log('web/index.html 복사함');
// 글자 효과 "렌파이 견본" 영상(public/effects → dist/effects, LineFields.tsx EffectClip). 세션 118: 예전엔 빠져서 앱에 안 나왔음
const fx = path.join(__dirname, '..', 'dist', 'effects');
if (fs.existsSync(fx)) {
  fs.rmSync(path.join(__dirname, 'web', 'effects'), { recursive: true, force: true });
  fs.cpSync(fx, path.join(__dirname, 'web', 'effects'), { recursive: true });
  console.log('web/effects 복사함 (' + fs.readdirSync(fx).length + '개)');
}
