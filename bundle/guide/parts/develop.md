# 직접 고치기

pygaki를 내 게임에 맞게 고치거나, 기능을 더하거나, 고친 것을 다른 사람과 나누려는 사람을 위한 장입니다. 설정 값만 바꾸려면 "플러그인 커스텀 가이드" 장으로 충분하고, 이 장은 코드와 효과 파일을 직접 고칠 때 봅니다.

## 저장소 둘러보기

저장소 하나에 두 프로그램과 묶는 도구가 같이 있습니다.

| 자리 | 무엇 |
| --- | --- |
| `pykaki/` | PyKaki 대본 편집기의 화면(React + TypeScript). `src/`가 코드, `docs/GUIDE.md`가 앱의 [도움말](이 안내서의 "PyKaki로 대본 쓰기" 장), `docs/SPEC.md`가 구조 설명 |
| `pykaki/app/` | 데스크톱 앱(Electron). 화면은 `pykaki/`를 빌드한 것을 그대로 씁니다 |
| `showpy/game/` | pygaki 플러그인. `ui_kit`, `screen_fx`, `hotkeys`, `splash` 네 폴더를 게임의 `game/`에 넣어 씁니다 |
| `showpy/game/ui_kit/effects/` | 효과 폴더. 글자 등장 효과와 그림 전환이 `.glsl` 파일 하나에 하나씩 |
| `showpy/docs/` | 플러그인 문서: `READ_ME_FIRST.md`(먼저 읽기), `CUSTOM_GUIDE.md`(이 안내서의 "플러그인 커스텀 가이드" 장), `SPEC.md`(구조), `DEV_RULES.md`(작업 규칙) |
| `docs/LINK.md` | 두 프로그램이 서로 맞추는 형식(대본 파일, 원고의 표시, 실시간 연결, 효과 파일) |
| `bundle/` | 렌파이 SDK + 플러그인 + 앱을 윈도우용 묶음으로 만드는 스크립트, 런처 버튼, 이 안내서(`guide/`) |

이 안내서도 저장소 문서에서 만들어집니다. "PyKaki로 대본 쓰기"는 `pykaki/docs/GUIDE.md`, "플러그인 커스텀 가이드"는 `showpy/docs/CUSTOM_GUIDE.md`를 그대로 읽고, 나머지 장은 `bundle/guide/parts/`의 글, "효과 견본"은 효과 파일과 견본 영상에서 만듭니다. 고친 뒤 `python bundle/guide/build_guide.py`를 돌리면 `bundle/guide/pygaki_안내서.html`이 다시 생기고, 묶음을 만들 때도 저절로 다시 만들어 넣습니다.

## 준비

* **렌파이 SDK 8.5.3**: 플러그인을 시험하고 Lint를 돌립니다. pygaki 묶음을 받았다면 그 폴더가 SDK입니다.
* **Node.js**(PyKaki를 고칠 때): `pykaki/`와 `pykaki/app/`에서 `npm ci`를 한 번 합니다.
* **Python 3**(묶음을 만들 때): `bundle/make_bundle.py`를 돌립니다.
* 시험용 렌파이 프로젝트를 하나 만들어 둡니다(런처의 새 프로젝트 → Pygaki). 진짜 게임에서 바로 고치지 않습니다.

## 플러그인 고치기

1. 저장소의 `showpy/game/` 아래 파일을 고칩니다.
2. 시험 프로젝트의 `game/`에 그 폴더를 복사하고 **`.rpyc` 파일을 지웁니다.** 남아 있으면 지운 코드가 계속 실행됩니다. 시험 프로젝트에서 저장한 `*_layout.rpy`(편집기에서 저장한 값)는 지우지 않아도 됩니다.
3. 런처에서 **Lint**를 돌리고, 게임을 켜서 화면을 봅니다. 오류가 나면 프로젝트 폴더의 `traceback.txt`, `errors.txt`, `log.txt`를 읽습니다.
4. 플러그인은 따로 넣어도 돌아야 합니다. `ui_kit` 없이 `screen_fx`만, `screen_fx` 없이 `ui_kit`만 넣고도 Lint를 돌려 봅니다.

지킬 것:

* 사용자가 고치는 값은 `*_config.rpy`에 두고, 엔진(`engine/`, `editor/`)은 그 값을 읽기만 합니다.
* `init` 숫자와 파일의 `init offset`을 더한 값이 -999~999 안에 들어야 합니다(`init 999`는 1000이 되어 Lint 경고).
* 화면에 보이는 글자에 `·`(가운뎃점), `≡`를 쓰지 않습니다. 렌파이 기본 한글 글꼴에 없어서 네모로 나옵니다. 화면 글자의 `[`는 `[[`로 적습니다.
* 셰이더의 색은 투명도를 곱한 값입니다. 색을 바꿀 때는 `rgb / a`로 풀고 `vec4(col * a, a)`로 내보냅니다.
* 인터넷에서 받은 셰이더나 코드는 라이선스를 보고, 그대로 가져오지 말고 모양만 참고해서 새로 씁니다(GPL 코드는 가져오지 않습니다).
* 판을 올릴 때는 엔진의 `VERSION`, 그 폴더 `README.md`, `showpy/docs/` 문서, `showpy/CHANGELOG.md`를 같이 고칩니다.

## 효과 하나 더하기 (효과 폴더)

글자 등장 효과나 그림 전환은 코드를 고치지 않고 **`ui_kit/effects/`에 `.glsl` 파일 하나를 더하는 것**으로 넣습니다. 파일을 넣고 게임을 껐다 켜면 렌파이의 `effect="이름"`, `img_fx.use("이름")`과 PyKaki의 목록에 저절로 생깁니다. 파일을 지우면 없어지고, 그 이름을 쓴 원고는 멈추지 않고 기본 모양으로 돕니다. 앱 [효과] 화면에서는 목록에서 숨기기만 합니다.

파일은 `@`로 시작하는 표시 줄과 들여 쓴 GLSL 코드로 되어 있습니다.

| 표시 | 뜻 |
| --- | --- |
| `@effect 이름 한글이름` | 글자 등장 효과의 시작 |
| `@transition 이름 한글이름` | 그림 전환의 시작 |
| `@time 초` | 그림 전환에 걸리는 시간의 기본값 |
| `@set u__이름 값` | 값의 기본값. 원고에서 바꿈(`img_fx.use("bands", count=10)`, `effect="이름:u__이름=값"`) |
| `@param u__이름 최소 최대 한글이름` | PyKaki 막대의 범위와 이름 |
| `@variables` | uniform 줄 |
| `@fragment` | 점마다 색을 정하는 코드 |

그림 전환의 `@fragment`에서는 `l__t`(진행 0→1), `l__uv`(점의 자리 0~1), `l__size`(가로 세로 픽셀), `l__old`(앞 그림 색), `l__new`(새 그림 색)를 쓰고, 다른 자리는 `texture2D(tex0, 자리)`(앞 그림), `texture2D(tex1, 자리)`(새 그림)로 읽습니다. 끝에 `gl_FragColor`에 색을 넣습니다. 셰이더 전환에 쓰는 그림 전환은 `@set u__cut 값`(0~1)으로 화면 셰이더가 바뀌는 때를 정합니다.

폴더에 들어 있는 효과(글자 `maskup`, `tracking`, `sweep`, `backbox`, `karaoke`, `meltglitch`, `droplets`, 그림 `irisin`, `bands`, `pixelsort`, `datamosh`, `slide`, `mosaic`, `blinds`, `static`, `calibrate`, `tapestretch`, `blink`, `pushup`)가 본보기입니다. 자세한 형식과 AI에게 새 효과를 부탁할 때 쓸 요청문은 `ui_kit/effects/README.md`에 있습니다. 글자 효과의 기본 효과는 `ui_kit/engine/text_effects.glsl` 한 파일에 있고, PyKaki도 빌드할 때 이 파일을 그대로 가져가서 렌파이와 같은 모양으로 그립니다.

## 화면 셰이더 하나 더하기

화면 셰이더도 효과처럼 **셰이더 하나에 파일 둘**로 따로 모여 있어서, 새 셰이더를 넣을 때 화면 효과 엔진 전체(`screen_fx/engine/screen_fx.rpy`)는 고치지 않습니다. 셰이더 코드와 값 목록이 든 `screen_fx/engine/<이름>.rpy`, 사용자가 고치는 값이 든 `screen_fx/<이름>_config.rpy` 두 파일만 더합니다. `screen_fx/README.md` 12장의 견본(흑백 `mono`) 두 파일을 새 이름으로 저장하고, 안의 `mono`를 새 이름으로 바꾼 뒤 값 목록(`PARAMS`), 막대(`GROUPS`), 셰이더 코드를 고칩니다. 빼려면 그 두 파일을 지우고(`.rpyc`까지), 지우지 않고 고르는 목록에서만 감추려면 `screen_fx/shaders_off.txt`에 이름을 적습니다. 효과 폴더의 `.glsl` 하나보다는 적을 것이 많습니다(값 목록과 막대를 파이썬으로 적음). `screen_fx.register_shader`로 등록하면 `$ screen_fx.use("이름")`, 대사 괄호 `(fx="이름")`, GUI 편집기 화면 효과 탭, PyKaki 셰이더 목록에 저절로 나옵니다. 세부 값의 막대(`PARAMS`, `GROUPS`)를 고쳤으면 시험 프로젝트에서 Lint를 한 번 돌려 `screen_fx/shader_list.json`을 다시 만들고, 저장소의 같은 자리에 복사한 뒤 PyKaki를 다시 빌드합니다.

## PyKaki 고치기

```bash
cd pykaki && npm ci            # 처음 한 번
cd pykaki && npm run dev       # 개발 서버 http://localhost:5173 (예제 대본, 렌파이 프로젝트는 못 엶)
cd pykaki && npx tsc --noEmit  # 타입 검사
cd pykaki && npm run build     # pykaki/dist/index.html 한 파일
cd pykaki/app && npm ci && npm start -- --project "렌파이 프로젝트 폴더"   # 데스크톱 앱으로 켜기
cd pykaki/app && npm run dist  # 윈도우 앱 폴더 (pykaki/app/out/win-unpacked)
```

* 화면을 고친 뒤에는 `npx tsc --noEmit`과 `npm run build`를 돌립니다. 앱은 빌드한 화면을 복사해서 씁니다.
* 새 글자 효과를 넣으면 견본 영상(`pykaki/public/effects/*.webm`)을 `pykaki/tools/record_effect_clips.py`로 다시 찍고, 안내서도 다시 만듭니다.
* 앱 쪽(`pykaki/app/`)을 고쳤으면 `npm run web && node smoke.cjs`로 진짜 Electron을 켜 보는 시험을 돌립니다. GitHub Actions "pygaki 앱"도 같은 시험을 돌리고 윈도우 앱 폴더를 만듭니다.
* 도움말 글은 `pykaki/docs/GUIDE.md`를 고치면 다음 빌드에 들어갑니다.
* 대본 파일(`.flow.json`)에 예전 판이 모르는 값을 더하면 `pykaki/src/version.ts`의 `FEATURE`를 1 올립니다(예전 앱이 "더 새 판" 경고를 띄움). 저장 형식 이름 `"format": "renpy-flow"`, 파일 이름 `.flow.json`은 바꾸지 않습니다.
* 앱은 사용자 허락 없이 밖으로 통신하지 않습니다. 게임과의 실시간 연결은 `127.0.0.1`만 씁니다.

## 두 프로그램의 형식 맞추기

PyKaki가 내보내는 원고(`game/script_flow.rpy`)의 줄 모양, 줄 끝의 찾는 표시(`# @l:…`), 게임이 PyKaki에 돌려주는 파일(`showpy_inbox.json`), 실시간 연결의 명령은 `docs/LINK.md`에 모두 적혀 있습니다. 이 형식을 바꾸면 `docs/LINK.md`와 양쪽 코드(`pykaki/`, `showpy/`)를 같은 커밋에서 고칩니다. 원고에 새 종류의 줄을 넣으면 게임 쪽(`ui_kit/engine/script_edit.rpy`)과 PyKaki 쪽(`pykaki/src/inbox.ts`)을 같이 맞춥니다.

## 묶음 만들기

렌파이 SDK + 플러그인 템플릿 + 런처 버튼 + 앱을 윈도우용 zip으로 묶습니다. 저장소에 태그를 올리면(`git tag v1.0 && git push origin v1.0`) GitHub Actions "배포 파일"이 묶어서 Releases에 초안으로 올립니다. 내 컴퓨터에서는 이렇게 만듭니다.

```bash
python bundle/make_bundle.py --sdk 렌파이SDK폴더 --app pykaki\app\out\win-unpacked --zip --tag v1.0
```

`bundle/out/`에 렌파이까지 든 묶음과, SDK가 이미 있는 사람용 덧붙임이 생깁니다. 템플릿에 넣는 플러그인과 템플릿에서만 다르게 두는 설정(처음에는 VHS 덮개 끔)은 `make_bundle.py`의 `PLUGINS`, `TEMPLATE_SETTINGS`에서 고칩니다. 묶음을 만들 때 만든 사람 컴퓨터의 경로가 들어 있으면 멈춥니다. 자세한 것은 `bundle/README.md`.

배포판과 묶음에는 개발용 파일(`showpy_live.json`, `showpy_inbox.json`, `pykaki_preview.json`, `pykaki_goto.json`, `ui_kit_backup/`, `*.flow.json`)이 들어가지 않게 합니다.

## AI와 같이 고칠 때

저장소 맨 위 `CLAUDE.md`와 `showpy/docs/DEV_RULES.md`에 AI가 지킬 규칙이 있습니다. 새 기능은 먼저 할 수 있는지, 짧은 계획, 예상 시간을 듣고 시작하게 하고, 끝나면 무엇을 바꿨고 무엇을 확인했는지 정리하게 합니다. 시험은 시험 프로젝트에서 하게 합니다.
