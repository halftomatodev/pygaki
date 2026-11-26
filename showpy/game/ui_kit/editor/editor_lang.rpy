################################################################################
## pygaki — 편집기 언어 (4.12)
##
## 게임 안 편집 화면(F9)의 글을 일본어, 영어로 바꿔 보여 줍니다.
## 패널의 [언어] 단추로 한국어 → 日本語 → English 차례로 바꾸고, 고른 언어는 이 컴퓨터에 기억합니다.
## 처음에는 게임 언어를 따릅니다(일본어 게임이면 일본어, 영어 게임이면 영어, 그 밖은 한국어).
##
## 편집기 코드의 글은 한국어 그대로 두고, 화면에 그릴 때 사전(editor_lang.tsv)에서 찾아 바꿉니다.
##   - 편집 화면 스타일(ui_editor_로 시작하는 스타일)로 그리는 글만 바꿉니다.
##     게임 화면의 글(대사, 메뉴, 고치고 있는 글자)은 그대로입니다.
##   - 저장하는 값, 원고에 쓰는 줄은 바뀌지 않습니다.
##   - 사전에 없는 글은 한국어 그대로 보입니다.
## 사전에 없는 글 찾기: 저장소의 showpy/i18n/extract_editor.py
################################################################################

init offset = 1

init -8 python in ui_editor:

    import re as _re
    import io as _io

    LANGS = [ ("ko", "한국어"), ("ja", "日本語"), ("en", "English") ]
    _HANGUL = _re.compile(u"[가-힣]")

    ## 사전: 한국어 글 → (일본어, 영어). {} 자리가 든 글은 정규식으로 따로
    _exact = { }
    _pats = [ ]
    _words = [ ]       # 긴 글 안에서 낱말처럼 바꿀 짧은 글 (긴 것부터)
    _dict_loaded = [ False ]

    _PH = _re.compile(r"\{(\d*)(?:![rsa])?(?::[^{}]*)?\}")

    ## 사전 칸: \n은 줄바꿈, \\n은 글자 그대로 \n
    _NL = _re.compile(r"(?<!\\)\\n")

    def _cell(s):
        return _NL.sub("\n", s).replace("\\\\n", "\\n")

    def _shown(s):
        """원고 글을 화면에 그린 모양으로 ([[ → [, {{ → {)."""
        return s.replace("[[", "[").replace("{{", "{").replace("}}", "}")

    def _load_dict():
        if _dict_loaded[0]:
            return
        _dict_loaded[0] = True
        try:
            path = store.ui_kit.root_path("editor/editor_lang.tsv")
            with _io.open(path, encoding="utf-8") as f:
                rows = f.read().split("\n")
        except Exception as e:
            print("pygaki 편집: 언어 사전을 읽지 못했습니다:", e)
            return

        for row in rows:
            row = row.rstrip("\r")
            if not row.strip() or row.startswith("#"):
                continue
            p = row.split("\t")
            if len(p) < 3:
                continue
            ko, ja, en = [ _cell(i) for i in p[:3] ]
            if _PH.search(ko):
                ## "저장 실패 ({} 탭): {}" → 정규식. 번역의 {0} {1}(또는 차례대로 {})에 잡힌 조각을 넣음
                ## 자리가 붙어 있으면({}{}) 어디서 자를지 모르니 짧게 잡기, 길게 잡기 두 가지로
                parts = _PH.split(ko)
                rxs = [ ]
                for grab in ("(.*?)", "(.*)"):
                    rx = ""
                    for i, part in enumerate(parts):
                        if i % 2 == 0:
                            rx += _re.escape(_shown(part))
                        else:
                            rx += grab
                    rxs.append(_re.compile("^" + rx.strip() + "$", _re.S))
                _pats.append((rxs, ja, en))
            else:
                k = _shown(ko).strip()
                v = (_shown(ja).strip(), _shown(en).strip())
                _exact[k] = v
                ## "지금 들어 있음:"은 "지금 들어 있음: 없음"을 ": "로 나눈 조각("지금 들어 있음")으로도 찾게
                if k.endswith(":") and k[:-1].strip() not in _exact:
                    _exact[k[:-1].strip()] = tuple(x.rstrip(u":：").strip() for x in v)

        ## 낱말처럼 바꿀 것: 짧은 글(10자 이하). 긴 것부터 찾아야 "자동 비키기"가 "비키기"보다 먼저
        _words[:] = sorted([ k for k in _exact if len(k) <= 10 and _HANGUL.search(k) ], key=lambda k: -len(k))
        _pats.sort(key=lambda p: -len(p[0][0].pattern))

    ## ── 지금 언어 ──

    ## pygaki v1.9: 편집 화면 언어는 pygaki 앱의 언어를 따름 (앱이 붙으면 실시간 연결 lang으로 보내고,
    ## 게임은 마지막으로 받은 값을 persistent._pygaki_app_lang에 기억). 받은 적이 없으면 PC 언어(일본어, 영어, 나머지는 한국어).
    ## 예전 [언어] 단추 값(persistent._pygaki_editor_lang)은 더 쓰지 않음
    _pc = [ None ]

    def pc_lang():
        if _pc[0] is None:
            l = "ko"
            try:
                lang, region = store.renpy.translation.detect_user_locale()
                lang = (lang or "").lower()
                if lang.startswith("ja"):
                    l = "ja"
                elif lang.startswith("en"):
                    l = "en"
            except Exception:
                pass
            _pc[0] = l
        return _pc[0]

    def editor_lang():
        l = getattr(store.persistent, "_pygaki_app_lang", None)
        return l if l in ("ko", "ja", "en") else pc_lang()

    def lang_name():
        l = editor_lang()
        for k, n in LANGS:
            if k == l:
                return n
        return l

    def lang_button():
        """패널의 언어 단추 글 (번역하지 않고 그 언어로 바로)."""
        return { "ko": "언어: 한국어", "ja": "言語: 日本語", "en": "Language: English" }[editor_lang()]

    ## 일본어는 게임 글꼴에 가나가 없을 수 있어서, 렌파이가 한국어·일본어 프로젝트에 넣는 글꼴이 있으면 그것으로
    _font_orig = [ None ]

    def _apply_font(init=False):
        """편집기 글꼴을 언어에 맞춤. 일본어가 아니면, 바꾼 적이 없을 때는 손대지 않음."""
        try:
            st = store.style.ui_editor_text
            ja = editor_lang() == "ja" and store.renpy.loadable("SourceHanSansLite.ttf")
            if ja:
                if _font_orig[0] is None:
                    _font_orig[0] = store.gui.interface_text_font
                want = "SourceHanSansLite.ttf"
            elif _font_orig[0] is not None:
                want = _font_orig[0]
            else:
                return
            st.font = want
            if not init:
                store.style.rebuild()
        except Exception:
            pass

    def set_lang(l):
        """pygaki 앱이 보낸 언어로 (실시간 연결 lang). 같으면 아무것도 안 함."""
        if l not in ("ko", "ja", "en"):
            return
        if getattr(store.persistent, "_pygaki_app_lang", None) == l:
            return
        store.persistent._pygaki_app_lang = l
        _memo.clear()
        _apply_font()
        ## 이미 그린 글은 다시 그려야 바뀜: 편집기 바탕 화면을 새로 띄움
        layer = "ui_editor"
        if store.renpy.get_screen("ui_editor_root", layer=layer):
            store.renpy.hide_screen("ui_editor_root", layer=layer)
            store.renpy.show_screen("ui_editor_root", _layer=layer)
        store.renpy.restart_interaction()

    ## ── 글 바꾸기 ──

    def _tr_core(t, i, depth=0):
        e = _exact.get(t)
        if e is not None:
            return e[i]
        if depth > 2:
            return None
        ## 맞는 패턴 가운데: 한글이 가장 적게 남고(자리에 든 조각까지 바꾼 뒤), 그다음 패턴 글자가 가장 많이 맞는 것
        ## ("지금 줄: a.rpy 3번째 줄"은 "{} {}번째 줄"보다 "지금 줄: {}"이 더 많이 맞음)
        best = None
        for rxs, ja, en in _pats:
            for rx in rxs:
                m = rx.match(t)
                if m is None:
                    continue
                g = m.groups()
                lit = len(t) - sum(len(x) for x in g)
                if lit <= 0:
                    continue
                out = _fill(ja if i == 0 else en, g, i, depth)
                score = (len(_HANGUL.findall(out)), -lit)
                if best is None or score < best[0]:
                    best = (score, out)
        return best[1] if best is not None else None

    def _fill(out, groups, i, depth):
        pos = [ 0 ]

        def one(mm):
            k = mm.group(1)
            if k == "":
                k = pos[0]
                pos[0] += 1
            else:
                k = int(k)
            part = groups[k] if k < len(groups) else ""
            if _HANGUL.search(part):
                part = _tr_line(part, i, depth + 1)
            return part

        return _PH.sub(one, out)

    ## 앞뒤의 한글 아닌 것(키 이름 "T ", 괄호, 기호)을 떼고 가운데만 다시
    _AFFIX = _re.compile(u"^([^가-힣]*?)([가-힣](?:.*[가-힣])?[.?!)]?)([^가-힣]*)$", _re.S)

    def _tr_affix(t, i, depth):
        w = _tr_core(t, i, depth)
        if w is not None:
            return w
        m = _AFFIX.match(t)
        if m and (m.group(1) or m.group(3)):
            for core in (m.group(2), m.group(2).rstrip(".?!)")):
                c = _tr_core(core.strip(), i, depth)
                if c is not None:
                    return m.group(1) + m.group(2).replace(core.strip(), c, 1) + m.group(3)
        return None

    _SPLIT = _re.compile(r"( \| |, | / |: |; )")
    _BOUND = u"(?<![가-힣])"

    def _tr_line(t, i, depth=0):
        s = t.strip()
        if not s:
            return t
        r = _tr_affix(s, i, depth)
        if r is None:
            ## " | ", ", ", ": "로 이은 조각마다
            parts = _SPLIT.split(s)
            if len(parts) >= 3:
                hit = False
                for k in range(0, len(parts), 2):
                    p = parts[k]
                    if not _HANGUL.search(p):
                        continue
                    q = _tr_affix(p.strip(), i, depth)
                    if q is None:
                        q = _tr_words(p.strip(), i)
                    if q is not None:
                        parts[k] = p.replace(p.strip(), q, 1)
                        hit = True
                if hit:
                    r = "".join(parts)
        if r is None:
            r = _tr_words(s, i)
        if r is None:
            return t
        return t.replace(s, r, 1)

    def _tr_words(s, i):
        """마지막으로: 글 안의 짧은 사전 글을 낱말 단위로 바꿈 ("자동 비키기 켬" → "自動でよける オン").
        한글이 하나도 안 남을 때만 씀 (반쯤 바뀐 글은 한국어 그대로보다 읽기 어려워서)."""
        out = s
        for k in _words:
            if k not in out:
                continue
            rx = _re.compile(_BOUND + _re.escape(k) + u"(?![가-힣])")
            if rx.search(out):
                v = _exact[k][i]
                out = rx.sub(lambda m: v, out)
            if not _HANGUL.search(out):
                return out
        return None

    def translate(s):
        """한국어 글 하나를 지금 편집기 언어로. 사전에 없으면 그대로."""
        l = editor_lang()
        if l == "ko" or not s or not _HANGUL.search(s):
            return s
        _load_dict()
        i = 0 if l == "ja" else 1
        ## 같은 글은 화면을 그릴 때마다 다시 오므로 한 번 바꾼 것은 기억해 둠
        key = (s, i)
        r = _memo.get(key)
        if r is None:
            try:
                r = _tr_line(s, i)
            except Exception:
                r = s
            if len(_memo) > 5000:
                _memo.clear()
            _memo[key] = r
        return r

    _memo = { }

    ## ── 렌파이에 걸기 ──
    ## config.replace_text는 글 조각(태그, 줄바꿈 사이)마다 불린다. 그때 그리는 Text의 스타일을 알려고
    ## Text.update를 감싼다 (편집 화면 스타일일 때만 바꿈)

    _drawing = [ None ]

    def _is_editor_style(st):
        for _ in range(8):
            if st is None:
                return False
            p = getattr(st, "parent", None)
            if isinstance(p, tuple):
                return bool(p) and str(p[0]).startswith("ui_editor")
            name = getattr(st, "name", None)
            if isinstance(name, tuple) and name:
                return str(name[0]).startswith("ui_editor")
            st = p
        return False

    def _replace_text(s):
        t = _drawing[0]
        if t is not None and state.open and editor_lang() != "ko":
            try:
                if _is_editor_style(t.style):
                    s = translate(s)
            except Exception:
                pass
        prev = _prev_replace[0]
        return prev(s) if prev is not None else s

    _prev_replace = [ None ]

    def install_lang():
        if not store.config.developer:
            return
        import renpy.text.text as tt
        if getattr(tt.Text, "_pygaki_lang", False):
            return
        orig = tt.Text.update

        def update(self, *args, **kwargs):
            old = _drawing[0]
            _drawing[0] = self
            try:
                return orig(self, *args, **kwargs)
            finally:
                _drawing[0] = old

        tt.Text.update = update
        tt.Text._pygaki_lang = True
        ## 게임이 따로 둔 replace_text가 있으면 그 앞에서 바꾸고 이어서 부름
        if store.config.replace_text is not _replace_text:
            _prev_replace[0] = store.config.replace_text
            store.config.replace_text = _replace_text


## 게임의 설정(init 0~)이 끝난 뒤에 건다 (init offset 1 + 998 = 999)
init 998 python in ui_editor:
    install_lang()
    _apply_font(init=True)
