// 대본 편집기 화면 글 뽑기 (언어 버튼 사전용). TypeScript 파서로 src의 문자열·템플릿·JSX 글 가운데 한글이 든 것을 모은다.
//   node i18n/extract.cjs            → 사전(strings.tsv)에 없는 글을 i18n/missing.txt에 (한 줄에 하나, 줄바꿈은 \n)
// 효과 파일(.glsl)의 @effect·@param 이름과 셰이더 목록(shader_list.json)의 이름·막대 이름도 같이 모은다
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const HANGUL = /[가-힣]/;
const SKIP_FILES = new Set(['sample.ts', 'i18n.ts']);
const out = new Set();
const add = (t) => {
  t = t.trim();
  if (!HANGUL.test(t)) return;
  // 원고로 나가는 줄
  if (/^(#|\$ |init |return |pass |jump |menu:|if |elif |voice |call screen )/.test(t) || /^(label|screen) [A-Za-z_][\w.]*\s*[(:]/.test(t) || /^(define|default) [A-Za-z_]/.test(t)) return;
  if (t.includes('pygaki가 만든') || t.includes('PyKaki가 만든')) return; // 플러그인이 알아보는 표시
  out.add(t);
};

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (/\.(ts|tsx)$/.test(f) && !SKIP_FILES.has(f) && !f.endsWith('.d.ts')) file(p);
  }
}
function file(p) {
  const sf = ts.createSourceFile(p, fs.readFileSync(p, 'utf8'), ts.ScriptTarget.Latest, true, p.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (n) => {
    if (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) add(n.text);
    else if (ts.isTemplateExpression(n)) {
      // 화면에서는 ${…} 자리가 바뀌는 값이라 원문 모양(${식}) 그대로 열쇠로
      let s = n.head.text;
      for (const sp of n.templateSpans) s += '${' + sp.expression.getText(sf) + '}' + sp.literal.text;
      add(s);
    } else if (ts.isJsxText(n)) add(n.text.replace(/\s+/g, ' '));
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
walk(SRC);

// 효과 파일 이름 (@effect 이름 한글, @transition 이름 한글, @param 값 낮 높 이름)
const GLSL = [path.join(ROOT, '..', 'showpy', 'game', 'ui_kit', 'engine'), path.join(ROOT, '..', 'showpy', 'game', 'ui_kit', 'effects'), path.join(SRC, 'fx')];
for (const d of GLSL) {
  if (!fs.existsSync(d)) continue;
  for (const f of fs.readdirSync(d)) {
    if (!f.endsWith('.glsl')) continue;
    for (const line of fs.readFileSync(path.join(d, f), 'utf8').split(/\r?\n/)) {
      let m = /^@(?:effect|transition)\s+\S+\s+(.+)$/.exec(line);
      if (m) add(m[1]);
      m = /^@param\s+\S+\s+\S+\s+\S+\s+(.+)$/.exec(line);
      if (m) add(m[1]);
    }
  }
}
// 셰이더 목록: 이름, 막대 묶음 이름, 막대 이름
const list = path.join(ROOT, '..', 'showpy', 'game', 'screen_fx', 'shader_list.json');
if (fs.existsSync(list)) {
  const j = JSON.parse(fs.readFileSync(list, 'utf8'));
  for (const s of j.shaders) {
    add(s.label || '');
    add(s.name || '');
    for (const g of s.groups || []) {
      add(String(g[0]));
      for (const r of g[1] || []) if (Array.isArray(r)) add(String(r[1]));
    }
  }
}

const have = new Set();
const tsv = path.join(__dirname, 'strings.tsv');
if (fs.existsSync(tsv)) for (const line of fs.readFileSync(tsv, 'utf8').split('\n')) if (line.includes('\t')) have.add(line.split('\t')[0].replace(/\\n/g, '\n').trim());
const miss = [...out].filter((t) => !have.has(t)).sort((a, b) => a.length - b.length || a.localeCompare(b));
fs.writeFileSync(path.join(__dirname, 'missing.txt'), miss.map((t) => t.replace(/\n/g, '\\n')).join('\n') + '\n');
console.log('전체', out.size, '사전에 없음', miss.length);
