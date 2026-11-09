"""pygaki 배포 묶음 만들기 (윈도우).

렌파이 SDK + showpy 템플릿 + 런처 버튼 + pygaki 데스크톱 앱을 폴더 하나(와 zip)로 묶는다.
렌파이를 새 버전으로 올릴 때도 새 SDK로 이 스크립트를 다시 돌리면 된다.

    python bundle/make_bundle.py
    python bundle/make_bundle.py --sdk <렌파이 SDK> --app pykaki\\app\\out\\win-unpacked --zip --tag v1.0

두 가지를 만든다 (기본: bundle/out/):
    pygaki[-태그]-renpy-<버전>/   묶음. 풀고 renpy.exe를 켜기만 하면 된다 (렌파이 SDK 포함)
    pygaki[-태그]-addon/          덧붙임. 이미 있는 렌파이 SDK 폴더(renpy.exe가 있는 곳)에 풀어 넣기만 하면 된다
                                  (아래에서 SDK 그대로인 것만 빠지고, pygaki_넣는법.txt가 더해짐)

묶음 안:
    renpy.exe, launcher/ ...          렌파이 SDK 그대로
    launcher/game/pygaki_launcher.rpy  런처 첫 화면의 [pygaki로 편집] [pygaki로 새 프로젝트]
    showpy/                            새 프로젝트 템플릿 (런처처럼 만든 1280x720 한국어 기본 프로젝트 + showpy 플러그인, project.json "template")
    pygaki/app/pygaki.exe              pygaki 데스크톱 앱 (GitHub Actions "pygaki 앱" 결과물을 풀어 둔 폴더)
    pygaki/읽어주세요.txt

필요한 것: 파이썬 3, 렌파이 SDK 폴더, pygaki 앱 폴더(win-unpacked).
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

## 복사하지 않는 것 (컴파일 결과, 개인 배치, 대본, 시험 찌꺼기, 실시간 연결 파일)
SKIP = shutil.ignore_patterns("*.rpyc", "*.rpymc", "*_layout.rpy", "showpy_inbox.json", "pykaki_preview.json",
                              "showpy_live.json", "*.flow.json", "ui_kit_backup", "persistent",
                              "cache", "saves", "__pycache__", "*.bak", "errors.txt", "traceback.txt", "log.txt", "lint.txt",
                              "zz_*", "*_debug.txt", "*.log")

## SDK를 복사할 때 빼는 것 (렌파이가 SDK 폴더에 남기는 것, 시험 찌꺼기)
SDK_SKIP = shutil.ignore_patterns("tmp", "__pycache__", "log.txt", "errors.txt", "traceback.txt",
                                  "zz_*", "*_debug.txt", "*.log", "saves")


def privacy_check(dirs):
    """만든 사람 컴퓨터의 정보(홈 폴더, 저장소·SDK 경로, Dropbox)가 묶음에 들어가지 않았는지 봅니다.
    찾으면 그 파일을 알려 주고 멈춥니다. (내 허락 없이 정보가 밖으로 나가지 않게)"""
    import re
    words = set()
    for w in (os.path.expanduser("~"), ROOT, os.environ.get("RENPY_SDK", "")):
        if w and len(w) > 6:
            words.add(w)
            words.add(w.replace("\\", "/"))
    pats = [ re.compile(re.escape(w).encode("utf-8"), re.I) for w in words ]
    pats.append(re.compile(rb"[A-Za-z]:[\\/]+(Dropbox|Users[\\/]+[^\\/\s\"']+[\\/]+(Downloads|Desktop|Documents|Dropbox))", re.I))
    exts = (".rpy", ".py", ".txt", ".json", ".md", ".cjs", ".js", ".html", ".asar", ".csv", ".ini", ".cfg")
    bad = [ ]
    for d in dirs:
        for base, _ds, fs in os.walk(d):
            for fn in fs:
                if not fn.lower().endswith(exts):
                    continue
                full = os.path.join(base, fn)
                try:
                    data = open(full, "rb").read()
                except OSError:
                    continue
                for pat in pats:
                    m = pat.search(data)
                    if m:
                        bad.append("{}: {}".format(os.path.relpath(full, d), m.group(0)[:80].decode("utf-8", "replace")))
                        break
    if bad:
        sys.exit("묶음에 만든 사람 컴퓨터의 정보가 들어 있어요. 지우고 다시 만들어 주세요:\n  " + "\n  ".join(bad[:40]))

README = """pygaki ({version})

렌파이 {renpy} + showpy {showpy} + pygaki 데스크톱 앱

1. 이 폴더의 renpy.exe로 렌파이 런처를 켭니다.
   (런처가 영어면 preferences → Language → 한국어)
2. 런처 아래쪽의 [pygaki로 새 프로젝트]로 프로젝트를 만듭니다. showpy가 처음부터 들어 있습니다.
   (런처의 원래 [Create New Project]에서 템플릿 "showpy"를 골라도 같습니다)
   VHS 덮개는 처음에는 꺼져 있습니다. 켜려면 game/screen_fx/screen_fx_config.rpy의
   define screen_fx.overlay = False 를 True로 바꿉니다.
3. 왼쪽 목록에서 프로젝트를 고르고 [pygaki로 편집]을 누르면 pygaki 앱이 그 프로젝트로 열립니다.
   위쪽 [대본 편집]에서 대본을 쓰고, [GUI 편집]에서 실행 중인 게임의 화면을 고칩니다.
   - 대본은 프로젝트 폴더 맨 위의 "프로젝트이름.flow.json"에 자동 저장됩니다.
   - Ctrl+E로 game/script_flow.rpy에 내보내면 렌파이가 바로 다시 불러옵니다.
4. [Launch Project]로 게임을 켜면 앱의 [GUI 편집]이 게임에 붙습니다(초록 점).
   앱 없이 게임 안에서 고치려면 Shift+M으로 showpy 편집기를 엽니다.
   편집기에서 넣은 그림, 소리 줄은 대본에 바로 받아 적힙니다.

앱만 따로 켜려면 pygaki\\app\\pygaki.exe (프로젝트 폴더를 고르는 창이 뜹니다).
처음 켤 때 윈도우가 "PC 보호" 창을 띄우면 [추가 정보] → [실행]을 누릅니다 (앱에 서명이 없어서 그렇습니다).

새 버전: https://github.com/halftomatodev/pygaki/releases

라이선스: 렌파이는 MIT (renpy\\LICENSE.txt 등 SDK 안의 파일), showpy와 pygaki 앱은 MIT.
"""

ADDON_README = """pygaki 덧붙임 ({version}) 넣는 법

이미 렌파이 SDK가 있으면 이것만 받아 넣으면 됩니다. (렌파이 {renpy}로 만듦. 렌파이 8이면 대개 됩니다)
렌파이가 없으면 렌파이까지 들어 있는 pygaki-...-renpy-....zip을 받으세요.

1. 렌파이 SDK 폴더(renpy.exe가 있는 폴더)를 엽니다.
2. 이 zip 안의 launcher, showpy, pygaki 세 폴더를 그 폴더에 그대로 끌어 넣습니다.
   "같은 이름의 폴더가 있다"고 물으면 [바꾸기]나 [합치기]를 고릅니다.
   렌파이의 원래 파일은 바뀌지 않고 파일만 더해집니다:
   launcher\\game\\pygaki_launcher.rpy, showpy\\, pygaki\\
3. 런처가 켜져 있었으면 껐다 켭니다. 첫 화면 아래쪽에 [pygaki로 편집] [pygaki로 새 프로젝트]가 생깁니다.

쓰는 법은 pygaki\\읽어주세요.txt를 보세요. 이 파일은 같이 넣어도 되고 지워도 됩니다.

빼려면: launcher\\game\\pygaki_launcher.rpy(와 pygaki_launcher.rpyc), showpy, pygaki 폴더를 지웁니다.
렌파이를 새 버전으로 올리면 새 SDK 폴더에 세 폴더를 다시 넣습니다.
"""

## 덧붙임에 들어가는 것 (SDK 폴더 기준). 나머지는 SDK 그대로
ADDON_PARTS = [os.path.join("launcher", "game", "pygaki_launcher.rpy"), "showpy", "pygaki"]


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
    ap.add_argument("--out", default=os.path.join(HERE, "out"), help="만들 자리 (묶음과 덧붙임 폴더가 여기 생김)")
    ap.add_argument("--zip", action="store_true", help="폴더를 zip으로도 묶는다")
    ap.add_argument("--tag", default="", help="이름에 붙일 판 (예: v1.0)")
    a = ap.parse_args()

    sdk = os.path.abspath(a.sdk)
    if not os.path.exists(os.path.join(sdk, "renpy.exe")) or not os.path.isdir(os.path.join(sdk, "launcher", "game")):
        sys.exit("렌파이 SDK 폴더가 아니에요 (renpy.exe, launcher/game이 없음): " + sdk)
    gui_game = os.path.join(sdk, "gui", "game")
    if not os.path.isdir(gui_game):
        sys.exit("SDK에 gui/game(새 프로젝트 기본 틀)이 없어요: " + gui_game)
    app = os.path.abspath(a.app)
    if not os.path.exists(os.path.join(app, "pygaki.exe")):
        sys.exit("pygaki 앱 폴더가 아니에요 (pygaki.exe가 없음): " + app +
                 "\nGitHub Actions의 'pygaki 앱' 결과물(pygaki-win)을 받아 풀고 --app으로 그 폴더를 주세요.")

    renpy_ver = version_of(os.path.join(sdk, "renpy", "vc_version.py"), r"version\s*=\s*u?['\"](\d+\.\d+\.\d+)", os.path.basename(sdk))
    showpy_ver = version_of(os.path.join(SHOWPY_GAME, "ui_kit", "engine", "ui_kit.rpy"), r'VERSION = "([\d.]+)"')
    outdir = os.path.abspath(a.out)
    prefix = "pygaki" + ("-" + a.tag if a.tag else "")
    out = os.path.join(outdir, prefix + "-renpy-" + renpy_ver)
    addon = os.path.join(outdir, prefix + "-addon")
    for d in (out, addon):
        if os.path.exists(d):
            sys.exit("이미 있어요. 지우고 다시 돌려 주세요: " + d)

    print("1/6 렌파이 SDK 복사 ...")
    shutil.copytree(sdk, out, ignore=SDK_SKIP)

    print("2/6 런처 버튼 넣기 ...")
    shutil.copy(os.path.join(HERE, "launcher", "pygaki_launcher.rpy"), os.path.join(out, "launcher", "game"))

    print("3/6 showpy 템플릿 만들기 ...")
    tdir = os.path.join(out, "showpy")
    make_base_project(out, tdir)
    for name in PLUGINS:
        src = os.path.join(SHOWPY_GAME, name)
        if not os.path.isdir(src):
            sys.exit("showpy 플러그인이 없어요: " + src)
        shutil.copytree(src, os.path.join(tdir, "game", name), ignore=SKIP)
    ## 커서, 클릭 대기 표시(CTC) 샘플 그림 (custom_ui_config.rpy가 가리키는 game/gui/cursor, game/gui/ctc)
    samples = os.path.join(ROOT, "showpy", "samples", "gui")
    if os.path.isdir(samples):
        shutil.copytree(samples, os.path.join(tdir, "game", "gui"), dirs_exist_ok=True)
    for rel, old, new in TEMPLATE_SETTINGS:
        fn = os.path.join(tdir, "game", rel)
        text = open(fn, encoding="utf-8").read()
        if text.count(old) != 1:
            sys.exit("템플릿 설정을 바꾸지 못했어요 ({} 에서 '{}'를 못 찾음). TEMPLATE_SETTINGS를 고쳐 주세요.".format(rel, old))
        with open(fn, "w", encoding="utf-8") as f:
            f.write(text.replace(old, new))
    with open(os.path.join(tdir, "project.json"), "w", encoding="utf-8") as f:
        json.dump({"type": "template"}, f)

    print("4/6 pygaki 앱 넣기 ...")
    shutil.copytree(app, os.path.join(out, "pygaki", "app"))
    with open(os.path.join(out, "pygaki", "읽어주세요.txt"), "w", encoding="utf-8-sig") as f:
        f.write(README.format(version=prefix, renpy=renpy_ver, showpy=showpy_ver).replace("\n", "\r\n"))
    for lic in ("LICENSE",):
        shutil.copy(os.path.join(ROOT, lic), os.path.join(out, "pygaki", "LICENSE-pygaki.txt"))

    ## 템플릿을 만들 때 렌파이가 SDK 폴더에 남긴 것
    shutil.rmtree(os.path.join(out, "tmp"), ignore_errors=True)
    for fn in ("log.txt", "errors.txt", "traceback.txt"):
        if os.path.exists(os.path.join(out, fn)):
            os.remove(os.path.join(out, fn))

    print("5/6 덧붙임 만들기 ...")
    for rel in ADDON_PARTS:
        src, dst = os.path.join(out, rel), os.path.join(addon, rel)
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        if os.path.isdir(src):
            shutil.copytree(src, dst)
        else:
            shutil.copy(src, dst)
    with open(os.path.join(addon, "pygaki_넣는법.txt"), "w", encoding="utf-8-sig") as f:
        f.write(ADDON_README.format(version=prefix, renpy=renpy_ver).replace("\n", "\r\n"))

    print("정보 새는지 검사 ...")
    privacy_check([ os.path.join(out, "showpy"), os.path.join(out, "pygaki"), os.path.join(out, "launcher", "game"), addon ])

    if a.zip:
        print("6/6 zip 만들기 ...")
        ## 묶음 zip은 폴더째, 덧붙임 zip은 안의 것만 (열면 바로 launcher, showpy, pygaki가 보이게)
        print("zip:", shutil.make_archive(out, "zip", outdir, os.path.basename(out)))
        print("zip:", shutil.make_archive(addon, "zip", addon))
    else:
        print("6/6 zip은 건너뜀 (--zip)")
    print("다 됐어요:")
    print("  묶음  ", out)
    print("  덧붙임", addon)


if __name__ == "__main__":
    main()
