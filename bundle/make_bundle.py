"""pygaki 배포 묶음 만들기 (윈도우).

렌파이 SDK + showpy 템플릿 + 런처 버튼 + PyKaki 데스크톱 앱을 폴더 하나(와 zip)로 묶는다.
렌파이를 새 버전으로 올릴 때도 새 SDK로 이 스크립트를 다시 돌리면 된다.

    python bundle/make_bundle.py
    python bundle/make_bundle.py --sdk <렌파이 SDK> --app pykaki\\app\\out\\win-unpacked --zip

만들어지는 것 (기본: bundle/out/pygaki-renpy-<버전>):
    renpy.exe, launcher/ ...          렌파이 SDK 그대로
    launcher/game/pygaki_launcher.rpy  런처 첫 화면의 [PyKaki로 대본 쓰기] [showpy 새 프로젝트]
    showpy/                            새 프로젝트 템플릿 (런처처럼 만든 1280x720 한국어 기본 프로젝트 + showpy 플러그인, project.json "template")
    pygaki/PyKaki/PyKaki.exe           PyKaki 데스크톱 앱 (GitHub Actions "PyKaki 앱" 결과물을 풀어 둔 폴더)
    pygaki/읽어주세요.txt

필요한 것: 파이썬 3, 렌파이 SDK 폴더, PyKaki 앱 폴더(win-unpacked).
"""
import argparse
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SHOWPY_GAME = os.path.join(ROOT, "showpy", "game")

## 템플릿에 넣을 showpy 플러그인. 빼고 싶은 것은 여기서 지운다
PLUGINS = ["ui_kit", "screen_fx", "hotkeys", "splash"]

## 템플릿 기본 프로젝트의 화면 크기와 언어 (런처로 새로 만들 때 고르는 것과 같음)
SIZE = (1280, 720)
LANGUAGE = "korean"

## 템플릿에서만 바꾸는 설정 (파일, 원래 줄, 바꿀 줄). showpy 원본은 그대로 둔다
TEMPLATE_SETTINGS = [
    ## VHS 덮개는 처음에는 끔. 켜려면 새 프로젝트의 screen_fx/screen_fx_config.rpy에서 True로
    ("screen_fx/screen_fx_config.rpy", "define screen_fx.overlay = True",
     "define screen_fx.overlay = False    # pygaki 템플릿: 처음에는 끔. 켜려면 True"),
]

## 복사하지 않는 것 (컴파일 결과, 개인 배치, 시험 찌꺼기)
SKIP = shutil.ignore_patterns("*.rpyc", "*.rpymc", "*_layout.rpy", "showpy_inbox.json", "pykaki_preview.json",
                              "cache", "saves", "__pycache__", "*.bak", "errors.txt", "traceback.txt", "log.txt", "lint.txt")

README = """pygaki ({version})

렌파이 {renpy} + showpy {showpy} + PyKaki 데스크톱 앱

1. 이 폴더의 renpy.exe로 렌파이 런처를 켭니다.
   (런처가 영어면 preferences → Language → 한국어)
2. 런처 아래쪽의 [showpy 새 프로젝트]로 프로젝트를 만듭니다. showpy가 처음부터 들어 있습니다.
   (런처의 원래 [Create New Project]에서 템플릿 "showpy"를 골라도 같습니다)
   VHS 덮개는 처음에는 꺼져 있습니다. 켜려면 game/screen_fx/screen_fx_config.rpy의
   define screen_fx.overlay = False 를 True로 바꿉니다.
3. 왼쪽 목록에서 프로젝트를 고르고 [PyKaki로 대본 쓰기]를 누르면 PyKaki가 그 프로젝트로 열립니다.
   - 대본은 프로젝트 폴더 맨 위의 "프로젝트이름.flow.json"에 자동 저장됩니다.
   - Ctrl+E로 game/script_flow.rpy에 내보내면 렌파이가 바로 다시 불러옵니다.
4. [Launch Project]로 게임을 켜고 Shift+M으로 showpy 편집기를 엽니다.
   편집기에서 넣은 그림, 소리 줄은 PyKaki 대본에 바로 받아 적힙니다.

PyKaki만 따로 켜려면 pygaki\\PyKaki\\PyKaki.exe (프로젝트 폴더를 고르는 창이 뜹니다).

라이선스: 렌파이는 MIT (renpy\\LICENSE.txt 등 SDK 안의 파일), showpy와 PyKaki는 MIT.
"""


def version_of(path, pattern, default="?"):
    try:
        m = re.search(pattern, open(path, encoding="utf-8").read())
        return m.group(1) if m else default
    except OSError:
        return default


def renpy_python(sdk):
    for rel in ("py3-windows-x86_64/python.exe", "py3-linux-x86_64/python", "py3-mac-universal/python"):
        p = os.path.join(sdk, "lib", rel)
        if os.path.exists(p):
            return p
    sys.exit("SDK 안의 파이썬을 찾지 못했어요: " + os.path.join(sdk, "lib"))


def make_base_project(sdk, tdir):
    """런처의 [새 프로젝트 만들기]와 같은 방법으로 그림까지 다 만든 기본 프로젝트를 만든다.

    SDK의 gui/game을 그대로 쓰면 처음 켤 때 그림을 만들다 실패한다(guisupport.rpy).
    런처처럼 generate_gui로 코드와 그림을 만들고, gui_images로 막대, 스크롤바 그림을 마저 만든다.
    """
    py = renpy_python(sdk)
    run = lambda args, env=None: subprocess.run([py, os.path.join(sdk, "renpy.py")] + args, cwd=sdk, check=True,
                                                 env=dict(os.environ, **(env or {})))
    run(["launcher", "generate_gui", tdir, "--start", "--width", str(SIZE[0]), "--height", str(SIZE[1]),
         "--language", LANGUAGE, "--template", os.path.join(sdk, "gui")])
    run([tdir, "gui_images"], {"RENPY_VARIANT": "small phone"})
    run([tdir, "gui_images"])
    for fn in ("log.txt", "errors.txt", "traceback.txt"):
        if os.path.exists(os.path.join(tdir, fn)):
            os.remove(os.path.join(tdir, fn))
    for dn in ("cache", "saves"):
        shutil.rmtree(os.path.join(tdir, "game", dn), ignore_errors=True)
    for dirpath, _, files in os.walk(tdir):
        for fn in files:
            if fn.endswith((".rpyc", ".rpymc")):
                os.remove(os.path.join(dirpath, fn))
    if not os.path.isdir(os.path.join(tdir, "game", "gui", "bar")):
        sys.exit("기본 프로젝트 그림을 만들지 못했어요: " + tdir)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--sdk", default=os.environ.get("RENPY_SDK", r"<렌파이 SDK>"))
    ap.add_argument("--app", default=os.path.join(ROOT, "pykaki", "app", "out", "win-unpacked"))
    ap.add_argument("--out", default=None)
    ap.add_argument("--zip", action="store_true", help="폴더를 zip으로도 묶는다")
    a = ap.parse_args()

    sdk = os.path.abspath(a.sdk)
    if not os.path.exists(os.path.join(sdk, "renpy.exe")) or not os.path.isdir(os.path.join(sdk, "launcher", "game")):
        sys.exit("렌파이 SDK 폴더가 아니에요 (renpy.exe, launcher/game이 없음): " + sdk)
    gui_game = os.path.join(sdk, "gui", "game")
    if not os.path.isdir(gui_game):
        sys.exit("SDK에 gui/game(새 프로젝트 기본 틀)이 없어요: " + gui_game)
    app = os.path.abspath(a.app)
    if not os.path.exists(os.path.join(app, "PyKaki.exe")):
        sys.exit("PyKaki 앱 폴더가 아니에요 (PyKaki.exe가 없음): " + app +
                 "\nGitHub Actions의 'PyKaki 앱' 결과물(PyKaki-win)을 받아 풀고 --app으로 그 폴더를 주세요.")

    renpy_ver = version_of(os.path.join(sdk, "renpy", "vc_version.py"), r"version\s*=\s*u?['\"](\d+\.\d+\.\d+)", os.path.basename(sdk))
    showpy_ver = version_of(os.path.join(SHOWPY_GAME, "ui_kit", "engine", "ui_kit.rpy"), r'VERSION = "([\d.]+)"')
    out = os.path.abspath(a.out or os.path.join(HERE, "out", "pygaki-renpy-" + renpy_ver))
    if os.path.exists(out):
        sys.exit("이미 있어요. 지우고 다시 돌려 주세요: " + out)

    print("1/5 렌파이 SDK 복사 ...")
    shutil.copytree(sdk, out, ignore=shutil.ignore_patterns("tmp", "__pycache__"))

    print("2/5 런처 버튼 넣기 ...")
    shutil.copy(os.path.join(HERE, "launcher", "pygaki_launcher.rpy"), os.path.join(out, "launcher", "game"))

    print("3/5 showpy 템플릿 만들기 ...")
    tdir = os.path.join(out, "showpy")
    make_base_project(out, tdir)
    for name in PLUGINS:
        src = os.path.join(SHOWPY_GAME, name)
        if not os.path.isdir(src):
            sys.exit("showpy 플러그인이 없어요: " + src)
        shutil.copytree(src, os.path.join(tdir, "game", name), ignore=SKIP)
    for rel, old, new in TEMPLATE_SETTINGS:
        fn = os.path.join(tdir, "game", rel)
        text = open(fn, encoding="utf-8").read()
        if text.count(old) != 1:
            sys.exit("템플릿 설정을 바꾸지 못했어요 ({} 에서 '{}'를 못 찾음). TEMPLATE_SETTINGS를 고쳐 주세요.".format(rel, old))
        with open(fn, "w", encoding="utf-8") as f:
            f.write(text.replace(old, new))
    with open(os.path.join(tdir, "project.json"), "w", encoding="utf-8") as f:
        json.dump({"type": "template"}, f)

    print("4/5 PyKaki 앱 넣기 ...")
    shutil.copytree(app, os.path.join(out, "pygaki", "PyKaki"))
    with open(os.path.join(out, "pygaki", "읽어주세요.txt"), "w", encoding="utf-8-sig") as f:
        f.write(README.format(version=os.path.basename(out), renpy=renpy_ver, showpy=showpy_ver).replace("\n", "\r\n"))
    for lic in ("LICENSE",):
        shutil.copy(os.path.join(ROOT, lic), os.path.join(out, "pygaki", "LICENSE-pygaki.txt"))

    if a.zip:
        print("5/5 zip 만들기 ...")
        z = shutil.make_archive(out, "zip", os.path.dirname(out), os.path.basename(out))
        print("zip:", z)
    else:
        print("5/5 zip은 건너뜀 (--zip)")
    print("다 됐어요:", out)


if __name__ == "__main__":
    main()
