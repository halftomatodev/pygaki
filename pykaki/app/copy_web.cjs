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
// 세션 119: 빌드가 dist/effects를 비운 채 끝난 적이 있어서(Dropbox가 바쁠 때로 보임) 비었으면 멈춤
const fx = path.join(__dirname, '..', 'dist', 'effects');
const n = fs.existsSync(fx) ? fs.readdirSync(fx).length : 0;
if (!n) {
  console.error('dist/effects가 비었어요. pykaki 폴더에서 빌드를 다시 하세요: ' + fx);
  process.exit(1);
}
fs.rmSync(path.join(__dirname, 'web', 'effects'), { recursive: true, force: true });
fs.cpSync(fx, path.join(__dirname, 'web', 'effects'), { recursive: true });
console.log('web/effects 복사함 (' + n + '개)');
