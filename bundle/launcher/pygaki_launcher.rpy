################################################################################
## pygaki — 렌파이 런처에 붙이는 파일 (launcher/game/에 복사)
##
## 런처에 두 가지를 더합니다.
##   [pygaki로 편집]        첫 화면 아래쪽 버튼. 지금 고른 프로젝트를 pygaki 앱으로 엽니다 (대본 편집, GUI 편집)
##   [pygaki 안내서]        그 옆 버튼. pygaki/pygaki_안내서.html을 기본 브라우저로 엽니다 (인터넷 없이 열리는 한 파일)
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
    PYGAKI_GUIDE = os.path.join(config.renpy_base, "pygaki", "pygaki_안내서.html")

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
            interface.error(KO("먼저 왼쪽 목록에서 프로젝트를 고르세요."), label=None)
            return
        if not os.path.exists(PYGAKI_APP):
            interface.error(KO("pygaki 앱을 찾지 못했어요:") + "\n[pygaki_app!q]", label=None, pygaki_app=PYGAKI_APP)
            return
        subprocess.Popen([ PYGAKI_APP, "--project", p.path ], cwd=os.path.dirname(PYGAKI_APP))

    def pygaki_guide():
        if not os.path.exists(PYGAKI_GUIDE):
            interface.error(KO("안내서를 찾지 못했어요:") + "\n[pygaki_guide!q]", label=None, pygaki_guide=PYGAKI_GUIDE)
            return
        if not pygaki_open_in_browser(PYGAKI_GUIDE):
            os.startfile(PYGAKI_GUIDE)

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

    ## 런처 언어가 영어여도 한글이 네모로 나오지 않게 SDK의 한글 글꼴로 적는다
    def KO(s):
        return "{font=SourceHanSansLite.ttf}" + s + "{/font}"

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

            textbutton "pygaki로 편집":
                style "l_link"
                text_font "SourceHanSansLite.ttf"
                text_size 16
                text_color "#F96854"
                action Jump("pygaki_open")

            textbutton "pygaki 안내서":
                style "l_link"
                text_font "SourceHanSansLite.ttf"
                text_size 16
                text_color "#F96854"
                action Jump("pygaki_guide")


## 버튼 동작은 label에서 한다 (안내 창을 띄우려면 화면 동작 밖이어야 함)
label pygaki_open:
    $ pygaki_open()
    jump front_page

label pygaki_guide:
    $ pygaki_guide()
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
            KO("어떤 프로젝트를 만들까요?"),
            [
                ( ("new_gui_project", None), KO("기본 (Vanilla): 렌파이 원래 새 프로젝트") ),
                ( ("pygaki_gui_project", None), KO("Pygaki: pygaki 편집 도구가 들어 있는 한국어 프로젝트") ),
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
