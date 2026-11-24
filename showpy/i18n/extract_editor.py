"""게임 안 편집 화면(Shift+M)의 한국어 글 가운데 사전에 없는 것을 찾는다.

    python showpy/i18n/extract_editor.py          # showpy/i18n/missing.txt에 적음

- 읽는 곳: game/*/editor/*.rpy 와 아래 MORE 파일 (편집 화면에 뜨는 알림을 만드는 엔진 파일)
- 따옴표 글만 본다. 주석(#), 세 겹 따옴표 글(설명), print(...) 줄, "##"로 시작하는 글(파일에 쓰는 주석)은 뺀다
- 사전: game/ui_kit/editor/editor_lang.tsv (한 줄에 한국어 \t 일본어 \t 영어)
"""
import glob
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = os.path.join(os.path.dirname(HERE), "game")
DICT = os.path.join(GAME, "ui_kit", "editor", "editor_lang.tsv")
MORE = [
    "ui_kit/engine/script_edit.rpy",
]
HANGUL = re.compile(r"[가-힣]")

# 사전에 안 넣는 글: 원고 머리말(데이터), 글꼴 견본, 이어 붙이는 조각(붙인 뒤의 글은 사전의 {} 패턴이나 짧은 낱말로 바뀜)
IGNORE = {
    "pygaki가 만든 파일이에요", "PyKaki가 만든 파일이에요", "가나다라 마바사 ABC abc 123",
    ", 지금 줄을 따라감", ", 덮개 끔", ", 커서 ", ", 화면 기준 {:.0f}, {:.0f}",
    "패널: 제목(=)을 끌어 옮기기 | P 구석 바꾸기 | X 접기 | Space 누르는 동안 숨기기 | B 자동 비키기 ",
    " (휘는 효과는 가장자리에서 누르는 자리가 조금 어긋남)",
    "위치",  # editor_stage.rpy place_lines가 줄을 고르는 데만 씀
}


def strings(src):
    """(글, 줄 번호) 목록. 따옴표 글만, 주석과 세 겹 따옴표는 건너뜀."""
    out = []
    i, n, line = 0, len(src), 1
    while i < n:
        c = src[i]
        if c == "\n":
            line += 1
            i += 1
        elif c == "#":
            while i < n and src[i] != "\n":
                i += 1
        elif src.startswith('"""', i) or src.startswith("'''", i):
            q = src[i:i + 3]
            j = src.find(q, i + 3)
            j = n if j < 0 else j + 3
            line += src.count("\n", i, j)
            i = j
        elif c in "\"'":
            # 앞이 글자면(예: Ren'Py 같은 낱말 안) 따옴표가 아님
            if c == "'" and i > 0 and src[i - 1].isalnum():
                i += 1
                continue
            j = i + 1
            buf = []
            while j < n and src[j] != c and src[j] != "\n":
                if src[j] == "\\" and j + 1 < n:
                    nx = src[j + 1]
                    buf.append({"n": "\n", "t": "\t", "\\": "\\", '"': '"', "'": "'"}.get(nx, "\\" + nx))
                    j += 2
                    continue
                buf.append(src[j])
                j += 1
            out.append(("".join(buf), line))
            i = j + 1
        else:
            i += 1
    return out


def files():
    fs = sorted(f for f in glob.glob(os.path.join(GAME, "*", "editor", "*.rpy")) if not f.endswith("editor_lang.rpy"))
    fs += [os.path.join(GAME, m) for m in MORE]
    return fs


def collect():
    seen = {}
    for f in files():
        src = open(f, encoding="utf-8").read()
        lines = src.split("\n")
        for s, ln in strings(src):
            if not HANGUL.search(s):
                continue
            row = lines[ln - 1] if ln - 1 < len(lines) else ""
            if "print(" in row or s.lstrip().startswith("#"):
                continue
            seen.setdefault(s, "{}:{}".format(os.path.relpath(f, GAME).replace("\\", "/"), ln))
    return seen


def load_dict():
    d = {}
    if os.path.exists(DICT):
        for row in open(DICT, encoding="utf-8").read().split("\n"):
            if not row.strip() or row.startswith("#"):
                continue
            p = row.split("\t")
            # \n은 줄바꿈, \\n은 글자 그대로 \n (게임 쪽 editor_lang.rpy의 _cell과 같게)
            k = re.sub(r"(?<!\\)\\n", "\n", p[0]).replace("\\\\n", "\\n")
            d[k] = p[1:]
    return d


def main():
    seen = collect()
    d = load_dict()
    keys = set(k.strip() for k in d)
    miss = [(s, w) for s, w in seen.items() if s.strip() not in keys and s not in IGNORE]
    out = os.path.join(HERE, "missing.txt")
    with open(out, "w", encoding="utf-8") as f:
        for s, w in miss:
            f.write(s.replace("\n", "\\n") + "\t" + w + "\n")
    print("전체", len(seen), "사전에 없음", len(miss), "->", out)


if __name__ == "__main__":
    sys.exit(main())
