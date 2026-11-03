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
