################################################################################
## UI Kit 편집기 — "UI 글" 탭 (확인 창 글, 버튼 글자) (3.23)
##
## 칸을 눌러 글을 고치고 Enter. 고치면 게임 화면에 바로 보이고, Ctrl+S로 ui_text_layout.rpy에 저장합니다.
################################################################################

init -8 python in ui_editor:

    class UITextTab(Tab):

        id = "ui_text"
        label = "UI 글"
        panel_screen = "ui_editor_ui_text_panel"
        overlay_screen = None

        def __init__(self):
            self.edits = { }

        def ut(self):
            return getattr(store, "ui_text", None)

        def available(self):
            if self.ut() is None:
                return (False, "UI 글 기능이 없습니다.")
            return (True, "")

        def groups(self):
            rv = [ ]
            for name, grp, label, srcs, confirm in self.ut().ITEMS:
                if not rv or rv[-1][0] != grp:
                    rv.append((grp, [ ]))
                rv[-1][1].append((name, label, confirm))
            return rv

        def _saved(self):
            return self.ut().merged()

        def val(self, name):
            if name in self.edits:
                return self.edits[name] or self.ut().original(name)
            return self.ut().current(name)

        def changed(self, name):
            """원래 글과 다르게 바뀌어 있는지 (저장한 것, 아직 저장 안 한 것 모두)."""
            if name in self.edits:
                return bool(self.edits[name])
            return name in self._saved()

        def _live(self):
            d = dict(self._saved())
            for k, v in self.edits.items():
                if v:
                    d[k] = v
                else:
                    d.pop(k, None)
            return d

        def put(self, name, text):
            ut = self.ut()
            text = text or ""
            if text == ut.original(name):
                text = ""
            saved = self._saved().get(name, "")
            if text == saved:
                self.edits.pop(name, None)
            else:
                self.edits[name] = text
            ## 게임 화면에 바로 보이게
            ut.apply(self._live())
            store.renpy.restart_interaction()

        def revert(self, name):
            self.put(name, "")

        def preview(self, name):
            self.ut().apply(self._live())
            self.ut().show_confirm(self.val(name))

        def on_close(self):
            store.renpy.hide_screen("confirm")

        ## ── 저장 ──

        def pending(self):
            return len(self.edits)

        def discard(self):
            self.edits = { }
            self.ut().apply()
            store.renpy.restart_interaction()

        def layout_file(self):
            uk = store.ui_kit
            d = self._live()
            lines = uk.file_header("GUI 편집기가 저장한 UI 글(확인 창, 버튼 글자)입니다.", [
                "여기 적힌 값은 ui_text_config.rpy의 같은 이름보다 우선합니다.",
                "이 파일을 지우면 설정 파일 값으로 돌아갑니다.",
                ])
            lines.append("define ui_text.layout = {")
            for name, grp, label, srcs, confirm in self.ut().ITEMS:
                if name in d:
                    lines.append('    "{}": _({}),     # {}'.format(name, uk.format_value(d[name]), label))
            lines.append("}")
            lines.append("")
            return ("ui_text_layout.rpy", "\n".join(lines))

        def after_save(self):
            ut = self.ut()
            ## 버튼 글자는 렌파이가 화면을 처음 그릴 때 한 번만 번역해 두므로, 바꿨으면 다시 불러옴
            need = any(not ut.ITEM[k][4] for k in self.edits if k in ut.ITEM)
            ut.runtime.saved = store.python_dict(self._live())
            self.edits = { }
            ut.apply()
            return need

        def copy_text(self):
            uk = store.ui_kit
            d = self._live()
            lines = [ "# ui_text_config.rpy에 붙여넣기", "define ui_text.texts = {" ]
            for name, grp, label, srcs, confirm in self.ut().ITEMS:
                if name in d:
                    lines.append('    "{}": _({}),'.format(name, uk.format_value(d[name])))
            lines.append("}")
            return "\n".join(lines)

        def info_lines(self):
            n = self.pending()
            return [
                "칸을 눌러 고치고 Enter (Esc 취소). 줄바꿈은 \\n. 확인 창 글은 [[이 창 보기]로 바로 보고, 버튼 글자는 저장하면 다시 불러온 뒤 바뀝니다.",
                "저장 안 한 변경: {}개".format(n) if n else "저장 안 한 변경 없음",
                ]

        def help_lines(self):
            return [
                "screens.rpy를 고치지 않고 렌파이 번역표로 바꿉니다. 같은 글을 여러 곳에서 쓰면 같이 바뀝니다.",
                ]

        def session(self):
            return { }

    register(UITextTab())

    class UITextInput(store.InputValue, DictEquality):
        """UI 글 탭의 글 칸."""
        default = False
        editable = True
        returnable = False

        def __init__(self, name):
            self.name = name
            self.text = None

        def get_text(self):
            if self.text is None:
                return get_tab("ui_text").val(self.name).replace("\n", "\\n")
            return self.text

        def set_text(self, s):
            self.text = s
            store.renpy.restart_interaction()

        def enter(self):
            s = (self.text if self.text is not None else self.get_text()).replace("\\n", "\n")
            get_tab("ui_text").put(self.name, s)
            self.text = None
            store.renpy.run(self.Disable())
            raise store.renpy.IgnoreEvent()

        def cancel(self):
            self.text = None
            store.renpy.run(self.Disable())

    _ui_text_inputs = { }

    def ui_text_input(name):
        if name not in _ui_text_inputs:
            _ui_text_inputs[name] = UITextInput(name)
        return _ui_text_inputs[name]


screen ui_editor_ui_text_panel(tab):

    vbox:
        spacing 6

        for _g, _items in tab.groups():
            text _g style "ui_editor_title" size 18
            for _name, _label, _confirm in _items:
                hbox:
                    spacing 6
                    text (_label + (" (바꿈)" if tab.changed(_name) else "")) style "ui_editor_small" yalign 0.5 min_width 220
                    if _confirm:
                        textbutton "이 창 보기" style "ui_editor_button" text_size 12 action Function(tab.preview, _name)
                    if tab.changed(_name):
                        textbutton "원래대로" style "ui_editor_button" text_size 12 action Function(tab.revert, _name)
                button:
                    style "ui_editor_button"
                    xsize 620
                    yminimum 36
                    action ui_editor.ui_text_input(_name).Toggle()
                    input value ui_editor.ui_text_input(_name) style "ui_editor_text" size 15 length 300 xmaximum 596
