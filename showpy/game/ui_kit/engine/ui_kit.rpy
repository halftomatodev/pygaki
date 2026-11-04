################################################################################
## UI Kit — 공통 엔진
##
## 이 파일은 고칠 필요가 없습니다. 설정은 플러그인 폴더의 *_config.rpy에서 하세요.
##
## 버전 3.1 · Ren'Py 8.5.3에서 제작
## 설치·설정 방법: 플러그인 폴더의 README.md
##
## 다섯 가지 기능(타이틀 메뉴, 선택지, 커스텀 UI, 대사 스타일, 이미지·영상 배치)이 함께 쓰는
## 계산과 도구를 모아 둔 파일입니다.
################################################################################

init offset = 1

init -20 python in ui_kit:

    import math
    import os
    import re
    import time

    import store
    from store import DictEquality, TransformMatrix, Matrix, Movie, python_object

    VERSION = "3.13"

    ## ── 플러그인 폴더 위치 ──
    ## 이 파일은 <플러그인 폴더>/engine/ui_kit.rpy 에 있습니다.
    ## 설정 파일과 편집기가 저장하는 배치 파일은 <플러그인 폴더>에 있습니다.

    _ENGINE_FILE = store.renpy.get_filename_line()[0].replace("\\", "/")
    ROOT = os.path.dirname(os.path.dirname(_ENGINE_FILE))

    def root_path(filename):
        """플러그인 폴더 안 파일의 실제 경로."""
        rel = os.path.join(ROOT, filename)

        for base in (store.config.basedir, store.config.gamedir):
            if os.path.isdir(os.path.join(base, ROOT)):
                return os.path.join(base, rel)

        return os.path.join(store.config.gamedir, filename)

    def write_text(path, text):
        """파일을 씁니다. 다른 프로그램(Dropbox 등)이 잠깐 잡고 있으면 몇 번 다시 시도합니다."""
        last = None

        for _i in range(8):
            try:
                tmp = path + ".tmp"
                with open(tmp, "w", encoding="utf-8") as f:
                    f.write(text)
                os.replace(tmp, path)
                return
            except Exception as e:
                last = e
                time.sleep(0.25)

        try:
            os.remove(path + ".tmp")
        except Exception:
            pass

        raise last

    ## ── 회전 · 기울기 · 확대를 한 행렬로 ──
    ## 순서: 기울기(글자 자체) → 확대 → 회전. 앵커(가운데)를 중심으로.
    ## rotate: 시계 방향(도), skew: 양수면 윗부분이 오른쪽으로 기울어짐(도).

    def shape_matrix(rotate, skew, zoom):
        r = math.radians(rotate)
        c = math.cos(r)
        s = math.sin(r)
        t = math.tan(math.radians(max(-80.0, min(80.0, skew))))
        z = zoom

        return Matrix([
            z * c, z * (-c * t - s), 0.0, 0.0,
            z * s, z * (c - s * t), 0.0, 0.0,
            0.0, 0.0, 1.0, 0.0,
            0.0, 0.0, 0.0, 1.0,
            ])

    class ShapeMatrix(TransformMatrix, DictEquality):
        """ATL에서 부드럽게 보간되는 회전·기울기·확대 행렬."""
        nargs = 3
        function = staticmethod(shape_matrix)

    ## ── 편집기에서 쓰는 테두리 ──

    class Outline(store.renpy.Displayable, DictEquality):
        """주어진 크기에 맞춰 사각형 테두리를 그립니다. (버튼 foreground로 쓰면 버튼과 같이 회전)"""

        def __init__(self, color="#ff3b8d", width=2, fill=None, **properties):
            super(Outline, self).__init__(**properties)
            self.color = color
            self.width = width
            self.fill = fill

        def render(self, width, height, st, at):
            rv = store.renpy.Render(width, height)
            w = int(width)
            h = int(height)
            t = self.width
            if self.fill:
                rv.blit(store.renpy.render(store.Solid(self.fill), w, h, st, at), (0, 0))
            for (x, y, bw, bh) in ((0, 0, w, t), (0, h - t, w, t), (0, 0, t, h), (w - t, 0, t, h)):
                if bw > 0 and bh > 0:
                    rv.blit(store.renpy.render(store.Solid(self.color), bw, bh, st, at), (x, y))
            return rv

    ## ── 작은 도구들 ──

    def is_style_property(name):
        import renpy.style
        return name in renpy.style.prefixed_all_properties

    def warper(name):
        if callable(name):
            return name
        return getattr(store._warper, name)

    def movie(path, side_mask=True, size=None, loop=True, group=None):
        kw = dict(play=path, side_mask=side_mask, loop=loop)
        if size is not None:
            kw["size"] = tuple(size)
        if group:
            kw["group"] = group
        return Movie(**kw)

    def to_pixels(v, size):
        """정수는 픽셀, 소수는 화면 비율."""
        if isinstance(v, float):
            return v * size
        return v

    def eval_condition(cond):
        if cond is None:
            return True
        if callable(cond):
            return cond()
        return eval(cond, vars(store))

    ## ── 설정 코드로 쓰기 ──

    def format_value(v):
        """값을 렌파이 스크립트에 그대로 붙여넣을 수 있는 글자로."""
        if isinstance(v, bool) or v is None:
            return repr(v)
        if isinstance(v, float):
            v = round(v, 3)
            if v == int(v) and abs(v) < 1e9:
                return "{:.1f}".format(v)
            return repr(v)
        if isinstance(v, int):
            return repr(v)
        if isinstance(v, str):
            return '"' + v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n") + '"'
        if isinstance(v, tuple):
            if len(v) == 1:
                return "(" + format_value(v[0]) + ",)"
            return "(" + ", ".join(format_value(i) for i in v) + ")"
        if isinstance(v, list):
            return "[ " + ", ".join(format_value(i) for i in v) + " ]"
        if isinstance(v, dict):
            return "{ " + ", ".join('{}: {}'.format(format_value(k), format_value(i)) for k, i in v.items()) + " }"
        return repr(v)

    def format_dict_lines(d, order=(), indent="    "):
        """사전을 한 줄에 하나씩."""
        keys = [ k for k in order if k in d ] + sorted(k for k in d if k not in order)
        return [ '{}"{}": {},'.format(indent, k, format_value(d[k])) for k in keys ]

    def file_header(title, note):
        lines = [
            "## " + "─" * 74,
            "## " + title + " (자동 생성)",
            ]
        for n in note:
            lines.append("## " + n)
        lines.append("## 저장 시각: " + time.strftime("%Y-%m-%d %H:%M:%S"))
        lines.append("## " + "─" * 74)
        lines.append("")
        return lines

    ## ── 게임 폴더의 파일 목록 (편집기에서 고를 때) ──

    def _natural_key(s):
        return [ int(t) if t.isdigit() else t.lower() for t in re.split(r"(\d+)", s) ]

    def game_files(exts):
        rv = [ ]
        for fn in store.renpy.list_files():
            low = fn.lower()
            if not low.endswith(exts):
                continue
            if low.startswith(("renpy/", "tl/", "saves/", "cache/")):
                continue
            rv.append(fn)
        return sorted(rv, key=_natural_key)

    def font_files():
        return game_files((".ttf", ".otf", ".ttc"))

    def audio_files():
        return game_files((".ogg", ".opus", ".mp3", ".wav", ".flac"))

    def image_folders():
        """이미지가 2장 이상 들어 있는 폴더 (애니메이션 프레임용)."""
        count = { }
        for fn in game_files((".png", ".webp", ".jpg", ".jpeg", ".avif")):
            d = os.path.dirname(fn)
            count[d] = count.get(d, 0) + 1
        return sorted((d for d, n in count.items() if n >= 2), key=_natural_key)

    def images_in(folder):
        folder = folder.rstrip("/")
        return [ fn for fn in game_files((".png", ".webp", ".jpg", ".jpeg", ".avif"))
                 if os.path.dirname(fn) == folder ]

    def same_file(a, b):
        """경로 표기가 달라도(대소문자, fonts/ 생략) 같은 파일인지."""
        if not a or not b:
            return False
        a = a.replace("\\", "/").lower()
        b = b.replace("\\", "/").lower()
        if a == b:
            return True
        return a.split("/")[-1] == b.split("/")[-1]

    ## ── 색 ──

    def parse_color(s):
        """'#rgb', '#rgba', '#rrggbb', '#rrggbbaa' → (r, g, b, a) 0~255. 실패하면 None."""
        try:
            c = store.Color(s)
            return (int(c[0]), int(c[1]), int(c[2]), int(c[3]))
        except Exception:
            return None

    def color_hex(rgba):
        r, g, b, a = [ max(0, min(255, int(round(i)))) for i in rgba ]
        if a >= 255:
            return "#{:02x}{:02x}{:02x}".format(r, g, b)
        return "#{:02x}{:02x}{:02x}{:02x}".format(r, g, b, a)


init 990 python in ui_kit:
    ## 배포판을 만들 때 플러그인 폴더의 설명서(.md)는 빼고 묶습니다.
    store.build.classify(ROOT + "/**.md", None)
