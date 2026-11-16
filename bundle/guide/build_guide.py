"""pygaki 안내서(HTML 한 파일) 만들기. 한국어, 일본어, 영어 세 벌.

    python bundle/guide/build_guide.py                 # bundle/guide/에 세 언어 (FILES 이름)
    python bundle/guide/build_guide.py --out-dir 폴더
    python bundle/guide/build_guide.py --web 폴더       # 웹판: 한국어는 index.html
    python bundle/guide/build_guide.py --stamp         # 번역 파일 첫 줄의 원본 지문을 지금 것으로 (번역을 원본에 맞춘 뒤)

저장소 문서를 읽어서 그대로 붙인다(사본을 따로 두지 않아 문서를 고치면 다시 돌리기만 하면 됨).
    시작하기, 한눈에, 직접 고치기, 주의와 라이선스   bundle/guide/parts/*.md
    pygaki로 대본 쓰기                              pykaki/docs/GUIDE.md (앱의 [도움말])
    플러그인 커스텀 가이드                           showpy/docs/CUSTOM_GUIDE.md
    효과 견본                                       효과 파일(@effect, @transition)과 화면 셰이더 목록, 견본 영상 pykaki/public/effects/*.webm
일본어·영어는 bundle/guide/ja/, en/의 <장 id>.md를 읽는다(첫 줄 <!-- 원본: 경로 @ 지문 -->, 지문은 원본 글의 sha1 앞 10자리). 원본이 바뀌어 지문이 다르면 만들 때 알린다.
효과 이름·셰이더 이름의 번역은 대본 편집기 언어 사전(pykaki/src/i18n/dict.json)을 쓴다.
견본 영상은 파일 안에 넣는다(data: 주소). 밖으로 나가는 요청이 없는 한 파일이라 묶음 어디에 두어도 열린다.
make_bundle.py가 묶을 때 이 스크립트를 불러 pygaki/pygaki_안내서.html로 넣는다. 파이썬 3 표준 라이브러리만 쓴다.
"""
import argparse
import base64
import glob
import html
import json
import os
import hashlib
import re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
REPO_URL = "https://github.com/halftomatodev/pygaki"
LANGS = ("ko", "ja", "en")
LANG_NAME = {"ko": "한국어", "ja": "日本語", "en": "English"}
## 언어마다 파일 이름 (묶음 pygaki/ 안에 나란히, 서로 이 이름으로 잇는다)
FILES = {"ko": "pygaki_안내서.html", "ja": "pygaki_guide_ja.html", "en": "pygaki_guide_en.html"}
OUT = os.path.join(HERE, FILES["ko"])

## 장 순서: (id, {언어: 제목}, 한국어 원본 파일). 번역은 bundle/guide/<언어>/<id>.md
CHAPTERS = [
    ("start", {"ko": "시작하기", "ja": "はじめに", "en": "Getting started"}, "bundle/guide/parts/start.md"),
    ("overview", {"ko": "한눈에: 문서와 파일 자리", "ja": "ひと目で:文書とファイルの場所", "en": "At a glance: where docs and files are"}, "bundle/guide/parts/overview.md"),
    ("pykaki", {"ko": "pygaki로 대본 쓰기", "ja": "pygaki でシナリオを書く", "en": "Writing scripts with pygaki"}, "pykaki/docs/GUIDE.md"),
    ("custom", {"ko": "플러그인 커스텀 가이드", "ja": "プラグイン カスタムガイド", "en": "Plugin customization guide"}, "showpy/docs/CUSTOM_GUIDE.md"),
    ("effects", {"ko": "효과 견본", "ja": "エフェクト見本", "en": "Effect samples"}, None),
    ("develop", {"ko": "직접 고치기", "ja": "自分で手を入れる", "en": "Changing it yourself"}, "bundle/guide/parts/develop.md"),
    ("license", {"ko": "주의와 라이선스", "ja": "注意とライセンス", "en": "Notes and licenses"}, "bundle/guide/parts/license.md"),
]

## 화면 글 (페이지 틀, 효과 견본 장)
T = {
    "ko": dict(
        title="pygaki 안내서", brand="안내서", ph="찾기 (예: 루비, 셰이더, 단축키)", search="안내서에서 찾기",
        theme="테마", fold="모두 펼치기", unfold="장만 보기", menu="☰ 목차", top="맨 위로",
        hero="렌파이로 게임을 만드는 사람을 위한 pygaki(대본 편집기와 pygaki 플러그인)의 모든 안내를 한 파일에 모았습니다. 인터넷 없이 열리고, 왼쪽 찾기 칸으로 낱말을 찾습니다.",
        repo="저장소", nohit="찾는 낱말이 들어 있는 곳이 없어요.", src="원본", ver="pygaki 플러그인",
        fx_intro="대사 줄의 글자 효과 카드에서 고르는 <b>글자 등장 효과</b>, 배경·보이기 줄에서 고르는 <b>그림 전환</b>, 상자의 ◐ 셰이더에서 고르는 "
                 "<b>화면 셰이더</b>입니다. 영상은 렌파이에서 찍은 견본이고(마우스를 올리면 처음부터), 영상이 없는 효과는 pygaki 앱 [효과] 화면의 "
                 "갤러리에서 움직이는 모습을 봅니다. 원고에는 이름(영어)을 씁니다: <code>e \"안녕\" (effect=\"wave\")</code>, "
                 "<code>scene bg hall with img_fx.use(\"irisin\")</code>, <code>$ screen_fx.shaders(\"glitch\", \"none\")</code>.",
        fx_none="영상 없음 · 앱 [효과]에서 보기", w_renpy="렌파이 기본", w_engine="pygaki 기본", w_folder="효과 폴더",
        h_text="글자 등장 효과",
        p_text='<code>effect="이름"</code>. 두 효과를 겹치려면 <code>effect="slidein|shake"</code>, 세부 값은 <code>effect="wave:u__amplitude=8"</code>. '
               '글의 일부에만 걸려면 태그 <code>{shader=이름}글{/shader}</code>.',
        h_tr="그림 전환",
        p_tr="배경·보이기·숨기기 줄의 \"나타나는 방식\"에서 고르고 [세부 값]으로 시간과 값을 정합니다. 원고에는 "
             "<code>with img_fx.use(\"이름\", 초, 값=…)</code>. 파일은 <code>ui_kit/effects/</code>에 하나씩 있습니다.",
        th_name="이름", th_look="모양", h_sh="화면 셰이더",
        p_sh="상자나 label의 ◐ 셰이더에서 1번, 2번 자리에 고릅니다. 원고에는 <code>$ screen_fx.shaders(\"1번\", \"2번\", transition=…)</code>. "
             "세부 값은 셰이더마다 <code>screen_fx/&lt;이름&gt;_config.rpy</code>에서 고치고, 목록에서 감추려면 앱 [셰이더]의 [숨김]이나 "
             "<code>screen_fx/shaders_off.txt</code>를 씁니다.",
        th_shown="화면 이름", th_ov="덮개(2번) 전용", yes="예"),
    "ja": dict(
        title="pygaki 案内書", brand="案内書", ph="検索 (例:ルビ、シェーダー、ショートカット)", search="案内書を検索",
        theme="テーマ", fold="すべて開く", unfold="章だけ表示", menu="☰ 目次", top="いちばん上へ",
        hero="Ren'Py でゲームを作る人のための pygaki(スクリプトエディターと pygaki プラグイン)の案内を、すべて 1 つのファイルにまとめました。インターネットなしで開け、左の検索欄で言葉を探せます。",
        repo="リポジトリ", nohit="探している言葉が入っているところがありません。", src="元の文書(韓国語)", ver="pygaki プラグイン",
        fx_intro="セリフ行の文字エフェクトカードで選ぶ <b>文字の登場エフェクト</b>、背景・表示の行で選ぶ <b>画像トランジション</b>、ボックスの ◐ シェーダーで選ぶ "
                 "<b>画面シェーダー</b>です。動画は Ren'Py で撮った見本で(マウスをのせると最初から)、動画のないエフェクトは pygaki アプリの [エフェクト] 画面の "
                 "ギャラリーで動く様子を見ます。スクリプトには名前(英語)を書きます:<code>e \"こんにちは\" (effect=\"wave\")</code>、"
                 "<code>scene bg hall with img_fx.use(\"irisin\")</code>、<code>$ screen_fx.shaders(\"glitch\", \"none\")</code>。",
        fx_none="動画なし · アプリの [エフェクト] で見る", w_renpy="Ren'Py 標準", w_engine="pygaki 基本", w_folder="エフェクトフォルダー",
        h_text="文字の登場エフェクト",
        p_text='<code>effect="名前"</code>。2 つのエフェクトを重ねるなら <code>effect="slidein|shake"</code>、詳細値は <code>effect="wave:u__amplitude=8"</code>。'
               '文の一部だけにかけるならタグ <code>{shader=名前}文字{/shader}</code>。',
        h_tr="画像トランジション",
        p_tr="背景・表示・隠すの行の「現れ方」で選び、[詳細値] で時間と値を決めます。スクリプトには "
             "<code>with img_fx.use(\"名前\", 秒, 値=…)</code>。ファイルは <code>ui_kit/effects/</code> に 1 つずつあります。",
        th_name="名前", th_look="見た目", h_sh="画面シェーダー",
        p_sh="ボックスや label の ◐ シェーダーで 1 番、2 番の枠に選びます。スクリプトには <code>$ screen_fx.shaders(\"1番\", \"2番\", transition=…)</code>。"
             "詳細値はシェーダーごとに <code>screen_fx/&lt;名前&gt;_config.rpy</code> で直し、一覧から隠すにはアプリ [シェーダー] の [非表示] か "
             "<code>screen_fx/shaders_off.txt</code> を使います。",
        th_shown="表示名", th_ov="オーバーレイ(2 番)専用", yes="はい"),
    "en": dict(
        title="pygaki guide", brand="guide", ph="Search (e.g. ruby, shader, shortcut)", search="Search this guide",
        theme="Theme", fold="Expand all", unfold="Chapters only", menu="☰ Contents", top="Back to top",
        hero="Everything about pygaki (the script editor and the pygaki plugins) for people making games with Ren'Py, in one file. It opens without the internet; search for words in the field on the left.",
        repo="Repository", nohit="No section contains that word.", src="Original (Korean)", ver="pygaki plugins",
        fx_intro="<b>Text effects</b> chosen in the text effect card of dialogue lines, <b>image transitions</b> chosen in background and show lines, and "
                 "<b>screen shaders</b> chosen in a box's ◐ Shader. The videos are samples recorded in Ren'Py (hover to restart); for effects without a video, "
                 "see them move in the gallery of the pygaki app's [Effects] screen. In scripts, use the (English) names: <code>e \"Hello\" (effect=\"wave\")</code>, "
                 "<code>scene bg hall with img_fx.use(\"irisin\")</code>, <code>$ screen_fx.shaders(\"glitch\", \"none\")</code>.",
        fx_none="No video · see it in the app's [Effects]", w_renpy="Ren'Py built-in", w_engine="pygaki default", w_folder="Effects folder",
        h_text="Text effects",
        p_text='<code>effect="name"</code>. To stack two effects, <code>effect="slidein|shake"</code>; for details, <code>effect="wave:u__amplitude=8"</code>. '
               'To apply to only part of the text, use the tag <code>{shader=name}text{/shader}</code>.',
        h_tr="Image transitions",
        p_tr="Choose them in \"how it appears\" of background, show and hide lines, and set the duration and values with [Details]. In scripts: "
             "<code>with img_fx.use(\"name\", seconds, value=…)</code>. Each is one file in <code>ui_kit/effects/</code>.",
        th_name="Name", th_look="Look", h_sh="Screen shaders",
        p_sh="Choose them for slots 1 and 2 in the ◐ Shader of a box or label. In scripts: <code>$ screen_fx.shaders(\"slot1\", \"slot2\", transition=…)</code>. "
             "Adjust each shader's details in <code>screen_fx/&lt;name&gt;_config.rpy</code>; to hide one from lists, use [Hide] in the app's [Shaders] or "
             "<code>screen_fx/shaders_off.txt</code>.",
        th_shown="Display name", th_ov="Overlay (slot 2) only", yes="Yes"),
}

_DICT = None


def tr(text, lang):
    """효과·셰이더 한글 이름 → 대본 편집기 사전의 번역 (없으면 그대로)."""
    global _DICT
    if lang == "ko" or not text:
        return text
    if _DICT is None:
        try:
            _DICT = json.loads(read("pykaki/src/i18n/dict.json"))["exact"]
        except Exception:
            _DICT = {}
    v = _DICT.get(text.strip())
    return v[0 if lang == "ja" else 1] if v else text


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


def effects_chapter(heads, used, clips_dir, lang="ko"):
    t = T[lang]
    renpy = effect_lines(read("pykaki/src/fx/renpy_textshaders.glsl"), "effect")
    engine = effect_lines(read("showpy/game/ui_kit/engine/text_effects.glsl"), "effect")
    folder_fx, folder_tr = [], []
    for fn in sorted(glob.glob(os.path.join(ROOT, "showpy", "game", "ui_kit", "effects", "*.glsl"))):
        src = open(fn, encoding="utf-8").read()
        folder_fx += effect_lines(src, "effect")
        folder_tr += effect_lines(src, "transition")
    clips = {}
    for fn in glob.glob(os.path.join(clips_dir, "*.webm")):
        with open(fn, "rb") as f:
            clips[os.path.splitext(os.path.basename(fn))[0]] = base64.b64encode(f.read()).decode("ascii")
    out = []

    def h2(title):
        hid = slug(title, used)
        heads.append((2, hid, title))
        out.append('<h2 id="%s">%s</h2>' % (hid, html.escape(title)))

    out.append("<p>%s</p>" % t["fx_intro"])

    def cards(items, where):
        out.append('<div class="fx-grid">')
        for name, label in items:
            v = clips.get(name)
            media = ('<video src="data:video/webm;base64,%s" autoplay loop muted playsinline preload="auto"></video>' % v) if v else \
                '<div class="fx-none">%s</div>' % html.escape(t["fx_none"])
            out.append('<figure class="fx-card">%s<figcaption><b>%s</b><code>%s</code><span>%s</span></figcaption></figure>'
                       % (media, html.escape(tr(label, lang) or name), html.escape(name), html.escape(where)))
        out.append("</div>")

    h2(t["h_text"])
    out.append("<p>%s</p>" % t["p_text"])
    cards(renpy, t["w_renpy"])
    cards(engine, t["w_engine"])
    cards(folder_fx, t["w_folder"])
    h2(t["h_tr"])
    out.append("<p>%s</p>" % t["p_tr"])
    out.append('<div class="tbl"><table><thead><tr><th>%s</th><th>%s</th></tr></thead><tbody>' % (t["th_name"], t["th_look"]))
    for name, label in folder_tr:
        out.append("<tr><td><code>%s</code></td><td>%s</td></tr>" % (html.escape(name), html.escape(tr(label, lang))))
    out.append("</tbody></table></div>")
    try:
        sh = json.loads(read("showpy/game/screen_fx/shader_list.json"))["shaders"]
    except Exception:
        sh = []
    if sh:
        h2(t["h_sh"])
        out.append("<p>%s</p>" % t["p_sh"])
        out.append('<div class="tbl"><table><thead><tr><th>%s</th><th>%s</th><th>%s</th></tr></thead><tbody>' % (t["th_name"], t["th_shown"], t["th_ov"]))
        for x in sorted(sh, key=lambda x: x.get("order", 0)):
            out.append("<tr><td><code>%s</code></td><td>%s</td><td>%s</td></tr>" % (
                html.escape(str(x.get("id", ""))), html.escape(tr(str(x.get("name", "")), lang)), t["yes"] if x.get("overlay_only") else ""))
        out.append("</tbody></table></div>")
    return "\n".join(out)


# ── 플래그 용례 (대본 편집기 플래그 만들기 메뉴와 같은 목록. GUIDE의 <!-- flag-recipes --> 자리에) ──

FLAG_MARK = "<!-- flag-recipes -->"


def flag_recipes(lang="ko"):
    """pykaki/src/flagRecipes.ts의 용례(빈 플래그 빼고)를 [영상 | 설명·바꾸는 곳·보는 곳·원고] 줄로. 영상은 pykaki/src/flagclips/<id>.webm"""
    src = read("pykaki/src/flagRecipes.ts")
    strs = lambda t: [x.replace("\\'", "'") for x in re.findall(r"'((?:[^'\\]|\\.)*)'", t)]
    out = ['<div class="g-cases">']
    for m in re.finditer(r"\{\s*id: '(\w+)',\s*(?:demo: \[.*?\n    \],\s*)?icon: '([^']*)',\s*title: '([^']*)',\s*kindHint: '([^']*)',\s*desc: '([^']*)',\s*flags: \[(.*?)\],"
                         r"\s*write: \[(.*?)\],\s*read: \[(.*?)\],\s*code: '((?:[^'\\]|\\.)*)'", src, re.S):
        rid, icon, title, kind, desc, flags, write, read_, code = m.groups()
        if rid == "blank":
            continue
        fn = os.path.join(ROOT, "pykaki", "src", "flagclips", rid + ".webm")
        if os.path.exists(fn):
            with open(fn, "rb") as f:
                media = '<video src="data:video/webm;base64,%s" autoplay loop muted playsinline preload="auto"></video>' % base64.b64encode(f.read()).decode("ascii")
        else:
            media = ""
        names = " ".join("<code>%s</code>" % html.escape(n) for n in re.findall(r"name: '(\w+)'", flags))
        uses = "".join('<li class="w">✎ %s</li>' % html.escape(tr(w, lang)) for w in strs(write)) + \
               "".join("<li>? %s</li>" % html.escape(tr(w, lang)) for w in strs(read_))
        code = code.replace("\\n", "\n").replace("\\'", "'").replace("\\\\", "\\")
        ## 원고 속 대사·선택지 글도 사전에 있으면 그 언어로
        code = re.sub(r'"([^"]*[가-힣][^"]*)"', lambda q: '"%s"' % tr(q.group(1), lang), code)
        out.append('<div class="g-case"><div class="g-case-v">%s</div><div class="g-case-t"><h4>%s %s <small>%s</small></h4>%s<p>%s</p><ul>%s</ul><pre><code>%s</code></pre></div></div>'
                   % (media, html.escape(icon), html.escape(tr(title, lang)), html.escape(tr(kind, lang)), names,
                      html.escape(tr(desc, lang)), uses, html.escape(code)))
    out.append("</div>")
    return "\n".join(out)


# ── 안내서 영상 (GUIDE의 <!-- clip 이름 --> 줄 → bundle/guide/clips/이름.webm) ──

CLIP_RE = re.compile(r"<!-- clip ([\w-]+) -->")


def guide_clip(name):
    fn = os.path.join(HERE, "clips", name + ".webm")
    if not os.path.exists(fn):
        raise SystemExit("영상이 없어요: %s" % os.path.relpath(fn, ROOT))
    with open(fn, "rb") as f:
        v = base64.b64encode(f.read()).decode("ascii")
    return '<figure class="g-clip"><video src="data:video/webm;base64,%s" autoplay loop muted playsinline preload="auto"></video></figure>' % v


# ── 페이지 ──

PAGE = """<!doctype html>
<html lang="__LANG__">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>__TITLE__</title>
<style>
:root{--bg:#fbfaf7;--panel:#ffffff;--text:#1f2328;--muted:#5d6670;--line:#e3e0d8;--soft:#f3f1ec;--accent:#e2563f;--accent-soft:#fde9e4;--code:#f2efe8;--link:#1c6fd1;--mark:#ffe58a}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#16181c;--panel:#1d2025;--text:#e6e6e6;--muted:#9aa3ad;--line:#30343b;--soft:#23272d;--accent:#ff7a63;--accent-soft:#3a2420;--code:#262a31;--link:#6cb0ff;--mark:#6b5a12}}
:root[data-theme="dark"]{--bg:#16181c;--panel:#1d2025;--text:#e6e6e6;--muted:#9aa3ad;--line:#30343b;--soft:#23272d;--accent:#ff7a63;--accent-soft:#3a2420;--code:#262a31;--link:#6cb0ff;--mark:#6b5a12}
*{box-sizing:border-box}
html{scroll-padding-top:16px}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.7 "Pretendard","Apple SD Gothic Neo","Malgun Gothic","Noto Sans KR",sans-serif;word-break:keep-all;overflow-wrap:anywhere}
html[lang=ja] body{font-family:"Hiragino Sans","Hiragino Kaku Gothic ProN","Yu Gothic UI","Yu Gothic","Meiryo","Noto Sans JP",sans-serif;word-break:normal;line-break:strict}
html[lang=en] body{font-family:"Segoe UI",system-ui,-apple-system,"Helvetica Neue",Arial,sans-serif;word-break:normal}
nav .langs{display:flex;gap:4px;margin:0 2px 10px;flex-wrap:wrap}
nav .langs a{padding:2px 9px;border:1px solid var(--line);border-radius:999px;font-size:13px;color:var(--text);text-decoration:none}
nav .langs a.on{background:var(--accent-soft);border-color:var(--accent);font-weight:700}
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
.fx-card video.wide{aspect-ratio:16/9}
.fx-none{color:#9aa3ad;font-size:12px;display:flex;align-items:center;justify-content:center;text-align:center;line-height:1.4}
.fx-card figcaption{padding:7px 10px 9px;display:flex;flex-wrap:wrap;gap:4px 8px;align-items:baseline;font-size:14px}
.fx-card figcaption span{color:var(--muted);font-size:12px;width:100%}
.g-cases{margin:12px 0 24px}
.g-case{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:18px;padding:18px 0;border-top:1px solid var(--line)}
.g-case:first-child{border-top:0;padding-top:4px}
.g-case video,.g-clip video{display:block;width:100%;aspect-ratio:16/9;background:#111;border-radius:8px}
.g-case-t{min-width:0;font-size:14.5px}
.g-case-t h4{margin:0 0 4px;font-size:16px}
.g-case-t h4 small{font-size:12px;font-weight:500;color:var(--muted);background:var(--soft);border-radius:5px;padding:1px 6px;margin-left:4px}
.g-case-t p{margin:6px 0}
.g-case-t ul{list-style:none;padding:0;margin:6px 0;display:flex;flex-direction:column;gap:3px;font-size:13.5px}
.g-case-t li{background:var(--soft);border-radius:6px;padding:3px 8px}
.g-case-t li.w{background:var(--accent-soft)}
.g-case-t pre{font-size:12.5px;margin:6px 0 0}
.g-clip{margin:8px 0 10px;max-width:760px}
@media (max-width:860px){.g-case{grid-template-columns:minmax(0,1fr);gap:10px}}
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
  <div class="brand">py<span>gaki</span> __BRAND__</div>
  <div class="ver">__VER__</div>
  <div class="langs">__LANGS__</div>
  <input id="q" type="search" placeholder="__PH__" aria-label="__SEARCH__">
  <div class="tools"><button id="theme" type="button">__THEME__</button><button id="fold" type="button">__FOLD__</button></div>
  <ol id="toc">__TOC__</ol>
</nav>
<main>
<button class="menu-btn" id="menu" type="button">__MENU__</button>
<header class="hero">
  <h1>__TITLE__</h1>
  <p>__HERO__</p>
  <p>__VER__ · __REPO_L__ <a href="__REPO__" target="_blank" rel="noopener">__REPO__</a></p>
  <div class="chips">__CHIPS__</div>
</header>
__BODY__
<p class="nohit hide" id="nohit">__NOHIT__</p>
</main>
</div>
<button class="top" id="top" type="button" title="__TOP__">↑</button>
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
  document.getElementById('fold').onclick=function(){allOpen=!allOpen;this.textContent=allOpen?'__UNFOLD__':'__FOLD__';mark()};
  function mark(){
    var cur=null,y=innerHeight*0.25;
    for(var i=0;i<heads.length;i++){if(heads[i].offsetParent===null)continue;if(heads[i].getBoundingClientRect().top<y)cur=heads[i];else break}
    links.forEach(function(a){a.parentNode.classList.remove('on')});
    document.querySelectorAll('#toc li.ch').forEach(function(li){li.classList.toggle('open',allOpen)});
    if(cur){var a=byId[cur.id];a.parentNode.classList.add('on');var ch=a.closest('li.ch');if(ch)ch.classList.add('open')}
  }
  addEventListener('scroll',function(){requestAnimationFrame(mark)},{passive:true}); mark();
  // 견본 영상: 마우스를 올리면 처음부터
  document.querySelectorAll('.fx-card video,.g-case video,.g-clip video').forEach(function(v){v.parentNode.addEventListener('mouseenter',function(){v.currentTime=0;v.play()})});
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


def version(lang="ko"):
    def v(rel, pat):
        try:
            m = re.search(pat, read(rel))
            return m.group(1) if m else "?"
        except OSError:
            return "?"
    return "%s ui_kit %s · screen_fx %s · splash %s" % (T[lang]["ver"],
        v("showpy/game/ui_kit/engine/ui_kit.rpy", r'VERSION = "([\d.]+)"'),
        v("showpy/game/screen_fx/engine/screen_fx.rpy", r'VERSION = "([\d.]+)"'),
        v("showpy/game/splash/engine/splash.rpy", r'VERSION = "([\d.]+)"'))


def head_src(text):
    """번역 파일 첫 줄 <!-- 원본: 경로 @ 커밋 --> → (경로, 커밋, 나머지 글)"""
    m = re.match(r"\A\s*<!--\s*원본:\s*(\S+)(?:\s*@\s*([0-9a-f]+))?\s*-->\s*\n", text)
    if not m:
        return None, None, text
    return m.group(1), m.group(2), text[m.end():]


def src_hash(rel):
    """원본 글의 지문 (줄 끝 차이는 무시). 번역 파일 첫 줄에 적어 두고, 원본이 바뀌었는지 본다."""
    return hashlib.sha1(read(rel).replace("\r\n", "\n").encode("utf-8")).hexdigest()[:10]


def stale_check(lang, cid, src, at):
    """번역을 맞춘 뒤(at) 원본(src)이 바뀌었으면 알린다."""
    if not at:
        print("  알림: %s/%s.md 첫 줄에 원본 지문이 없어요 (--stamp)" % (lang, cid))
    elif at != src_hash(src):
        print("  알림: %s 원본이 번역(%s/%s.md) 뒤에 바뀌었어요. 번역도 맞춘 뒤 --stamp" % (src, lang, cid))


def stamp():
    """번역 파일 첫 줄의 원본 지문을 지금 원본 것으로 (번역을 원본에 맞춘 뒤에만)."""
    for lang in LANGS[1:]:
        for cid, _t, src in CHAPTERS:
            p = os.path.join(HERE, lang, cid + ".md")
            if not src or not os.path.exists(p):
                continue
            _s, _at, rest = head_src(open(p, encoding="utf-8").read())
            h = src_hash(src)
            with open(p, "w", encoding="utf-8", newline="\n") as f:
                f.write("<!-- 원본: %s @ %s -->\n%s" % (src, h, rest))
            print("표시: %s/%s.md @ %s" % (lang, cid, h))


def build(out_path=OUT, clips_dir=None, lang="ko", files=None):
    files = files or FILES
    t = T[lang]
    clips_dir = clips_dir or os.path.join(ROOT, "pykaki", "public", "effects")
    used = set()
    toc, chips, body = [], [], []
    for n, (cid, titles, src) in enumerate(CHAPTERS, 1):
        title = titles[lang]
        used.add(cid)
        heads = []
        if src:
            if lang == "ko":
                text = read(src)
            else:
                tp = os.path.join(HERE, lang, cid + ".md")
                if not os.path.exists(tp):
                    raise SystemExit("번역이 없어요: %s" % os.path.relpath(tp, ROOT))
                _s, at, text = head_src(open(tp, encoding="utf-8").read())
                stale_check(lang, cid, src, at)
            ## 원본 맨 위 제목(# …)은 장 제목으로 바꾼다
            text = re.sub(r"\A\s*#\s+[^\n]*\n", "", text)
            inner = md(CLIP_RE.sub(r"\n\nCLIPHERE \1\n\n", text.replace(FLAG_MARK, "FLAGRECIPESHERE")), src, heads, used)
            inner = inner.replace("<p>FLAGRECIPESHERE</p>", flag_recipes(lang))
            inner = re.sub(r"<p>CLIPHERE ([\w-]+)</p>", lambda m: guide_clip(m.group(1)), inner)
            note = '<p class="src">%s: <a href="%s/blob/main/%s" target="_blank" rel="noopener"><code>%s</code></a></p>' % (t["src"], REPO_URL, src, src) \
                if not src.startswith("bundle/guide/") else ""
        else:
            inner = effects_chapter(heads, used, clips_dir, lang)
            note = ""
        body.append('<section class="chapter" id="%s"><h1 id="%s-h"><span class="n">%d</span>%s</h1>%s\n%s</section>'
                    % (cid, cid, n, html.escape(title), note, blocks(inner)))
        sub = "".join('<li class="s2"><a href="#%s">%s</a></li>' % (h, html.escape(x)) for lv, h, x in heads if lv == 2)
        toc.append('<li class="ch"><a href="#%s-h"><span class="n">%d</span>%s</a><ol class="sub">%s</ol></li>' % (cid, n, html.escape(title), sub))
        chips.append('<a href="#%s-h"><b>%d</b>%s</a>' % (cid, n, html.escape(title)))
    langs = "".join('<a href="%s"%s lang="%s">%s</a>' % (html.escape(files[l]), ' class="on" aria-current="page"' if l == lang else "", l, LANG_NAME[l])
                    for l in LANGS)
    page = PAGE
    for k, v in (("__TOC__", "".join(toc)), ("__CHIPS__", "".join(chips)), ("__LANGS__", langs), ("__LANG__", lang),
                 ("__TITLE__", html.escape(t["title"])), ("__BRAND__", html.escape(t["brand"])), ("__PH__", html.escape(t["ph"])),
                 ("__SEARCH__", html.escape(t["search"])), ("__THEME__", html.escape(t["theme"])), ("__UNFOLD__", t["unfold"]),
                 ("__FOLD__", t["fold"]), ("__MENU__", html.escape(t["menu"])), ("__HERO__", html.escape(t["hero"])),
                 ("__REPO_L__", html.escape(t["repo"])), ("__NOHIT__", html.escape(t["nohit"])), ("__TOP__", html.escape(t["top"])),
                 ("__VER__", html.escape(version(lang))), ("__REPO__", REPO_URL)):
        page = page.replace(k, v)
    page = page.replace("__BODY__", "\n".join(body))
    with open(out_path, "w", encoding="utf-8", newline="\n") as f:
        f.write(page)
    return out_path


def build_all(out_dir=HERE, files=None, clips_dir=None):
    """세 언어를 out_dir에. files: 언어마다 파일 이름 (웹판은 한국어를 index.html로)."""
    files = files or FILES
    os.makedirs(out_dir, exist_ok=True)
    return [build(os.path.join(out_dir, files[l]), clips_dir, l, files) for l in LANGS]


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--out-dir", default=HERE)
    ap.add_argument("--web", help="웹판 폴더 (한국어는 index.html)")
    ap.add_argument("--stamp", action="store_true", help="번역 파일의 원본 지문을 지금 것으로")
    a = ap.parse_args()
    if a.stamp:
        stamp()
    else:
        if a.web:
            ps = build_all(a.web, dict(FILES, ko="index.html"))
        else:
            ps = build_all(a.out_dir)
        for p in ps:
            print("만듦: %s (%d KB)" % (p, os.path.getsize(p) // 1024))
