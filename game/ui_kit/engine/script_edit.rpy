################################################################################
## UI Kit — 원고 쓰기 도구
##
## 이 파일은 고칠 필요가 없습니다.
##
## 편집기에서 대사·선택지 한 줄을 고친 값을 원고(.rpy)의 그 줄에 직접 적어 넣습니다.
## 대사·선택지 줄의 괄호 (x=…, size=…) 부분만 바꾸고, 나머지 글자는
## 한 글자도 건드리지 않습니다.
## show / hide / scene 줄은 이미지 이름, at 절, with 절만 바꿉니다. (이미지/영상 탭)
## 고른 줄 위나 아래에 새 줄을 넣을 수도 있습니다. (3.0. 화면 효과 줄, 새 show 줄)
##
## 안전장치
##   1. 고치기 전에 그 줄이 지금 게임이 읽은 내용과 같은지 확인합니다.
##      (대사·선택지 글이 다르면 줄 번호가 밀린 것이므로 쓰지 않습니다.)
##   2. 편집을 시작한 뒤 다른 프로그램에서 그 줄을 고쳤으면 쓰지 않습니다.
##   3. 여러 줄에 걸친 대사, 다음 줄로 이어지는 괄호처럼 애매한 줄은
##      고치지 않습니다. (편집기의 Ctrl+C 복사로 대신합니다.)
##   4. 고치기 전 원본을 프로젝트 폴더의 ui_kit_backup/에 남깁니다.
##   5. 들여쓰기, 줄바꿈 문자(\r\n), UTF-8 BOM을 그대로 둡니다.
##
## 개발 모드(런처에서 실행)에서만 동작합니다.
################################################################################

init -19 python in script_edit:

    import ast
    import os
    import re
    import time

    import store

    BACKUP_DIR = "ui_kit_backup"     # 프로젝트 폴더(game의 바로 위) 기준
    BACKUP_KEEP = 30                 # 원고 파일 하나당 남길 백업 수

    ## 편집 종류
    SAY = "say"         # e "대사" (x=…)
    CHOICE = "choice"   # "선택지" (x=…) if 조건:
    MENU = "menu"       # menu 이름 (x=…):

    class LineError(Exception):
        """이 줄은 자동으로 고칠 수 없음. 메시지는 편집기에 그대로 보여줍니다."""
        pass

    ## ── 한 줄을 조각으로 나누기 ──────────────────────────────────────────────
    ## 문자열과 괄호 묶음은 통째로 한 조각입니다. 그래서 대사 안의 ( 나 #,
    ## 괄호 안의 문자열은 잘못 읽히지 않습니다.

    class Tok(store.python_object):

        def __init__(self, kind, start, end, text):
            self.kind = kind        # "str", "group", "word", "punct", "space", "comment"
            self.start = start
            self.end = end
            self.text = text

        def __repr__(self):
            return "Tok({}, {!r})".format(self.kind, self.text)

    _CLOSE = { "(": ")", "[": "]", "{": "}" }
    _WORD = re.compile(r"[^\s\"'`()\[\]{}#:=,]+")

    def _scan_string(line, i):
        """line[i]에서 시작하는 문자열의 끝 위치(다음 글자)."""
        q = line[i]
        n = len(line)
        triple = line.startswith(q * 3, i)
        quote = q * 3 if triple else q
        j = i + len(quote)

        while j < n:
            c = line[j]
            if c == "\\":
                j += 2
                continue
            if line.startswith(quote, j):
                return j + len(quote)
            j += 1

        raise LineError("대사나 선택지 글이 다음 줄로 이어집니다.")

    def _scan_group(line, i):
        """line[i]의 여는 괄호에 맞는 닫는 괄호 다음 위치."""
        stack = [ _CLOSE[line[i]] ]
        j = i + 1
        n = len(line)

        while j < n:
            c = line[j]
            if c in "\"'`":
                j = _scan_string(line, j)
                continue
            if c == "#":
                break
            if c in _CLOSE:
                stack.append(_CLOSE[c])
            elif c in ")]}":
                if c != stack[-1]:
                    raise LineError("괄호 짝이 맞지 않습니다.")
                stack.pop()
                if not stack:
                    return j + 1
            j += 1

        raise LineError("괄호가 다음 줄로 이어집니다.")

    def tokenize(line):
        rv = [ ]
        i = 0
        n = len(line)

        while i < n:
            c = line[i]

            if c.isspace():
                j = i
                while j < n and line[j].isspace():
                    j += 1
                rv.append(Tok("space", i, j, line[i:j]))
                i = j
            elif c == "#":
                rv.append(Tok("comment", i, n, line[i:]))
                break
            elif c in "\"'`" or (c == "r" and line[i + 1:i + 2] in ("\"", "'", "`")):
                ## r"..." 는 렌파이의 원문 그대로 문자열
                j = _scan_string(line, i + 1 if c == "r" else i)
                rv.append(Tok("str", i, j, line[i:j]))
                i = j
            elif c in _CLOSE:
                j = _scan_group(line, i)
                rv.append(Tok("group", i, j, line[i:j]))
                i = j
            elif c in ")]}":
                raise LineError("괄호 짝이 맞지 않습니다.")
            else:
                m = _WORD.match(line, i)
                if m and m.end() > i:
                    rv.append(Tok("word", i, m.end(), m.group(0)))
                    i = m.end()
                else:
                    rv.append(Tok("punct", i, i + 1, c))
                    i += 1

        code = [ t for t in rv if t.kind not in ("space", "comment") ]
        if code and code[-1].kind in ("punct", "word") and code[-1].text.endswith("\\"):
            raise LineError("줄이 다음 줄로 이어집니다.")

        return rv

    ## ── 문자열 값 비교 ───────────────────────────────────────────────────────

    def _norm(s):
        return re.sub(r"\s+", " ", s).strip()

    def _dequote(m):
        c = m.group(1)
        if c == "{":
            return "{{"
        elif c == "[":
            return "[["
        elif c == "%":
            return "%%"
        elif c == "n":
            return "\n"
        elif c[0] == "u":
            if m.group(2):
                return chr(int(m.group(2), 16))
            return c
        return c

    def string_value(text):
        """원고의 문자열 조각 → 렌파이가 읽은 글자 (renpy/lexer.py의 string()과 같은 규칙).
        읽을 수 없으면 None."""
        raw = text.startswith("r")
        if raw:
            text = text[1:]

        q = text[:1]
        if text.startswith(q * 3) and len(text) >= 6:
            ## 한 줄짜리 세 겹 따옴표. 규칙이 조금 달라서 파이썬 방식으로 읽습니다.
            try:
                v = ast.literal_eval(text)
            except Exception:
                return None
            return v if isinstance(v, str) else None

        s = text[1:-1]
        if raw:
            return s
        s = re.sub(r"[ \n]+", " ", s)
        return re.sub(r"\\(u([0-9a-fA-F]{1,4})|.)", _dequote, s)

    def same_text(tok, expect):
        """원고의 문자열 조각이 게임이 읽은 글(expect)과 같은지."""
        v = string_value(tok.text)
        if v is None:
            return False
        if v == expect:
            return True
        ## 혹시 모를 공백 처리 차이는 같은 것으로 봅니다.
        return _norm(v) == _norm(expect)

    ## ── 괄호 자리 찾기 ───────────────────────────────────────────────────────

    def _code(toks):
        return [ (k, t) for k, t in enumerate(toks) if t.kind not in ("space", "comment") ]

    def _next_code(toks, k):
        for j in range(k + 1, len(toks)):
            if toks[j].kind not in ("space", "comment"):
                return j
        return None

    def _is_args(tok):
        return tok is not None and tok.kind == "group" and tok.text.startswith("(")

    def _ends_with_colon(code):
        return bool(code) and code[-1][1].kind == "punct" and code[-1][1].text == ":"

    def locate(line, kind):
        """(괄호를 붙일 대상 조각 번호, 지금 괄호 조각 번호 또는 None, 조각 목록)."""
        toks = tokenize(line)
        code = _code(toks)

        if not code:
            raise LineError("빈 줄입니다.")

        if kind == SAY:
            strs = [ k for k, t in code if t.kind == "str" ]
            if not strs:
                raise LineError("대사 줄이 아닙니다.")
            if _ends_with_colon(code):
                raise LineError("대사 줄이 아닙니다. (끝이 ':')")
            ## 문자열 바로 뒤에 오는 첫 ( … ) 가 괄호. 없으면 마지막 문자열 뒤에 붙입니다.
            for k in strs:
                j = _next_code(toks, k)
                if j is not None and _is_args(toks[j]):
                    return k, j, toks
            return strs[-1], None, toks

        if kind == CHOICE:
            if not _ends_with_colon(code):
                raise LineError("선택지 줄이 아닙니다. (끝에 ':'가 없음)")
            k, first = code[0]
            if first.kind != "str":
                raise LineError("선택지 줄이 아닙니다.")
            j = _next_code(toks, k)
            return k, (j if _is_args(toks[j]) else None), toks

        if kind == MENU:
            if not _ends_with_colon(code):
                raise LineError("menu 줄이 아닙니다. (끝에 ':'가 없음)")
            k, first = code[0]
            if first.kind != "word" or first.text != "menu":
                raise LineError("menu 줄이 아닙니다.")
            j = _next_code(toks, k)
            if toks[j].kind == "word":          # menu 이름
                k = j
                j = _next_code(toks, k)
            return k, (j if _is_args(toks[j]) else None), toks

        raise LineError("모르는 편집 종류: {}".format(kind))

    ## ── 한 줄 고치기 ─────────────────────────────────────────────────────────

    def rewrite(line, kind, args, expect=None):
        """line(줄바꿈 없이)의 괄호를 args(괄호 안에 들어갈 글자 목록)로 바꾼 새 줄.
        args가 비었으면 괄호를 지웁니다. expect가 있으면 대사·선택지 글이
        그것과 같을 때만 고칩니다."""

        k, g, toks = locate(line, kind)
        target = toks[k]

        if expect is not None and kind in (SAY, CHOICE) and not same_text(target, expect):
            raise LineError("원고의 이 줄이 게임이 읽은 내용과 다릅니다. (줄 번호가 밀렸을 수 있음)")

        inside = ", ".join(a.strip() for a in args if a and a.strip())
        group = "(" + inside + ")" if inside else ""

        if g is not None:
            old = toks[g]
            if group:
                return line[:old.start] + group + line[old.end:]
            ## 괄호를 지울 때는 앞의 공백도 같이 (단, 뒤에 붙을 글자와는 한 칸 띄움)
            start = target.end
            rest = line[old.end:]
            if rest[:1] not in ("", ":", " ", "\t"):
                rest = " " + rest
            return line[:start] + rest

        if not group:
            return line

        return line[:target.end] + " " + group + line[target.end:]

    ## ── show / hide / scene 줄 (이미지/영상 탭) ────────────────────────────────
    ## 괄호 대신 at 절과 with 절만 바꿉니다. 이미지 이름, onlayer, as, zorder,
    ## behind, 줄 끝의 ':'(ATL 블록)과 주석은 그대로 둡니다.
    ##     show eileen happy at left with dissolve
    ##     show eileen happy at stage.pos(420, 720), shake with Dissolve(1.0)
    ##     hide eileen with stage.ease("outright", 0.8)

    SHOW = "show"
    HIDE = "hide"
    SCENE = "scene"
    IMAGE_KINDS = (SHOW, HIDE, SCENE)

    ## 새 줄 넣기 (ui_kit 3.0)
    ##   INSERT        고른 줄 바로 위에 넣음
    ##   INSERT_AFTER  고른 줄 바로 아래에 넣음 (줄 끝이 ':'이면 그 아래 들여쓴 묶음 다음)
    ## args = {"lines": [새 줄, …] (앞 공백 없이), "replace": (머리 글자, …)}
    ##   replace: 넣을 자리 바로 옆에 이 글자로 시작하는 줄이 이어져 있으면 지우고 새 줄로 바꿈
    ##            (같은 자리에 두 번 넣지 않도록. 새 줄이 빈 목록이면 지우기만 함)
    ## expect  = 고른 줄의 내용 (앞뒤 공백 빼고 같은지 확인)
    INSERT = "insert"
    INSERT_AFTER = "insert_after"
    INSERT_KINDS = (INSERT, INSERT_AFTER)

    CLAUSE_WORDS = ("onlayer", "at", "as", "zorder", "behind", "with")

    ## show 다음에 오면 이미지가 아닌 것
    _NOT_IMAGE = ("screen", "layer", "expression", "image", "text")

    class ImageLine(store.python_object):
        """show/hide/scene 줄을 읽은 결과.
            name      : 이미지 이름 낱말 목록
            name_end  : 이름이 끝나는 글자 위치
            clauses   : 절 이름 → (시작, 끝, 내용 글자)   (시작 = 절 이름의 첫 글자)
            at        : at 식 목록 (없으면 None)
            with_     : with 식 (없으면 None)
            tail      : 새 절을 덧붙일 위치 (줄 끝 ':' 앞, 또는 마지막 글자 뒤)"""

        def __init__(self):
            self.name = [ ]
            self.name_start = 0
            self.name_end = 0
            self.clauses = { }
            self.at = None
            self.with_ = None
            self.tail = 0

    def parse_image_line(line, kind):
        toks = tokenize(line)
        code = _code(toks)

        if not code or code[0][1].kind != "word" or code[0][1].text != kind:
            raise LineError("{} 줄이 아닙니다.".format(kind))

        rv = ImageLine()

        ## 줄 끝의 ':' (ATL 블록)
        end = len(code)
        if _ends_with_colon(code):
            end -= 1
            rv.tail = code[end][1].start
            while rv.tail > 0 and line[rv.tail - 1] in " \t":
                rv.tail -= 1
        else:
            rv.tail = code[-1][1].end

        i = 1

        ## 이미지 이름
        while i < end:
            t = code[i][1]
            if t.kind == "word" and t.text in CLAUSE_WORDS:
                break
            if t.kind != "word":
                raise LineError("이미지 이름을 읽을 수 없습니다.")
            if not rv.name:
                rv.name_start = t.start
            rv.name.append(t.text)
            rv.name_end = t.end
            i += 1

        if not rv.name:
            if kind == SCENE:
                raise LineError("그림 없는 scene 줄입니다.")
            raise LineError("이미지 이름이 없습니다.")
        if rv.name[0] in _NOT_IMAGE:
            raise LineError("{} {} 줄은 고칠 수 없습니다.".format(kind, rv.name[0]))

        ## 절
        while i < end:
            t = code[i][1]
            if not (t.kind == "word" and t.text in CLAUSE_WORDS):
                raise LineError("읽을 수 없는 부분이 있습니다: " + t.text)
            word = t.text
            if word in rv.clauses:
                raise LineError("{} 절이 두 번 있습니다.".format(word))
            j = i + 1
            while j < end and not (code[j][1].kind == "word" and code[j][1].text in CLAUSE_WORDS):
                j += 1
            body = [ tk for _k, tk in code[i + 1:j] ]
            if not body:
                raise LineError("{} 뒤가 비어 있습니다.".format(word))
            rv.clauses[word] = (t.start, body[-1].end, line[body[0].start:body[-1].end])

            if word == "at":
                items = [ ]
                cur = [ ]
                for tk in body:
                    if tk.kind == "punct" and tk.text == ",":
                        if cur:
                            items.append(line[cur[0].start:cur[-1].end])
                        cur = [ ]
                    else:
                        cur.append(tk)
                if cur:
                    items.append(line[cur[0].start:cur[-1].end])
                rv.at = items
            elif word == "with":
                rv.with_ = line[body[0].start:body[-1].end]

            i = j

        return rv

    def rewrite_image(line, kind, spec, expect=None):
        """show/hide/scene 줄의 이미지 이름, at 절, with 절을 바꾼 새 줄.
            spec : {"at": [식…] 또는 None(그대로), "with": 식, "" (지우기) 또는 None(그대로),
                    "name": 새 이미지 이름 글자 (예: "ghost angry") 또는 None(그대로)}
            expect : 이미지 이름 낱말 튜플 (게임이 읽은 것과 같은지 확인)"""

        info = parse_image_line(line, kind)

        if expect is not None and tuple(info.name) != tuple(expect):
            raise LineError("원고의 이 줄이 게임이 읽은 내용과 다릅니다. (줄 번호가 밀렸을 수 있음)")

        reps = [ ]      # (위치, 순서, 끝, 새 글자)

        def change(word, new, insert_at, order):
            if word in info.clauses:
                s, e, _old = info.clauses[word]
                if new:
                    reps.append((s, order, e, new))
                else:
                    ## 절을 지울 때는 앞의 공백도 같이
                    while s > 0 and line[s - 1] in " \t":
                        s -= 1
                    reps.append((s, order, e, ""))
            elif new:
                reps.append((insert_at, order, insert_at, " " + new))

        at = spec.get("at")
        if at is not None:
            if kind == HIDE:
                raise LineError("hide 줄에는 위치를 적을 수 없습니다.")
            items = [ a.strip() for a in at if a and a.strip() ]
            change("at", ("at " + ", ".join(items)) if items else "", info.name_end, 0)

        w = spec.get("with")
        if w is not None:
            change("with", ("with " + w.strip()) if w.strip() else "", info.tail, 1)

        nm = spec.get("name")
        if nm is not None:
            words = nm.split()
            if not words or any(not re.match(r"^[^\s\"'#:,()\[\]{}]+$", w) for w in words):
                raise LineError("이미지 이름 {!r}를 쓸 수 없습니다.".format(nm))
            if words[0] in _NOT_IMAGE or words[0] in CLAUSE_WORDS:
                raise LineError("이미지 이름 {!r}를 쓸 수 없습니다.".format(nm))
            reps.append((info.name_start, -1, info.name_end, " ".join(words)))

        ## 뒤에서부터 바꿔야 앞의 위치가 밀리지 않습니다. (같은 위치면 with를 먼저 → at이 앞에 옴)
        out = line
        for s, _o, e, new in sorted(reps, key=lambda r: (r[0], r[1]), reverse=True):
            out = out[:s] + new + out[e:]
        return out

    def image_line_text(line, kind, spec):
        """원고에 쓰지 못할 때 복사해 줄 새 줄 (앞 공백 없이). 읽을 수 없으면 None."""
        try:
            return rewrite_image(line, kind, spec).strip()
        except LineError:
            return None

    ## ── 파일 ─────────────────────────────────────────────────────────────────

    def enabled():
        return bool(store.config.developer) and not (store.renpy.android or store.renpy.ios or store.renpy.emscripten)

    def resolve(filename):
        """렌파이가 알려주는 파일 이름(game/script.rpy 등) → 실제 경로. 없으면 None."""
        fn = filename.replace("\\", "/")
        if fn.endswith(".rpyc"):
            fn = fn[:-1]
        if not fn.endswith(".rpy"):
            return None

        cands = [ ]
        try:
            import renpy.lexer
            cands.append(renpy.lexer.unelide_filename(fn))     # 렌파이가 원고를 찾는 방법
        except Exception:
            pass
        if os.path.isabs(fn):
            cands.append(fn)
        else:
            cands.append(os.path.join(store.config.basedir, fn))
            cands.append(os.path.join(store.config.gamedir, fn))
        for p in cands:
            if os.path.isfile(p):
                return os.path.normpath(p)
        return None

    def _read(path):
        with open(path, "rb") as f:
            data = f.read()
        bom = data.startswith(b"\xef\xbb\xbf")
        if bom:
            data = data[3:]
        return bom, data.decode("utf-8").splitlines(True)

    def _split_eol(raw):
        body = raw.rstrip("\r\n")
        return body, raw[len(body):]

    def read_line(filename, linenumber):
        """원고의 그 줄 (줄바꿈 없이). 못 읽으면 None."""
        path = resolve(filename)
        if path is None:
            return None
        try:
            _bom, lines = _read(path)
        except Exception:
            return None
        if not (1 <= linenumber <= len(lines)):
            return None
        return _split_eol(lines[linenumber - 1])[0]

    ## label 안에 있지 않은 문장 (init, define, screen …) 은 줄 넣기 목록에 넣지 않습니다.
    _SKIP_NODES = ("Init", "Define", "Default", "Image", "Transform", "Screen", "Style",
                   "Testcase", "EndTranslate", "TranslateBlock", "TranslateEarlyBlock",
                   "TranslatePython", "RPY")

    def label_lines(filename):
        """그 원고 파일에서 label 안에 있는 문장의 줄 [(줄 번호, 문장)] (줄 순서).
        이 줄들 위·아래에는 새 줄을 넣어도 됩니다. (ui_kit 3.0)"""
        import renpy
        script = renpy.game.script
        found = { }

        def walk(block, depth=0):
            if depth > 40:
                return
            for n in block or ():
                cls = type(n).__name__
                if cls == "Translate":
                    walk(getattr(n, "block", None), depth + 1)
                    continue
                if cls == "Label":
                    walk(getattr(n, "block", None), depth + 1)
                    continue
                if cls in _SKIP_NODES:
                    continue
                if getattr(n, "filename", None) == filename and n.linenumber not in found:
                    found[n.linenumber] = n
                if cls == "If":
                    for _c, b in getattr(n, "entries", ()):
                        walk(b, depth + 1)
                elif cls == "While":
                    walk(getattr(n, "block", None), depth + 1)
                elif cls == "Menu":
                    for item in getattr(n, "items", ()):
                        if len(item) >= 3 and item[2]:
                            walk(item[2], depth + 1)

        for n in list(script.namemap.values()):
            if type(n).__name__ == "Label" and getattr(n, "filename", None) == filename:
                walk(n.block)

        return sorted(found.items(), key=lambda i: i[0])

    def find_choice_line(filename, menu_line, block_line):
        """menu 문(menu_line) 안에서, 그 선택지의 내용 첫 줄(block_line) 바로 위에 있는
        선택지 줄 번호. 렌파이는 선택지마다 줄 번호를 따로 기록하지 않아서 원고를 읽어
        찾습니다. (찾은 줄의 선택지 글은 쓰기 전에 한 번 더 확인합니다) 못 찾으면 None."""
        path = resolve(filename)
        if path is None:
            return None
        try:
            _bom, lines = _read(path)
        except Exception:
            return None
        if not (1 <= menu_line <= len(lines)):
            return None

        def indent(s):
            return len(s) - len(s.lstrip(" "))

        base = indent(_split_eol(lines[menu_line - 1])[0])
        child = None
        best = None

        for n in range(menu_line + 1, min(block_line, len(lines)) + 1):
            s = _split_eol(lines[n - 1])[0]
            t = s.strip()
            if not t or t.startswith("#"):
                continue
            ind = indent(s)
            if ind <= base:
                break
            if child is None:
                child = ind
            if ind == child:
                best = n

        return best

    def _write_bytes(path, data):
        """다른 프로그램(Dropbox 등)이 잠깐 잡고 있으면 몇 번 다시 시도합니다."""
        last = None
        tmp = path + ".ui_kit_tmp"
        for _i in range(8):
            try:
                with open(tmp, "wb") as f:
                    f.write(data)
                os.replace(tmp, path)
                return
            except Exception as e:
                last = e
                time.sleep(0.25)
        try:
            os.remove(tmp)
        except Exception:
            pass
        raise last

    def _backup(path, data):
        root = os.path.join(store.config.basedir, BACKUP_DIR)
        rel = os.path.relpath(path, store.config.basedir).replace("\\", "/")
        stem = rel.replace("/", "__")
        os.makedirs(root, exist_ok=True)

        name = "{}.{}.bak".format(stem, time.strftime("%Y%m%d-%H%M%S"))
        dest = os.path.join(root, name)
        k = 1
        while os.path.exists(dest):
            k += 1
            dest = os.path.join(root, "{}.{}-{}.bak".format(stem, time.strftime("%Y%m%d-%H%M%S"), k))
        with open(dest, "wb") as f:
            f.write(data)

        olds = sorted(fn for fn in os.listdir(root) if fn.startswith(stem + ".") and fn.endswith(".bak"))
        for fn in olds[:-BACKUP_KEEP]:
            try:
                os.remove(os.path.join(root, fn))
            except Exception:
                pass

        return dest

    ## ── 편집 시작 때의 줄 기억 ───────────────────────────────────────────────
    ## 편집기가 그 줄을 처음 고치기 시작할 때 remember()를 부르면,
    ## 저장할 때 그사이 다른 프로그램이 그 줄을 바꿨는지 확인합니다.

    _original = { }     # (실제 경로, 줄) -> 줄 내용

    def remember(filename, linenumber):
        path = resolve(filename)
        if path is None:
            return
        key = (path, linenumber)
        if key not in _original:
            text = read_line(filename, linenumber)
            if text is not None:
                _original[key] = text

    def forget(filename=None, linenumber=None):
        if filename is None:
            _original.clear()
            return
        _original.pop((resolve(filename), linenumber), None)

    ## ── PyKaki가 만든 원고 (3.2) ─────────────────────────────────────────────
    ## 이 원고는 PyKaki에서 다시 내보내면 덮어써집니다. 그래서
    ##   - 대사 글자와 모양, 선택지, 화면 효과 줄은 저장하지 않습니다. (PyKaki에서 고침)
    ##   - 그림, 영상, 소리 줄과 대사 위치는 원고에 쓰고, showpy_inbox.json에도 적어 둡니다.
    ##     PyKaki가 그 파일을 받아 적으므로 다시 내보내도 사라지지 않습니다.
    ## 형식은 문서 docs/LINK.md에 있습니다.

    PYKAKI_MARK = "# PyKaki가 만든 파일이에요."
    INBOX_FILE = "showpy_inbox.json"
    MEDIA_HEADS = ("show", "scene", "hide", "play", "stop")
    _PK_BLOCK = "PyKaki가 만든 원고라 저장하지 않았습니다. 대사 글자와 모양, 선택지, 화면 효과는 PyKaki에서 고치세요."
    _PK_OLD = "이 줄의 표시가 없습니다. PyKaki에서 showpy 연결을 켜고 다시 내보내세요."

    _pk_cache = { }     # 실제 경로 -> (수정 시각, PyKaki 원고인지)
    _pk_seq = [ 0 ]

    def _pk_lines(lines):
        return any(l.startswith(PYKAKI_MARK) for l in lines[:5])

    def is_pykaki(filename):
        """PyKaki가 내보낸 원고인지 (파일 머리의 표시로 알아봅니다)."""
        path = resolve(filename)
        if path is None:
            return False
        try:
            mt = os.path.getmtime(path)
            c = _pk_cache.get(path)
            if c is None or c[0] != mt:
                c = (mt, _pk_lines(_read(path)[1]))
                _pk_cache[path] = c
            return c[1]
        except Exception:
            return False

    def _pk_mark(lines, n, head):
        """n번째 줄 바로 위 표시 주석의 값."""
        if n < 2 or n - 2 >= len(lines):
            return None
        t = lines[n - 2].strip()
        if t.startswith(head):
            return t[len(head):].strip() or None
        return None

    def box_of(filename, linenumber):
        """그 줄이 들어 있는 PyKaki 상자의 id."""
        path = resolve(filename)
        if path is None:
            return None
        try:
            lines = _read(path)[1]
        except Exception:
            return None
        return _pk_box(lines, linenumber)

    def _pk_box(lines, n):
        for i in range(min(n, len(lines)) - 1, -1, -1):
            t = lines[i].strip()
            if t.startswith("# @node:"):
                w = t[8:].split()
                return w[0] if w else None
        return None

    def _pk_id():
        _pk_seq[0] += 1
        return "sp{:x}{:x}".format(int(time.time() * 1000) & 0xfffffff, _pk_seq[0])

    def _pk_prepare(lines, group):
        """PyKaki 원고에 쓸 수 있는 편집만 남기고, 받아 적을 기록을 붙입니다."""
        rv = [ ]
        for e in group:
            n = e.linenumber
            e.pk_ops = [ ]
            if e.kind in IMAGE_KINDS:
                e.pk_line = _pk_mark(lines, n, "# @l:")
                if e.pk_line is None:
                    e.reason = _PK_OLD
                    continue
            elif e.kind == SAY and getattr(e, "pk_pos", None):
                ## 대사는 위치만 저장합니다. (editor_say.rpy가 pk_pos를 붙임)
                e.pk_line = _pk_mark(lines, n, "# @l:")
                if e.pk_line is None:
                    e.reason = _PK_OLD
                    e.no_copy = True
                    continue
            elif e.kind in INSERT_KINDS and all(t.strip().split(None, 1)[0] in MEDIA_HEADS for t in e.args.get("lines", [ ]) if t.strip()):
                lid = _pk_mark(lines, n, "# @l:")
                if e.kind == INSERT:
                    end = _pk_mark(lines, n, "# @end:")
                    if lid is None and end is None:
                        e.reason = _PK_OLD
                        continue
                    anchor = { "before": lid } if lid else { "end": end }
                    ## 줄 표시와 그 줄이 떨어지지 않게 표시 위에 넣습니다.
                    e.linenumber = n - 1
                    e.expect = None
                else:
                    if lid is None:
                        e.reason = _PK_OLD
                        continue
                    anchor = { "after": lid }
                box = _pk_box(lines, n)
                new = [ ]
                for t in e.args.get("lines", [ ]):
                    if not t.strip():
                        continue
                    i = _pk_id()
                    op = dict(id=i, op="insert", code=t.strip(), box=box)
                    op.update(anchor)
                    e.pk_ops.append(op)
                    new += [ "# @l:" + i, t ]
                    anchor = { "after": i }
                e.args["lines"] = new
                e.args["replace"] = ( )
            else:
                e.reason = _PK_BLOCK
                e.no_copy = True
                continue
            rv.append(e)
        return rv

    def _inbox_path(path):
        return os.path.join(os.path.dirname(path), INBOX_FILE)

    def _inbox_add(path, ops):
        import json
        p = _inbox_path(path)
        data = dict(format="showpy-inbox", version=1, ops=[ ])
        try:
            with open(p, "rb") as f:
                data["ops"] = json.loads(f.read().decode("utf-8")).get("ops", [ ])
        except Exception:
            pass
        data["ops"] += ops
        _write_bytes(p, json.dumps(data, ensure_ascii=False, indent=2).encode("utf-8"))

    def inbox_count(filename):
        """PyKaki가 아직 받아 적지 않은 줄 수."""
        import json
        path = resolve(filename)
        if path is None:
            return 0
        try:
            with open(_inbox_path(path), "rb") as f:
                return len(json.loads(f.read().decode("utf-8")).get("ops", [ ]))
        except Exception:
            return 0

    ## ── 여러 줄 한꺼번에 저장 ────────────────────────────────────────────────

    class Edit(store.python_object):
        """고칠 줄 하나.
            filename, linenumber : 렌파이가 알려주는 위치 (node.filename, node.linenumber)
            kind                 : SAY / CHOICE / MENU / SHOW / HIDE / SCENE
            args                 : 괄호 안에 들어갈 글자 목록. ["x=300", 'color="#a00"']
                                   SHOW / HIDE / SCENE은 {"at": [식…] 또는 None, "with": 식 또는 None}
            expect               : 그 줄의 대사·선택지 글, 또는 이미지 이름 튜플 (확인용, 없으면 None)"""

        def __init__(self, filename, linenumber, kind, args, expect=None):
            self.filename = filename
            self.linenumber = linenumber
            self.kind = kind
            self.args = dict(args) if isinstance(args, dict) else list(args)
            self.expect = expect

            ## apply() 결과
            self.ok = False
            self.changed = False
            self.reason = None
            self.before = None
            self.after = None

        def place(self):
            fn = self.filename.replace("\\", "/")
            if fn.startswith("game/"):
                fn = fn[5:]
            if self.linenumber is None:
                return fn
            return "{} {}번째 줄".format(fn, self.linenumber)

    def apply(edits):
        """편집 목록을 원고에 씁니다. 파일마다 한 번씩 씁니다.
        각 Edit의 ok / changed / reason / before / after에 결과가 들어가고,
        만든 백업 파일 경로 목록을 돌려줍니다. 한 줄이 실패해도 나머지는 씁니다."""

        backups = [ ]

        if not enabled():
            for e in edits:
                e.reason = "개발 모드에서만 원고를 고칠 수 있습니다."
            return backups

        by_file = { }
        for e in edits:
            if e.linenumber is None:
                e.reason = e.reason or "원고에서 그 줄을 찾지 못했습니다."
                continue
            path = resolve(e.filename)
            if path is None:
                e.reason = "원고 파일(.rpy)을 찾을 수 없습니다."
                continue
            by_file.setdefault(path, [ ]).append(e)

        for path, group in by_file.items():
            try:
                bom, lines = _read(path)
            except Exception as ex:
                for e in group:
                    e.reason = "원고를 읽지 못했습니다: {}".format(ex)
                continue

            pk = _pk_lines(lines)
            if pk:
                group = _pk_prepare(lines, group)

            new_lines = list(lines)
            touched = [ ]

            ## 줄 안을 고치는 편집을 먼저 하고, 줄 넣기는 뒤에서 아래 줄부터 (줄 번호가 밀리지 않게)
            inserts = sorted([ e for e in group if e.kind in INSERT_KINDS ], key=lambda e: e.linenumber, reverse=True)

            for e in group:
                if e.kind in INSERT_KINDS:
                    continue
                n = e.linenumber
                if not (1 <= n <= len(lines)):
                    e.reason = "원고에 그 줄이 없습니다. (줄 번호가 밀렸을 수 있음)"
                    continue

                body, eol = _split_eol(new_lines[n - 1])
                e.before = body

                orig = _original.get((path, n))
                if orig is not None and orig != _split_eol(lines[n - 1])[0]:
                    e.reason = "편집하는 동안 다른 프로그램에서 이 줄이 바뀌었습니다."
                    continue

                try:
                    if e.kind in IMAGE_KINDS:
                        out = rewrite_image(body, e.kind, e.args, e.expect)
                    else:
                        out = rewrite(body, e.kind, e.args, e.expect)
                except LineError as ex:
                    e.reason = str(ex)
                    continue

                e.after = out
                e.ok = True
                if out != body:
                    e.changed = True
                    new_lines[n - 1] = out + eol
                    touched.append(e)

            for e in inserts:
                try:
                    if _insert(new_lines, lines, path, e):
                        touched.append(e)
                except LineError as ex:
                    e.reason = str(ex)

            if not touched:
                continue

            old_data = (b"\xef\xbb\xbf" if bom else b"") + "".join(lines).encode("utf-8")
            new_data = (b"\xef\xbb\xbf" if bom else b"") + "".join(new_lines).encode("utf-8")

            try:
                backups.append(_backup(path, old_data))
                _write_bytes(path, new_data)
            except Exception as ex:
                for e in touched:
                    e.ok = False
                    e.changed = False
                    e.reason = "원고를 저장하지 못했습니다: {}".format(ex)
                continue

            if pk:
                ops = [ ]
                for e in touched:
                    if e.kind in INSERT_KINDS:
                        ops += e.pk_ops
                    elif e.kind in IMAGE_KINDS:
                        ops.append(dict(id=_pk_id(), op="replace", line=e.pk_line, code=e.after.strip()))
                    elif e.kind == SAY:
                        ops.append(dict(id=_pk_id(), op="say_pos", line=e.pk_line, pos=e.pk_pos))
                try:
                    _inbox_add(path, ops)
                except Exception as ex:
                    for e in touched:
                        e.note = "PyKaki에 넘길 파일을 쓰지 못했습니다: {}".format(ex)

            for e in touched:
                if e.kind not in INSERT_KINDS:
                    _original[(path, e.linenumber)] = e.after
            if inserts:
                ## 줄이 늘거나 줄었으니 이 파일의 기억은 버림 (다시 불러온 뒤 새로 기억)
                for k in [ k for k in _original if k[0] == path ]:
                    _original.pop(k, None)

        return backups

    def _indent(text):
        return text[:len(text) - len(text.lstrip(" \t"))]

    def _insert(new_lines, lines, path, e):
        """줄 넣기 하나. 바뀌었으면 True."""
        n = e.linenumber
        if not (1 <= n <= len(new_lines)):
            raise LineError("원고에 그 줄이 없습니다. (줄 번호가 밀렸을 수 있음)")

        body, eol = _split_eol(new_lines[n - 1])
        eol = eol or "\n"
        ## 확인은 고치기 전 줄로 (같은 줄의 이름, at, with를 먼저 고쳤을 수 있으므로)
        before = _split_eol(lines[n - 1])[0] if n <= len(lines) else body
        if e.expect is not None and before.strip() != str(e.expect).strip():
            raise LineError("원고의 이 줄이 게임이 읽은 내용과 다릅니다. (줄 번호가 밀렸을 수 있음)")
        orig = _original.get((path, n))
        if orig is not None and orig != _split_eol(lines[n - 1])[0]:
            raise LineError("편집하는 동안 다른 프로그램에서 이 줄이 바뀌었습니다.")

        ind = _indent(body)
        add = [ ind + t.strip() + eol for t in e.args.get("lines", [ ]) if t and t.strip() ]
        heads = tuple(e.args.get("replace", ( )))

        def ours(i):
            if not heads or not (0 <= i < len(new_lines)):
                return False
            t, _eol = _split_eol(new_lines[i])
            return _indent(t) == ind and t.strip().startswith(heads)

        if e.kind == INSERT:
            end = n - 1                  # 넣을 자리 (고른 줄 바로 앞)
            start = end
            while ours(start - 1):
                start -= 1
        else:
            start = n
            if body.rstrip().endswith(":"):
                ## 줄 끝이 ':'이면 아래 들여쓴 묶음(ATL 등) 다음에
                while start < len(new_lines):
                    t, _eol = _split_eol(new_lines[start])
                    if t.strip() and len(_indent(t)) <= len(ind):
                        break
                    start += 1
            end = start
            while ours(end):
                end += 1

        old = new_lines[start:end]
        if [ x.rstrip("\r\n") for x in old ] == [ x.rstrip("\r\n") for x in add ]:
            e.ok = True
            e.before = e.after = "".join(old)
            return False

        new_lines[start:end] = add
        e.before = "".join(x.rstrip("\r\n") + "\n" for x in old)
        e.after = "".join(x.rstrip("\r\n") + "\n" for x in add)
        e.ok = True
        e.changed = True
        return True

    def report(edits):
        """편집기 알림용 짧은 요약."""
        done = [ e for e in edits if e.changed ]
        fail = [ e for e in edits if not e.ok ]
        parts = [ ]
        if done:
            ins = [ e for e in done if e.kind in INSERT_KINDS ]
            if ins:
                parts.append("원고 {}곳을 고쳤습니다. (그중 줄 넣기 {}곳)".format(len(done), len(ins)))
            else:
                parts.append("원고 {}줄을 고쳤습니다.".format(len(done)))
        for e in fail:
            if getattr(e, "no_copy", False):
                parts.append("{}: {}".format(e.place(), e.reason))
            else:
                parts.append("{}: {} → Ctrl+C로 복사해 붙여넣으세요.".format(e.place(), e.reason))
        for e in edits:
            if getattr(e, "note", None):
                parts.append(e.note)
                break
        if not parts:
            parts.append("바뀐 줄이 없습니다.")
        return "\n".join(parts)

    def reload():
        """원고를 고친 뒤 다시 불러오기 (Shift+R과 같음)."""
        store.renpy.reload_script()


init 990 python in script_edit:
    ## 백업 폴더는 배포판에 넣지 않습니다.
    store.build.classify(BACKUP_DIR + "/**", None)
    store.build.classify("game/" + INBOX_FILE, None)
