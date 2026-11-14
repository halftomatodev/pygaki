"""pygaki 안내서(HTML 한 파일) 만들기.

    python bundle/guide/build_guide.py            # bundle/guide/pygaki_안내서.html
    python bundle/guide/build_guide.py --out 경로

저장소 문서를 읽어서 그대로 붙인다(사본을 따로 두지 않아 문서를 고치면 다시 돌리기만 하면 됨).
    시작하기, 한눈에, 직접 고치기, 주의와 라이선스   bundle/guide/parts/*.md
    PyKaki로 대본 쓰기                              pykaki/docs/GUIDE.md (앱의 [도움말])
    플러그인 커스텀 가이드                           showpy/docs/CUSTOM_GUIDE.md
    효과 견본                                       효과 파일(@effect, @transition)과 화면 셰이더 목록, 견본 영상 pykaki/public/effects/*.webm
견본 영상은 파일 안에 넣는다(data: 주소). 밖으로 나가는 요청이 없는 한 파일이라 묶음 어디에 두어도 열린다.
make_bundle.py가 묶을 때 이 스크립트를 불러 pygaki/pygaki_안내서.html로 넣는다. 파이썬 3 표준 라이브러리만 쓴다.
"""
import argparse
import base64
import glob
import html
import json
import os
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
REPO_URL = "https://github.com/halftomatodev/pygaki"
OUT = os.path.join(HERE, "pygaki_안내서.html")

## 장 순서: (id, 제목, 원본 파일, 원본 첫 줄 제목을 뺄지)
CHAPTERS = [
    ("start", "시작하기", "bundle/guide/parts/start.md"),
    ("overview", "한눈에: 문서와 파일 자리", "bundle/guide/parts/overview.md"),
    ("pykaki", "PyKaki로 대본 쓰기", "pykaki/docs/GUIDE.md"),
    ("custom", "플러그인 커스텀 가이드", "showpy/docs/CUSTOM_GUIDE.md"),
    ("effects", "효과 견본", None),
    ("develop", "직접 고치기", "bundle/guide/parts/develop.md"),
    ("license", "주의와 라이선스", "bundle/guide/parts/license.md"),
]


def read(rel):
    with open(os.path.join(ROOT, rel), encoding="utf-8") as f:
        return f.read()


# ── 마크다운 → HTML (이 저장소 문서에 쓰는 것만: 제목, 문단, 목록, 표, 코드 블록, 인용, 굵게, 코드, 링크) ──

def slug(s, used):
    base = re.sub(r"[^\w가-힣]+", "-", s).strip("-").lower() or "s"
    k, n = base, 2
    while k in used:
        k, n = "%s-%d" % (base, n), n + 1
    used.add(k)
    return k


def link_url(u, src):
    if re.match(r"^(https?:|#|mailto:)", u):
        return u
    ## 저장소 안 상대 경로 → GitHub 주소 (안내서는 묶음 안에 따로 있어서 상대 경로가 안 맞음)
    base = os.path.dirname(src) if src else ""
    path = os.path.normpath(os.path.join(base, u)).replace("\\", "/")
    if path.startswith(".."):
        return REPO_URL
    return "%s/blob/main/%s" % (REPO_URL, path)


def inline(t, src):
    out, i = [], 0
    for m in re.finditer(r"`([^`]+)`", t):
        out.append(inline_plain(t[i:m.start()], src))
        out.append("<code>%s</code>" % html.escape(m.group(1)))
        i = m.end()
    out.append(inline_plain(t[i:], src))
    return "".join(out)


def inline_plain(t, src):
    t = html.escape(t, quote=False)
    t = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", t)
    ## [글](주소). (F1)처럼 주소가 아닌 괄호는 글 그대로 둔다
    def ln(m):
        text, url = m.group(1), m.group(2)
        if not re.match(r"^(https?:|#|\.|[\w/-]+\.(md|txt|rpy|glsl|json)(#.*)?$)", url):
            return m.group(0)
        u = link_url(html.unescape(url), src)
        ext = ' target="_blank" rel="noopener"' if u.startswith("http") else ""
        return '<a href="%s"%s>%s</a>' % (html.escape(u), ext, text)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", ln, t)
    return t


def split_row(line):
    line = line.strip()
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|") and not line.endswith("\\|"):
        line = line[:-1]
    cells, cur, code = [], "", False
    i = 0
    while i < len(line):
        c = line[i]
        if c == "\\" and i + 1 < len(line) and line[i + 1] == "|":
            cur += "|"
            i += 2
            continue
        if c == "`":
            code = not code
        if c == "|" and not code:
            cells.append(cur.strip())
            cur = ""
        else:
            cur += c
        i += 1
    cells.append(cur.strip())
    return cells


LIST_RE = re.compile(r"^(\s*)([-*]|\d+\.)\s+(.*)$")


def md(text, src, heads, used, shift=0):
    """heads: [(단계, id, 제목)]에 h2, h3을 더한다. shift: 제목 단계를 내림."""
    lines = text.replace("\r\n", "\n").split("\n")
    out = []
    i = 0
    para = []

    def flush():
        if para:
            out.append("<p>%s</p>" % inline(" ".join(x.strip() for x in para), src))
            para.clear()

    while i < len(lines):
        ln = lines[i]
        s = ln.strip()
        ## 코드 블록 (들여 쓴 것도)
        m = re.match(r"^(\s*)```(\w*)", ln)
        if m:
            flush()
            ind = len(m.group(1))
            body = []
            i += 1
            while i < len(lines) and not lines[i].strip().startswith("```"):
                body.append(lines[i][ind:] if lines[i][:ind].strip() == "" else lines[i])
                i += 1
            i += 1
            out.append('<pre><code>%s</code></pre>' % html.escape("\n".join(body)))
            continue
        if not s:
            flush()
            i += 1
            continue
        if re.match(r"^-{3,}$|^\*{3,}$", s):
            flush()
            out.append("<hr>")
            i += 1
            continue
        m = re.match(r"^(#{1,6})\s+(.*)$", s)
        if m:
            flush()
            lv = min(6, len(m.group(1)) + shift)
            title = m.group(2).strip()
            hid = slug(title, used)
            if lv in (2, 3):
                heads.append((lv, hid, re.sub(r"`", "", title)))
            out.append('<h%d id="%s">%s</h%d>' % (lv, hid, inline(title, src), lv))
            i += 1
            continue
        if s.startswith(">"):
            flush()
            q = []
            while i < len(lines) and lines[i].strip().startswith(">"):
                q.append(lines[i].strip()[1:].strip())
                i += 1
            out.append("<blockquote>%s</blockquote>" % inline(" ".join(q), src))
            continue
        if s.startswith("|") and i + 1 < len(lines) and re.match(r"^\s*\|?\s*:?-{2,}", lines[i + 1]):
            flush()
            head = split_row(s)
            i += 2
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                rows.append(split_row(lines[i]))
                i += 1
            t = ['<div class="tbl"><table><thead><tr>']
            t += ["<th>%s</th>" % inline(c, src) for c in head]
            t.append("</tr></thead><tbody>")
            for r in rows:
                t.append("<tr>" + "".join("<td>%s</td>" % inline(c, src) for c in r) + "</tr>")
            t.append("</tbody></table></div>")
            out.append("".join(t))
            continue
        if LIST_RE.match(ln):
            flush()
            i = md_list(lines, i, out, src)
            continue
        para.append(ln)
        i += 1
    flush()
    return "\n".join(out)


def md_list(lines, i, out, src):
    """들여쓰기로 겹친 목록. 목록 줄 아래 더 들여 쓴 글은 그 항목에 이어 붙이고, 코드 블록도 그 항목 안에."""
    stack = []  # (들여쓰기, 태그)
    item_open = []

    def close_to(ind):
        while stack and stack[-1][0] > ind:
            out.append("</li></%s>" % stack.pop()[1])

    while i < len(lines):
        ln = lines[i]
        if not ln.strip():
            ## 빈 줄 다음이 목록이나 더 들여 쓴 글이면 계속
            j = i + 1
            if j < len(lines) and (LIST_RE.match(lines[j]) or (lines[j].startswith("  ") and stack)):
                i = j
                continue
            break
        m = LIST_RE.match(ln)
        if m:
            ind = len(m.group(1).expandtabs(4))
            tag = "ol" if m.group(2)[0].isdigit() else "ul"
            close_to(ind)
            if not stack or stack[-1][0] < ind:
                out.append("<%s>" % tag)
                stack.append((ind, tag))
            else:
                out.append("</li>")
            out.append("<li>" + inline(m.group(3), src))
            i += 1
            continue
        if stack and (ln.startswith(" ") or ln.startswith("\t")):
            cm = re.match(r"^(\s*)```", ln)
            if cm:
                ind = len(cm.group(1))
                body = []
                i += 1
                while i < len(lines) and not lines[i].strip().startswith("```"):
                    body.append(lines[i][ind:] if lines[i][:ind].strip() == "" else lines[i])
                    i += 1
                i += 1
                out.append('<pre><code>%s</code></pre>' % html.escape("\n".join(body)))
                continue
            out.append(" " + inline(ln.strip(), src))
            i += 1
            continue
        break
    close_to(-1)
    return i


# ── 효과 견본 ──

def effect_lines(text, kind):
    return [(m.group(1), m.group(2).strip()) for m in re.finditer(r"^@%s\s+(\S+)\s*(.*)$" % kind, text, re.M)]


def effects_chapter(heads, used, clips_dir):
    renpy = effect_lines(read("pykaki/src/fx/renpy_textshaders.glsl"), "effect")
    engine = effect_lines(read("showpy/game/ui_kit/engine/text_effects.glsl"), "effect")
    folder_fx, folder_tr = [], []
    for fn in sorted(glob.glob(os.path.join(ROOT, "showpy", "game", "ui_kit", "effects", "*.glsl"))):
        t = open(fn, encoding="utf-8").read()
        folder_fx += effect_lines(t, "effect")
        folder_tr += effect_lines(t, "transition")
    clips = {}
    for fn in glob.glob(os.path.join(clips_dir, "*.webm")):
        with open(fn, "rb") as f:
            clips[os.path.splitext(os.path.basename(fn))[0]] = base64.b64encode(f.read()).decode("ascii")
    out = []

    def h2(title):
        hid = slug(title, used)
        heads.append((2, hid, title))
        out.append('<h2 id="%s">%s</h2>' % (hid, html.escape(title)))

    out.append("<p>대사 줄의 글자 효과 카드에서 고르는 <b>글자 등장 효과</b>, 배경·보이기 줄에서 고르는 <b>그림 전환</b>, 상자의 ◐ 셰이더에서 고르는 "
               "<b>화면 셰이더</b>입니다. 영상은 렌파이에서 찍은 견본이고(마우스를 올리면 처음부터), 영상이 없는 효과는 pygaki 앱 [효과] 화면의 "
               "갤러리에서 움직이는 모습을 봅니다. 원고에는 이름(영어)을 씁니다: <code>e \"안녕\" (effect=\"wave\")</code>, "
               "<code>scene bg hall with img_fx.use(\"irisin\")</code>, <code>$ screen_fx.shaders(\"glitch\", \"none\")</code>.</p>")

    def cards(items, where):
        out.append('<div class="fx-grid">')
        for name, label in items:
            v = clips.get(name)
            media = ('<video src="data:video/webm;base64,%s" autoplay loop muted playsinline preload="auto"></video>' % v) if v else \
                '<div class="fx-none">영상 없음 · 앱 [효과]에서 보기</div>'
            out.append('<figure class="fx-card">%s<figcaption><b>%s</b><code>%s</code><span>%s</span></figcaption></figure>'
                       % (media, html.escape(label or name), html.escape(name), where))
        out.append("</div>")

    h2("글자 등장 효과")
    out.append('<p><code>effect="이름"</code>. 두 효과를 겹치려면 <code>effect="slidein|shake"</code>, 세부 값은 <code>effect="wave:u__amplitude=8"</code>. '
               '글의 일부에만 걸려면 태그 <code>{shader=이름}글{/shader}</code>.</p>')
    cards(renpy, "렌파이 기본")
    cards(engine, "pygaki 기본")
    cards(folder_fx, "효과 폴더")
    h2("그림 전환")
    out.append("<p>배경·보이기·숨기기 줄의 \"나타나는 방식\"에서 고르고 [세부 값]으로 시간과 값을 정합니다. 원고에는 "
               "<code>with img_fx.use(\"이름\", 초, 값=…)</code>. 파일은 <code>ui_kit/effects/</code>에 하나씩 있습니다.</p>")
    out.append('<div class="tbl"><table><thead><tr><th>이름</th><th>모양</th></tr></thead><tbody>')
    for name, label in folder_tr:
        out.append("<tr><td><code>%s</code></td><td>%s</td></tr>" % (html.escape(name), html.escape(label)))
    out.append("</tbody></table></div>")
    try:
        sh = json.loads(read("showpy/game/screen_fx/shader_list.json"))["shaders"]
    except Exception:
        sh = []
    if sh:
        h2("화면 셰이더")
        out.append("<p>상자나 label의 ◐ 셰이더에서 1번, 2번 자리에 고릅니다. 원고에는 <code>$ screen_fx.shaders(\"1번\", \"2번\", transition=…)</code>. "
                   "세부 값은 셰이더마다 <code>screen_fx/&lt;이름&gt;_config.rpy</code>에서 고치고, 목록에서 감추려면 앱 [셰이더]의 [숨김]이나 "
                   "<code>screen_fx/shaders_off.txt</code>를 씁니다.</p>")
        out.append('<div class="tbl"><table><thead><tr><th>이름</th><th>화면 이름</th><th>덮개(2번) 전용</th></tr></thead><tbody>')
        for x in sorted(sh, key=lambda x: x.get("order", 0)):
            out.append("<tr><td><code>%s</code></td><td>%s</td><td>%s</td></tr>" % (
                html.escape(str(x.get("id", ""))), html.escape(str(x.get("name", ""))), "예" if x.get("overlay_only") else ""))
        out.append("</tbody></table></div>")
    return "\n".join(out)


# ── 페이지 ──

PAGE = """<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>pygaki 안내서</title>
<style>
:root{--bg:#fbfaf7;--panel:#ffffff;--text:#1f2328;--muted:#5d6670;--line:#e3e0d8;--soft:#f3f1ec;--accent:#e2563f;--accent-soft:#fde9e4;--code:#f2efe8;--link:#1c6fd1;--mark:#ffe58a}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#16181c;--panel:#1d2025;--text:#e6e6e6;--muted:#9aa3ad;--line:#30343b;--soft:#23272d;--accent:#ff7a63;--accent-soft:#3a2420;--code:#262a31;--link:#6cb0ff;--mark:#6b5a12}}
:root[data-theme="dark"]{--bg:#16181c;--panel:#1d2025;--text:#e6e6e6;--muted:#9aa3ad;--line:#30343b;--soft:#23272d;--accent:#ff7a63;--accent-soft:#3a2420;--code:#262a31;--link:#6cb0ff;--mark:#6b5a12}
*{box-sizing:border-box}
html{scroll-padding-top:16px}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.7 "Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;word-break:keep-all;overflow-wrap:anywhere}
a{color:var(--link)}
.wrap{display:grid;grid-template-columns:290px minmax(0,1fr);min-height:100vh}
nav{position:sticky;top:0;height:100vh;overflow:auto;background:var(--panel);border-right:1px solid var(--line);padding:18px 14px 40px}
nav .brand{font-weight:800;font-size:20px;margin:0 6px 2px}
nav .brand span{color:var(--accent)}
nav .ver{color:var(--muted);font-size:13px;margin:0 6px 12px}
nav input{width:100%;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--bg);color:var(--text);font:inherit;font-size:14px}
nav .tools{display:flex;gap:6px;margin:8px 0 12px}
nav .tools button{flex:1;padding:5px;border:1px solid var(--line);background:var(--soft);color:var(--text);border-radius:7px;font:inherit;font-size:13px;cursor:pointer}
nav ol{list-style:none;margin:0;padding:0}
nav li a{display:block;padding:3px 8px;border-radius:6px;color:var(--text);text-decoration:none;font-size:14px;line-height:1.45}
nav li a:hover{background:var(--soft)}
nav li.ch>a{font-weight:700;margin-top:6px}
nav li.ch>a .n{color:var(--accent);margin-right:6px}
nav li.s2>a{padding-left:24px;color:var(--muted);font-size:13px}
nav li.on>a{background:var(--accent-soft);color:var(--text)}
nav ol.sub{display:none}
nav li.open>ol.sub{display:block}
main{padding:28px 40px 120px;max-width:1040px}
header.hero{border-bottom:1px solid var(--line);padding-bottom:18px;margin-bottom:8px}
header.hero h1{font-size:30px;margin:0 0 6px}
header.hero p{color:var(--muted);margin:4px 0}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
.chips a{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:4px 12px;text-decoration:none;color:var(--text);font-size:14px}
.chips a b{color:var(--accent);margin-right:4px}
section.chapter{padding-top:12px}
section.chapter>h1{font-size:26px;border-bottom:2px solid var(--accent);padding-bottom:6px;margin:44px 0 12px}
section.chapter>h1 .n{color:var(--accent);margin-right:10px}
.src{color:var(--muted);font-size:13px;margin:-4px 0 16px}
h2{font-size:21px;margin:34px 0 10px}
h3{font-size:17px;margin:24px 0 8px}
h4,h5,h6{font-size:15px;margin:18px 0 6px}
p,li{margin:6px 0}
ul,ol{padding-left:24px}
code{background:var(--code);border-radius:4px;padding:1px 5px;font:13.5px/1.5 Consolas,"D2Coding",monospace}
pre{background:var(--code);border:1px solid var(--line);border-radius:8px;padding:12px 14px;overflow:auto;font-size:13.5px;line-height:1.55}
pre code{background:none;padding:0}
blockquote{margin:10px 0;padding:8px 14px;border-left:4px solid var(--accent);background:var(--accent-soft);border-radius:0 8px 8px 0}
hr{border:0;border-top:1px solid var(--line);margin:20px 0}
.tbl{overflow-x:auto;margin:10px 0}
table{border-collapse:collapse;width:100%;font-size:14.5px;background:var(--panel)}
th,td{border:1px solid var(--line);padding:6px 9px;text-align:left;vertical-align:top}
th{background:var(--soft);white-space:nowrap}
mark{background:var(--mark);color:inherit;border-radius:2px}
.hide{display:none!important}
.nohit{color:var(--muted);padding:20px 0}
.fx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin:12px 0 20px}
.fx-card{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:10px;overflow:hidden}
.fx-card video,.fx-none{display:block;width:100%;aspect-ratio:48/5;object-fit:contain;background:#111}
.fx-none{color:#9aa3ad;font-size:12px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.4}
.fx-card figcaption{padding:7px 10px 9px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline;font-size:14px}
.fx-card figcaption span{color:var(--muted);font-size:12px;width:100%}
.top{position:fixed;right:18px;bottom:18px;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:999px;width:42px;height:42px;font-size:18px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12)}
.menu-btn{display:none}
@media (max-width:860px){
  .wrap{display:block}
  nav{position:fixed;inset:0 25% 0 0;z-index:5;transform:translateX(-105%);transition:transform .2s;height:auto;box-shadow:0 0 30px rgba(0,0,0,.3)}
  body.nav-open nav{transform:none}
  main{padding:16px 16px 100px}
  .menu-btn{display:inline-block;position:sticky;top:8px;z-index:4;border:1px solid var(--line);background:var(--panel);color:var(--text);border-radius:8px;padding:6px 12px;font:inherit;margin-bottom:8px}
  header.hero h1{font-size:24px}
}
@media print{nav,.top,.menu-btn{display:none}.wrap{display:block}main{max-width:none}}
</style>
</head>
<body>
<div class="wrap">
<nav id="nav">
  <div class="brand">py<span>gaki</span> 안내서</div>
  <div class="ver">__VER__</div>
  <input id="q" type="search" placeholder="찾기 (예: 루비, 셰이더, 단축키)" aria-label="안내서에서 찾기">
  <div class="tools"><button id="theme" type="button">테마</button><button id="fold" type="button">모두 펼치기</button></div>
  <ol id="toc">__TOC__</ol>
</nav>
<main>
<button class="menu-btn" id="menu" type="button">☰ 목차</button>
<header class="hero">
  <h1>pygaki 안내서</h1>
  <p>렌파이로 게임을 만드는 사람을 위한 대본 편집기 PyKaki와 pygaki 플러그인의 모든 안내를 한 파일에 모았습니다. 인터넷 없이 열리고, 왼쪽 찾기 칸으로 낱말을 찾습니다.</p>
  <p>__VER__ · 저장소 <a href="__REPO__" target="_blank" rel="noopener">__REPO__</a></p>
  <div class="chips">__CHIPS__</div>
</header>
__BODY__
<p class="nohit hide" id="nohit">찾는 낱말이 들어 있는 곳이 없어요.</p>
</main>
</div>
<button class="top" id="top" type="button" title="맨 위로">↑</button>
<script>
(function(){
  var root=document.documentElement;
  function ls(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}
  var th=ls('pygaki-guide-theme'); if(th)root.setAttribute('data-theme',th);
  document.getElementById('theme').onclick=function(){
    var dark=root.getAttribute('data-theme')?root.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme: dark)').matches;
    var t=dark?'light':'dark'; root.setAttribute('data-theme',t); ls('pygaki-guide-theme',t);
  };
  document.getElementById('top').onclick=function(){scrollTo({top:0,behavior:'smooth'})};
  var menu=document.getElementById('menu');
  menu.onclick=function(){document.body.classList.toggle('nav-open')};
  document.getElementById('nav').addEventListener('click',function(e){if(e.target.closest('a'))document.body.classList.remove('nav-open')});
  // 목차: 지금 읽는 장과 절을 표시하고 그 장만 펼친다
  var links=[].slice.call(document.querySelectorAll('#toc a'));
  var byId={}; links.forEach(function(a){byId[a.getAttribute('href').slice(1)]=a});
  var heads=[].slice.call(document.querySelectorAll('main h1[id],main h2[id]')).filter(function(h){return byId[h.id]});
  var allOpen=false;
  document.getElementById('fold').onclick=function(){allOpen=!allOpen;this.textContent=allOpen?'장만 보기':'모두 펼치기';mark()};
  function mark(){
    var cur=null,y=innerHeight*0.25;
    for(var i=0;i<heads.length;i++){if(heads[i].offsetParent===null)continue;if(heads[i].getBoundingClientRect().top<y)cur=heads[i];else break}
    links.forEach(function(a){a.parentNode.classList.remove('on')});
    document.querySelectorAll('#toc li.ch').forEach(function(li){li.classList.toggle('open',allOpen)});
    if(cur){var a=byId[cur.id];a.parentNode.classList.add('on');var ch=a.closest('li.ch');if(ch)ch.classList.add('open')}
  }
  addEventListener('scroll',function(){requestAnimationFrame(mark)},{passive:true}); mark();
  // 견본 영상: 마우스를 올리면 처음부터
  document.querySelectorAll('.fx-card video').forEach(function(v){v.parentNode.addEventListener('mouseenter',function(){v.currentTime=0;v.play()})});
  // 찾기: 낱말이 든 절만 남기고 표시
  var blocks=[].slice.call(document.querySelectorAll('main .blk'));
  var q=document.getElementById('q'),t=null;
  function clearMarks(){document.querySelectorAll('main mark').forEach(function(m){m.replaceWith(document.createTextNode(m.textContent))});document.querySelectorAll('main .blk').forEach(function(b){b.normalize()})}
  function hl(el,w){
    var walk=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,null),n,list=[];
    while((n=walk.nextNode()))if(n.nodeValue.toLowerCase().indexOf(w)>=0&&!n.parentNode.closest('script,style'))list.push(n);
    list.forEach(function(n){var i,s=n.nodeValue,low=s.toLowerCase(),f=document.createDocumentFragment(),p=0;
      while((i=low.indexOf(w,p))>=0){f.appendChild(document.createTextNode(s.slice(p,i)));var m=document.createElement('mark');m.textContent=s.slice(i,i+w.length);f.appendChild(m);p=i+w.length}
      f.appendChild(document.createTextNode(s.slice(p)));n.replaceWith(f)});
  }
  function run(){
    clearMarks(); var w=q.value.trim().toLowerCase(),hit=0;
    blocks.forEach(function(b){var ok=!w||b.textContent.toLowerCase().indexOf(w)>=0;b.classList.toggle('hide',!ok);if(ok&&w){hit++;hl(b,w)}});
    document.querySelectorAll('main section.chapter').forEach(function(s){s.classList.toggle('hide',!!w&&!s.querySelector('.blk:not(.hide)'))});
    document.getElementById('nohit').classList.toggle('hide',!w||hit>0);
    document.querySelector('header.hero').classList.toggle('hide',!!w);
    mark();
  }
  q.addEventListener('input',function(){clearTimeout(t);t=setTimeout(run,180)});
  if(q.value)run(); // 다시 열 때 브라우저가 찾기 칸 글을 되살리면 그대로 걸러 보인다
  q.addEventListener('keydown',function(e){if(e.key==='Escape'){q.value='';run()}});
  addEventListener('keydown',function(e){if((e.ctrlKey||e.metaKey)&&e.key==='f'&&document.activeElement!==q){e.preventDefault();q.focus();q.select()}});
})();
</script>
</body>
</html>
"""


def blocks(body_html):
    """찾기에서 절(h2)마다 숨기고 보이게, h2를 기준으로 덩어리(.blk)로 나눈다."""
    parts = re.split(r"(?=<h2 id=)", body_html)
    return "\n".join('<div class="blk">%s</div>' % p for p in parts if p.strip())


def version():
    def v(rel, pat):
        try:
            m = re.search(pat, read(rel))
            return m.group(1) if m else "?"
        except OSError:
            return "?"
    return "pygaki 플러그인 ui_kit %s · screen_fx %s · splash %s" % (
        v("showpy/game/ui_kit/engine/ui_kit.rpy", r'VERSION = "([\d.]+)"'),
        v("showpy/game/screen_fx/engine/screen_fx.rpy", r'VERSION = "([\d.]+)"'),
        v("showpy/game/splash/engine/splash.rpy", r'VERSION = "([\d.]+)"'))


def build(out_path=OUT, clips_dir=None):
    clips_dir = clips_dir or os.path.join(ROOT, "pykaki", "public", "effects")
    used = set()
    toc, chips, body = [], [], []
    for n, (cid, title, src) in enumerate(CHAPTERS, 1):
        used.add(cid)
        heads = []
        if src:
            text = read(src)
            ## 원본 맨 위 제목(# …)은 장 제목으로 바꾼다
            text = re.sub(r"\A\s*#\s+[^\n]*\n", "", text)
            inner = md(text, src, heads, used)
            note = '<p class="src">원본: <a href="%s/blob/main/%s" target="_blank" rel="noopener"><code>%s</code></a></p>' % (REPO_URL, src, src) \
                if not src.startswith("bundle/guide/") else ""
        else:
            inner = effects_chapter(heads, used, clips_dir)
            note = ""
        body.append('<section class="chapter" id="%s"><h1 id="%s-h"><span class="n">%d</span>%s</h1>%s\n%s</section>'
                    % (cid, cid, n, html.escape(title), note, blocks(inner)))
        sub = "".join('<li class="s2"><a href="#%s">%s</a></li>' % (h, html.escape(t)) for lv, h, t in heads if lv == 2)
        toc.append('<li class="ch"><a href="#%s-h"><span class="n">%d</span>%s</a><ol class="sub">%s</ol></li>' % (cid, n, html.escape(title), sub))
        chips.append('<a href="#%s-h"><b>%d</b>%s</a>' % (cid, n, html.escape(title)))
    page = (PAGE.replace("__TOC__", "".join(toc)).replace("__CHIPS__", "".join(chips))
            .replace("__VER__", html.escape(version())).replace("__REPO__", REPO_URL).replace("__BODY__", "\n".join(body)))
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    return out_path


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out", default=OUT)
    a = ap.parse_args()
    p = build(a.out)
    print("만듦: %s (%d KB)" % (os.path.relpath(p, ROOT), os.path.getsize(p) // 1024))
