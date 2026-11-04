################################################################################
## Splash — UI Kit 편집기 탭 "스플래시" (splash 1.2)
##
## UI Kit 플러그인이 있으면 그 편집기(개발 모드에서 Shift+M)에 탭을 더합니다.
## UI Kit이 없으면 이 파일은 아무것도 하지 않고, 페이지는 splash_config.rpy대로 나옵니다.
## PyKaki 앱의 [showpy] 화면에도 이 탭이 그대로 나옵니다 (ui_kit 3.16 공통 틀).
##
##   페이지를 고르고 바탕색, 바탕·로고 그림, 제목·본문 글자, 위치, 시간, 넘어가는 때를 바꿉니다.
##   [이 페이지 보기]로 지금 값으로 그 페이지를 띄워 봅니다 (클릭하면 닫힘).
##   저장하면 이 폴더의 splash_layout.rpy에 페이지마다 바꾼 값만 적습니다.
##   그 파일의 값은 splash_config.rpy의 같은 값보다 우선합니다. 지우면 설정 파일 값으로 돌아갑니다.
##
## 글 내용(제목, 본문 문장, 조작 방법 목록)은 번역할 수 있는 글이라 splash_config.rpy에서 고칩니다.
################################################################################

init offset = 1

## UI Kit 편집기(init -9, -8)를 읽은 뒤에 실행됩니다.
init -6 python in splash:

    _ed = getattr(store, "ui_editor", None)
    HAS_EDITOR = (_ed is not None) and hasattr(_ed, "register") and hasattr(_ed, "Tab")

    _EDITOR_FILE = store.renpy.get_filename_line()[0].replace("\\", "/")

    if HAS_EDITOR:

        IMAGE_EXTS = (".png", ".webp", ".jpg", ".jpeg", ".avif")

        def root_path(filename):
            """이 플러그인 폴더(splash/) 안 파일의 실제 경로."""
            root = os.path.dirname(os.path.dirname(_EDITOR_FILE))
            for base in (store.config.basedir, store.config.gamedir):
                if os.path.isdir(os.path.join(base, root)):
                    return os.path.join(base, root, filename)
            return os.path.join(store.config.gamedir, filename)

        def _fmt(v):
            uk = getattr(store, "ui_kit", None)
            if uk is not None and hasattr(uk, "format_value"):
                return uk.format_value(v)
            return repr(v)

        ## ── 막대 ──

        class SplashBarValue(store.BarValue, DictEquality):
            """고른 페이지의 숫자 값을 읽고 쓰는 막대."""

            def __init__(self, key, lo, hi, step, digits):
                self.key = key
                self.lo = lo
                self.hi = hi
                self.step = step
                self.digits = digits

            def changed(self, v):
                value = self.lo + v
                value = int(round(value)) if self.digits == 0 else round(value, self.digits)
                _ed.get_tab("splash").put(self.key, value)

            def get_adjustment(self):
                v = _ed.get_tab("splash").val(self.key)
                try:
                    v = float(v)
                except Exception:
                    v = self.lo
                v = max(self.lo, min(self.hi, v))
                return store.ui.adjustment(range=self.hi - self.lo, value=v - self.lo, step=self.step,
                    changed=self.changed, adjustable=True)

            def get_style(self):
                return ("ui_editor_bar", "ui_editor_bar")

        ## ── 탭 ──

        class SplashTab(_ed.Tab):

            id = "splash"
            label = "스플래시"
            panel_screen = "ui_editor_splash_panel"
            overlay_screen = None
            copy_hint = "splash_config.rpy의 그 페이지 { } 안에 붙여넣으세요."

            ## 막대 (이름, 표시, 최소, 최대, 간격, 소수 자리)
            TEXT_ROWS = (
                ("title", "제목", (("title_size", "크기", 10, 120, 1, 0),)),
                ("body", "본문", (("body_size", "크기", 10, 60, 1, 0), ("body_line_spacing", "줄 간격", 0, 30, 1, 0))),
                )
            PLACE_ROWS = (
                ("xalign", "가로 (왼쪽 0 ~ 오른쪽 1)", 0.0, 1.0, 0.01, 2),
                ("yalign", "세로 (위 0 ~ 아래 1)", 0.0, 1.0, 0.01, 2),
                ("width", "글 폭 (픽셀)", 200, 1920, 10, 0),
                ("spacing", "그림·제목·본문 사이", 0, 120, 1, 0),
                )
            TIME_ROWS = (
                ("fade_in", "나타나는 시간 (초)", 0.0, 3.0, 0.05, 2),
                ("fade_out", "사라지는 시간 (초)", 0.0, 3.0, 0.05, 2),
                ("min_time", "클릭으로 넘기기 전 기다림 (초)", 0.0, 5.0, 0.1, 1),
                )
            ## 넘어가는 때: None 클릭할 때까지 / 숫자 그 초만큼 / "movie" 영상이 끝날 때
            DURATIONS = ((None, "클릭할 때까지"), (3.0, "시간이 지나면"), ("movie", "영상이 끝날 때"))

            ## 값 이름 → 패널에 보이는 이름 (색, 글꼴 고르기 창 제목)
            LABELS = {
                "color": "바탕색", "title_color": "제목 색", "title_font": "제목 글꼴",
                "body_color": "본문 색", "body_font": "본문 글꼴", "prompt_color": "안내 글 색",
                }

            def __init__(self):
                self.page = None        # 고른 페이지 id
                self.pick = None        # 그림 고르는 중: "background" 또는 "image"
                self.pick_folder = None

            ## ── 페이지 ──

            def raws(self):
                return [ r for r in (cfg("pages") or [ ]) if isinstance(r, dict) and r.get("id") ]

            def ids(self):
                return [ r["id"] for r in self.raws() ]

            def cur(self):
                ids = self.ids()
                if self.page in ids:
                    return self.page
                return ids[0] if ids else None

            def raw(self):
                pid = self.cur()
                for r in self.raws():
                    if r["id"] == pid:
                        return r
                return { }

            def set_page(self, pid):
                self.page = pid
                self.pick = None
                store.renpy.restart_interaction()

            def available(self):
                if not self.raws():
                    return (False, "splash.pages에 페이지가 없습니다. (splash_config.rpy)")
                return (True, "")

            ## ── 값 ──

            def base(self, key):
                return merged(self.raw(), edits=False).get(key)

            def val(self, key):
                e = state.edits.get(self.cur(), { })
                return e[key] if key in e else self.base(key)

            def put(self, key, value):
                pid = self.cur()
                if pid is None:
                    return
                e = state.edits.setdefault(pid, { })
                if value == self.base(key):
                    e.pop(key, None)
                    if not e:
                        state.edits.pop(pid, None)
                else:
                    e[key] = value
                store.renpy.restart_interaction()

            def toggle(self, key):
                if key == "skippable" and self.val("skippable") and self.val("duration") is None:
                    _ed.msg("'클릭할 때까지' 넘어가는 페이지는 클릭으로 넘기기를 끌 수 없습니다. 넘어가는 때를 먼저 바꾸세요.")
                    return
                self.put(key, not self.val(key))

            def num(self, key, digits):
                v = self.val(key)
                try:
                    v = float(v)
                except Exception:
                    return str(v)
                return "{:.0f}".format(v) if digits == 0 else ("{:." + str(digits) + "f}").format(v)

            def edited(self, key):
                return key in state.edits.get(self.cur(), { })

            def has(self, key):
                return bool(self.val(key))

            ## 넘어가는 때
            def duration_kind(self):
                d = self.val("duration")
                if d is None or d == "movie":
                    return d
                return 3.0

            def set_duration(self, kind):
                ## 엔진 check()가 막는 조합은 고르지 않게 (막으면 게임을 켤 때 멈춤)
                if kind == "movie" and not (_is_movie(self.val("image")) or _is_movie(self.val("background"))):
                    _ed.msg("바탕이나 로고가 영상(.webm 등)일 때만 '영상이 끝날 때'를 고를 수 있습니다.")
                    return
                if kind is None and not self.val("skippable"):
                    _ed.msg("클릭으로 넘기기가 '안 됨'이면 '클릭할 때까지'는 고를 수 없습니다.")
                    return
                if kind == 3.0:
                    d = self.val("duration")
                    self.put("duration", d if isinstance(d, (int, float)) else 3.0)
                else:
                    self.put("duration", kind)

            ## 색·글꼴 고르기 창 (UI Kit)
            def get_value(self, key):
                v = self.val(key)
                return v if isinstance(v, str) else None

            def set_value(self, key, value):
                self.put(key, value)

            def value_label(self, key):
                return self.LABELS.get(key, key)

            ## ── 그림 고르기 (바탕, 로고) ──

            def open_pick(self, key):
                self.pick = None if self.pick == key else key
                if self.pick and self.pick_folder is None:
                    cur = self.val(key)
                    if isinstance(cur, str) and "/" in cur and not cur.startswith("#"):
                        self.pick_folder = os.path.dirname(cur)
                store.renpy.restart_interaction()

            def _files(self):
                uk = getattr(store, "ui_kit", None)
                exts = IMAGE_EXTS + MOVIE_EXTS
                if uk is not None and hasattr(uk, "game_files"):
                    return list(uk.game_files(exts))
                return sorted(f for f in store.renpy.list_files() if f.lower().endswith(exts))

            def folders(self):
                seen = { }
                for f in self._files():
                    d = os.path.dirname(f)
                    seen[d] = seen.get(d, 0) + 1
                return sorted(seen, key=lambda d: (d.startswith("gui"), d))

            def pick_files(self):
                fs = self.folders()
                folder = self.pick_folder if self.pick_folder in fs else (fs[0] if fs else None)
                return [ f for f in self._files() if os.path.dirname(f) == folder ][:80]

            def cur_folder(self):
                fs = self.folders()
                return self.pick_folder if self.pick_folder in fs else (fs[0] if fs else None)

            def set_folder(self, d):
                self.pick_folder = d
                store.renpy.restart_interaction()

            def choose(self, path):
                if self.pick:
                    self.put(self.pick, path)
                    ## 영상을 빼서 '영상이 끝날 때'가 안 맞게 되면 클릭할 때까지로
                    if self.val("duration") == "movie" and not (_is_movie(self.val("image")) or _is_movie(self.val("background"))):
                        self.put("duration", None if self.val("skippable") else 3.0)
                self.pick = None
                store.renpy.restart_interaction()

            def clear_media(self, key):
                self.pick, old = key, self.pick
                self.choose(None)
                self.pick = None if old == key else old

            def thumb(self, path):
                if path.lower().endswith(MOVIE_EXTS):
                    return None
                return store.Transform(path, fit="contain", xysize=(72, 54))

            def media_label(self, key):
                v = self.val(key)
                if not v:
                    return "(없음)"
                return str(v)

            ## ── 보기 ──

            def show_page(self):
                pid = self.cur()
                if pid is not None:
                    ShowPage(pid)()

            def show_all(self):
                preview()

            ## ── 되돌리기, 저장 ──

            def reset_item(self):
                state.edits.pop(self.cur(), None)
                _ed.msg("이 페이지의 저장 안 한 변경을 되돌렸습니다.")

            def discard(self):
                state.edits = { }
                store.renpy.restart_interaction()

            def pending(self):
                return sum(len(e) for e in state.edits.values())

            def _merged_layout(self):
                lay = { }
                for pid, d in saved_layout().items():
                    lay[pid] = dict(d)
                for pid, e in state.edits.items():
                    lay.setdefault(pid, { }).update(e)
                return { pid : d for pid, d in lay.items() if d }

            def file_path(self, filename):
                return root_path(filename)

            def layout_file(self):
                lay = self._merged_layout()
                header = getattr(getattr(store, "ui_kit", None), "file_header", None)
                if header is not None:
                    lines = header("UI Kit 편집기가 저장한 스플래시 페이지 값입니다.", [
                        "여기 적힌 값은 splash_config.rpy의 같은 페이지 값보다 우선합니다.",
                        "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                        ])
                else:
                    lines = [ "## UI Kit 편집기가 저장한 스플래시 페이지 값입니다. (자동 생성)", "" ]
                lines.append("define splash.layout = {")
                order = self.ids() + sorted(p for p in lay if p not in self.ids())
                for pid in order:
                    if pid not in lay:
                        continue
                    lines.append('    "{}": {{'.format(pid))
                    for k in sorted(lay[pid]):
                        lines.append('        "{}": {},'.format(k, _fmt(lay[pid][k])))
                    lines.append("    },")
                lines.append("}")
                lines.append("")
                return ("splash_layout.rpy", "\n".join(lines))

            def after_save(self):
                ## store 변수(splash.layout)가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게)
                state.saved = store.python_dict(self._merged_layout())
                state.edits = { }
                return False

            def copy_text(self):
                d = dict(state.edits.get(self.cur(), { }))
                if not d:
                    return None
                lines = [ "# splash_config.rpy의 '{}' 페이지에 붙여넣기".format(self.cur()) ]
                for k in sorted(d):
                    lines.append('"{}": {},'.format(k, _fmt(d[k])))
                return "\n".join(lines)

            def info_lines(self):
                ids = self.ids()
                pid = self.cur()
                n = len(state.edits.get(pid, { }))
                rv = [ "페이지 {}/{}: {}".format(ids.index(pid) + 1 if pid in ids else 0, len(ids), pid) ]
                total = self.pending()
                rv.append("저장 안 한 변경: 이 페이지 {}개, 전체 {}개".format(n, total) if total else "저장 안 한 변경 없음")
                return rv

            def help_lines(self):
                return [
                    "값을 바꾼 뒤 [[이 페이지 보기]로 확인합니다 (클릭하면 닫힘). 저장하면 splash/splash_layout.rpy",
                    "제목, 본문 문장은 splash_config.rpy에서 고칩니다 (번역할 수 있는 글).",
                    ]

            def session(self):
                return dict(page=self.page)

            def restore(self, d):
                self.page = d.get("page", self.page)

        _ed.register(SplashTab())


## 스플래시 탭 패널 (UI Kit 편집기 안)
screen ui_editor_splash_panel(tab):

    $ _ids = tab.ids()
    $ _cur = tab.cur()

    vbox:
        spacing 6

        hbox:
            spacing 4
            box_wrap True
            box_wrap_spacing 4
            xmaximum 632
            text "페이지:" style "ui_editor_text" yalign 0.5
            for _id in _ids:
                textbutton _id style "ui_editor_tab" action Function(tab.set_page, _id) selected (_cur == _id)

        hbox:
            spacing 6
            textbutton "이 페이지 보기" style "ui_editor_button" action Function(tab.show_page)
            textbutton "처음부터 보기" style "ui_editor_button" action Function(tab.show_all)

        ## 바탕
        hbox:
            spacing 6
            text "바탕색" style "ui_editor_text" yalign 0.5 min_width 110
            button:
                style "ui_editor_button"
                action Function(ui_editor.open_popup, "color", "color")
                hbox:
                    spacing 4
                    add Solid(tab.get_value("color") or "#000000", xysize=(16, 16)) yalign 0.5
                    text (tab.get_value("color") or "#000000") style "ui_editor_button_text" size 13 yalign 0.5

        for _key, _label in (("background", "바탕 그림/영상"), ("image", "로고 그림/영상")):
            hbox:
                spacing 6
                text _label style "ui_editor_text" yalign 0.5 min_width 110
                text tab.media_label(_key) style "ui_editor_small" yalign 0.5 xmaximum 260
                textbutton ("고르기 닫기" if tab.pick == _key else "고르기") style "ui_editor_button" text_size 13 action Function(tab.open_pick, _key) selected (tab.pick == _key)
                textbutton "없음" style "ui_editor_button" text_size 13 action Function(tab.clear_media, _key) sensitive tab.has(_key)

            if tab.pick == _key:
                use ui_editor_splash_picker(tab)

        if tab.has("image"):
            hbox:
                spacing 6
                text "로고 확대" style "ui_editor_text" yalign 0.5 min_width 110
                bar value splash.SplashBarValue("image_zoom", 0.1, 3.0, 0.05, 2) xsize 220 yalign 0.5
                text ("{:.2f}".format(float(tab.val("image_zoom") or 1.0))) style "ui_editor_small" yalign 0.5

        ## 글자
        for _what, _label, _rows in tab.TEXT_ROWS:
            if tab.has(_what):
                hbox:
                    spacing 6
                    text (_label + " 글자") style "ui_editor_text" yalign 0.5 min_width 110
                    button:
                        style "ui_editor_button"
                        action Function(ui_editor.open_popup, "color", _what + "_color")
                        hbox:
                            spacing 4
                            add Solid(tab.get_value(_what + "_color") or "#ffffff", xysize=(16, 16)) yalign 0.5
                            text (tab.get_value(_what + "_color") or "(기본)") style "ui_editor_button_text" size 13 yalign 0.5
                    textbutton (ui_editor.short_path(tab.get_value(_what + "_font")) if tab.get_value(_what + "_font") else "글꼴 (기본)") style "ui_editor_button" text_size 13 action Function(ui_editor.open_popup, "font", _what + "_font")
                for _k, _l, _lo, _hi, _st, _dg in _rows:
                    hbox:
                        spacing 6
                        text ("  " + _l) style "ui_editor_small" yalign 0.5 min_width 110
                        bar value splash.SplashBarValue(_k, _lo, _hi, _st, _dg) xsize 220 yalign 0.5
                        text tab.num(_k, _dg) style "ui_editor_small" yalign 0.5

        ## 위치
        text "위치 (그림·제목·본문 묶음)" style "ui_editor_text"
        for _k, _l, _lo, _hi, _st, _dg in tab.PLACE_ROWS:
            hbox:
                spacing 6
                text ("  " + _l) style "ui_editor_small" yalign 0.5 min_width 180
                bar value splash.SplashBarValue(_k, _lo, _hi, _st, _dg) xsize 200 yalign 0.5
                text tab.num(_k, _dg) style "ui_editor_small" yalign 0.5

        ## 넘어가는 때
        hbox:
            spacing 4
            box_wrap True
            xmaximum 632
            text "넘어가는 때" style "ui_editor_text" yalign 0.5 min_width 110
            $ _dk = tab.duration_kind()
            for _v, _l in tab.DURATIONS:
                textbutton _l style "ui_editor_button" text_size 13 action Function(tab.set_duration, _v) selected (_dk == _v)
        if tab.duration_kind() == 3.0:
            hbox:
                spacing 6
                text "  보여 주는 시간 (초)" style "ui_editor_small" yalign 0.5 min_width 180
                bar value splash.SplashBarValue("duration", 0.5, 15.0, 0.1, 1) xsize 200 yalign 0.5
                text tab.num("duration", 1) style "ui_editor_small" yalign 0.5

        for _k, _l, _lo, _hi, _st, _dg in tab.TIME_ROWS:
            hbox:
                spacing 6
                text ("  " + _l) style "ui_editor_small" yalign 0.5 min_width 180
                bar value splash.SplashBarValue(_k, _lo, _hi, _st, _dg) xsize 200 yalign 0.5
                text tab.num(_k, _dg) style "ui_editor_small" yalign 0.5

        hbox:
            spacing 6
            text "클릭으로 넘기기" style "ui_editor_text" yalign 0.5 min_width 110
            textbutton ("됨" if tab.val("skippable") else "안 됨") style "ui_editor_button" text_size 13 action Function(tab.toggle, "skippable") selected bool(tab.val("skippable"))
            text "처음 한 번만" style "ui_editor_text" yalign 0.5
            textbutton ("켬" if tab.val("once") else "끔") style "ui_editor_button" text_size 13 action Function(tab.toggle, "once") selected bool(tab.val("once"))

        hbox:
            spacing 6
            textbutton "이 페이지 되돌리기" style "ui_editor_button" action Function(tab.reset_item)
            textbutton "모두 버리기" style "ui_editor_button" action Function(tab.discard)


## 바탕·로고 그림 고르기 (패널 안에 펼침)
screen ui_editor_splash_picker(tab):
    $ _cf = tab.cur_folder()
    frame:
        style "empty"
        background "#ffffff10"
        padding (8, 6)
        xmaximum 630
        vbox:
            spacing 4
            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 610
                for _d in tab.folders():
                    textbutton (_d or "game") style "ui_editor_button" text_size 12 action Function(tab.set_folder, _d) selected (_cf == _d)
            vpgrid:
                cols 6
                spacing 4
                allow_underfull True
                for _f in tab.pick_files():
                    button:
                        style "ui_editor_button"
                        xsize 96
                        ysize 82
                        action Function(tab.choose, _f)
                        selected (tab.val(tab.pick) == _f)
                        vbox:
                            xalign 0.5
                            $ _t = tab.thumb(_f)
                            if _t is not None:
                                add _t xalign 0.5
                            else:
                                text "영상" style "ui_editor_small" xalign 0.5
                            text _f.split("/")[-1] style "ui_editor_small" size 11 xalign 0.5
