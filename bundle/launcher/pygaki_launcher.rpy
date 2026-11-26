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
##                           Pygaki = 해상도만 골라 만든 한국어 프로젝트에 pygaki 플러그인을 얹은 것
##                                    (해상도는 레트로 다섯 GBC·SNES·PC-98·Y2K·Millennial + 고해상도 1280·1920.
##                                     레트로는 game/pixel_perfect.rpy로 화면에 맞는 가장 큰 정수 배율로 키움)
##                                    (강조·배경 색은 고르지 않음. pygaki는 상자를 투명하게 두고 그림을 넣어 쓰므로 렌파이 기본 색으로 둠)
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

    ##.html을 VS Code 같은 편집기가 맡고 있어도 브라우저로 열리게, 윈도우에 정해 둔 기본 브라우저
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
        "screen_fx/engine/tiles.rpy", "screen_fx/tiles_config.rpy",     # v1.6에 포토 콜라주로 바뀜
        "ui_kit/effects/popin.glsl", "ui_kit/effects/drip.glsl",          # v1.4 만드는 중에 지운 효과
        "screen_fx/editor/editor_flow.rpy", "screen_fx/editor/editor_flow.rpyc",     # 줄기표 없앰
    )
    ## pygaki 판 (플러그인 폴더마다 따로 매기지 않고 pygaki 판 하나. 예전 판은 폴더마다 4.19, 5.9 같은 번호였음)
    PYGAKI_VERSION_FILE = "ui_kit/engine/ui_kit.rpy"

    def pygaki_version(gamedir):
        import re
        try:
            with open(os.path.join(gamedir, PYGAKI_VERSION_FILE), "rb") as f:
                m = re.search(br'VERSION\s*=\s*"([^"]+)"', f.read())
            return m.group(1).decode("utf-8") if m else "?"
        except Exception:
            return None

    def pygaki_version_label(v):
        """보일 판 이름. 예전 번호 체계(앞자리 2 이상)는 "예전 판" """
        if v is None:
            return T("없음", "なし", "none")
        try:
            if int(v.split(".")[0]) >= 2:
                return T("예전 판", "旧バージョン", "older version")
        except Exception:
            pass
        return "v" + v

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
        ## 지난 판의.rpyc가 남으면 렌파이가 지운.rpy도 읽으므로 플러그인 폴더의.rpyc는 모두 지운다 (켤 때 다시 생김)
        for plugin in PYGAKI_PLUGINS:
            for root, dirs, files in os.walk(os.path.join(gamedir, plugin)):
                for name in files:
                    if name.endswith((".rpyc", ".rpymc")):
                        os.remove(os.path.join(root, name))
        return len(copy), len(retire), backup

    ## 레트로 가장 작은 해상도(PC-98 640x400)보다 작은 해상도는 지원하지 않는다 (세션 112 사용자 답).
    ## 렌파이 기본 화면(저장·설정)과 pygaki 타이틀·스플래시·편집 화면 글이 들어가지 않음
    PYGAKI_MIN_SIZE = (640, 400)

    def pygaki_number(title, ask, wrong, least):
        small = T("{0}보다 작은 값은 지원하지 않아요 (가장 작은 해상도는 PC-98 640x400).",
                  "{0} より小さい値には対応していません(いちばん小さい解像度は PC-98 640x400)。",
                  "Values smaller than {0} aren't supported (the smallest resolution is PC-98 640x400).").format(least)
        ask = ask + "\n" + T("{0} 이상.", "{0} 以上。", "{0} or more.").format(least)
        while True:
            v = interface.input(title, KO(ask), cancel=Jump("front_page"), allow=interface.DIGITS_LETTERS)
            try:
                v = int(v)
            except Exception:
                interface.error(wrong, label=None)
                continue
            if v >= least:
                return v
            interface.error(KO(small), label=None)

    ## Pygaki 새 프로젝트 해상도: 레트로 다섯(픽셀 퍼펙트) + 고해상도 둘. (값, 이름, 레트로인지)
    ## GBC 160x144, SNES 256x224는 뺌(세션 99): 렌파이 기본 화면과 플러그인 글이 들어가지 않음
    PYGAKI_SIZES = (
        ( (640, 400), "PC-98", True ),
        ( (800, 600), "Y2K", True ),
        ( (1024, 768), "Millennial", True ),
        ( (1280, 720), "HD", False ),
        ( (1920, 1080), "Full HD", False ),
    )
    PYGAKI_DEFAULT_SIZE = (640, 400)

    ## 레트로 해상도 프로젝트에 넣는 game/pixel_perfect.rpy. 사용자 파일이라 [플러그인 올리기]가 건드리지 않는다
    PYGAKI_PIXEL_RPY = (
        '## 픽셀 퍼펙트 (pygaki가 레트로 해상도 새 프로젝트에 넣은 파일)',
        '##',
        '## 작은 해상도(gui.rpy의 gui.init)로 그린 그림을 화면(창)에 들어가는 가장 큰 정수 배율(×2, ×3 ...)로 키웁니다.',
        '## 창 크기를 바꾸거나 전체 화면으로 바꾸면 그때마다 알아서 다시 맞추고, 남는 곳은 검은 띠로 둡니다.',
        '## 그림은 흐리게 늘이지 않고 각진 픽셀 그대로 키웁니다 (nearest neighbor).',
        '## 그림·영상·셰이더·글자, 확대·회전한 것까지 게임 화면 전체를 이 해상도의 픽셀 격자로 다시 뽑습니다(pixel_perfect_snap).',
        '## 그래서 큰 영상을 넣거나 그림을 1.5배로 키워도 화면에는 이 해상도의 픽셀로만 보입니다.',
        '## pygaki 편집 화면(F9)은 맨 위 층이라 여기서 빠지고 선명하게 그립니다.',
        '## 처음 켤 때 창은 모니터에 들어가는 가장 큰 정수 배율 크기로 엽니다 (그 뒤로는 렌파이가 마지막 창 크기를 기억함).',
        '## 환경설정 [창 화면]도 그 크기로 돌아갑니다 (전체 화면에서 창으로 돌아올 때).',
        '##',
        '## 끄려면 pixel_perfect를 False로 바꿉니다. 정수 배율은 두고 격자로 다시 뽑기만 끄려면 pixel_perfect_snap을 False로.',
        '',
        'init python:',
        '',
        '    pixel_perfect = True',
        '    pixel_perfect_snap = True',
        '',
        '    ## 지금 배율 (창 크기가 바뀔 때마다 새로 정해짐. pygaki 편집 화면도 이 값을 봄)',
        '    pixel_perfect_scale = 1',
        '',
        '    def pixel_perfect_view(width, height):',
        '        global pixel_perfect_scale',
        '        sw, sh = config.screen_width, config.screen_height',
        '        m = int(min(width / sw, height / sh))',
        '        if m < 1:',
        '            ## 창이 원래 크기보다 작으면 비율만 맞춰 줄인다',
        '            pixel_perfect_scale = 1',
        '            f = min(width / sw, height / sh)',
        '            return (max(1, int(sw * f)), max(1, int(sh * f)))',
        '        pixel_perfect_scale = m',
        '        return (m * sw, m * sh)',
        '',
        '    ## 화면이 준비된 뒤 첫 상호작용에서 (켤 때마다) 한 번',
        '    def pixel_perfect_first_window():',
        '        if config.physical_width or renpy.display.draw is None:',
        '            return',
        '        mw, mh = renpy.get_renderer_info().get("max_window_size", (0, 0))',
        '        m = int(min(mw / config.screen_width, mh / config.screen_height))',
        '        if m < 1:',
        '            return',
        '        w, h = config.screen_width * m, config.screen_height * m',
        '        ## 환경설정 [창 화면]이 돌아가는 "기본 창 크기"도 이 크기로 (전체 화면에서 돌아와도 작아지지 않게)',
        '        config.physical_width, config.physical_height = w, h',
        '        if persistent._pixel_perfect_window or preferences.fullscreen:',
        '            return',
        '        persistent._pixel_perfect_window = True',
        '        renpy.set_physical_size((w, h))',
        '        pixel_perfect_center_window(w, h)',
        '',
        '    ## 키운 창을 그 모니터의 쓸 수 있는 곳(작업 표시줄 뺌) 가운데로. 창이 아래로 삐져나가지 않게',
        '    def pixel_perfect_center_window(w, h):',
        '        try:',
        '            import pygame_sdl2',
        '            d = pygame_sdl2.display',
        '            x0, y0 = d.get_position()',
        '            areas = list(d.get_usable_display_bounds())',
        '            area = areas[0]',
        '            for a in areas:',
        '                if a[0] <= x0 < a[0] + a[2] and a[1] <= y0 < a[1] + a[3]:',
        '                    area = a',
        '            bx, by, bw, bh = area',
        '            title = 32',
        '            x = bx + max(0, (bw - w) // 2)',
        '            y = by + title + max(0, (bh - h - title) // 2)',
        '            d.set_position((x, y))',
        '        except Exception:',
        '            pass',
        '',
        '    if pixel_perfect:',
        '        config.nearest_neighbor = True',
        '        config.adjust_view_size = pixel_perfect_view',
        '        config.interact_callbacks.append(pixel_perfect_first_window)',
        '',
        '    ## 게임 층 전체(config.layers. 편집 화면 같은 맨 위 층은 빠짐)를 한 장으로 그린 뒤 픽셀 가운데 값만 집는 셰이더',
        '    _pp_args = { "glsl": 100 } if hasattr(renpy.config, "glsl_version") else { }',
        '    renpy.register_shader("pygaki.pixel_snap", variables="""',
        '        uniform sampler2D tex0;',
        '        uniform vec2 u_pp_grid;',
        '        uniform float u_lod_bias;',
        '        attribute vec2 a_tex_coord;',
        '        varying vec2 v_tex_coord;',
        '    """, vertex_200="""',
        '        v_tex_coord = a_tex_coord;',
        '    """, fragment_300="""',
        '        gl_FragColor = texture2D(tex0, (floor(v_tex_coord * u_pp_grid) + 0.5) / u_pp_grid, u_lod_bias);',
        '    """, **_pp_args)',
        '',
        '## 화면 효과(screen_fx) 같은 플러그인이 덧씌운 것보다 바깥에 오도록 늦게 붙인다',
        'init 1500 python:',
        '    if pixel_perfect and pixel_perfect_snap:',
        '        config.layer_transforms[None] = list(config.layer_transforms.get(None, [ ])) + [',
        '            Transform(mesh=True, shader="pygaki.pixel_snap", u_pp_grid=(float(config.screen_width), float(config.screen_height))),',
        '            ]',
    )

    def pygaki_add_pixel_perfect(gamedir):
        path = os.path.join(gamedir, "pixel_perfect.rpy")
        if not os.path.exists(path):
            with open(path, "wb") as f:
                f.write(("\r\n".join(PYGAKI_PIXEL_RPY) + "\r\n").encode("utf-8"))

    ## ── 새 프로젝트의 글꼴과 작은 해상도 맞추기 (세션 99, 101) ──
    ## 모든 Pygaki 새 프로젝트에 한글 픽셀 글꼴 갈무리(Galmuri, OFL) 세트를 game/fonts에 넣는다.
    ## 레트로(픽셀 퍼펙트) 해상도는 갈무리9를 기본 글꼴로 쓴다. 갈무리는 글꼴 단위 100이 1픽셀이라
    ## 원래 크기(갈무리7 8px, 9 10px, 11 12px, 14 15px)의 정수배가 아니면 픽셀이 격자에서 어긋나 깨진다 → 10px의 배수만 쓴다.
    ## 렌파이가 만든 gui.rpy는 글 크기를 해상도에 비례해 줄여 퀵메뉴·저장 칸 글이 7~9px로 못 읽힌다.
    ## pygaki 플러그인 설정은 1280x720 기준 픽셀이다. 둘 다 새 프로젝트를 만들 때 한 번 맞춘다(사용자 파일, 나중에 고쳐도 됨).
    PYGAKI_FONTS = os.path.join(config.renpy_base, "pygaki", "fonts")
    PYGAKI_FONT_FILES = (
        "Galmuri7.ttf", "Galmuri9.ttf", "Galmuri11.ttf", "Galmuri11-Bold.ttf", "Galmuri11-Condensed.ttf", "Galmuri14.ttf",
        "GalmuriMono7.ttf", "GalmuriMono9.ttf", "GalmuriMono11.ttf", "Galmuri-OFL.txt",
    )
    PYGAKI_PIXEL_FONT = "fonts/Galmuri9.ttf"
    PYGAKI_PIXEL_UNIT = 10
    PYGAKI_MIN_TEXT = 12
    ## 렌파이가 1280x720으로 만든 gui.rpy의 글 크기
    PYGAKI_GUI_720 = { "text_size": 22, "name_text_size": 30, "interface_text_size": 22, "label_text_size": 24,
        "notify_text_size": 16, "title_text_size": 50, "quick_button_text_size": 14, "slot_button_text_size": 14 }

    def pygaki_fonts_ok():
        return all(os.path.exists(os.path.join(PYGAKI_FONTS, n)) for n in PYGAKI_FONT_FILES)

    def pygaki_add_fonts(gamedir):
        """갈무리 세트를 game/fonts에 (있는 파일은 그대로)"""
        if not pygaki_fonts_ok():
            return False
        fd = os.path.join(gamedir, "fonts")
        if not os.path.isdir(fd):
            os.makedirs(fd)
        for n in PYGAKI_FONT_FILES:
            if not os.path.exists(os.path.join(fd, n)):
                shutil.copy(os.path.join(PYGAKI_FONTS, n), os.path.join(fd, n))
        return True

    def pygaki_pixel_snap(s):
        """픽셀 글꼴 크기: 갈무리9 원래 크기(10px)의 배수 가운데 가장 가까운 것"""
        return max(1, int(s / float(PYGAKI_PIXEL_UNIT) + 0.5)) * PYGAKI_PIXEL_UNIT

    def pygaki_small_size(v, height, pixel):
        """1280x720 기준 글 크기 v를 이 높이에 맞게. 픽셀 글꼴이면 10px의 배수"""
        k = height / 720.0
        if pixel:
            return pygaki_pixel_snap(v * k)
        return max(PYGAKI_MIN_TEXT, int(round(v * k)))

    def pygaki_small_len(v, height):
        return max(1, int(round(v * height / 720.0)))

    def pygaki_edit(path, fn):
        if not os.path.exists(path):
            return
        with open(path, "rb") as f:
            text = f.read().decode("utf-8")
        new = fn(text)
        if new != text:
            with open(path, "wb") as f:
                f.write(new.encode("utf-8"))

    def pygaki_fit_small(gamedir, width, height, retro=False):
        import re
        ## 1. 갈무리 세트 복사 (모든 새 프로젝트). 레트로면 갈무리9를 기본 글꼴로
        pixel = pygaki_add_fonts(gamedir) and retro
        if height == 720 and not pixel:
            return
        ## 대사를 어디에나 놓는 캐릭터 t의 창 높이는 화면 높이 (1280x720 기준 720)
        if height != 720:
            pygaki_edit(os.path.join(gamedir, "ui_kit", "say_style_config.rpy"),
                lambda text: re.sub(r"\bwindow_ysize=720\b", "window_ysize={}".format(height), text))
        if height > 720 and not pixel:
            return

        ## 2. gui.rpy: 글꼴, 글 크기 (픽셀 글꼴은 10px 배수로, 아니면 렌파이가 줄인 값이 너무 작을 때 올림)
        def gui(text):
            def put(text, name, value):
                return re.sub(r"(?m)^(define gui\." + name + r" = ).*$", lambda m: m.group(1) + value, text, count=1)
            if pixel:
                for name in ("text_font", "name_text_font", "interface_text_font"):
                    text = put(text, name, repr(PYGAKI_PIXEL_FONT).replace("'", '"'))
                ## 글 크기를 10px 배수로. 렌파이는 폭 비율로 줄여서(800x600 대사 14px) 1280x720 값을 높이 비율로 줄인 것을 쓴다
                def size(m):
                    v = PYGAKI_GUI_720.get(m.group(2))
                    s = v * height / 720.0 if v else int(m.group(3))
                    return m.group(1) + str(pygaki_pixel_snap(s))
                text = re.sub(r"(?m)^(define gui\.(\w*text_size) = )(\d+)\s*$", size, text)
            else:
                for name in ("text_size", "name_text_size", "interface_text_size", "label_text_size", "notify_text_size",
                        "quick_button_text_size", "slot_button_text_size"):
                    m = re.search(r"(?m)^define gui\." + name + r" = (\d+)\s*$", text)
                    if m and int(m.group(1)) < PYGAKI_MIN_TEXT:
                        text = put(text, name, str(PYGAKI_MIN_TEXT))
            return text
        pygaki_edit(os.path.join(gamedir, "gui.rpy"), gui)

        ## 3. 플러그인 설정의 1280x720 기준 숫자 (자리는 화면 비율이라 그대로)
        def sizes(text, keys):
            text = re.sub(r'("(?:' + "|".join(keys) + r')"\s*:\s*)(\d+)', lambda m: m.group(1) + str(pygaki_small_size(int(m.group(2)), height, pixel)), text)
            return re.sub(r'\b((?:' + "|".join(keys) + r')=)(\d+)', lambda m: m.group(1) + str(pygaki_small_size(int(m.group(2)), height, pixel)), text)

        def lens(text, keys):
            text = re.sub(r'("(?:' + "|".join(keys) + r')"\s*:\s*)(\d+)', lambda m: m.group(1) + str(pygaki_small_len(int(m.group(2)), height)), text)
            return re.sub(r'\b((?:' + "|".join(keys) + r')=)(\d+)', lambda m: m.group(1) + str(pygaki_small_len(int(m.group(2)), height)), text)

        def title(text):
            if pixel:
                ## 타이틀 글은 갈무리9 두 배(20px) 아래로 내리지 않는다. 템플릿이 아래 항목을 일부러 줄여 둬서(36·28·24)
                ## 그대로 줄이면 PC-98 [종료하기]만 10px가 됨 (세션 112)
                least = 2 * PYGAKI_PIXEL_UNIT
                text = re.sub(r'("size"\s*:\s*)(\d+)', lambda m: m.group(1) + str(max(least, pygaki_small_size(int(m.group(2)), height, True))), text)
            else:
                text = sizes(text, ("size",))
            if pixel:
                ## 픽셀 글꼴을 조금 돌리면 격자에 걸려 글자가 삐뚤빼뚤해진다
                text = re.sub(r'("(?:rotate|hover_rotate)"\s*:\s*)-?\d+(?:\.\d+)?', lambda m: m.group(1) + "0", text)
            text = re.sub(r"(?m)^(define tmenu\.game_menu_gap = )(\d+)", lambda m: m.group(1) + str(pygaki_small_len(int(m.group(2)), height)), text)
            return re.sub(r"(?m)^(define tmenu\.intro_offset = \()(-?\d+)", lambda m: m.group(1) + str(-pygaki_small_len(abs(int(m.group(2))), height)), text)

        def splash(text):
            text = sizes(text, ("title_size", "body_size", "key_size", "desc_size", "prompt_size", "option_size"))
            return lens(text, ("width", "spacing", "key_width", "keys_spacing", "body_line_spacing"))

        def say(text):
            text = sizes(text, ("what_size",))
            return lens(text, ("what_xpos", "what_ypos", "tail_size", "tail_width"))

        pygaki_edit(os.path.join(gamedir, "ui_kit", "title_menu_config.rpy"), title)
        pygaki_edit(os.path.join(gamedir, "splash", "splash_config.rpy"), splash)
        pygaki_edit(os.path.join(gamedir, "ui_kit", "say_style_config.rpy"), say)

    if "pygaki_buttons" not in config.overlay_screens:
        config.overlay_screens.append("pygaki_buttons")


## 런처 첫 화면에만 보이는 버튼 줄 (아래쪽 링크 줄 바로 위)
screen pygaki_buttons():

    zorder 101

    if renpy.get_screen("front_page"):

        ## 아래 링크 줄([매뉴얼]...)과 같은 왼쪽에서 시작. 가운데 정렬이면 일본어에서 오른쪽 [프로젝트 실행]과 겹침 (세션 104)
        hbox:
            xpos 30
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

        pygaki_old = pygaki_version(p.gamedir)
        pygaki_new = pygaki_version(os.path.join(PYGAKI_TEMPLATE, "game"))
        pygaki_lines = "pygaki  {} → {}".format(pygaki_version_label(pygaki_old), pygaki_version_label(pygaki_new))
        pygaki_same = pygaki_old == pygaki_new
        if pygaki_same:
            pygaki_head = T("판이 같아요. 그래도 다시 넣을까요?", "バージョンは同じです。それでも入れ直しますか?", "The versions are the same. Put them in again anyway?")
        else:
            pygaki_head = T("이 프로젝트의 pygaki 플러그인을 새 판으로 바꿀까요?", "このプロジェクトの pygaki プラグインを新しいバージョンにしますか?", "Update this project's pygaki plugins to the new version?")
        pygaki_note = L(
            "엔진·편집기 파일만 바꾸고, 설정(*_config.rpy)과 게임 안 pygaki editor에서 저장한 값(*_layout.rpy)은 그대로 둬요. 바꾸기 전 것은 프로젝트 폴더의 ui_kit_backup/plugins에 남아요. 게임을 끄고 해 주세요.",
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


## Pygaki 새 프로젝트: 런처의 new_gui_project(해상도 → 색 → 만들기)에서 색 고르기만 빼고 한국어 프로젝트를 만들고,
## 그 위에 템플릿의 플러그인을 얹는다. 문구는 런처 것을 그대로 써서 런처 언어를 따라간다.
label pygaki_gui_project:

    python:
        ## 레트로(작게 그려 화면에 맞는 가장 큰 정수 배율로 키움) 다섯과 고해상도 둘을 한 목록에서 고른다
        default_size = PYGAKI_DEFAULT_SIZE
        gui_size = interface.choice(
            L("레트로 해상도를 선택할 경우 현재 화면 크기에 맞게 정수 배율(픽셀 퍼펙트)로 확대됩니다.",
              "レトロ解像度を選ぶと、今の画面の大きさに合わせて整数倍(ピクセルパーフェクト)で拡大されます。",
              "Retro resolutions are scaled up by whole numbers to fit the current screen size (pixel perfect)."),
            ## 글꼴에 없는 기호(가운뎃점 등)는 네모로 깨지므로 쓰지 않는다 (세션 97 사용자 사진)
            [ ( s, KO("{0} {1}x{2}{3}".format(n, s[0], s[1], " (retro)" if r else "")) ) for s, n, r in PYGAKI_SIZES ]
            + [ ( "custom", L("사용자 정의", "カスタム", "Custom") ) ],
            default_size,
            cancel=Jump("front_page"),
        )

        pygaki_pixel = gui_size == "custom" or any(s == gui_size and r for s, n, r in PYGAKI_SIZES)

        if gui_size == "custom":
            gui_size = (
                pygaki_number(_("WIDTH"), _("Please enter the width of your game, in pixels."), _("The width must be a number."), PYGAKI_MIN_SIZE[0]),
                pygaki_number(_("HEIGHT"), _("Please enter the height of your game, in pixels."), _("The height must be a number."), PYGAKI_MIN_SIZE[1]),
            )

    ## 강조·배경 색은 고르지 않는다 (pygaki는 상자를 투명하게 두고 사용자가 그림을 넣어 씀). 렌파이 런처의 기본 색
    $ gui_color = (DARK_COLORS[0], "#000000", False)

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
            if pygaki_pixel:
                pygaki_add_pixel_perfect(project.current.gamedir)
            pygaki_fit_small(project.current.gamedir, width, height, pygaki_pixel)

    jump front_page
