################################################################################
## pygaki — 렌파이 런처에 붙이는 파일 (launcher/game/에 복사)
##
## 런처에 두 가지를 더합니다.
##   [pygaki로 편집]        첫 화면 아래쪽 버튼. 지금 고른 프로젝트를 pygaki 앱으로 엽니다 (대본 편집, GUI 편집)
##   [+ Create New Project]  누르면 "기본 (Vanilla)"과 "Pygaki" 가운데 고릅니다.
##                           기본 = 렌파이 원래 새 프로젝트, Pygaki = showpy가 들어간 템플릿(SDK 폴더의 showpy)
##
## 런처의 원래 파일은 고치지 않고 이 파일 하나만 더합니다. 렌파이를 올리면 이 파일을 다시 복사합니다.
## (bundle/make_bundle.py가 넣어 줍니다)
################################################################################

init python:

    import os
    import subprocess

    ## SDK 폴더 기준 자리
    PYGAKI_APP = os.path.join(config.renpy_base, "pygaki", "app", "pygaki.exe")
    PYGAKI_TEMPLATE = os.path.join(config.renpy_base, "showpy")

    def pygaki_open():
        p = project.current
        if p is None:
            interface.error(KO("먼저 왼쪽 목록에서 프로젝트를 고르세요."), label=None)
            return
        if not os.path.exists(PYGAKI_APP):
            interface.error(KO("pygaki 앱을 찾지 못했어요:") + "\n[pygaki_app!q]", label=None, pygaki_app=PYGAKI_APP)
            return
        subprocess.Popen([ PYGAKI_APP, "--project", p.path ], cwd=os.path.dirname(PYGAKI_APP))

    ## 런처 언어가 영어여도 한글이 네모로 나오지 않게 SDK의 한글 글꼴로 적는다
    def KO(s):
        return "{font=SourceHanSansLite.ttf}" + s + "{/font}"

    def pygaki_can_new():
        return os.path.isdir(os.path.join(PYGAKI_TEMPLATE, "game"))

    ## 런처의 [+ Create New Project](label new_project)를 아래 pygaki_new_project로 돌린다.
    ## 템플릿이 없으면(showpy 폴더를 뺐으면) 런처 원래 흐름 그대로.
    if pygaki_can_new():
        config.label_overrides["new_project"] = "pygaki_new_project"

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


## 버튼 동작은 label에서 한다 (안내 창을 띄우려면 화면 동작 밖이어야 함)
label pygaki_open:
    $ pygaki_open()
    jump front_page


## 새 프로젝트 만들기: 런처의 new_project와 같은 순서이고, 템플릿 고르기만 "기본 (Vanilla)" / "Pygaki"로 바꿈.
## (config.label_overrides로 런처의 [+ Create New Project]가 여기로 온다)
label pygaki_new_project:

    if persistent.projects_directory is None:
        call choose_projects_directory

    if persistent.projects_directory is None:
        $ interface.error(_("The projects directory could not be set. Giving up."))

    python:
        new_project_language = __("{#language name and font}")

        ## 사용자가 따로 둔 다른 템플릿도 그대로 고를 수 있게 뒤에 붙인다 (showpy 자신은 "Pygaki"로 이미 있음)
        pygaki_others = [
            ( ("new_template_project", p.path), p.name)
            for p in project.manager.templates
            if os.path.normcase(os.path.abspath(p.path)) != os.path.normcase(os.path.abspath(PYGAKI_TEMPLATE))
        ]

        gui_kind, gui_template_path = interface.choice(
            KO("어떤 프로젝트를 만들까요?"),
            [
                ( ("new_gui_project", None), KO("기본 (Vanilla): 렌파이 원래 새 프로젝트") ),
                ( ("new_template_project", PYGAKI_TEMPLATE), KO("Pygaki: showpy가 들어 있는 1280x720 한국어 프로젝트") ),
            ] + pygaki_others,
            ("new_template_project", PYGAKI_TEMPLATE),
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
