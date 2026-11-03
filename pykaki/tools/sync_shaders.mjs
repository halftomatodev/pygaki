// showpy의 등장 효과 셰이더 파일을 PyKaki로 복사한다.
//   npm run sync-shaders                       (showpy 저장소가 ../showpy에 있을 때)
//   SHOWPY_DIR=F:\SHOWPY\showpy npm run sync-shaders
// 원본: showpy game/ui_kit/engine/text_effects.glsl → 사본: src/fx/text_effects.glsl
// 새 효과는 showpy 파일에만 쓰고 이 스크립트로 가져온다. 사본을 직접 고치지 않는다.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const showpy = process.env.SHOWPY_DIR ?? join(root, '..', 'showpy');
const src = join(showpy, 'game', 'ui_kit', 'engine', 'text_effects.glsl');
const dst = join(root, 'src', 'fx', 'text_effects.glsl');

if (!existsSync(src)) {
  console.error(`showpy 셰이더 파일이 없어요: ${src}\nSHOWPY_DIR에 showpy 저장소 폴더를 적어 주세요.`);
  process.exit(1);
}
const text = readFileSync(src, 'utf8');
const old = existsSync(dst) ? readFileSync(dst, 'utf8') : '';
if (old === text) console.log('이미 같아요: ' + dst);
else {
  writeFileSync(dst, text);
  const names = [...text.matchAll(/^@effect (\w+)/gm)].map((m) => m[1]);
  console.log(`복사했어요 (효과 ${names.length}개): ${src} → ${dst}`);
}
