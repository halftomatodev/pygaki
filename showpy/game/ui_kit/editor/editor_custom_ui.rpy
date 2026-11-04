################################################################################
## UI Kit — 편집기: 커서·대사 소리 탭 (커스텀 UI)
##
## 텍스트 속도, 대사 소리, 클릭 대기 표시, 커서, 퀵메뉴를 바꿉니다.
## 패널 안에서 미리 보고, 저장하면 custom_ui_layout.rpy가 만들어집니다.
## 커서와 클릭 대기 표시 켜기·끄기는 저장 뒤 다시 불러와야 적용됩니다.
##
## 3.0: 커서·클릭 대기 표시는 초당 24프레임 고정. 칸 12개에 그림을 하나씩 골라 넣고,
##      그림 한 장을 1프레임 / 2프레임 보여줄지 고릅니다. 커서는 소프트웨어 커서가 기본.
################################################################################

init offset = 1

init -8 python in ui_editor:

    class CustomUITab(Tab):

        id = "custom_ui"
        label = "커서/대사 소리"
        panel_screen = "ui_editor_custom_ui_panel"
        overlay_screen = None

        ## 저장한 뒤 다시 불러와야 하는 값
        RELOAD_KEYS = ("cursor", "cursor_frames", "cursor_mode", "cursor_hotspot", "ctc")

        def __init__(self):
            self.edits = { }
            self.sample = 0
            self.sound_until = None
            self.slot_target = None     # 그림 고르기 창: ("ctc" 또는 "cursor", 칸 번호)
            self.pick_folder = None     # 그림 고르기 창에서 보고 있는 폴더

        def cu(self):
            return getattr(store, "custom_ui", None)

        def on_close(self):
            ## 커서와 셰이더 미리 보기를 끝냄 (Screen FX 4.5)
            fx = get_tab("screen_fx")
            if fx is not None and hasattr(fx, "cursor_leave"):
                fx.cursor_leave()

        def available(self):
            cu = self.cu()
            if cu is None:
                return (False, "커스텀 UI 기능이 없습니다.")
            if not cu.on():
                return (False, "커스텀 UI 기능이 꺼져 있습니다. (custom_ui.enabled)")
            return (True, "")

        def val(self, key):
            if key in self.edits:
                return self.edits[key]
            return self.cu().cfg(key)

        def put(self, key, value):
            if value == self.cu().cfg(key):
                self.edits.pop(key, None)
            else:
                self.edits[key] = value
            store.renpy.restart_interaction()

        def toggle(self, key):
            self.put(key, not self.val(key))
            if key in ("ctc", "cursor") and self.val(key) and not self.val(key + "_frames"):
                folders = store.ui_kit.image_folders()
                if folders:
                    self.put(key + "_frames", store.ui_kit.images_in(folders[0])[:self.max_frames()])

        ## ── 텍스트 속도 ──

        def cps(self):
            v = self.val("text_cps")
            if v is None:
                return store._preferences.text_cps
            return v

        def cps_label(self):
            c = self.cps()
            if self.val("text_cps") is None:
                return "options.rpy 값 ({})".format("한 번에" if c == 0 else "{}글자/초".format(c))
            return "한 번에" if c == 0 else "{}글자/초".format(c)

        def replay(self):
            self.sample += 1
            store.renpy.restart_interaction()

        def sample_text(self):
            """미리보기 글자. 속도나 '다시 보기'가 바뀔 때만 새로 만들어 처음부터 나오게 합니다."""
            c = self.cps()
            key = (self.sample, c)
            if getattr(self, "_sample_key", None) != key:
                kw = dict(style="ui_editor_text", size=18)
                if c:
                    kw["slow_cps"] = c
                self._sample = store.Text("텍스트 속도와 클릭 대기 표시를 미리 봅니다. 가나다라마바사.", **kw)
                self._sample_key = key
            return self._sample

        ## ── 소리 ──

        def sound_label(self):
            s = self.val("typing_sound")
            return s if s else "(없음)"

        def cycle_sound(self, step):
            files = [ None ] + store.ui_kit.audio_files()
            cur = self.val("typing_sound")
            k = 0
            for i, f in enumerate(files):
                if f == cur:
                    k = i
            self.put("typing_sound", files[(k + step) % len(files)])

        def _channel(self):
            ch = self.cu().cfg("typing_channel")
            if store.renpy.music.channel_defined(ch):
                return ch
            return "sound"

        def listen(self):
            s = self.val("typing_sound")
            if not s:
                msg("대사 소리가 없습니다. < >로 파일을 고르세요.")
                return
            store.renpy.music.play(s, channel=self._channel(), loop=True, relative_volume=self.val("typing_volume"))
            self.sound_until = True
            store.renpy.restart_interaction()

        def stop_sound(self):
            self.sound_until = None
            store.renpy.music.stop(channel=self._channel())

        ## ── 프레임 칸 (3.0): 그림을 칸마다 골라 넣음. 24fps 고정 ──

        def max_frames(self):
            return getattr(self.cu(), "MAX_FRAMES", 12)

        def frames(self, key):
            return list(self.val(key + "_frames") or [ ])

        def hold(self, key):
            try:
                return max(1, int(self.val(key + "_hold") or 2))
            except Exception:
                return 2

        def speed_label(self, key):
            n = len(self.frames(key))
            h = self.hold(key)
            fps = getattr(self.cu(), "FPS", 24)
            per = fps / float(h)
            if not n:
                return "그림 없음"
            return "초당 {:g}장, 한 바퀴 {:.2f}초".format(per, n * h / float(fps))

        def set_hold(self, key, h):
            self.put(key + "_hold", h)

        def all_folders(self):
            """그림이 들어 있는 폴더 전부 (game 기준)."""
            import os
            seen = { }
            for fn in store.ui_kit.game_files((".png", ".webp", ".jpg", ".jpeg", ".avif")):
                d = os.path.dirname(fn)
                seen[d] = seen.get(d, 0) + 1
            return sorted(seen, key=lambda d: (not d.startswith("gui/"), d))

        def open_slot(self, key, index):
            import os
            self.slot_target = (key, index)
            fr = self.frames(key)
            if index < len(fr):
                self.pick_folder = os.path.dirname(fr[index])
            elif fr:
                self.pick_folder = os.path.dirname(fr[-1])
            else:
                fs = self.all_folders()
                self.pick_folder = fs[0] if fs else None
            state.popup = "frame"
            store.renpy.restart_interaction()

        def set_pick_folder(self, folder):
            self.pick_folder = folder
            store.renpy.restart_interaction()

        def pick_images(self):
            if self.pick_folder is None:
                return [ ]
            return store.ui_kit.images_in(self.pick_folder)

        def choose_frame(self, path):
            if self.slot_target is None:
                return
            key, index = self.slot_target
            fr = self.frames(key)
            if index < len(fr):
                fr[index] = path
            else:
                fr.append(path)
            self.put(key + "_frames", fr[:self.max_frames()])
            ## 다음 칸으로 (연달아 고를 수 있게)
            nxt = min(index + 1, self.max_frames() - 1)
            if index + 1 < self.max_frames():
                self.slot_target = (key, nxt)
            else:
                close_popup()
            store.renpy.restart_interaction()

        def clear_frame(self):
            if self.slot_target is None:
                return
            key, index = self.slot_target
            fr = self.frames(key)
            if index < len(fr):
                del fr[index]
                self.put(key + "_frames", fr)
            close_popup()

        def fill_folder(self):
            if self.slot_target is None or self.pick_folder is None:
                return
            key = self.slot_target[0]
            imgs = self.pick_images()
            if not imgs:
                return
            self.put(key + "_frames", imgs[:self.max_frames()])
            if len(imgs) > self.max_frames():
                msg("그림이 {}장이라 앞의 {}장만 넣었습니다.".format(len(imgs), self.max_frames()))
            close_popup()

        def slot_label(self):
            if self.slot_target is None:
                return ""
            key, index = self.slot_target
            return "{} {}번 칸".format("클릭 대기 표시" if key == "ctc" else "커서", index + 1)

        def frames_preview(self, key):
            frames = tuple(self.frames(key))
            if not frames:
                return store.Null()
            delay = self.cu().hold_delay(self.hold(key))
            cache = self.__dict__.setdefault("_previews", { })
            k = (key, frames, delay)
            if k not in cache:
                def f(st, at, frames=frames, delay=delay):
                    return self.cu().frame_at(frames, delay, st)
                cache[k] = store.DynamicDisplayable(f)
            return cache[k]

        ## ── 저장 ──

        def pending(self):
            return len(self.edits)

        def _merged(self):
            lay = dict(self.cu().saved_layout())
            lay.update(self.edits)
            return lay

        def layout_file(self):
            cu = self.cu()
            uk = store.ui_kit
            lay = self._merged()

            lines = uk.file_header("UI Kit 편집기가 저장한 커서/대사 소리 설정입니다.", [
                "여기 적힌 값은 custom_ui_config.rpy의 같은 값보다 우선합니다.",
                "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                ])

            lines.append("define custom_ui.layout = {")
            for k in [ k for k in cu.EDIT_KEYS if k in lay ] + sorted(k for k in lay if k not in cu.EDIT_KEYS):
                v = lay[k]
                if isinstance(v, list) and len(v) > 2:
                    lines.append('    "{}": ['.format(k))
                    for i in v:
                        lines.append("        {},".format(uk.format_value(i)))
                    lines.append("    ],")
                else:
                    lines.append('    "{}": {},'.format(k, uk.format_value(v)))
            lines.append("}")
            lines.append("")

            return ("custom_ui_layout.rpy", "\n".join(lines))

        def after_save(self):
            cu = self.cu()
            changed = set(self.edits)
            ## store 변수가 아니라 실행 중 값으로 (다시 불러올 때 옛 값이 덮지 않게, 3.15)
            cu.runtime.layout = store.python_dict(self._merged())
            self.edits = { }

            ## 지금 게임에도 바로 적용할 수 있는 것
            cu.apply_text_cps()

            need = bool(changed & set(self.RELOAD_KEYS))

            ## 클릭 대기 표시가 처음부터 꺼져 있었다면 프레임만 바꿔도 다시 불러와야 함
            if ("ctc_frames" in changed) and not store.renpy.has_image(cu.cfg("ctc_name")):
                need = True

            return need

        def copy_text(self):
            lay = self._merged()
            uk = store.ui_kit
            lines = [ "# custom_ui_config.rpy에 붙여넣기" ]
            for k in self.cu().EDIT_KEYS:
                if k in lay:
                    lines.append("define custom_ui.{} = {}".format(k, uk.format_value(lay[k])))
            return "\n".join(lines)

        def info_lines(self):
            n = self.pending()
            return [
                "그림 폴더: 커서는 game/gui/cursor/, 클릭 대기 표시(CTC)는 game/gui/ctc/ (1번부터 순서대로, 12장까지, 64x64 권장)",
                "저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음",
                ]

        def help_lines(self):
            return [
                "칸을 누르면 그림을 고릅니다 (빈 칸은 건너뜀). 24fps 고정: 1프레임마다 = 초당 24장, 2프레임마다 = 초당 12장.",
                "커서 켜기/끄기, 커서 방식, 커서 그림, 클릭 대기 표시 켜기/끄기는 저장하면 다시 불러온 뒤 적용됩니다.",
                ]

        def session(self):
            return { }

    register(CustomUITab())


## 막대에 쓰는 값 (편집 중인 값을 읽고 씀)
init -8 python in ui_editor:

    class EditBarValue(store.BarValue, DictEquality):

        def __init__(self, key, lo, hi, step, digits=0, none_is=None):
            self.key = key
            self.lo = lo
            self.hi = hi
            self.step = step
            self.digits = digits
            self.none_is = none_is

        def _tab(self):
            return get_tab("custom_ui")

        def changed(self, v):
            value = self.lo + v
            if self.digits == 0:
                value = int(round(value))
            else:
                value = round(value, self.digits)
            self._tab().put(self.key, value)

        def get_adjustment(self):
            v = self._tab().val(self.key)
            if v is None:
                v = self.none_is if self.none_is is not None else self.lo
            return store.ui.adjustment(range=self.hi - self.lo, value=v - self.lo, step=self.step, changed=self.changed, adjustable=True)

        def get_style(self):
            return ("ui_editor_bar", "ui_editor_bar")


style ui_editor_row_label is ui_editor_text:
    xsize 120
    yalign 0.5

style ui_editor_small_button is ui_editor_button:
    padding (6, 2)

style ui_editor_small_button_text is ui_editor_button_text:
    size 13


screen ui_editor_custom_ui_panel(tab):

    if tab.sound_until is not None:
        timer 1.5 action Function(tab.stop_sound)

    vbox:
        spacing 6

        ## 텍스트 속도
        hbox:
            spacing 6
            text "텍스트 속도" style "ui_editor_row_label"
            bar value ui_editor.EditBarValue("text_cps", 0, 100, 1, none_is=tab.cps()) xsize 200 yalign 0.5
            text tab.cps_label() style "ui_editor_small" yalign 0.5
            textbutton "기본값" style "ui_editor_small_button" action Function(tab.put, "text_cps", None) yalign 0.5

        ## 대사 소리
        hbox:
            spacing 6
            text "대사 소리" style "ui_editor_row_label"
            textbutton "<" style "ui_editor_small_button" action Function(tab.cycle_sound, -1)
            text tab.sound_label() style "ui_editor_small" yalign 0.5 xsize 150
            textbutton ">" style "ui_editor_small_button" action Function(tab.cycle_sound, 1)
            text "음량" style "ui_editor_small" yalign 0.5
            bar value ui_editor.EditBarValue("typing_volume", 0.0, 1.0, 0.05, digits=2) xsize 80 yalign 0.5
            textbutton "들어보기" style "ui_editor_small_button" action Function(tab.listen)

        ## 클릭 대기 표시 (24fps, 칸 12개)
        hbox:
            spacing 6
            text "클릭 대기 표시" style "ui_editor_row_label"
            textbutton ("켬" if tab.val("ctc") else "끔") style "ui_editor_small_button" action Function(tab.toggle, "ctc") selected tab.val("ctc")
            textbutton "1프레임마다" style "ui_editor_small_button" action Function(tab.set_hold, "ctc", 1) selected (tab.hold("ctc") == 1)
            textbutton "2프레임마다" style "ui_editor_small_button" action Function(tab.set_hold, "ctc", 2) selected (tab.hold("ctc") == 2)
            text tab.speed_label("ctc") style "ui_editor_small" yalign 0.5
        use ui_editor_frame_slots(tab, "ctc")

        ## 커서 (24fps, 칸 12개)
        hbox:
            spacing 6
            text "커서" style "ui_editor_row_label"
            textbutton ("켬" if tab.val("cursor") else "끔") style "ui_editor_small_button" action Function(tab.toggle, "cursor") selected tab.val("cursor")
            textbutton "1프레임마다" style "ui_editor_small_button" action Function(tab.set_hold, "cursor", 1) selected (tab.hold("cursor") == 1)
            textbutton "2프레임마다" style "ui_editor_small_button" action Function(tab.set_hold, "cursor", 2) selected (tab.hold("cursor") == 2)
            text tab.speed_label("cursor") style "ui_editor_small" yalign 0.5
        hbox:
            spacing 6
            text "" style "ui_editor_row_label"
            text "방식" style "ui_editor_small" yalign 0.5
            textbutton "소프트웨어 (24fps)" style "ui_editor_small_button" action Function(tab.put, "cursor_mode", "software") selected (tab.val("cursor_mode") != "hardware")
            textbutton "기본 커서 (최대 20fps)" style "ui_editor_small_button" action Function(tab.put, "cursor_mode", "hardware") selected (tab.val("cursor_mode") == "hardware")
        use ui_editor_frame_slots(tab, "cursor")

        ## 퀵메뉴
        hbox:
            spacing 6
            text "퀵메뉴" style "ui_editor_row_label"
            textbutton ("새 게임에서 보임" if tab.val("quick_menu") else "새 게임에서 숨김") style "ui_editor_small_button" action Function(tab.toggle, "quick_menu") selected tab.val("quick_menu")

        ## 미리보기
        frame:
            style "empty"
            background "#ffffff14"
            padding (10, 8)
            xsize 620

            hbox:
                spacing 12
                vbox:
                    xsize 470
                    spacing 4
                    hbox:
                        spacing 2
                        add tab.sample_text()
                        if tab.val("ctc"):
                            add tab.frames_preview("ctc") yalign 1.0
                    textbutton "글자 다시 보기" style "ui_editor_small_button" action Function(tab.replay)
                vbox:
                    spacing 4
                    text "커서" style "ui_editor_small"
                    if tab.val("cursor"):
                        add tab.frames_preview("cursor")
                    else:
                        text "(끔)" style "ui_editor_small"

        ## 커서와 셰이더 '여기에서부터' (Screen FX 4.5가 있을 때, 3.21)
        if renpy.has_screen("ui_editor_fx_cursor_panel") and ui_editor.get_tab("screen_fx") is not None:
            use expression "ui_editor_fx_cursor_panel" pass (ui_editor.get_tab("screen_fx"))


## 프레임 칸 12개 (3.0). 그림이 든 칸 → 다음 빈 칸(+) → 나머지는 비어 있음
screen ui_editor_frame_slots(tab, key):
    $ _fr = tab.frames(key)
    $ _mx = tab.max_frames()
    hbox:
        spacing 3
        text "" style "ui_editor_row_label"
        for _i in range(_mx):
            if _i < len(_fr):
                button:
                    style "ui_editor_small_button"
                    xysize (38, 38)
                    padding (2, 2)
                    action Function(tab.open_slot, key, _i)
                    add Transform(_fr[_i], fit="contain", xysize=(34, 34)) align (0.5, 0.5)
            elif _i == len(_fr):
                textbutton "+" style "ui_editor_small_button" xysize (38, 38) text_xalign 0.5 action Function(tab.open_slot, key, _i)
            else:
                null width 38 height 38


## 프레임 그림 고르기 창 (3.0)
screen ui_editor_frame_popup():

    $ _tab = ui_editor.get_tab("custom_ui")

    button:
        style "empty"
        xfill True
        yfill True
        background "#00000066"
        action Function(ui_editor.close_popup)

    frame:
        style "ui_editor_frame"
        modal True
        align (0.5, 0.5)
        xsize 720
        ysize 600

        vbox:
            spacing 6
            text ("그림 고르기 - " + _tab.slot_label()) style "ui_editor_title"
            text "폴더를 고르고 그림을 누르면 이 칸에 들어가고 다음 칸으로 넘어갑니다." style "ui_editor_small"

            hbox:
                spacing 4
                box_wrap True
                box_wrap_spacing 4
                xmaximum 690
                for _d in _tab.all_folders():
                    textbutton (_d or "game") style "ui_editor_button" text_size 13 action Function(_tab.set_pick_folder, _d) selected (_tab.pick_folder == _d)

            viewport:
                scrollbars "vertical"
                mousewheel True
                ysize 360

                vpgrid:
                    cols 7
                    spacing 6
                    allow_underfull True
                    for _f in _tab.pick_images():
                        button:
                            style "ui_editor_button"
                            xsize 90
                            ysize 96
                            action Function(_tab.choose_frame, _f)
                            vbox:
                                xalign 0.5
                                add Transform(_f, fit="contain", xysize=(72, 72)) xalign 0.5
                                text _f.split("/")[-1] style "ui_editor_small" size 11 xalign 0.5

            hbox:
                spacing 6
                textbutton "이 폴더 통째로 넣기 (최대 12장)" style "ui_editor_button" action Function(_tab.fill_folder) sensitive bool(_tab.pick_images())
                textbutton "이 칸 비우기" style "ui_editor_button" action Function(_tab.clear_frame)
                textbutton "닫기 (Esc)" style "ui_editor_button" action Function(ui_editor.close_popup)
