# strings.tsv (한국어 \t 일본어 \t 영어) → pykaki/src/i18n/dict.json
# 그대로 맞는 글은 exact, ${…}가 든 글은 정규식 pats ({0} {1} … 자리)
import json, re, sys, os, glob

S, OUT = sys.argv[1], sys.argv[2]

def unesc(s):
    return s.replace('\\n', '\n')

def split_tpl(key):
    """'앞${식}뒤' → (['앞', '뒤'], 식 개수)"""
    parts, i, cur = [], 0, ''
    while i < len(key):
        if key.startswith('${', i):
            depth, j = 1, i + 2
            while j < len(key) and depth:
                if key[j] == '{': depth += 1
                elif key[j] == '}': depth -= 1
                j += 1
            parts.append(cur)
            cur = ''
            i = j
        else:
            cur += key[i]
            i += 1
    parts.append(cur)
    return parts

exact, pats, seen = {}, [], set()
bad = 0
for path in sorted(glob.glob(os.path.join(S, 'strings*.tsv'))):
    for n, line in enumerate(open(path, encoding='utf-8').read().split('\n'), 1):
        if not line.strip():
            continue
        cols = line.split('\t')
        if len(cols) != 3:
            print('칸 수 틀림', os.path.basename(path), n, cols[:1]); bad += 1
            continue
        ko, ja, en = (unesc(c).strip() for c in cols)
        if ko in seen:
            continue
        seen.add(ko)
        if '${' in ko:
            parts = split_tpl(ko)
            k = len(parts) - 1
            # 고정 글에 한글이 없는 패턴(예: '${a} ${b}')은 아무 글이나 쪼개서 빼다 (조각마다 번역은 i18n.ts가 함)
            if not re.search('[가-힣]', ''.join(parts)):
                continue
            for t in (ja, en):
                got = set(int(x) for x in re.findall(r'\{(\d+)\}', t))
                if not got <= set(range(k)):
                    print('자리 번호 틀림', ko[:40], t[:40]); bad += 1
            rx = '^' + '([\\s\\S]*?)'.join(re.escape(p).replace('\\ ', ' ') for p in parts) + '$'
            pats.append([rx, ja, en])
        else:
            exact[ko] = [ja, en]
# 긴 패턴부터 (더 구체적인 것이 먼저 맞게)
pats.sort(key=lambda p: -len(p[0]))
os.makedirs(os.path.dirname(OUT), exist_ok=True)
json.dump({'exact': exact, 'pats': pats}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
print('exact', len(exact), 'pats', len(pats), 'bad', bad)
