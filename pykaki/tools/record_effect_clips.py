"""등장 효과 견본 영상 만들기.

효과마다 렌파이에서 예시 대사를 재생하며 화면을 찍고, 대사창 부분만 잘라 public/effects/<효과>.webm으로 만든다.
PyKaki 글자 효과 칸의 "렌파이 견본"이 이 영상을 보여 준다.
showpy에 효과를 새로 넣으면 이 스크립트를 다시 돌린다.

    python tools/record_effect_clips.py
    python tools/record_effect_clips.py scatter melt      # 몇 개만

필요한 것: 렌파이 SDK, ffmpeg(libvpx-vp9), showpy 저장소, 대사창 그림이 있는 시험 프로젝트.
경로는 아래 값이나 같은 이름의 환경 변수로 바꾼다.
"""
import os
import re
import shutil
import subprocess
import sys
import tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
PYKAKI = os.path.dirname(HERE)
SDK = os.environ.get("RENPY_SDK", r"F:\SHOWPY\renpy-8.5.3-sdk")
SHOWPY = os.environ.get("SHOWPY_DIR", os.path.join(os.path.dirname(PYKAKI), "showpy"))
BASE = os.environ.get("BASE_GAME", r"F:\Dropbox\1_DEV\RENPY\pykaki_sample\game")
OUT = os.path.join(PYKAKI, "public", "effects")

FPS = 15
SECONDS = 2.4
TEXT = "효과 미리보기 Sample 글자"
## 대사창 글자 부분 (1280x720 게임 기준): 너비, 높이, 왼쪽, 위
CROP = "880:90:230:578"

PROBE = """
define e = Character("미나")
init python:
    import os
    _FX = os.environ["FX"]
    _CPS = float(os.environ["CPS"]) if os.environ.get("CPS") else None
    _OUT = os.environ["SHOTS"]
    _N = [0]
    def _snap():
        renpy.screenshot(os.path.join(_OUT, "f%03d.png" % _N[0]))
        _N[0] += 1
        if _N[0] >= {frames}:
            renpy.quit()

screen _clip():
    timer {step} repeat True action Function(_snap, _update_screens=False)

label before_main_menu:
    show screen _clip
    e "{text}" (effect=_FX, cps=_CPS, size=40)
    return
"""


def effects_from_pykaki():
    """셰이더 파일(PyKaki 렌파이 내장 효과, showpy text_effects.glsl)의 효과 목록과, 글자/초 기본값을 쓰는 효과(@cps)."""
    names, typed = [], set()
    for path in (os.path.join(PYKAKI, "src", "fx", "renpy_textshaders.glsl"), os.path.join(SHOWPY, "game", "ui_kit", "engine", "text_effects.glsl")):
        cur = None
        for line in open(path, encoding="utf-8"):
            m = re.match(r"@effect (\w+)", line)
            if m:
                cur = m.group(1)
                names.append(cur)
            elif line.strip() == "@cps" and cur:
                typed.add(cur)
    cps = re.search(r"DEFAULT_CPS = (\d+)", open(os.path.join(PYKAKI, "src", "stage.ts"), encoding="utf-8").read()).group(1)
    return names, typed, cps


def make_project(tmp):
    game = os.path.join(tmp, "game")
    os.makedirs(game)
    for n in ("gui", "gui.rpy", "options.rpy", "screens.rpy", "SourceHanSansLite.ttf"):
        src = os.path.join(BASE, n)
        if os.path.isdir(src):
            shutil.copytree(src, os.path.join(game, n))
        elif os.path.exists(src):
            shutil.copy(src, game)
    ## 화면 효과(VHS 덮개 등)가 섞이지 않게 ui_kit만 넣는다
    shutil.copytree(os.path.join(SHOWPY, "game", "ui_kit"), os.path.join(game, "ui_kit"))
    with open(os.path.join(game, "clip_probe.rpy"), "w", encoding="utf-8") as f:
        f.write(PROBE.replace("{frames}", str(int(FPS * SECONDS))).replace("{step}", "%.4f" % (1.0 / FPS)).replace("{text}", TEXT))
    for root, _dirs, files in os.walk(game):
        for n in files:
            if n.endswith(".rpyc"):
                os.remove(os.path.join(root, n))
    return tmp


def record(tmp, fx, cps):
    shots = os.path.join(tmp, "shots_" + fx)
    os.makedirs(shots)
    env = dict(os.environ, FX=fx, CPS=cps or "", SHOTS=shots)
    subprocess.run([os.path.join(SDK, "renpy.exe"), tmp], env=env, timeout=60,
                   stdin=subprocess.DEVNULL, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    if not os.listdir(shots):
        tb = os.path.join(tmp, "traceback.txt")
        raise RuntimeError("{}: 화면을 찍지 못했어요. {}".format(fx, open(tb, encoding="utf-8").read()[:600] if os.path.exists(tb) else ""))
    out = os.path.join(OUT, fx + ".webm")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", os.path.join(shots, "f%03d.png"),
                    "-vf", "crop={},scale=480:-2".format(CROP), "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", "42",
                    "-pix_fmt", "yuv420p", "-an", out], check=True)
    return os.path.getsize(out)


def main():
    names, typed, default_cps = effects_from_pykaki()
    only = sys.argv[1:]
    if only:
        names = [n for n in names if n in only]
    os.makedirs(OUT, exist_ok=True)
    tmp = make_project(tempfile.mkdtemp(prefix="pykaki_clips_"))
    total = 0
    try:
        for fx in names:
            size = record(tmp, fx, default_cps if fx in typed else None)
            total += size
            print("{:12} {:6.1f} KB".format(fx, size / 1024))
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    print("모두 {}개, {:.1f} KB → {}".format(len(names), total / 1024, OUT))


if __name__ == "__main__":
    main()
