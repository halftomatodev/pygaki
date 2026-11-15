################################################################################
## pygaki — 렌파이 런처에 붙이는 파일 (launcher/game/에 복사)
##
## 런처에 두 가지를 더합니다.
##   [pygaki로 편집]        첫 화면 아래쪽 버튼. 지금 고른 프로젝트를 pygaki 앱으로 엽니다 (대본 편집, GUI 편집)
##   [pygaki 안내서]        그 옆 버튼. 런처 언어의 안내서(pygaki/pygaki_안내서.html, _ja, _en)를 기본 브라우저로 엽니다 (인터넷 없이 열리는 한 파일)
##   단추와 알림 글은 런처 언어(한국어, 일본어, 그 밖은 영어)를 따릅니다
##   [플러그인 올리기]      그 옆 버튼. 고른 프로젝트의 pygaki 플러그인을 이 묶음의 판으로 바꿉니다 (설정·저장 값은 그대로)
##   [+ Create New Project]  누르면 "기본 (Vanilla)"과 "Pygaki" 가운데 고릅니다.
##                           기본 = 렌파이 원래 새 프로젝트
##                           Pygaki = 기본처럼 해상도와 색을 골라 만든 한국어 프로젝트에 pygaki 플러그인을 얹은 것
##                           (플러그인은 SDK 폴더의 pygaki/template에서 가져옴)
##
## 런처의 원래 파일은 고치지 않고 이 파일 하나만 더합니다. 렌파이를 올리면 이 파일을 다시 복사합니다.
## (bundle/make_bundle.py가 넣어 줍니다)
################################################################################

init python:

    import os
    import shutil
    import subprocess

    ## SDK 폴더 기준 자리
    PYGAKI_APP = os.path.join(config.renpy_base, "pygaki", "app", "pygaki.exe")
    PYGAKI_TEMPLATE = os.path.join(config.renpy_base, "pygaki", "template")
    PYGAKI_GUIDES = { "ko": "pygaki_안내서.html", "ja": "pygaki_guide_ja.html", "en": "pygaki_guide_en.html" }

    ## 예전 묶음은 템플릿이 SDK 폴더 바로 아래 showpy에 있었다. 새 자리에 없으면 그것을 쓴다
    if not os.path.isdir(os.path.join(PYGAKI_TEMPLATE, "game")):
        if os.path.isdir(os.path.join(config.renpy_base, "showpy", "game")):
            PYGAKI_TEMPLATE = os.path.join(config.renpy_base, "showpy")

    ## Pygaki 프로젝트는 런처 언어와 상관없이 한국어로 만든다 (렌파이가 한국어 프로젝트에 넣는 글꼴)
    PYGAKI_LANGUAGE = "korean"
    PYGAKI_FONT = "SourceHanSansLite.ttf"

    def pygaki_open():
        p = project.current
        if p is None:
            interface.error(L("먼저 왼쪽 목록에서 프로젝트를 고르세요.", "先に左のリストからプロジェクトを選んでください。", "Choose a project in the list on the left first."), label=None)
            return
        if not os.path.exists(PYGAKI_APP):
            interface.error(L("pygaki 앱을 찾지 못했어요:", "pygaki アプリが見つかりません:", "Couldn't find the pygaki app:") + "\n[pygaki_app!q]", label=None, pygaki_app=PYGAKI_APP)
            return
        subprocess.Popen([ PYGAKI_APP, "--project", p.path ], cwd=os.path.dirname(PYGAKI_APP))

    def pygaki_guide():
        ## 런처 언어의 안내서. 없으면(예전 묶음) 한국어
        guide = os.path.join(config.renpy_base, "pygaki", PYGAKI_GUIDES[pygaki_lang()])
        if not os.path.exists(guide):
            guide = os.path.join(config.renpy_base, "pygaki", PYGAKI_GUIDES["ko"])
        if not os.path.exists(guide):
            interface.error(L("안내서를 찾지 못했어요:", "案内書が見つかりません:", "Couldn't find the guide:") + "\n[pygaki_guide!q]", label=None, pygaki_guide=guide)
            return
        if not pygaki_open_in_browser(guide):
            os.startfile(guide)

    ## .html을 VS Code 같은 편집기가 맡고 있어도 브라우저로 열리게, 윈도우에 정해 둔 기본 브라우저
    ## (https 주소를 여는 프로그램)를 찾아 file 주소를 넘긴다. 못 찾으면 False (그때는 파일에 붙은 프로그램으로)
    def pygaki_open_in_browser(path):
        try:
            import winreg
            from urllib.request import pathname2url
            key = r"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\https\UserChoice"
            with winreg.OpenKey(winreg.HKEY_CURRENT_USER, key) as k:
                progid = winreg.QueryValueEx(k, "ProgId")[0]
            with winreg.OpenKey(winreg.HKEY_CLASSES_ROOT, progid + r"\shell\open\command") as k:
                cmd = winreg.QueryValueEx(k, "")[0]
            url = "file:" + pathname2url(os.path.abspath(path))
            if "%1" in cmd:
                cmd = cmd.replace("%1", url)
            else:
                cmd = cmd + ' "' + url + '"'
            subprocess.Popen(cmd)
            return True
        except Exception:
            return False

    ## 런처 언어(환경 설정의 Language)에 맞춘 글. 한국어 런처면 한국어, 일본어면 일본어, 그 밖은 영어.
    ## 영어 런처 글꼴에는 한글·일본어 글자가 없어서 SDK의 글꼴(한·일·영이 모두 있음)로 적는다
    def pygaki_lang():
        l = _preferences.language
        if l == "korean":
            return "ko"
        if l == "japanese":
            return "ja"
        return "en"

    def KO(s):
        return "{font=SourceHanSansLite.ttf}" + s + "{/font}"

    ## 고른 언어의 글 (글꼴 없이). 글에 {0} 같은 자리를 채울 때는 이것으로 채운 뒤 KO()로 감싼다
    def T(ko, ja, en):
        return { "ko": ko, "ja": ja, "en": en }[pygaki_lang()]

    def L(ko, ja, en):
        return KO(T(ko, ja, en))

    def pygaki_can_new():
        return os.path.isdir(os.path.join(PYGAKI_TEMPLATE, "game"))

    ## 런처의 [+ Create New Project](label new_project)를 아래 pygaki_new_project로 돌린다.
    ## 템플릿이 없으면(pygaki/template 폴더를 뺐으면) 런처 원래 흐름 그대로.
    if pygaki_can_new():
        config.label_overrides["new_project"] = "pygaki_new_project"

    ## 템플릿에서 새 프로젝트로: 새 프로젝트에 없는 것만 가져온다 (플러그인 폴더, 커서·CTC 샘플, 한국어 공통 문구).
    ## 방금 고른 해상도로 만든 gui.rpy, screens.rpy, 그림은 이미 있으므로 그대로 남는다.
    PYGAKI_SKIP = shutil.ignore_patterns("*.rpyc", "*.rpymc", "cache", "saves", "*.bak", "log.txt", "errors.txt", "traceback.txt")

    def pygaki_add_plugins(gamedir):
        src = os.path.join(PYGAKI_TEMPLATE, "game")

        def fill(rel, deeper):
            for name in sorted(os.listdir(os.path.join(src, rel))):
                if PYGAKI_SKIP(src, [ name ]):
                    continue
                a = os.path.join(src, rel, name)
                b = os.path.join(gamedir, rel, name)
                if not os.path.exists(b):
                    if os.path.isdir(a):
                        shutil.copytree(a, b, ignore=PYGAKI_SKIP)
                    else:
                        shutil.copy(a, b)
                elif deeper and os.path.isdir(a) and name in deeper:
                    fill(os.path.join(rel, name), None)

        ## game/gui는 안쪽에서 없는 것(cursor, ctc)만
        fill("", ( "gui", ))

        ## 렌파이가 직접 띄우는 화면(오류, 접근성 메뉴)도 한글 글꼴로. 런처가 한국어일 때 기본 프로젝트에 들어가는 줄과 같다
        common = os.path.join(gamedir, "tl", "None", "common.rpym")
        if os.path.exists(common) and os.path.exists(os.path.join(gamedir, PYGAKI_FONT)):
            with open(common, "rb") as f:
                has = b"gui.system_font" in f.read()
            if not has:
                with open(common, "ab") as f:
                    f.write("\r\ndefine gui.system_font = {!r}\r\n".format(PYGAKI_FONT).encode("utf-8"))

    ## [플러그인 올리기]: 고른 프로젝트의 pygaki 플러그인을 이 묶음의 판으로 바꾼다.
    ## 엔진·편집기 파일만 바꾸고, 사용자가 고치는 파일(설정 *_config.rpy, GUI 편집기 저장 *_layout.rpy, 숨김 *_off.txt)은
    ## 없을 때만 넣는다. 예전 판에만 있던 파일은 치운다. 바꾸기 전 플러그인 폴더는 프로젝트의 ui_kit_backup/plugins/에 남긴다.
    PYGAKI_PLUGINS = ( "ui_kit", "screen_fx", "splash", "hotkeys" )
    PYGAKI_KEEP = ( "_config.rpy", "_layout.rpy", "_off.txt" )
    ## 예전 판에만 있던 파일 (남아 있으면 지금 판과 부딪힘). 판을 낼 때 지운 파일을 여기에 더한다
    PYGAKI_RETIRED = (
        "screen_fx/engine/tiles.rpy", "screen_fx/tiles_config.rpy",     # 5.3에 포토 콜라주로 바뀜
        "ui_kit/effects/popin.glsl", "ui_kit/effects/drip.glsl",          # 5.1 만드는 중에 지운 효과
    )
    PYGAKI_VERSION_FILES = (
        ( "ui_kit", "ui_kit/engine/ui_kit.rpy" ),
        ( "screen_fx", "screen_fx/engine/screen_fx.rpy" ),
        ( "splash", "splash/engine/splash.rpy" ),
        ( "hotkeys", "hotkeys/hotkeys.rpy" ),
    )

    def pygaki_versions(gamedir):
        import re
        out = { }
        for name, rel in PYGAKI_VERSION_FILES:
            try:
                with open(os.path.join(gamedir, rel), "rb") as f:
                    m = re.search(br'VERSION\s*=\s*"([^"]+)"', f.read())
                out[name] = m.group(1).decode("utf-8") if m else "?"
            except Exception:
                out[name] = None
        return out

    def pygaki_update_plan(gamedir):
        """바꿀 파일 [(템플릿 파일, 프로젝트 파일)], 치울 파일 [프로젝트 파일]."""
        src = os.path.join(PYGAKI_TEMPLATE, "game")
        copy = [ ]
        for plugin in PYGAKI_PLUGINS:
            top = os.path.join(src, plugin)
            if not os.path.isdir(top):
                continue
            for root, dirs, files in os.walk(top):
                dirs[:] = [ d for d in dirs if not PYGAKI_SKIP(root, [ d ]) ]
                for name in files:
                    if PYGAKI_SKIP(root, [ name ]):
                        continue
                    a = os.path.join(root, name)
                    b = os.path.join(gamedir, os.path.relpath(a, src))
                    if name.endswith(PYGAKI_KEEP) and os.path.exists(b):
                        continue
                    copy.append((a, b))
        retire = [ os.path.join(gamedir, *r.split("/")) for r in PYGAKI_RETIRED ]
        retire = [ r for r in retire if os.path.exists(r) ]
        return copy, retire

    def pygaki_update_plugins(gamedir):
        import time
        copy, retire = pygaki_update_plan(gamedir)
        backup = os.path.join(os.path.dirname(gamedir), "ui_kit_backup", "plugins", time.strftime("%Y%m%d_%H%M%S"))
        for plugin in PYGAKI_PLUGINS:
            d = os.path.join(gamedir, plugin)
            if os.path.isdir(d):
                shutil.copytree(d, os.path.join(backup, plugin), ignore=PYGAKI_SKIP)
        for a, b in copy:
            if not os.path.isdir(os.path.dirname(b)):
                os.makedirs(os.path.dirname(b))
            shutil.copy(a, b)
        for r in retire:
            os.remove(r)
        ## 지난 판의 .rpyc가 남으면 렌파이가 지운 .rpy도 읽으므로 플러그인 폴더의 .rpyc는 모두 지운다 (켤 때 다시 생김)
        for plugin in PYGAKI_PLUGINS:
            for root, dirs, files in os.walk(os.path.join(gamedir, plugin)):
                for name in files:
                    if name.endswith((".rpyc", ".rpymc")):
                        os.remove(os.path.join(root, name))
        return len(copy), len(retire), backup

    def pygaki_number(title, ask, wrong):
        while True:
            v = interface.input(title, ask, cancel=Jump("front_page"), allow=interface.DIGITS_LETTERS)
            try:
                v = int(v)
                if v > 0:
                    return v
            except Exception:
                pass
            interface.error(wrong, label=None)

    if "pygaki_buttons" not in config.overlay_screens:
        config.overlay_screens.append("pygaki_buttons")


## 런처 첫 화면에만 보이는 버튼 줄 (아래쪽 링크 줄 바로 위)
screen pygaki_buttons():

    zorder 101

    if renpy.get_screen("front_page"):

        hbox:
            xalign 0.5
            ypos 506
            spacing 24

            textbutton L("pygaki로 편집", "pygaki で編集", "Edit with pygaki"):
                style "l_link"
                text_font "SourceHanSansLite.ttf"
                text_size 16
                action Jump("pygaki_open")

            textbutton L("pygaki 안내서", "pygaki 案内書", "pygaki guide"):
                style "l_link"
                text_font "SourceHanSansLite.ttf"
                text_size 16
                action Jump("pygaki_guide")

            textbutton L("플러그인 올리기", "プラグインを更新", "Update plugins"):
                style "l_link"
                text_font "SourceHanSansLite.ttf"
                text_size 16
                action Jump("pygaki_update")


## 버튼 동작은 label에서 한다 (안내 창을 띄우려면 화면 동작 밖이어야 함)
label pygaki_open:
    $ pygaki_open()
    jump front_page

label pygaki_guide:
    $ pygaki_guide()
    jump front_page

## 고른 프로젝트의 플러그인을 이 묶음의 판으로 (판을 보여 주고 물은 뒤)
label pygaki_update:
    python:
        p = project.current
        if p is None:
            interface.error(L("먼저 왼쪽 목록에서 프로젝트를 고르세요.", "先に左のリストからプロジェクトを選んでください。", "Choose a project in the list on the left first."), label=None)
            renpy.jump("front_page")
        if not os.path.isdir(os.path.join(PYGAKI_TEMPLATE, "game", "ui_kit")):
            interface.error(L("이 묶음에 플러그인 템플릿(pygaki/template)이 없어요.", "このパックにはプラグインのテンプレート(pygaki/template)がありません。", "This bundle has no plugin template (pygaki/template)."), label=None)
            renpy.jump("front_page")
        if not os.path.isdir(os.path.join(p.gamedir, "ui_kit")):
            interface.error(L("이 프로젝트에는 pygaki 플러그인이 없어요. 새 프로젝트 만들기에서 \"Pygaki\"로 만든 프로젝트만 올릴 수 있어요.", "このプロジェクトには pygaki プラグインがありません。更新できるのは、新規プロジェクト作成で「Pygaki」を選んで作ったプロジェクトだけです。", "This project has no pygaki plugins. Only projects made with \"Pygaki\" in Create New Project can be updated."), label=None)
            renpy.jump("front_page")

        pygaki_old = pygaki_versions(p.gamedir)
        pygaki_new = pygaki_versions(os.path.join(PYGAKI_TEMPLATE, "game"))
        pygaki_none = T("없음", "なし", "none")
        pygaki_lines = "\n".join(
            "{}  {} → {}".format(n, pygaki_old[n] or pygaki_none, pygaki_new[n] or pygaki_none)
            for n in PYGAKI_PLUGINS
        )
        pygaki_same = all(pygaki_old[n] == pygaki_new[n] for n in PYGAKI_PLUGINS)
        if pygaki_same:
            pygaki_head = T("판이 같아요. 그래도 다시 넣을까요?", "バージョンは同じです。それでも入れ直しますか?", "The versions are the same. Put them in again anyway?")
        else:
            pygaki_head = T("이 프로젝트의 pygaki 플러그인을 새 판으로 바꿀까요?", "このプロジェクトの pygaki プラグインを新しいバージョンにしますか?", "Update this project's pygaki plugins to the new version?")
        pygaki_note = L(
            "엔진·편집기 파일만 바꾸고, 설정(*_config.rpy)과 게임 안 편집 화면에서 저장한 값(*_layout.rpy)은 그대로 둬요. 바꾸기 전 것은 프로젝트 폴더의 ui_kit_backup/plugins에 남아요. 게임을 끄고 해 주세요.",
            "エンジン・編集画面のファイルだけを替え、設定(*_config.rpy)とゲーム内編集画面で保存した値(*_layout.rpy)はそのままです。替える前のものはプロジェクトフォルダーの ui_kit_backup/plugins に残ります。ゲームを閉じてから行ってください。",
            "Only the engine and editor files are replaced. Settings (*_config.rpy) and values saved in the in-game editor (*_layout.rpy) stay as they are. The old files are kept in ui_kit_backup/plugins in the project folder. Close the game first.",
        )

        pygaki_ok = interface.yesno(
            KO(pygaki_head + "\n\n" + pygaki_lines + "\n\n") + pygaki_note,
        )

        if pygaki_ok:
            with interface.error_handling(L("플러그인을 바꾸는 중", "プラグインの更新", "updating the plugins")):
                pygaki_n, pygaki_gone, pygaki_backup = pygaki_update_plugins(p.gamedir)
            interface.info(
                KO(T("바꿨어요. 파일 {0}개를 새 판으로, 예전 판에만 있던 파일 {1}개를 치웠어요. 게임을 켜면 새 판으로 돌아요.",
                  "更新しました。ファイル {0} 個を新しいバージョンにし、古いバージョンにだけあったファイル {1} 個を片付けました。ゲームを起動すると新しいバージョンで動きます。",
                  "Done. {0} files were updated and {1} files that only the old version had were removed. The game runs the new version next time you start it.").format(pygaki_n, pygaki_gone)),
                L("바꾸기 전 것:", "替える前のもの:", "Old files:") + "\n[pygaki_backup!q]",
                pygaki_backup=pygaki_backup,
            )
    jump front_page


## 새 프로젝트 만들기: 런처의 new_project와 같은 순서이고, 템플릿 고르기만 "기본 (Vanilla)" / "Pygaki"로 바꿈.
## Pygaki를 고르면 아래 pygaki_gui_project로 가서 해상도와 색을 고른다.
## (config.label_overrides로 런처의 [+ Create New Project]가 여기로 온다)
label pygaki_new_project:

    if persistent.projects_directory is None:
        call choose_projects_directory

    if persistent.projects_directory is None:
        $ interface.error(_("The projects directory could not be set. Giving up."))

    python:
        new_project_language = __("{#language name and font}")

        ## 사용자가 따로 둔 다른 템플릿도 그대로 고를 수 있게 뒤에 붙인다 (pygaki 템플릿 자신은 "Pygaki"로 이미 있음)
        pygaki_others = [
            ( ("new_template_project", p.path), p.name)
            for p in project.manager.templates
            if os.path.normcase(os.path.abspath(p.path)) != os.path.normcase(os.path.abspath(PYGAKI_TEMPLATE))
        ]

        gui_kind, gui_template_path = interface.choice(
            L("어떤 프로젝트를 만들까요?", "どのプロジェクトを作りますか?", "Which kind of project?"),
            [
                ( ("new_gui_project", None), L("기본 (Vanilla): 렌파이 원래 새 프로젝트", "基本 (Vanilla):Ren'Py の通常の新規プロジェクト", "Basic (Vanilla): Ren'Py's usual new project") ),
                ( ("pygaki_gui_project", None), L("Pygaki: pygaki 편집 도구가 들어 있는 한국어 프로젝트", "Pygaki:pygaki の編集ツールが入った韓国語プロジェクト", "Pygaki: a Korean-language project with the pygaki editing tools") ),
            ] + pygaki_others,
            ("pygaki_gui_project", None),
            cancel=Jump("front_page"),
        )

        ## 기본은 런처 언어로 만들어지므로 런처가 하던 대로 알려 준다
        if gui_kind == "new_gui_project":
            interface.info(_("You will be creating an [new_project_language]{#this substitution may be localized} language project. Change the launcher language in preferences to create a project in another language."), cancel=Jump("front_page"))

    python:
        project_name = ""
        while True:
            project_name = interface.input(
                _("PROJECT NAME"),
                _("Please enter the name of your project:"),
                allow=interface.PROJECT_LETTERS,
                cancel=Jump("front_page"),
                default=project_name,
            )

            project_name = project_name.strip()
            if not project_name:
                interface.error(_("The project name may not be empty."), label=None)
                continue

            project_dir = os.path.join(persistent.projects_directory, project_name)

            if project.manager.get(project_name) is not None:
                interface.error(_("[project_name!q] already exists. Please choose a different project name."), project_name=project_name, label=None)
                continue

            if os.path.exists(project_dir):
                interface.error(_("[project_dir!q] already exists. Please choose a different project name."), project_dir=project_dir, label=None)
                continue
            break

    jump expression gui_kind


## Pygaki 새 프로젝트: 런처의 new_gui_project(해상도 → 색 → 만들기)와 같은 순서로 한국어 프로젝트를 만들고,
## 그 위에 템플릿의 플러그인을 얹는다. 문구는 런처 것을 그대로 써서 런처 언어를 따라간다.
label pygaki_gui_project:

    python:
        default_size = (1920, 1080)

        gui_size = interface.choice(
            _("What resolution should the project use? Although Ren'Py can scale the window up and down, this is the initial size of the window, the size at which assets should be drawn, and the size at which the assets will be at their sharpest.\n\nThe default of [default_size[0]]x[default_size[1]] is a reasonable compromise."),
            [
                ((1280, 720), "1280x720"),
                ((1920, 1080), "1920x1080"),
                ((2560, 1440), "2560x1440"),
                ((3840, 2160), "3840x2160"),
                ("custom", _("Custom. The GUI is optimized for a 16:9 aspect ratio.")),
            ],
            default_size,
            cancel=Jump("front_page"),
        )

        if gui_size == "custom":
            gui_size = (
                pygaki_number(_("WIDTH"), _("Please enter the width of your game, in pixels."), _("The width must be a number.")),
                pygaki_number(_("HEIGHT"), _("Please enter the height of your game, in pixels."), _("The height must be a number.")),
            )

    $ gui_color = (DARK_COLORS[0], "#000000", False)

    call screen choose_gui_color

    python hide:

        width, height = gui_size
        accent, boring, light = gui_color

        p = gui7.GuiParameters(
            os.path.join(project_dir, "game"),
            os.path.join(config.renpy_base, "gui", "game"),
            width,
            height,
            accent,
            boring,
            light,
            PYGAKI_LANGUAGE,
            True,
            True,
            True,
            project_name,
            )

        interface.processing(_("Creating the new project..."))

        with interface.error_handling(_("creating a new project")):
            gui7.generate_gui(p)

        with interface.error_handling(_("activating the new project")):
            project.manager.scan()
            project.Select(project.manager.get(project_name))()

        ## 막대, 스크롤바 같은 그림을 고른 크기로 마저 만든 뒤에 플러그인을 얹는다
        interface.processing(_("Updating the project..."))
        project.current.launch([ 'gui_images' ], env={ "RENPY_VARIANT" : "small phone" }, wait=True)
        project.current.launch([ 'gui_images' ], wait=True)

        with interface.error_handling(_("creating a new project")):
            pygaki_add_plugins(project.current.gamedir)

    jump front_page
