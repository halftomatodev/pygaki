# Screen FX 플러그인 (기본 효과 + VHS 덮개 + ASCII + 레트로 터미널 + 게임보이 + 새 효과 일곱 + 타이틀 일렁임)

화면 전체에 씌우는 렌파이 셰이더 플러그인입니다. 화면은 **셰이더 두 개를 겹쳐** 그립니다.

```
[게임 화면] → 기본 효과 (없음 / ASCII / 레트로 터미널 / 게임보이) → 덮개 (VHS, 켬 / 끔) → 눈에 보이는 화면
```

- **기본 효과**: 스크립트의 원하는 곳에서 **다른 효과로 바꾸면 선택취소할 때까지 그 효과가 유지**됩니다. 바꿀 때는 **TV가 꺼졌다 켜지는 전환**이 들어갑니다. 배포 설정은 "없음".
- **덮개**: VHS 하나. **켬 / 끔만** 고르고, 휘어짐 같은 **왜곡 정도는 값으로** 조절합니다. 배포 설정은 켬. (5장)
- 처음 상태 = "기본 효과 없음 + 덮개 켬" = 화면 전체에 VHS.

| 효과 | 하는 일 | 설정 파일 |
|---|---|---|
| 효과 바꾸기, 전환 | 지금 켤 효과 고르기, 선택취소, 덮개 켜고 끄기, TV 꺼짐/켜짐, 서서히, 바로 전환 | `screen_fx_config.rpy` |
| VHS 덮개 (`vhs_crt`) | 낡은 브라운관 TV에 VHS 테이프를 튼 것처럼 (주사선, RGB 격자, 흐르는 띠, 노이즈, 색 번짐, 휘어진 가장자리). **기본 효과 위에 덮는 덮개 전용** | `vhs_crt_config.rpy` |
| ASCII (`ascii`) | 화면을 글자 칸으로 나눠 밝기에 맞는 글자로 다시 그림. 글자 하나가 픽셀 하나 (옛날 텍스트 화면, 로그라이크 콘솔). 글꼴은 Neo둥근모 | `ascii_config.rpy` |
| 레트로 터미널 (`retro_term`) | 옛날 단색 모니터. 밝기를 형광체 색으로 칠함, 빛 번짐, 주사선, 깜빡임, 자체 곡면 CRT(테두리 포함)와 자체 VHS. **쓰는 동안 덮개는 기본으로 꺼짐** | `retro_term_config.rpy` |
| 게임보이 (`gameboy`) | 옛날 휴대용 게임기의 LCD 화면. 큰 점, 4색(또는 2색). **디더링**(점 무늬로 섞기)과 **픽셀화**(딱 끊기). 글자는 색만 입혀서 읽히게 | `gameboy_config.rpy` |
| 글리치 (`glitch`) | 평소에는 깨끗하다가 가끔 무작위로 가로 띠 찢김, 블록 밀림, 색 갈라짐 (5.1) | `glitch_config.rpy` |
| 지글거림 (`boil`) | 손그림 애니메이션처럼 테두리가 1초에 12번쯤 뚝뚝 떨리고 고운 알갱이가 바뀜 (5.1) | `boil_config.rpy` |
| 망점 (`halftone`) | 인쇄물처럼 점(또는 줄)으로. 한 색 또는 CMYK 네 색 (5.1) | `halftone_config.rpy` |
| 홀로그램 (`hologram`) | 한 색 + 흐르는 주사선 + 옆으로 번진 복사본 두 겹 + 빛 번짐 + 깜빡임. 인물 하나에 걸기 좋음 (5.1) | `hologram_config.rpy` |
| 나이트비전 (`nightvision`) | 초록 한 색으로 밝게, 노이즈, 가장자리 어둡게, 동그란 테두리, **화면 글**(왼쪽 위 글, REC, 숫자 시간, [ZOOM]을 하나씩 켜고 끔)과 **화면 이미지**(테두리, 조준선 그림) (5.1) | `nightvision_config.rpy` |
| 포토 콜라주 (`collage`) | 한 장면을 사진으로 여러 번 찍어 겹쳐 붙인 것처럼. 화면 가운데에만 크기가 제각각인 네모 조각(최대 10장)이 겹치고, 조각마다 조금 밀리고 확대됨. 하얀 테두리, 그림자. 장면 전환 `screen_fx.TileSwap`도 (5.3, 예전 조각 어긋남 `tiles`를 바꿈) | `collage_config.rpy` |
| 파편 흩날림 (`shards`) | 화면 위로 작은 뾰족한 조각이 바람에 날림. 깊이 세 겹, 돌고 뒤집히고 깜빡임. 색 1~3개, 바탕 어둡게 (5.1) | `shards_config.rpy` |
| 타이틀 일렁임 (`watermorph`) | 타이틀 화면을 투명한 액체 너머로 보는 것처럼. 바꾸기 기능과 상관없이 타이틀에서만 따로 켜짐 | `watermorph_config.rpy` |

효과마다 **글자 빼기**로 대사, 이름 / 선택지 / 메뉴, 화면 중 효과를 씌우지 않을 글자를 골라서 뺄 수 있습니다. (기본은 글자까지 전부 씌움. ASCII만 글자를 전부 빼는 게 기본)

`ui_kit` 플러그인이 같이 있으면 그 편집기(개발 모드에서 Shift+M)에 **"화면 효과", "타이틀 일렁임" 탭**이 생기고, **대사 탭에서 "이 대사부터 이 효과", 덮개 켬/끔, 덮개 휘어짐을 골라 원고에 바로 저장**할 수 있습니다. 대사가 아닌 줄(show, scene, with, $ 줄 등)에서 바꾸고 싶으면 **"화면 효과" 탭의 "줄에 넣기"** 로 그 줄 바로 위에 `$ screen_fx.use(…)` 줄을 넣습니다(4.1). `ui_kit`이 없어도 효과는 설정 파일과 스크립트로 그대로 동작합니다.

버전 5.6 · 렌파이 8.5.3에서 만들고 테스트했습니다.

VHS 셰이더 원본: [VHS and CRT monitor effect](https://godotshaders.com/shader/vhs-and-crt-monitor-effect/) (Godot Shaders, CC0). 렌파이용으로 옮기면서 채도·대비·전체 세기를 바꿀 수 있게 추가했습니다.
레트로 터미널은 [cool-retro-term](https://github.com/Swordfish90/cool-retro-term)의 모습과 설정 목록을 참고해 새로 썼습니다(코드는 가져오지 않음).
게임보이는 [Retro dither](https://godotshaders.com/shader/retro-dither/) (tcmug, CC0)의 4×4 디더링 무늬와 [Gameboy Classic Shader](https://github.com/HarlequinVG/shaders/tree/master/gameboy_shader) (Harlequin, GPL v3)의 LCD 모습(점 격자·점 그림자)을 참고해 새로 썼습니다(코드는 가져오지 않음).
ASCII 효과는 [ASCII shader](https://godotshaders.com/shader/ascii-shader/) (Daniel Bologna, Acerola의 아이디어, MIT)를 참고해 렌파이용으로 새로 썼습니다. 글꼴은 [Neo둥근모](https://neodgm.dalgona.dev/) (SIL OFL 1.1)입니다.

### 5.6에서 바뀐 점

- **그림 전환으로 셰이더 바꾸기**: `transition=`에 효과 폴더(`ui_kit/effects/`)의 그림 전환 이름(`"pixelsort"`, `"datamosh"` 등)을 적으면, 바로 다음 `with screen_fx.pending_with()`가 앞 화면 → 새 화면을 그 전환으로 잇고 셰이더는 그 시간의 절반에 바뀝니다(효과 파일에 `@set u__cut 값`이 있으면 그때. 샘플 `pixelsort`, `datamosh`는 끝에서 끊기는 크래시라 1.0). pygaki 앱에서는 상자의 ◐ 셰이더 → 전환 "시작할 때", "끝날 때"에서 "픽셀소트", "데이터모싱"을 고르면 이렇게 적힙니다(`ui_kit`이 같이 있어야 함).
  ```renpy
  $ screen_fx.shaders("glitch", "none", transition="pixelsort", duration=1.2)   # 1.2초 (안 적으면 효과 파일의 시간)
  scene bg room
  with screen_fx.pending_with()            # 셰이더가 그대로면 아무 전환 없이
  with screen_fx.pending_with(dissolve)    # 셰이더가 그대로면 dissolve로
  ```
  `scene`, `show`를 먼저 다 적고 그 뒤에 `with`를 적어야 새 화면까지 이어집니다. 효과 파일을 빼면 `screen_fx.transition` 설정의 전환으로 바뀝니다.

### 5.5에서 바뀐 점

- **일렁임 셰이더 (`ripple`)**: 예전 "타이틀 일렁임"(watermorph)을 셰이더 하나로 옮겼습니다. 타이틀 셰이더, 게임 내 메뉴 셰이더, 게임 중 셰이더 어디에나 고를 수 있습니다. 설정은 `ripple_config.rpy`.
  ```renpy
  define screen_fx.title_shaders = ("ripple", "none")   # 타이틀에 일렁임 (새 프로젝트의 처음 값)
  $ screen_fx.shaders("ripple", "vhs_crt")              # 게임 중에 일렁임 + VHS
  ```
  예전 방식(`watermorph_config.rpy`)도 그대로 돕니다. 새 프로젝트에서는 `watermorph.enabled = False`가 처음 값입니다. 둘을 같이 켜면 두 번 일렁이니 하나만 켜세요.
- **이 자리에서만 쓰는 세부 값**: `screen_fx.shaders()`에 `values=`와 `tv=`를 적을 수 있습니다. pygaki 앱이 상자마다 정한 값을 이렇게 적습니다.
  ```renpy
  $ screen_fx.shaders("vhs_crt", "none", values={"vhs_crt": {"warp_amount": 2.0}})   # 이 장면만 더 휘게
  $ screen_fx.shaders("glitch", "none", transition="tv", tv={"off_time": 0.6})       # 이번 TV 전환만 천천히 꺼짐
  $ screen_fx.shaders("vhs_crt", "none", values={})                                    # 바꾼 값을 설정대로
  ```
  `values`를 적으면 고른 셰이더의 바꾼 값을 그 값으로 바꿉니다(적지 않은 값은 설정대로). 아예 안 적으면 전처럼 그대로 둡니다. `tv`는 `screen_fx.tv`와 같은 이름을 씁니다. `screen_fx.use()`, `screen_fx.clear()`에도 `tv=`를 적을 수 있습니다.

### 5.4에서 바뀐 점

- **셰이더 끄기 (`shaders_off.txt`)**: 이 폴더에 `shaders_off.txt`를 만들고 안 쓸 셰이더 이름을 한 줄에 하나씩 적으면, 편집기의 1번, 2번 고르는 줄에서 빠집니다. 효과는 그대로 등록되어 있어서 이미 그 셰이더를 쓴 원고는 전과 똑같이 돕니다. 파일이 없으면 다 켠 것입니다.
  ```
  # 끈 셰이더. 한 줄에 이름 하나 (# 뒤는 설명)
  gameboy
  shards     # 파편 흩날림은 이 게임에서 안 씀
  ```
- **셰이더 목록 파일 (`shader_list.json`)**: 개발 모드에서 게임을 켜면 이 폴더의 `shader_list.json`에 셰이더 목록(이름, 값, 막대 묶음)을 적어 둡니다. pygaki 앱이 이 파일을 읽어 [대본 편집]의 셰이더 고르는 목록을 만들고, 같이 적힌 셰이더 코드로 [효과] 화면에서 샘플을 그립니다. 직접 고치지 않습니다(게임을 켤 때 다시 씀). 새 효과를 `engine/`에 넣었으면 게임을 한 번 켜야 앱의 목록에 나옵니다.

### 5.2에서 바뀐 점

- **줄기표** (편집기 "화면 효과" 탭, `ui_kit`이 있을 때): [G 줄기표 펴기](또는 G)를 누르면 게임 화면 옆, 편집기 패널 반대쪽에 서랍이 나옵니다. 원고를 줄 번호 순서대로 마디로 그리고, `menu`의 선택지와 `if`/`else`는 옆으로 갈라지는 가지로, `jump`는 `-> 라벨`로 보여줍니다. 오른쪽 색 띠는 그 줄에 덮인 셰이더(왼쪽 1번, 오른쪽 2번)입니다. 다시 누르면 들어갑니다.
  - **마디를 누르면** 그 줄을 고르고 게임도 그 줄로 갑니다(줄 목록과 같음).
  - **마디를 끌면** 구간이 칠해집니다. 1번, 2번을 고르고 패널의 **[이 구간에 적용]** → 저장(Ctrl+S)하면 시작 줄 위에 `$ screen_fx.shaders("1번", "2번")`, 끝 다음 줄 위에 원래 두 자리로 되돌리는 줄이 들어갑니다.
  - 끝 줄이 선택지/if 가지 안이면 경고하고, 되돌리는 곳을 **끝 다음 줄 / 가지가 합쳐지는 곳 / 안 넣음** 중에서 고릅니다. 끝이 `jump`, `return`이면 되돌리기는 넣지 않습니다. 구간 안에 이미 셰이더가 바뀌는 줄이 있으면 알려 주고 [구간 안 셰이더 줄 지우기]도 있습니다.
  - **전환 점**: 셰이더가 바뀌는 줄마다 줄기표 오른쪽 끝에 네모 점이 있습니다. 눌러서 여러 개 고르고(또는 [구간이 닿는 전환 점 고르기]) 패널의 "고른 전환 점"에서 전환(설정대로 / TV / 서서히 / 바로)을 한 번에 고릅니다. [이 구간에 적용]을 누르면 시작과 되돌리는 곳 두 점이 저절로 골라집니다.
  - **Delete로 지우기**: 구간을 골라 두었거나 전환 점을 골라 두고 Delete(또는 패널 [구간의 셰이더 지우기], [고른 점 지우기])를 누르면, 그 셰이더 줄(구간이면 끝 다음의 "원래대로" 줄까지)을 지우기로 하고 네모 점이 없어집니다. 대사 괄호의 `fx=`는 괄호에서 뺍니다. 저장(Ctrl+S)하면 원고에서 빠집니다. 앞에서 켠 셰이더가 이어지면 그 구간은 그 셰이더로 보이고, 메시지로 알려 줍니다(둘 다 기본으로 하려면 앞의 셰이더 줄도 지움).
  - **pygaki 앱에서는** (지금은 꺼 둠: 앱의 칸 이름은 "셰이더"이고, PyKaki 대본은 [대본 편집]에서 상자나 label 오른쪽 위의 ◐ 셰이더로 겁니다. 아래는 예전 동작): [GUI 편집] → "인게임 화면 셰이더" → 가운데 위 [줄기표 펴기]. 가운데가 원고 | 줄기표 두 칸이 되고, 줄기표에서 똑같이 끌고 누르고 점을 고릅니다(누른 줄로 원고 칸도 스크롤). 앱이 패널을 가져가 있는 동안 게임 창의 서랍은 숨습니다(F9로 게임 창 편집기를 보이게 하면 같이 나옴). ui_kit 4.1이 있어야 합니다.
  - 가지는 렌파이가 읽은 원고 그대로라 줄 번호가 정확합니다. 다른 파일로 가는 `jump`, `call`은 따라가지 않습니다.

### 5.1에서 바뀐 점

- **새 화면 효과 일곱 가지**: 글리치(`glitch`), 지글거림(`boil`), 망점(`halftone`), 홀로그램(`hologram`), 나이트비전(`nightvision`), 조각 어긋남(`tiles`, 5.3에서 포토 콜라주 `collage`로 바뀜), 파편 흩날림(`shards`). 다른 효과처럼 1번, 2번 자리 어디에나 고르고, 대사 괄호 `fx=`, `image_fx`, `set_values`, 프리셋, 편집기 막대가 다 됩니다. 효과마다 설정 파일(`<이름>_config.rpy`)에 쓰는 법과 예시가 있습니다.
  ```renpy
  $ screen_fx.shaders("glitch")                        # 1번 글리치
  $ screen_fx.shaders("halftone", "boil")              # 망점 + 지글거림 겹치기
  show eileen at screen_fx.image_fx("hologram")        # 인물 하나만 홀로그램
  $ nightvision.set(hud_text="CAM 03")                 # 나이트비전 화면 글 바꾸기
  scene bg room with screen_fx.TileSwap(1.0)           # 칸마다 바뀌는 장면 전환
  $ screen_fx.shaders("shards")                        # 붉은 파편이 흩날림
  $ shards.preset("embers")                            # 위로 올라가는 불티
  ```
- 파편 흩날림(`shards`)은 그림 파일 없이 셰이더로 조각을 그립니다. 깊이 세 겹(먼 조각은 작고 흐리고 느림), 조각마다 돌고 뒤집히고 깜빡입니다. 양 `count`, 색 수 `colors`(1~3)와 `color`·`color2`·`color3`, 크기 `size_min`·`size_max`, 속도 `speed`, 방향 `direction`(도, 0 오른쪽 90 아래), 바탕 어둡게 `dim`. 프리셋 `embers`(불티), `ash`(재), `storm`(폭풍), `dread`(어두운 화면에 붉은 파편). 다른 효과에 얹으려면 2번 자리에(`screen_fx.shaders("boil", "shards")`).
- 새 효과는 쓰는 동안 덮개(VHS)를 기본으로 켜지 않습니다(`<이름>.overlay = False`). 같이 쓰려면 2번 자리에 `"vhs_crt"`.
- 나이트비전 화면 글은 `hud_label`(왼쪽 위 글), `rec`(REC 글자), `timer`(숫자 시간), `zoom`([ZOOM] 글)로 하나씩 켜고 끕니다. 글 내용(`hud_text`, `zoom_text`)과 화면 이미지(`hud_image`)는 편집기 세부 속성 "화면 글"에서 고치고 고를 수 있습니다(글 칸, [그림 고르기] 창). `hud_image`에 그림 파일(예: `"gui/nv_frame.png"`)을 적으면 화면에 얹습니다(`hud_image_fit` `"full"` 화면 가득 / `"center"` 가운데, `hud_image_alpha` 진하기, `hud_image_zoom` 크기, `hud_image_rotate` 회전, `hud_image_x`·`hud_image_y` 가운데 기준 자리).
- 나이트비전 화면 글은 셰이더가 아니라 이 효과가 보일 때만 뜨는 스크린(`nightvision_hud`, `config.overlay_screens`에 저절로 들어감)입니다. 1번이든 2번이든 나이트비전이 보이면 뜹니다.

옮기기: `screen_fx/engine/`을 `.rpyc`까지 지우고 새것을 넣고, 새 설정 파일 일곱 개(`glitch_config.rpy` … `shards_config.rpy`)를 넣습니다. 있던 설정 파일은 그대로 둬도 됩니다.

### 5.0에서 바뀐 점

- **이미지 하나에 거는 효과**: 화면 효과 두 자리와 상관없이 그 이미지에만 씌웁니다. 값을 안 적으면 그 효과의 설정 파일 값. 화면 전체 효과와 겹쳐 쓸 수 있습니다.
  ```renpy
  show ghost at screen_fx.image_fx("gameboy")
  show ghost at screen_fx.image_fx("ascii", strength=0.6)
  ```
- **게임 중에 효과 값 바꾸기**: `$ screen_fx.set_values("vhs_crt", warp_amount=2.0)` (`vhs_crt.set(...)`과 같음. 값 없이 부르면 설정대로). 세이브·되감기에 저장됩니다.
- **셰이더 장면 전환 틀**: `screen_fx.ShaderSwap("셰이더 이름", 시간, u_값=…)`. 셰이더는 `tex0`(옛 장면), `tex1`(새 장면), `u_sfx_swap`(0 → 1), `u_sfx_swap_size`를 받습니다. 이 틀로 만든 전환은 새 효과와 함께 들어옵니다.

### 4.5에서 바뀐 점

- **두 자리는 늘 같이**: 편집기는 `$ screen_fx.shaders("1번", "2번")`만 씁니다. 스크립트도 이렇게 쓰는 걸 권합니다. 예전 줄(`use()`, `clear()`, `set_overlay()`, 대사 괄호 `fx=`, `fx_overlay=`)도 그대로 됩니다.
  ```renpy
  $ screen_fx.shaders("ascii", "vhs_crt", transition="fade")   # 전환: "tv", "fade", None(바로), 안 적으면 설정대로
  $ screen_fx.set_cursor("top")      # 커서: "effect" 1번·2번 다 받음 / "overlay" 2번만 / "top" 안 받음
  ```
- 화면 효과 탭 **셰이더가 바뀌는 줄**: 이 원고 파일에서 셰이더가 바뀌는 줄마다 두 자리와 전환을 보여주고 전환을 고릅니다. 한 자리만 바꾸는 예전 줄은 [두 자리로 바꾸기]. 두 자리 값은 파일을 위에서부터 읽어 센 대강의 값입니다(분기, jump는 따지지 않음).
- [여기에서부터 적용]에 "적용할 때 전환".
- (5.2) **줄기표**: G로 펴고 접음. 마디 끌어 구간 → [이 구간에 적용], 오른쪽 점으로 전환 점 고르기. 위 "5.2에서 바뀐 점" 참고.
- "처음 상태": 처음 1번, 2번, '설정대로' 전환만. TV 시간 막대, 기다림, 건너뛰기, 미리 보기는 칸에서 뺐습니다(`screen_fx_config.rpy`의 `screen_fx.tv`, `wait`, `skippable`).
- **커서와 셰이더 '여기에서부터'**: UI Kit 커서/대사 소리 탭 아래. 셰이더 줄과 커서 줄은 같은 줄 위에 있어도 서로 지우지 않습니다.
- PyKaki 원고에서도 저장됩니다(4.20~4.21에서는 막혀 있었음).
- warp 뒤 셰이더, 커서 상태를 원고대로 맞춤. 고른 줄이 다른 파일에 남아 있으면 지금 줄을 따라감.

### 4.4에서 바뀐 점

- 편집기 "화면 효과" 탭(앱 "인게임 화면 셰이더")의 페이지 고르기 줄(셰이더 고르기 / 아스키 / VHS / 단말기 / 게임보이 / 처음 상태, 전환)을 없앴습니다. 탭을 열면 바로 1번, 2번이고, **고른 효과의 세부 속성(글자 빼기, 기본 설정/프리셋, 막대)이 그 줄 바로 아래**에 나옵니다. 줄 끝 "세부 속성 접기/펴기".
- "처음 상태, 전환"은 맨 아래 [처음 상태, 전환 펴기]로.
- **줄 목록에서 줄을 누르면 게임도 그 줄로** 갑니다(지나온 줄이면 되감기, 아니면 게임을 다시 시작해서 그 줄까지 건너뜀. `ui_kit` 3.20의 `goto_line`). 줄 번호 칸도 같음. [ ] 키는 고르기만 합니다.
- "타이틀 셰이더", "게임 내 메뉴 셰이더" 탭에도 1번, 2번 아래 세부 속성(글자 빼기 없음, 화면 전체라서). 효과 값은 인게임과 같이 씁니다(효과마다 하나). 저장은 그대로 `*_layout.rpy`.
- 편집 중 효과 값: 화면 효과, 타이틀/메뉴 셰이더 탭을 쓰는 동안은 모든 효과가 편집한 값과 고른 프리셋으로 보입니다.

### 4.3에서 바뀐 점

- **셰이더 두 자리**: 1번(예전 기본 효과 자리)과 2번(예전 덮개 자리) 모두 기본(`"none"`, 아무것도 안 함) / 아스키(`"ascii"`) / VHS(`"vhs_crt"`) / 단말기(`"retro_term"`) / 게임보이(`"gameboy"`) 중 하나. 같은 효과를 두 자리에 고르면 한 번만 씌웁니다.
  ```renpy
  $ screen_fx.shaders("ascii", "vhs_crt")     # 1번 아스키 + 2번 VHS
  $ screen_fx.shaders("gameboy")              # 1번 게임보이, 2번 없음
  $ screen_fx.shaders("none", "none")         # 전부 셰이더 적용 취소
  $ screen_fx.use("vhs_crt", overlay="gameboy")   # use()로도 (overlay에 효과 이름)
  ```
  예전 줄은 그대로 됩니다: `use("vhs_crt")`(2번을 안 적으면 예전처럼 "없음 + VHS"), `fx=`, `fx_overlay=True/False`.
- **타이틀 셰이더, 게임 내 메뉴 셰이더**: `screen_fx_config.rpy`의 `screen_fx.title_shaders`, `screen_fx.menu_shaders` (기본 `("none", "none")`). 타이틀과 타이틀에서 연 화면, 게임 중 ESC 메뉴와 거기서 연 화면에서는 인게임 셰이더 대신 이 두 자리를 화면 전체(글자 포함)에 씌웁니다. 메뉴가 열려 있는 동안 뒤 게임 화면도 메뉴 셰이더로 보입니다. VHS의 `vhs_crt.scope`, `vhs_crt.auto`는 더 쓰지 않습니다.
- 편집기 "화면 효과" 탭 (9-1, 9-4):
  - 첫 페이지 **"셰이더 고르기"**: 1번, 2번 줄에서 고르면 화면에 바로 보입니다. 두 줄 끝의 "전부 셰이더 적용 취소"는 둘 다 "기본"으로.
  - 줄 목록 왼쪽 **세모(▶)**는 게임의 지금 줄입니다. 고른 줄(분홍)은 세모를 따라갑니다. 다른 줄을 누르면 거기서 멈추고, 세모를 두 번 누르면 다시 지금 줄로 가서 따라갑니다.
  - **[여기에서부터 적용]**: 고른 줄 바로 위에 `$ screen_fx.shaders("…", "…")`를 넣습니다(Ctrl+S로 원고에). 같은 줄에 다시 적용하면 바꿔 씁니다. [이 줄 위의 셰이더 줄 지우기].
  - 효과 페이지(아스키, VHS, 단말기, 게임보이): "고칠 대상" → **"세부 속성"**. 켜기/범위, 덮개 줄, "이 대사부터/이 줄부터 이 효과", "덮개 켜기", "이 대상 되돌리기", "모두 버리기" 버튼은 뺐습니다.
  - "기본 효과, 전환" → **"처음 상태, 전환"**: 게임을 시작할 때 1번, 2번(`screen_fx.base`, `screen_fx.overlay`)과 전환.
- 편집기 탭 **"타이틀 셰이더"**(타이틀에서), **"게임 내 메뉴 셰이더"**(ESC 메뉴를 연 채로): 1번, 2번. 저장하면 `screen_fx_layout.rpy`의 `title_shaders`, `menu_shaders`.
- 같이 쓰는 `ui_kit`은 3.19여야 PyKaki 앱 목록에 "└ 타이틀 셰이더", "└ 게임 내 메뉴 셰이더"가 나옵니다(게임 안 편집기에서는 3.x 어느 판이든 됨).

### 4.2에서 바뀐 점

- **마우스 커서를 화면 효과 안에 그립니다.** (5-3) UI Kit(3.1 이상)의 소프트웨어 커서를 쓸 때.
  - 기본은 **효과까지**(`"effect"`): 커서도 기본 효과와 VHS 덮개를 같이 받습니다. ASCII면 커서도 글자로, 게임보이면 4색 점으로, 덮개의 색 번짐과 휘어짐도 같이.
  - **덮개 밑**(`"overlay"`): 덮개(VHS)만 받고 기본 효과는 안 받음. **효과 안 받음**(`"top"`): 4.1까지처럼 맨 위에 깨끗하게.
  - 셰이더처럼 **원고의 구간마다** 고릅니다: 설정 `screen_fx.cursor`, 스크립트 `$ screen_fx.set_cursor("top")`, `use(…, cursor="overlay")`, 대사 괄호 `fx_cursor="top"`. 다시 바꿀 때까지 유지되고 세이브·되감기에 저장됩니다.
  - 편집기: 대사 탭과 "줄에 넣기" 페이지에 **"커서:" 줄**이 생겼습니다. (9-2, 9-4)
  - 커서가 화면과 같이 휘어서, 가장자리에서 보이는 자리와 눌리는 자리가 거의 맞습니다.
- 고친 파일: `engine/screen_fx.rpy`, `editor/editor_fx.rpy`, `screen_fx_config.rpy`(`screen_fx.cursor`), `README.md`.
- 같이 쓰는 `ui_kit`은 **3.1**이어야 커서가 효과 안으로 들어갑니다. (3.0 이하와 같이 쓰면 커서는 4.1처럼 맨 위)

### 4.1에서 바뀐 점

- **"화면 효과" 탭에 "줄에 넣기" 페이지가 생겼습니다.** (9-4)
  - 대사가 아닌 줄도 고를 수 있습니다: `scene`, `show`, `with`, `$ …`, `play` 등. 고른 줄 **바로 위에** `$ screen_fx.use("ascii")` 같은 줄을 넣어서, 그 줄부터 효과가 바뀌게 합니다.
  - 줄 고르기: [< []] [[] >] (한 줄씩), 줄 번호 입력, [지금 줄로], [L 목록 펴기] (근처 줄 목록에서 누르기).
  - 고르는 것: 화면 효과, 덮개(VHS) 그대로/켬/끔, 덮개 휘어짐, 전환. Ctrl+S로 원고에 들어갑니다.
  - 같은 줄에 다시 저장하면 앞에 넣은 효과 줄을 **바꿔 씁니다**(쌓이지 않음). [이 줄 위의 효과 줄 지우기]로 넣은 줄을 지웁니다.
  - 효과 페이지에 **"이 줄부터 이 효과"** 버튼이 더해졌습니다(VHS 덮개 페이지는 "이 줄부터 덮개 켜기"). 대사가 떠 있지 않아도 되고, 누르면 지금 줄과 그 효과가 골라진 채로 "줄에 넣기" 페이지로 넘어갑니다. 예전 "이 대사부터 이 효과"(대사 괄호에 넣기)도 그대로 있습니다.
- 대사 괄호 `fx=`(대사 탭)는 그대로 씁니다. 대사 줄이면 괄호, 다른 줄이면 "줄에 넣기"를 쓰세요.
- 고친 파일: `engine/screen_fx.rpy`(버전), `editor/editor_fx.rpy`, `README.md`.
- 같이 쓰는 `ui_kit`은 **3.0**이어야 "줄에 넣기"가 동작합니다(원고에 줄을 넣는 기능이 3.0에 생김). 2.9 이하와 같이 쓰면 줄 목록이 비고, 저장해도 원고에 들어가지 않습니다.

### 4.0에서 바뀐 점

예전 버전과 쓰는 법이 달라진 곳이 있어서 4.0입니다. (옮기는 방법은 2장 "3.4에서 4.0으로 옮기기")

- **화면 = 기본 효과 + VHS 덮개.** (3장, 5장)
  - 기본 효과 목록: 없음 / ASCII / 레트로 터미널 / 게임보이. **VHS는 기본 효과 목록에서 빠지고 덮개 전용**이 됐습니다.
  - 덮개는 VHS 하나라 **켬 / 끔만** 고릅니다. `use(…, overlay=True / False)`, `set_overlay(True / False)`, 대사 괄호 `fx_overlay=True / False`, 설정 `screen_fx.overlay = True / False`.
  - 배포 설정이 "기본 효과 VHS, 덮개 끔"에서 **"기본 효과 없음, 덮개 켬"**으로 바뀌었습니다. 보이는 모습은 같습니다.
  - 효과마다 덮개를 기본으로 켤지 정합니다: `<이름>.overlay`. **레트로 터미널은 기본으로 끔**(자체 곡면 CRT가 있어서 두 번 휘지 않게). ASCII, 게임보이는 켬.
- **덮개 왜곡 정도**: VHS 설정의 휘어짐(`warp_amount`), 화면 밀림(`distort_intensity`), 색 번짐(`aberration`) 등. 설정 파일, 편집기 막대, `vhs_crt.set()`에 더해 **`screen_fx.set_warp()`와 대사 괄호 `fx_warp=`** 가 생겼습니다. (5장)
- **흑백(`mono`) 효과를 지웠습니다.** 새 효과를 만들 때 복사하던 견본은 12장에 코드로 들어 있습니다.
- 편집기 "화면 효과" 탭: 효과 페이지에 **"이 대사부터 이 효과"** 버튼(대사 탭에 넘겨줌, Ctrl+S로 원고에 저장), "게임의 지금 장면" 안내, 효과마다 덮개 켬/끔 줄. "기본 효과, 전환" 페이지의 덮개 줄은 켬/끔. (9-1)
- 편집기 대사 탭: 덮개 줄이 **그대로 / 켬 / 끔**, **덮개 휘어짐** 줄이 새로 생겼습니다. 두 줄은 효과를 바꾸지 않는 대사에서도 고를 수 있습니다. (9-2)
- **예전 원고도 동작합니다**: `use("vhs_crt")`, `fx="vhs_crt"`, `screen_fx.base = "vhs_crt"`는 "효과 없음 + 덮개 켬"으로, `overlay="vhs_crt"`는 `True`, `overlay=None`은 `False`로 읽습니다. 다만 `use("mono")`, `fx="mono"`는 효과가 없어서 오류가 납니다(지우거나 다른 효과로 바꾸기). 흑백을 쓰던 세이브는 불러올 때 기본 효과로 돌아갑니다.
- 같이 쓰는 `ui_kit`은 2.9여야 대사 탭의 덮개/휘어짐 줄과 "이 대사부터 이 효과" 버튼이 동작합니다.

### 3.4에서 바뀐 점

- **편집기를 연 동안에도 화면 효과가 보입니다.** 3.3까지는 "화면 효과" 탭이 아닌 탭(타이틀 메뉴, 선택지, 대사, 이미지/영상 …)을 쓰는 동안 효과를 잠시 껐습니다. 이제는 효과를 켠 채로 편집하고, 편집기 패널은 그 위에 깨끗하게 보입니다. (9-3)
  - 편집 중에 **V** 키로 켜고 끕니다. 대사 탭의 "화면 효과 보기(V)" 버튼도 같은 값입니다.
  - 기본값은 `screen_fx_config.rpy`의 `define screen_fx.editor_preview = True`. 3.3처럼 끄고 편집하려면 `False`.
  - 타이틀 일렁임도 같은 값을 따릅니다.
- 고친 파일: `engine/screen_fx.rpy`, `screen_fx_config.rpy`(값 하나 추가), `README.md`. 같이 쓰는 `ui_kit`은 2.8이어야 V 키와 안내 줄이 생깁니다. (`ui_kit` 2.7 이하와 같이 써도 오류는 나지 않고, 기본값대로 효과가 켜진 채 편집됩니다)

### 3.3에서 바뀐 점

- **게임보이(`gameboy`) 효과 추가**: 화면을 큰 점으로 나누고 4색(또는 2색)으로만 칠합니다. 표현 방식은 **디더링**(`"dither"`, 색 사이 밝기를 점 무늬로 섞음, 4×4 / 8×8 무늬)과 **픽셀화**(`"pixel"`, 무늬 없이 딱 끊음) 중에 고릅니다. 점 크기, 4가지 색, 밝기·대비·감마, 점 사이 틈, 점 그림자, LCD 얼룩. 프리셋 `dmg`, `green`, `pocket`, `light`, `bw`, `blood`, `1bit`, `clean`. (8장)
- **글자는 색만 입히기**: 게임보이는 빼지 않은 글자 층(대사·선택지·메뉴)에 4색만 입히고 점으로 쪼개지 않아서, 작은 대사도 읽힙니다(`text_pixel = False`, 기본). 글자까지 점으로 쪼개려면 `True`.
  - 그래서 글자를 하나도 안 빼도 층마다 씌우는 효과를 만들 수 있게 됐습니다(`ShaderEffect.layered()`, 유니폼 `u_sfx_text`). 다른 효과는 지금과 똑같이 동작합니다. (12장)

### 3.2에서 바뀐 점

- **글자 빼기(exclude)**: 효과마다 `"say"`(대사·이름), `"choice"`(선택지), `"screens"`(메뉴·화면) 중 효과를 씌우지 않을 글자를 골라서 뺍니다. 기본은 아무것도 안 뺌(글자까지 전부). ASCII만 글자 전부 빼기가 기본. (3-8)
  - 그래서 대사창은 `sfx_say` 층, 선택지는 `sfx_choice` 층에 띄웁니다. 렌파이 기본처럼 두려면 `screen_fx.split_text_layers = False`. (3-8)
  - 3.1의 `target = "screen"`/`"scene"`, `use(…, target=…)`, 대사 괄호 `fx_target=`도 그대로 됩니다. `"scene"`은 글자 전부 빼기와 같습니다.
- **레트로 터미널(`retro_term`) 효과 추가**: 형광체 색·바탕색, 빛 번짐, 주사선/픽셀 격자/RGB 서브픽셀, 정적 노이즈, 깜빡임, 지나가는 밝은 줄, RGB 어긋남, 떨림. **자체 곡면 CRT**(휘어짐·가장자리 어둡게·둥근 화면 테두리)와 **자체 VHS**(흐르는 띠·수평 흔들림)를 따로 켜고 끕니다. 프리셋 `green`, `blue`, `amber`, `white`, `flat`, `broken`. (7장)
- VHS 셰이더가 반투명한 그림(대사창 등)에 씌워질 때 두 번 어두워지지 않게 고쳤습니다. 화면 전체에 씌울 때 모습은 그대로입니다.
- 편집기: "화면 효과" 탭의 **적용 대상** 줄이 **글자 빼기** 버튼(대사와 이름 / 선택지 / 메뉴와 화면 / 안 뺌 / 전부 뺌)으로, 대사 탭의 **대상** 줄도 **글자 빼기** 줄로 바뀌었습니다.

### 3.1에서 바뀐 점

- **ASCII 효과(`ascii`) 추가**: 글자 하나가 픽셀 하나. 칸 크기·가로세로 비율·선명하게(8의 배수), 글자 목록, 색 입히기(한 가지 색 / 원래 색 / 16색), 바탕에 원래 그림 비치기. 프리셋 `terminal`, `amber`, `dungeon`, `blocks`, `big`, `glow`. (6장)
- **덮개(overlay)**: 고른 효과 위에 VHS를 한 번 더 씌웁니다. 기본은 꺼짐. `use("ascii", overlay="vhs_crt")`, 대사 괄호 `fx_overlay="vhs_crt"`, `screen_fx.set_overlay()`, 설정 `screen_fx.overlay`. (3-7)
- **적용 대상(target)**: 효과마다 `"screen"`(화면 전체) 또는 `"scene"`(장면만: 대사·이름·선택지는 원래대로)을 고릅니다. ASCII는 기본이 장면만, VHS·흑백은 기본이 화면 전체. (3-8)
- **스크린 안의 그림**: `add "map.png" at screen_fx.scene`으로 스크린에 넣은 그림에도 "장면만" 효과가 씌워집니다. UI Kit 타이틀 배경과 Splash의 배경·로고에는 자동으로 씌워집니다. (3-9)
- 편집기: "화면 효과" 탭에 **적용 대상** 줄, "전환 설정"에 **기본 덮개** 줄, 대사 탭에 **덮개·대상** 줄이 생겼습니다.
- 3.0의 설정 파일·세이브는 그대로 쓸 수 있습니다. 새 파일은 `ascii_config.rpy`, `engine/ascii.rpy`, `fonts/` 폴더입니다.

### 3.0에서 바뀐 점

- **효과 바꾸기**: `$ screen_fx.use("mono")`로 바꾸면 `$ screen_fx.clear()`까지 유지됩니다. 지금 켜진 효과는 세이브·되감기에 같이 저장됩니다. (3장)
- **대사 줄 괄호**: `e "…" (fx="mono")` 처럼 그 대사부터 효과를 바꿀 수 있습니다. 편집기 대사 탭에서 고르면 원고에 바로 저장됩니다. (3-2, 9-2)
- **전환**: TV 꺼짐·켜짐(기본), 서서히, 바로. 시간·섬광·지직거림·소리를 설정 파일과 편집기에서 고칩니다. (4장)
- **흑백(`mono`) 효과 추가**. 새 셰이더를 넣을 때 이 파일을 복사해서 씁니다. (12장)
- 편집기의 "VHS 효과" 탭은 **"화면 효과" 탭**으로 바뀌었습니다. 위쪽 버튼으로 VHS / 흑백 / 전환 설정을 고릅니다.
- `vhs_crt_config.rpy`, `vhs_crt_layout.rpy`, `watermorph_config.rpy`는 **그대로 쓸 수 있습니다.** `vhs_crt.set()`, `preset()`, `reset()`, `off()`, `on()`, `Toggle()`, `camera at vhs_crt.effect`도 그대로입니다.
- 편집기 탭은 `ui_kit` 2.3 이상이 필요합니다. (2.2 이하에서는 Ctrl+S 한 번에 파일 하나씩 저장됩니다)
- 2.x에서 만든 세이브도 그대로 불러올 수 있습니다. 세이브에 든 `vhs_crt.set()` 값은 불러올 때 새 저장 위치로 옮겨지고, `camera at vhs_crt.effect`를 쓴 세이브도 열립니다.

---

## 1. 파일 구성

```
game/screen_fx/
├── screen_fx_config.rpy     설정: 기본 효과, 덮개 켬/끔, 전환(TV·서서히·바로), 소리   ← 여기를 고침
├── vhs_crt_config.rpy       설정: VHS 덮개 (왜곡 정도 등)                  ← 여기를 고침
├── ascii_config.rpy         설정: ASCII 효과                              ← 여기를 고침
├── retro_term_config.rpy    설정: 레트로 터미널 효과                       ← 여기를 고침
├── gameboy_config.rpy       설정: 게임보이 효과                            ← 여기를 고침
├── watermorph_config.rpy    설정: 타이틀 일렁임                            ← 여기를 고침
├── glitch_config.rpy        설정: 글리치 (5.1)                            ← 여기를 고침
├── boil_config.rpy          설정: 지글거림 (5.1)                          ← 여기를 고침
├── halftone_config.rpy      설정: 망점 (5.1)                              ← 여기를 고침
├── hologram_config.rpy      설정: 홀로그램 (5.1)                          ← 여기를 고침
├── nightvision_config.rpy   설정: 나이트비전과 화면 글 (5.1)               ← 여기를 고침
├── collage_config.rpy       설정: 포토 콜라주, TileSwap 전환 (5.3)         ← 여기를 고침
├── shards_config.rpy        설정: 파편 흩날림 (5.1)                       ← 여기를 고침
├── *_layout.rpy             편집기에서 저장하면 생기는 파일 (처음에는 없음)
├── engine/                  엔진 (고치지 않음. 새 효과를 넣을 때만 여기에 파일 추가)
│   ├── screen_fx.rpy            공통: 효과 목록, 바꾸기, 전환, 대사 괄호 fx
│   ├── vhs_crt.rpy              VHS 셰이더 (덮개)
│   ├── ascii.rpy                ASCII 셰이더 (글자 그림을 게임 중에 만듦)
│   ├── retro_term.rpy           레트로 터미널 셰이더
│   ├── gameboy.rpy              게임보이 셰이더
│   ├── watermorph.rpy           타이틀 일렁임 셰이더
│   ├── glitch.rpy, boil.rpy, halftone.rpy, hologram.rpy   새 효과 셰이더 (5.1)
│   ├── nightvision.rpy          나이트비전 셰이더 + 화면 글 스크린 (5.1)
│   ├── shards.rpy               파편 흩날림 셰이더 (5.1)
│   └── collage.rpy              포토 콜라주 셰이더, TileSwap 전환 (5.3, 예전 tiles.rpy)
├── editor/
│   └── editor_fx.rpy            UI Kit 편집기 탭 (UI Kit이 없으면 아무것도 안 함)
├── fonts/
│   ├── neodgm.ttf               ASCII 효과의 기본 글꼴 (Neo둥근모, SIL OFL 1.1)
│   └── neodgm_OFL.txt           글꼴 라이선스 (글꼴과 함께 배포해야 함)
└── README.md                이 설명서 (배포판에는 자동으로 빠짐)
```

---

## 2. 설치

`screen_fx` 폴더를 프로젝트의 `game` 폴더 안에 넣으면 끝입니다. **원본 파일(`screens.rpy`, `options.rpy`, `script.rpy`)은 고치지 않아도 됩니다.** 게임을 실행하면 바로 VHS 효과가 씌워집니다.

- 효과마다 설정 파일의 `enabled`로 따로 끌 수 있고, 끄면 효과가 없는 화면과 똑같습니다.
- 렌파이 기본 스크린을 대신하지 않고, 화면에 씌우는 방식도 렌파이의 `config.layer_transforms`에 **추가만** 합니다. 게임에서 쓰는 `camera at ...`, `show layer ... at ...`, 다른 플러그인과 같이 써도 서로 지우지 않습니다.
- 대사 줄 괄호의 `fx=`를 받기 위해 `config.say_arguments_callback`에 함수를 겁니다. 이미 다른 함수가 걸려 있으면 그 함수에 이어서 넘겨줍니다. (`ui_kit` 대사 스타일과 같이 써도 됩니다)
- 다른 CRT 셰이더를 이미 쓰고 있다면 효과가 두 번 겹칩니다. 하나만 남기세요.

이 플러그인이 쓰는 이름:

| 종류 | 이름 |
|---|---|
| 이름공간 | `screen_fx`, `vhs_crt`, `ascii`, `retro_term`, `gameboy`, `watermorph` |
| 셰이더 | `screen_fx.tv`, `vhs_crt.effect`, `ascii.effect`, `retro_term.effect`, `gameboy.effect`, `watermorph.q1`~`q3`, 유니폼 `u_sfx_tv_*`, `u_sfx_base`, `u_sfx_text`, `u_vhs_crt_*`, `u_ascii_*`, `u_rt_*`, `u_gb_*`, `u_wm_*` |
| 저장되는 값 | `screen_fx.current`(지금 효과), `screen_fx.cur_overlay`(덮개), `screen_fx.cur_target`(글자 빼기), `screen_fx.overrides`(set()으로 바꾼 값, 덮개 휘어짐 포함), `screen_fx.changes` (세이브·되감기에 들어감) |
| persistent | `persistent.screen_fx_off`(플레이어가 화면 효과를 전부 끔), `persistent.vhs_crt_off`, `persistent.ascii_off`, `persistent.retro_term_off`, `persistent.gameboy_off` |
| 소리 채널 | `screen_fx_off`, `screen_fx_on` (효과음 음량을 따름) |
| 층 | `sfx_say`(대사창), `sfx_choice`(선택지). `config.say_layer`, `config.choice_layer`, `config.nvl_layer`, `config.nvl_choice_layer`를 이 층으로 바꾸고 `config.context_clear_layers`에 더함 (`split_text_layers = False`면 안 바꿈) |

### 4.1에서 4.2로 옮기기

1. `game/screen_fx/engine/`, `game/screen_fx/editor/` 폴더를 **`.rpyc` 파일까지** 지우고 새 폴더를 넣습니다.
2. 설정 파일은 그대로 써도 됩니다. `screen_fx.cursor`를 안 적으면 `"effect"`(효과까지)로 동작합니다. 4.1처럼 커서를 늘 깨끗하게 두려면 `screen_fx_config.rpy`에 `define screen_fx.cursor = "top"`을 더하세요.
3. `ui_kit`도 3.1로 바꾸고, 런처에서 Lint를 실행합니다.

### 4.0에서 4.1로 옮기기

1. `game/screen_fx/engine/`, `game/screen_fx/editor/` 폴더를 **`.rpyc` 파일까지** 지우고 새 폴더를 넣습니다.
2. 설정 파일(`*_config.rpy`), `*_layout.rpy`는 그대로 둡니다. (바뀐 값 없음)
3. `ui_kit`도 3.0으로 바꾸고, 런처에서 Lint를 실행합니다.

### 3.4에서 4.0으로 옮기기

1. 고쳐 둔 설정 파일(`*_config.rpy`)과 편집기가 만든 `*_layout.rpy`를 따로 복사해 둡니다.
2. `game/screen_fx` 폴더를 **`.rpyc` 파일까지** 지우고 새 폴더를 넣습니다. (`engine/mono.rpy`, `mono_config.rpy`, `mono_layout.rpy`가 남아 있으면 지우세요)
3. 복사해 둔 파일 중 **`ascii_config.rpy`, `retro_term_config.rpy`, `gameboy_config.rpy`, `vhs_crt_config.rpy`, `*_layout.rpy`는 그대로 덮어써도** 됩니다. (새 값 `<이름>.overlay`는 안 적으면 기본값: 레트로 터미널만 끔)
4. `screen_fx_config.rpy`는 **새 파일을 쓰고** 고쳤던 값만 옮기는 쪽을 권합니다. 예전 파일을 그대로 쓰면:

   ```renpy
   define screen_fx.base = "vhs_crt"    # 그대로 둬도 됨 ("없음 + 덮개 켬"으로 읽음). 새 값은 "none"
   define screen_fx.overlay = None      # ← 이러면 덮개가 꺼져서 VHS가 안 보임! True로 바꾸기
   ```

5. 원고에서 흑백을 쓰던 줄을 바꿉니다: `$ screen_fx.use("mono")`, `(fx="mono")`, `mono.set()`, `mono.preset()` → 다른 효과로 바꾸거나 지우기. 흑백이 꼭 필요하면 12장의 견본 코드로 다시 넣을 수 있습니다.
6. `overlay="vhs_crt"`, `fx_overlay=None` 같은 예전 덮개 값은 그대로 동작합니다(켬 / 끔으로 읽음). 다른 효과를 덮개로 쓴 줄(`overlay="ascii"` 등)은 오류가 나니 `True`로 바꾸세요.
7. `ui_kit`도 2.9로 바꾸고, 런처에서 Lint를 실행합니다.

### 3.3에서 3.4로 옮기기

1. `game/screen_fx/engine` 폴더를 **`.rpyc` 파일까지** 지우고 새 `engine` 폴더를 넣습니다.
2. 고쳐 둔 `screen_fx_config.rpy`를 그대로 쓴다면, 원하는 곳에 아래 줄을 더합니다. (안 더해도 기본값 `True`로 동작)

   ```py
   define screen_fx.editor_preview = True     # 편집 중에도 효과 보이기. False면 3.3처럼 끔
   ```

3. `ui_kit`은 2.8로 바꿉니다(V 키). 런처에서 Lint를 실행합니다.

### 3.2에서 3.3으로 옮기기

1. 고쳐 둔 설정 파일(`*_config.rpy`)과 편집기가 만든 `*_layout.rpy`를 따로 복사해 둡니다.
2. `game/screen_fx` 폴더를 **`.rpyc` 파일까지** 지우고 새 폴더를 넣은 뒤, 복사해 둔 파일을 덮어씁니다.
3. 새 파일 `gameboy_config.rpy`는 덮어쓰지 말고 새 것을 그대로 둡니다. 설정 이름과 문법은 3.2와 같습니다.
4. `ui_kit`은 2.5 그대로 씁니다. (편집기의 효과 버튼은 효과 목록에서 자동으로 생김)
5. 런처에서 Lint를 실행합니다.

### 3.1에서 3.2로 옮기기

1. 고쳐 둔 설정 파일(`*_config.rpy`)과 편집기가 만든 `*_layout.rpy`를 따로 복사해 둡니다.
2. `game/screen_fx` 폴더를 **`.rpyc` 파일까지** 지우고 새 폴더를 넣은 뒤, 복사해 둔 파일을 덮어씁니다.
3. 예전 설정의 `define vhs_crt.target = "screen"`, `define ascii.target = "scene"` 등은 그대로 됩니다. 골라서 빼려면 `define vhs_crt.exclude = ("say",)`처럼 `exclude`로 바꾸세요. (둘 다 적으면 `exclude`가 이김)
4. 새 파일 `retro_term_config.rpy`는 덮어쓰지 말고 새 것을 그대로 둡니다.
5. `ui_kit`도 2.5로 바꿉니다. (편집기의 글자 빼기 버튼)
6. 다른 코드가 `renpy.get_screen("say", layer="screens")`처럼 대사창 층을 `"screens"`로 정해 두고 찾는다면 `define screen_fx.split_text_layers = False`. (3-8)
7. 런처에서 Lint를 실행합니다.

### 3.0에서 3.1로 옮기기

1. 예전 `game/screen_fx` 폴더에서 **고쳐 둔 설정 파일**(`*_config.rpy`)과 편집기가 만든 `*_layout.rpy`를 따로 복사해 둡니다.
2. `game/screen_fx` 폴더를 **`.rpyc` 파일까지** 지우고 새 폴더를 넣습니다.
3. 복사해 둔 파일을 덮어씁니다. 설정 이름과 문법은 그대로이고, 새 설정(`screen_fx.overlay`, `vhs_crt.target`, `mono.target`)은 적지 않으면 3.0과 똑같이 동작합니다.
4. `ui_kit`도 2.4로 바꿉니다. (편집기의 덮개·대상 줄, 타이틀 배경에 장면 효과)
5. 런처에서 Lint를 실행합니다.

### 2.x에서 3.0으로 옮기기

1. 예전 `game/screen_fx` 폴더를 **`.rpyc` 파일까지** 지웁니다. 단, 고쳐 둔 `vhs_crt_config.rpy`, `watermorph_config.rpy`, 편집기가 만든 `vhs_crt_layout.rpy`, `watermorph_layout.rpy`는 따로 복사해 둡니다.
2. 새 `screen_fx` 폴더를 `game/`에 넣습니다.
3. 복사해 둔 파일을 `screen_fx/`에 **덮어씁니다.** 설정 이름과 문법은 그대로입니다.
4. `ui_kit`도 2.3으로 바꿉니다. (편집기의 "화면 효과" 탭과 대사 탭의 화면 효과 줄)
5. 런처에서 Lint를 실행합니다.

### 예전 `watermorph`, `vhs_crt` 폴더(1.x)에서 옮기기

1. `game/watermorph`, `game/vhs_crt` 폴더를 **`.rpyc` 파일까지** 지웁니다. (남아 있으면 효과가 두 번 걸리거나 셰이더가 두 번 등록됩니다)
2. `screen_fx` 폴더를 `game/`에 넣고, 예전 설정 파일 두 개를 `screen_fx/`에 덮어씁니다.
3. 런처에서 Lint를 실행합니다.

---

## 3. 효과 바꾸기 (`screen_fx.use` / `screen_fx.clear`)

평소에는 기본 효과(`screen_fx.base`, 배포 설정은 `"none"`)와 덮개(`screen_fx.overlay`, 배포 설정은 켬)가 설정대로 보입니다. 다른 효과로 바꾸면 **다시 바꾸거나 선택취소(`clear`)할 때까지** 그 효과가 계속 켜져 있습니다.

쓸 수 있는 기본 효과 이름:

| 이름 | 뜻 |
|---|---|
| `"none"` | 효과 없음 (덮개는 설정대로. 덮개까지 끄려면 `overlay=False`) |
| `"ascii"` | ASCII (글자로 다시 그림) |
| `"retro_term"` | 레트로 터미널 (옛날 단색 모니터. 덮개는 기본으로 꺼짐) |
| `"gameboy"` | 게임보이 (4색 점 화면. 디더링 / 픽셀화) |
| `"default"` | 기본 효과 (`screen_fx.base`). `use("default")`는 `clear()`와 같음 |
| 새로 넣은 효과 | `engine/`에 넣은 효과의 이름 (12장) |
| `"vhs_crt"` | (예전 이름) "효과 없음 + 덮개 켬"으로 읽음 |

### 3-1. 스크립트에서

```renpy
label start:
    scene bg room
    e "평소 화면 (효과 없음 + VHS 덮개)."

    ## ASCII로. 기본 전환(TV 꺼짐·켜짐)이 끝난 뒤 다음 대사가 나옵니다.
    $ screen_fx.use("ascii")
    e "세계가 글자로 무너진다."
    e "다음 줄에서도 계속 ASCII."

    ## 선택취소: 기본 효과와 덮개를 설정대로
    $ screen_fx.clear()
    e "현재로 돌아왔다."

    ## 전환을 고르기
    $ screen_fx.use("gameboy", transition="tv")      # TV 꺼짐·켜짐 (기본값)
    $ screen_fx.use("gameboy", transition="fade")    # 서서히
    $ screen_fx.use("gameboy", transition=None)      # 바로

    ## 전환 전체 시간 바꾸기 (TV는 꺼짐·검은 화면·켜짐 비율을 유지한 채 늘어남)
    $ screen_fx.use("ascii", duration=2.0)

    ## 전환을 기다리지 않고 바로 다음 줄로 (대사가 전환 중에 나오기 시작함)
    $ screen_fx.use("ascii", wait=False)

    ## 덮개 켜고 끄기 (5장)
    $ screen_fx.use("ascii", overlay=False)          # ASCII만, VHS 덮개 끔
    $ screen_fx.use("none", overlay=False)           # 아무 효과 없는 깨끗한 화면
    $ screen_fx.set_overlay(True)                    # 효과는 그대로, 덮개만 켬

    ## 덮개 왜곡 정도 (5장)
    $ screen_fx.set_warp(3.0, duration=1.0)          # 1초 동안 가장자리가 크게 휨

    ## 서서히 기본으로 돌아가기
    $ screen_fx.clear(transition="fade", duration=2.0)

    ## 이번만 대사창까지 전부 글자로: 글자 빼기를 비움 (3-8)
    $ screen_fx.use("ascii", exclude=())

    ## 게임보이로 하되 대사·이름만 원래 색 (3-8)
    $ screen_fx.use("gameboy", exclude=("say",))
```

### 3-2. 대사 줄 괄호로 (`fx=`, `fx_overlay=`, `fx_warp=`, `fx_cursor=`)

대사 뒤 괄호에 적으면 **그 대사가 나오기 전에** 바뀌고, 그 뒤로 유지됩니다. 편집기 대사 탭에서 고르면 이렇게 저장됩니다(9-2).

```renpy
e "평소 화면."
e "어? 화면이…" (fx="ascii")                               # 이 대사부터 ASCII
e "아직 ASCII야."                                          # 앞에서 이어짐
e "돌아왔다." (fx="default")                               # 선택취소 → 기본 효과
e "서서히 바뀐다." (fx="gameboy", fx_transition="fade")     # 이 줄만 서서히
e "번쩍." (fx="none", fx_overlay=False, fx_transition=None)  # 바로 깨끗한 화면으로
e "크고 빨갛게." (size=40, color="#aa0000", fx="gameboy")  # ui_kit 대사 스타일 값과 같이 써도 됨
e "글자 세계, 덮개 없이." (fx="ascii", fx_overlay=False)    # ASCII만 (5장)
e "덮개만 다시 켜자." (fx_overlay=True)                     # 효과는 그대로 두고 덮개만
e "화면이 휜다." (fx_warp=3.0)                              # 덮개 휘어짐 3 (5장)
e "원래대로 휨." (fx_warp="default")                        # 휘어짐을 설정값으로
e "전부 글자로." (fx="ascii", fx_exclude=())               # 이번만 아무것도 안 뺌 (3-8)
e "대사만 또렷하게." (fx="gameboy", fx_exclude=("say",))    # 이번만 대사·이름 빼기
e "커서는 깨끗하게." (fx_cursor="top")                      # 여기부터 커서는 효과 안 받음 (5-3)
```

- `fx_transition`: `"tv"`, `"fade"`, `None`(바로). 적지 않으면 `screen_fx.transition`을 따릅니다.
- `fx_overlay`: `True` 덮개 켬 / `False` 끔. `fx=` 없이 쓰면 지금 효과는 그대로 두고 덮개만 바꿉니다. `fx=`만 쓰고 이걸 안 적으면 덮개는 설정대로(그 효과의 `<이름>.overlay`).
- `fx_warp`: 덮개 가장자리 휘어짐(0 평평 ~ 5 크게). `"default"`면 설정 파일 값으로. 다시 바꿀 때까지 유지됩니다.
- `fx_cursor`: 커서 자리. `"effect"` 효과까지 / `"overlay"` 덮개 밑 / `"top"` 효과 안 받음 / `"default"` 설정대로. 다시 바꿀 때까지 유지됩니다. (5-3)
- `fx_exclude`: 뺄 글자 묶음. `("say",)` 대사·이름, `("say", "choice")` 대사·선택지, `()` 아무것도 안 뺌. 적지 않으면 그 효과의 설정(`<이름>.exclude`)을 따릅니다. (예전 `fx_target="screen"`/`"scene"`도 됨)
- `fx=`를 쓴 대사는 전환이 끝난 뒤에 글자가 나오기 시작합니다. (`screen_fx.wait = True`일 때)
- `screen_fx` 폴더를 지우면 이 괄호를 적은 대사에서 오류가 납니다. 그 괄호도 같이 지우세요.

### 3-3. 화면 버튼으로 (screens.rpy 등)

```renpy
textbutton "ASCII" action screen_fx.Use("ascii")                     # 누르면 ASCII (전환을 기다리지 않음)
textbutton "게임보이 (서서히)" action screen_fx.Use("gameboy", transition="fade")
textbutton "원래대로" action screen_fx.Clear()                       # 선택취소
textbutton "효과 없음" action screen_fx.Use("none", overlay=False)
textbutton "ASCII+VHS" action screen_fx.Use("ascii", overlay=True)    # 덮개도 같이
textbutton "VHS 덮기" action screen_fx.SetOverlay(True)               # 효과는 그대로, 덮개만
textbutton "덮개 걷기" action screen_fx.SetOverlay(False)
textbutton "크게 휘기" action vhs_crt.Set(warp_amount=3.0, duration=0.5)   # 덮개 왜곡 값 바꾸기
textbutton _("화면 효과") action screen_fx.Toggle()                   # 플레이어용: 화면 효과 전부 끄기·켜기
```

- `screen_fx.Use(...)`는 지금 켜진 효과와 같으면 선택된 모양(`selected`)으로 보입니다. `SetOverlay`도 마찬가지.
- `screen_fx.Toggle()`로 끄면 **모든 화면 효과와 TV 전환 연출**이 꺼집니다(효과 바꾸기는 바로 바뀜). 깜빡임에 민감한 플레이어를 위해 환경설정 화면에 넣어 두기를 권합니다. 선택은 게임을 껐다 켜도 유지됩니다(`persistent.screen_fx_off`).

### 3-4. 지금 켜진 효과 확인

```renpy
if screen_fx.current_effect() == "ascii":     # 지금 기본 효과 이름 (없으면 "none")
    e "아직 글자 화면이야."

if screen_fx.is_default():                     # use()로 바꾸지 않았거나 clear()로 돌아온 상태
    e "평소 화면이야."

if screen_fx.overlay_on():                     # 지금 덮개(VHS)가 켜져 있는지
    e "VHS가 덮여 있어."

if screen_fx.warp_value() > 2.0:               # 지금 덮개 휘어짐 값
    e "화면이 많이 휘었어."

if "say" in screen_fx.current_exclude():       # 지금 효과에서 뺀 글자 묶음 (튜플). 예: ("say", "choice")
    e "대사창은 멀쩡해."
```

### 3-5. 기본 효과 바꾸기

`screen_fx_config.rpy`의 `screen_fx.base`가 평소 효과이자 `clear()`로 돌아가는 효과입니다.

```renpy
define screen_fx.base = "none"      # 평소 효과 없음 (배포 설정. 덮개가 켜져 있으면 VHS만 보임)
define screen_fx.base = "gameboy"   # 게임 전체가 게임보이 화면
define screen_fx.overlay = False    # 덮개도 끄면 평소에는 깨끗한 화면, 특정 장면에서만 use()로 효과
```

### 3-6. 저장·되감기·건너뛰기

- 지금 켜진 효과, 덮개, 덮개 휘어짐은 **세이브·되감기에 같이 저장**됩니다. ASCII 장면에서 저장한 세이브를 불러오면 ASCII로 나옵니다.
- 새 게임을 시작하거나 타이틀로 돌아가면 설정대로 돌아갑니다.
- **전환 없이 바로 바뀌는 때**: 되감기·앞으로 감기, 세이브 불러오기, 건너뛰기(Ctrl·Tab), 편집기를 열어 둔 동안, 플레이어가 `screen_fx.Toggle()`로 효과를 끈 동안.
- TV 전환 중에 클릭하면 전환을 건너뛰고 바로 새 효과로 바뀝니다(`screen_fx.skippable = True`). 그 클릭으로 다음 대사가 넘어가지는 않습니다.
- 글자 빼기도 효과와 같이 저장됩니다.

### 3-7. 덮개

덮개(VHS)를 켜고 끄는 법, 왜곡 정도를 바꾸는 법은 **5장**에 있습니다.

### 3-8. 글자 빼기 (대사·선택지·메뉴를 효과에서 빼기)

기본은 **글자까지 전부** 효과를 씌웁니다. 효과마다 아래 세 묶음 중 효과를 씌우지 않을 글자를 골라서 뺄 수 있습니다. 뺀 글자는 원래 모습 그대로 또렷하게 남습니다.

| 이름 | 빼는 것 | 렌파이 층 |
|---|---|---|
| `"say"` | 대사·이름 (대사창, NVL 화면) | `sfx_say` |
| `"choice"` | 선택지 | `sfx_choice` |
| `"screens"` | 메뉴·화면 (퀵메뉴, 저장·불러오기·환경설정 화면, `show screen`으로 띄운 화면) | `screens` |

`scene`·`show`로 띄운 배경·캐릭터는 늘 효과를 받습니다.

효과마다 설정 파일에서 기본값을 정합니다.

```renpy
define vhs_crt.exclude = ()                            # vhs_crt_config.rpy (덮개. 배포 설정: 아무것도 안 뺌)
define retro_term.exclude = ()                         # retro_term_config.rpy
define gameboy.exclude = ()                            # gameboy_config.rpy (빼지 않은 글자는 색만 바뀜. 8장)
define ascii.exclude = ("say", "choice", "screens")    # ascii_config.rpy (배포 설정: 글자 전부 뺌)

## 이렇게도 고를 수 있음
define gameboy.exclude = ("say",)                      # 대사·이름만 원래 색 (하나일 때도 쉼표: ("say",))
define vhs_crt.exclude = ("say", "choice")             # 대사·선택지는 깨끗하게, 퀵메뉴·메뉴는 VHS
```

이번에만 바꾸기:

```renpy
$ screen_fx.use("ascii", exclude=())                            # 대사창까지 전부 글자로 (연출용)
$ screen_fx.use("gameboy", exclude=("say", "choice", "screens"))   # 글자는 전부 원래 색, 배경·캐릭터만 게임보이
e "전부 글자로." (fx="ascii", fx_exclude=())
e "대사만 또렷하게." (fx="gameboy", fx_exclude=("say",))
e "효과는 두고 글자 빼기만." (fx_exclude=("say",))                # fx 없이 쓰면 지금 효과는 그대로
```

| 짧게 쓰기 | 뜻 |
|---|---|
| `()` 또는 `None` | 아무것도 안 뺌 |
| `"all"` | 글자 전부 뺌 (`("say", "choice", "screens")`와 같음) |
| `"say"`, `"say,choice"` | 글자 하나 또는 쉼표로 이은 글자 |

어떻게 씌우나요:
- 아무것도 안 빼면 화면 전체에 **한 번** 씌웁니다. (3.1의 `"screen"`과 같음) 단, 게임보이처럼 글자 층만 다르게 그리는 효과는 안 빼도 층마다 씌웁니다(게임보이의 `text_pixel = False`).
- 하나라도 빼면 **층마다** 따로 씌웁니다. 장면 층(`master`)과 빼지 않은 글자 층에만 효과가 걸리고, 뺀 층은 그대로 그 위·아래 순서대로 겹칩니다. 층 순서: 장면 → 대사창(`sfx_say`) → 선택지(`sfx_choice`) → 퀵메뉴·메뉴(`screens`).
- 층마다 씌우면 휘어짐(VHS·레트로 터미널의 곡면)이 뺀 글자에는 걸리지 않으니, 대사창만 반듯하게 떠 보입니다. 원하던 모습이 아니면 아무것도 빼지 마세요.
- 비어 있는 층(선택지가 안 떠 있는 동안의 `sfx_choice` 등)은 건너뜁니다.

대사창·선택지를 따로 층에 띄우는 설정 (`screen_fx_config.rpy`):

```renpy
define screen_fx.split_text_layers = True    # 배포 설정. 대사창은 sfx_say, 선택지는 sfx_choice 층
define screen_fx.split_text_layers = False   # 렌파이 기본처럼 전부 screens 층
```

- `False`면 글자 빼기는 "전부 빼기"와 "안 빼기"만 됩니다(하나라도 고르면 글자 전부 뺌).
- `True`일 때 `renpy.get_screen("say")`, `renpy.get_screen("choice")`는 그대로 찾힙니다(스크린이 속한 층도 같이 바꿈). 다른 코드가 `layer="screens"`를 직접 적어서 대사창을 찾는다면 `False`로 두세요.
- `transient`, `overlay` 층은 층마다 씌울 때 빠집니다(화면 전체에 씌울 때는 들어감).

### 3-9. 스크린 안의 그림·타이틀 배경

효과에서 `"screens"`(메뉴·화면)를 빼면, 스크린에 `add`한 그림도 효과를 못 받습니다. 그런 그림에는 `at screen_fx.scene`을 붙입니다. 지금 켜진 효과가 `"screens"`를 뺐을 때만 그림에 효과가 씌워지고, 메뉴·화면도 효과를 받는 중이면 이미 걸려 있으니 아무것도 안 합니다.

```renpy
screen map_view():
    add "images/map.png" at screen_fx.scene        # 지도 그림에도 ASCII가 씌워짐
    textbutton "닫기" action Hide("map_view")        # 버튼 글자는 그대로 읽힘

screen cg_view(img):
    add img at screen_fx.scene, truecenter         # 다른 트랜스폼과 같이 쓸 때는 쉼표로
```

자동으로 씌워지는 곳 (따로 고칠 필요 없음):

| 어디 | 무엇 | 필요한 것 |
|---|---|---|
| 타이틀 화면 | 배경 그림(`gui.main_menu_background`) | `ui_kit` 2.4 이상 |
| Splash 페이지 | 배경과 로고 그림 | `splash` 1.1 이상 |

- 타이틀은 게임이 시작되기 전이라 보통 설정대로(배포 설정은 효과 없음 + VHS 덮개, 아무것도 안 뺌) 보입니다. 덮개에서 `"screens"`를 빼면(`define vhs_crt.exclude = ("screens",)`) 타이틀 메뉴 글자는 선명하고 배경에만 VHS가 걸립니다.

---

## 4. 전환 (`screen_fx_config.rpy`)

| 이름 | 배포 기본값 | 뜻 |
|---|---|---|
| `screen_fx.base` | `"none"` | 기본 효과 (3-5) |
| `screen_fx.overlay` | `True` | 덮개(VHS) 켬 / 끔 (5장) |
| `screen_fx.editor_preview` | `True` | 편집기를 연 동안에도 효과 보이기 (9-3) |
| `screen_fx.split_text_layers` | `True` | 대사창·선택지를 각자 층에 띄움. 글자 빼기를 묶음마다 고르려면 `True` (3-8) |
| `screen_fx.transition` | `"tv"` | 따로 정하지 않았을 때 전환. `"tv"`, `"fade"`, `None`(바로) |
| `screen_fx.fade_time` | `1.0` | `"fade"` 전환 전체 시간(초). 앞 효과가 절반 동안 빠지고, 새 효과가 절반 동안 들어옴 |
| `screen_fx.wait` | `True` | `True`면 전환이 끝난 뒤 다음 줄로. `False`면 전환을 시작하고 바로 다음 줄로 |
| `screen_fx.skippable` | `True` | `True`면 클릭으로 전환 건너뛰기 |
| `screen_fx.tv` | (아래 표) | TV 꺼짐·켜짐 값 |

TV 꺼짐·켜짐의 흐름: **꺼짐**(화면이 위아래로 눌려 밝은 가로선 → 가로선이 가운데 점으로) → **검은 화면**(이때 효과가 바뀜) → **켜짐**(점 → 가로선 → 화면이 펴지며 지직거림이 서서히 빠짐). 꺼지기 전 화면에는 앞 효과가, 켜지는 화면에는 새 효과가 걸려 있습니다.

```renpy
define screen_fx.tv = {
    "off_time": 0.35,       # 꺼지는 시간(초)
    "black_time": 0.25,     # 꺼진 채 검은 화면(초)
    "on_time": 0.45,        # 켜지는 시간(초)
    "line": 3,              # 가로선·점 두께(픽셀)
    "flash": 0.8,           # 꺼질 때 하얗게 빛나는 정도 (0~1)
    "noise": 0.5,           # 켜질 때 지직거림 (0~1)
    "off_sound": "audio/tv_off.ogg",   # 꺼지기 시작할 때 소리 (None = 없음. 이 예시는 game/audio/에 파일을 넣었을 때)
    "on_sound": "audio/tv_on.ogg",     # 켜지기 시작할 때 소리 (None = 없음. 배포 설정은 둘 다 None)
    "volume": 1.0,          # 두 소리의 음량 (0~1). 환경설정의 효과음 음량도 같이 따름
}
```

전환 예시:

```renpy
## 느리고 묵직하게 꺼졌다 켜지는 TV
define screen_fx.tv = { "off_time": 0.8, "black_time": 0.6, "on_time": 1.0, "flash": 1.0, "noise": 0.8 }

## 섬광 없이 조용히 (깜빡임이 적게)
define screen_fx.tv = { "flash": 0.0, "noise": 0.1 }

## 기본 전환을 서서히로
define screen_fx.transition = "fade"
define screen_fx.fade_time = 1.5
```

- 꺼지는 순간 화면 바깥(줄어든 화면 주변)은 검게 칠합니다.
- 소리는 `screen_fx_off`, `screen_fx_on` 채널로 나오고 효과음 음량을 따릅니다. 클릭으로 건너뛰면 켜지는 소리가 바로 납니다.
- 편집기 "화면 효과" 탭의 **"기본 효과, 전환"**에서 막대를 끌고 "미리 보기: TV"를 누르면 바로 확인할 수 있습니다.

---

## 5. 덮개 (VHS) 켜고 끄기, 왜곡 정도

덮개는 기본 효과 위에 **한 번 더** 씌우는 VHS입니다. 켬 / 끔만 고르고, 모양(휘어짐, 노이즈, 색 번짐 …)은 VHS 설정 값으로 정합니다.

### 5-1. 켜고 끄기

```renpy
## screen_fx_config.rpy: 평소 덮개
define screen_fx.overlay = True     # 켬 (배포 설정)
define screen_fx.overlay = False    # 끔. use(…, overlay=True)나 fx_overlay=True로 켤 때만

## 효과마다: 그 효과를 쓰는 동안 덮개를 기본으로 켤지 (각 효과의 설정 파일)
define ascii.overlay = True         # ascii_config.rpy (배포 설정: 켬)
define gameboy.overlay = True       # gameboy_config.rpy (배포 설정: 켬. False면 평평한 LCD만)
define retro_term.overlay = False   # retro_term_config.rpy (배포 설정: 끔. 자체 곡면 CRT와 두 번 휘지 않게)
```

```renpy
## 스크립트에서
$ screen_fx.use("ascii", overlay=False)            # ASCII로 바꾸면서 덮개 끔
$ screen_fx.use("retro_term", overlay=True)        # 레트로 터미널인데 덮개도 켬
$ screen_fx.set_overlay(False)                     # 효과는 그대로, 덮개만 끔
$ screen_fx.set_overlay(True, transition="fade")   # 덮개만 서서히 켬
$ screen_fx.set_overlay("default")                 # 설정대로

## 대사 괄호
e "덮개 없이." (fx="ascii", fx_overlay=False)
e "덮개만 켬." (fx_overlay=True)
```

- 덮개가 켜지는 조건: `use()`나 괄호에서 `True`/`False`를 적었으면 그 값. 안 적었으면 `screen_fx.overlay`가 켜져 있고 **그 효과의** `<이름>.overlay`도 켜져 있을 때.
- `use()`는 부를 때마다 덮개를 **새로 정합니다**. `overlay`를 안 적으면 설정대로 돌아갑니다. 앞의 덮개를 이어 가려면 다시 적거나 `set_overlay()`를 쓰세요.
  ```renpy
  $ screen_fx.use("ascii", overlay=False)
  $ screen_fx.use("gameboy")                     # ← 덮개는 설정대로 (gameboy.overlay = True면 다시 켜짐)
  $ screen_fx.use("gameboy", overlay=False)      # ← 끈 채로 이어 가려면
  ```
- 덮개만 바뀔 때도 전환(TV, 서서히)이 들어갑니다. 바로 바꾸려면 `transition=None`.
- 덮개의 글자 빼기: 기본 효과가 "없음"이면 `vhs_crt.exclude`(또는 `use(…, exclude=…)`)를 따릅니다. 기본 효과가 있으면, 그 효과가 아무것도 안 뺄 때는 덮개도 아무것도 안 뺍니다(덮개가 늘 위에 오도록).
- ASCII 위에 VHS를 덮으면 화면이 많이 어두워집니다. `ascii.preset("glow")`를 같이 쓰면 잘 보입니다(6장).
- 덮개는 화면을 한 번 더 그리므로 아주 느린 PC에서는 조금 무거워질 수 있습니다.
- 예전 값도 읽습니다: `overlay="vhs_crt"` = `True`, `overlay=None` = `False`.

### 5-2. 왜곡 정도

덮개의 모양은 `vhs_crt_config.rpy`의 `vhs_crt.settings` 값입니다(전체 표는 11-2). 왜곡에 관계된 값:

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `warp_amount` | `1.0` | **가장자리 휘어짐**. `0` 평평 ~ `1` 기본 ~ `3` 이상 크게 휨 (0~5) |
| `distort_intensity` | `0.05` | 띠가 지나갈 때 화면이 옆으로 밀리는 정도 (0~0.2) |
| `aberration` | `0.03` | 색 번짐 (빨강·초록 어긋남, -1~1) |
| `roll` / `roll_size` / `roll_speed` | `True` / `15.0` / `8.0` | 위아래로 흐르는 띠 |
| `noise_opacity`, `static_noise_intensity` | `0.4`, `0.06` | 지직거림, 자글자글한 노이즈 |
| `vignette_intensity`, `vignette_opacity` | `0.4`, `0.5` | 가장자리 어둡게 |
| `strength` | `1.0` | 덮개 전체 세기 (0이면 안 보임) |

바꾸는 방법:

```renpy
## 1) 평소 값: vhs_crt_config.rpy
define vhs_crt.settings = {
    "warp_amount": 1.0,          # 가장자리 휘어짐
    "distort_intensity": 0.05,   # 화면 밀림
    # …
}

## 2) 게임 중에 (세이브·되감기에 저장, 다시 바꿀 때까지 유지)
$ screen_fx.set_warp(3.0)                    # 휘어짐만 3으로
$ screen_fx.set_warp(0.0, duration=2.0)      # 2초 동안 서서히 평평하게
$ screen_fx.set_warp("default")              # 설정 파일 값으로
$ vhs_crt.set(warp_amount=2.5, distort_intensity=0.15, aberration=0.2, duration=1.0)   # 여러 값을 한 번에
$ vhs_crt.preset("broken", duration=0.5)     # 프리셋으로 (11-3)
$ vhs_crt.reset(duration=1.0)                # set()으로 바꾼 값을 전부 설정 값으로

## 3) 대사 괄호
e "화면이 크게 휜다." (fx_warp=3.0)
e "다시 원래대로." (fx_warp="default")
```

- 편집기: "화면 효과" 탭 → **"VHS 덮개"** 페이지의 막대(가장자리 휘어짐 등)로 평소 값을, 대사 탭의 **"덮개 휘어짐"** 줄로 그 대사부터의 값을 고릅니다. (9장)
- `screen_fx.set_warp(값)`은 `vhs_crt.set(warp_amount=값)`과 같습니다.
- 휘어짐이 크면 화면 가장자리 버튼의 보이는 위치와 클릭되는 위치가 어긋납니다(11-7).

### 5-3. 마우스 커서 자리 (4.2)

UI Kit의 소프트웨어 커서(`custom_ui.cursor = True`, `cursor_mode = "software"`)를 화면 효과의 어디에 그릴지 고릅니다.

```
[게임 화면] → [커서 "effect"] → 기본 효과(ASCII 등) → [커서 "overlay"] → 덮개(VHS) → 화면   [커서 "top"]
```

| 값 | 뜻 | 이럴 때 |
|---|---|---|
| `"effect"` | 기본 효과와 덮개를 다 받음 (기본) | 커서도 화면의 일부처럼. ASCII면 글자로, 게임보이면 4색 점으로 |
| `"overlay"` | 덮개(VHS)만 받음 | ASCII에서 커서가 글자로 바뀌어 잘 안 보일 때. 주사선, 색 번짐, 휘어짐은 받음 |
| `"top"` | 효과를 안 받음 (4.1까지와 같음) | 메뉴처럼 커서가 또렷해야 하는 구간 |

```renpy
## 1) 평소 값: screen_fx_config.rpy
define screen_fx.cursor = "effect"

## 2) 스크립트: 이 줄부터 다시 바꿀 때까지 (세이브·되감기에 저장)
$ screen_fx.set_cursor("top")                     # 효과 안 받음
$ screen_fx.set_cursor("overlay")                 # 덮개 밑
$ screen_fx.set_cursor("default")                 # 1)의 값으로
$ screen_fx.use("ascii", cursor="overlay")        # 효과를 바꾸면서 같이
$ screen_fx.clear(cursor="default")               # 선택취소하면서 커서도 설정대로

## 3) 대사 괄호
e "커서까지 글자가 됐다." (fx="ascii", fx_cursor="effect")
e "이제 커서는 깨끗하게." (fx_cursor="top")

## 지금 값 알아보기
if screen_fx.current_cursor() == "top":
    e "커서는 맨 위에 있어."
```

- `use()`, `clear()`는 `cursor=`를 적었을 때만 커서 자리를 바꿉니다. (덮개와 달리 효과를 바꿔도 커서 자리는 그대로)
- 편집기: 대사 탭 **"커서:"** 줄(→ `fx_cursor=`), "화면 효과" 탭 **"줄에 넣기"** 페이지의 "커서:" 줄(→ `$ screen_fx.set_cursor(…)`). (9-2, 9-4)
- **편집기(Shift+M)를 연 동안에는 늘 맨 위**에 그립니다. (효과 안에 그리면 편집기 패널 뒤로 숨어서)
- 커서도 화면과 같이 휘어서, 가장자리에서 보이는 자리와 눌리는 자리가 거의 맞습니다.
- 글자 빼기(3-8)를 켠 효과에서도 똑같이 동작합니다. (커서는 뺀 글자와 상관없이 고른 자리대로)
- 운영체제 커서(`custom_ui.cursor_mode = "hardware"`), 환경설정의 "시스템 커서", UI Kit이 없거나 커서를 안 쓸 때는 이 값과 상관없이 운영체제 커서가 맨 위에 보입니다.

---

## 6. ASCII (`ascii_config.rpy`)

화면을 **글자 칸**으로 나누고, 칸마다 밝기에 맞는 글자로 다시 그립니다. 글자 하나가 픽셀 하나 역할을 합니다. 옛날 텍스트 화면이나 던전 크롤(로그라이크) 콘솔처럼 보입니다.

- 기본 효과가 아니라서, `use("ascii")`나 대사 괄호 `fx="ascii"`로 켭니다. 쓰는 동안 VHS 덮개는 `ascii.overlay`(기본 켬)대로.
- **글자 빼기의 기본이 "글자 전부"** 입니다(`ascii.exclude = ("say", "choice", "screens")`). 배경·캐릭터만 글자가 되고, 대사·이름·선택지·메뉴는 원래 글꼴로 읽힙니다(3-8).
- 글자 그림은 설정의 글자 목록(`chars`)과 글꼴(`ascii.font`)로 **게임 중에 직접 만듭니다**. 이미지 파일을 따로 준비할 필요가 없습니다.
- 기본 글꼴은 플러그인에 들어 있는 **Neo둥근모**(`fonts/neodgm.ttf`)입니다. 둥근모꼴을 다듬어 영문·기호·한글을 모두 넣은 픽셀 글꼴입니다.

```renpy
label dungeon:
    scene bg cave
    $ screen_fx.use("ascii")                         # ASCII로 (대사는 그대로 읽힘)
    e "던전에 들어왔다."

    $ ascii.preset("dungeon", duration=0.5)          # 16색 + 던전풍 글자
    e "벽이 글자로 보여."

    $ ascii.set(cell=48, duration=2.0)               # 2초 동안 글자가 커지며 그림이 무너짐
    e "시야가 흐려진다…"

    $ ascii.reset(duration=1.0)                      # 설정 파일 값으로
    $ screen_fx.clear()                              # 선택취소: VHS로
```

### 6-1. 전체 설정

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `ascii.enabled` | `True` | 켜기·끄기. `False`면 `use("ascii")`를 해도 효과 없는 화면 |
| `ascii.overlay` | `True` | 이 효과를 쓰는 동안 VHS 덮개를 기본으로 켤지 (5-1) |
| `ascii.exclude` | `("say", "choice", "screens")` | 글자 빼기. `()`면 대사까지 전부 글자로 (3-8) |
| `ascii.font` | `None` | 글자에 쓸 글꼴 (game 폴더 기준 경로). `None` = Neo둥근모 |
| `ascii.settings` | (아래 표) | 효과 값 |
| `ascii.presets` | 아래 참고 | 게임 중에 한 번에 바꿀 값 묶음 |
| `ascii.warper` | `"ease"` | 부드럽게 바뀔 때의 속도 곡선 |
| `ascii.redraw` | `0.0` | 다시 그리는 간격(초). 움직임이 없는 효과라 `1.0/30`으로 줄여도 티가 잘 안 남 |

### 6-2. 효과 값 (`ascii.settings`)

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `strength` | `1.0` | 전체 세기. `0` 원래 화면 ~ `1` 완전히 글자로 |
| `cell` | `16` | **글자 칸 높이(픽셀)**. 작을수록 촘촘해서 그림이 잘 보이고, 클수록 글자가 크게 보임. `8` 아주 촘촘, `16` 기본, `32` 큼직, `48` 이상은 그림이 무너짐 |
| `aspect` | `0.5` | **칸 가로 ÷ 세로**. `0.5` 반각 글자 모양(8×16, 텍스트 화면), `1.0` 정사각형 칸(타일 느낌) |
| `crisp` | `True` | **선명하게**: 칸 높이를 8의 배수로 맞춤. 16·32·48처럼 16의 배수에서 Neo둥근모가 계단 모양 그대로 가장 또렷함. `False`면 적은 크기 그대로(어중간한 크기에서는 조금 흐려짐) |
| `chars` | `" .:-=+*#%@"` | 글자 목록. **어두운 칸 → 밝은 칸 순서**(맨 앞이 가장 어두운 곳). 글자 수는 자유 |
| `color_mode` | `"color"` | `"mono"` 한 가지 색(`fg`), `"color"` 칸의 원래 색, `"palette16"` 옛날 PC 16색 중 가까운 색 |
| `fg` | `"#c8c8c8"` | `"mono"`일 때 글자 색. `"#33ff66"` 녹색 단말기, `"#ffb000"` 호박색 |
| `bg` | `"#000000"` | 바탕색 (글자 사이 빈 곳) |
| `color_boost` | `1.3` | `"color"`·`"palette16"`일 때 글자 색을 밝게 하는 배율 (글자가 칸을 다 채우지 않아 어두워 보이므로) |
| `bg_tint` | `0.0` | 바탕에 칸의 원래 색을 비치는 정도. `0` 바탕색 그대로, `0.15~0.3` 원래 그림이 어둡게 비쳐 알아보기 쉬움(VHS를 덮을 때 추천), `1` 모자이크 위에 글자 |
| `brightness` | `1.0` | 글자 고르기에 쓰는 밝기. 크면 `@`·`#` 같은 꽉 찬 글자가 많아짐 |
| `contrast` | `1.0` | 밝은 곳과 어두운 곳의 글자 차이 |
| `invert` | `False` | 밝기 뒤집기 (어두운 곳에 꽉 찬 글자. 밝은 바탕색과 같이 쓸 때) |

글자 목록 예 (편집기에서 버튼으로 고를 수 있는 것):

```renpy
"chars": " .:-=+*#%@",       # 기본
"chars": " .,:;ox%#@",       # 던전풍
"chars": " .'^\":;!|/7xX#",  # 가는 선 (따옴표 "는 \"로 적음)
"chars": " .oO0@",           # 동그라미
"chars": " ░▒▓█",            # 블록 (점이 아니라 면으로 채워짐)
"chars": "01",               # 0과 1 (두 단계)
"chars": " .·:∴※#",          # 직접 만들기: 글꼴에 있는 글자면 한글·기호도 됨
```

칸 크기 예:

```renpy
## 촘촘한 텍스트 화면 (글자는 거의 안 읽히고 그림이 잘 보임)
"cell": 8, "aspect": 0.5,

## 정사각형 타일 (로그라이크 지도 느낌)
"cell": 16, "aspect": 1.0,

## 큼직한 글자 (글자 하나하나가 보임)
"cell": 32, "aspect": 0.5,

## 크기를 자유롭게 (crisp를 끄면 12, 20 같은 크기도 그대로. 글자가 조금 흐려짐)
"cell": 20, "crisp": False,
```

### 6-3. 프리셋

| 이름 | 모습 |
|---|---|
| `"terminal"` | 녹색 단색 모니터 (`color_mode: "mono"`, `fg: "#33ff66"`) |
| `"amber"` | 호박색 단색 모니터 |
| `"dungeon"` | 로그라이크 콘솔 (16색 + 던전풍 글자) |
| `"blocks"` | 블록 문자 `░▒▓█`로 면을 채움 |
| `"big"` | 큼직한 글자 (`cell: 32`) |
| `"glow"` | 바탕에 그림이 비침. **VHS를 덮을 때 추천** (`bg_tint: 0.2`, `color_boost: 1.6`) |

```renpy
$ ascii.preset("terminal")                     # 바로
$ ascii.preset("dungeon", duration=0.5)        # 0.5초 동안 (숫자 값만 부드럽게, 글자 목록·색 모드는 바로)
$ screen_fx.use("ascii", overlay=True)
$ ascii.preset("glow")                         # ASCII + VHS 덮개가 어두울 때
```

`ascii.set()`, `preset()`, `reset()`, `off()`, `on()`, `ascii.Set()`, `ascii.Preset()`, `ascii.Toggle()`은 VHS의 같은 이름과 똑같이 동작합니다(11-4).

### 6-4. 다른 글꼴 쓰기

```renpy
## ascii_config.rpy
define ascii.font = "fonts/DungGeunMo.ttf"     # game/fonts/에 넣은 다른 글꼴
```

- 픽셀 글꼴이면 `crisp = True`와 함께, 칸 높이를 글꼴의 원래 크기(둥근모 계열은 16)의 배수로 두면 가장 또렷합니다.
- 글자 목록의 글자가 그 글꼴에 없으면 빈칸이나 네모로 나옵니다.
- 글꼴을 바꾸면 그 글꼴의 라이선스도 지켜 주세요.

### 6-5. 알아 둘 점

- **대사가 읽히지 않을 때**: `ascii.exclude`에 `"say"`가 들어 있는지, `use(…, exclude=())`나 `fx_exclude=()`를 쓰지 않았는지 확인하세요.
- **너무 어두울 때**: `color_boost`를 올리거나 `bg_tint`를 0.15~0.3으로, 또는 `brightness`를 올리세요. VHS를 덮으면 더 어두워지니 `ascii.preset("glow")`.
- **그림이 안 알아보일 때**: `cell`을 줄이세요(8~12). 글자 목록을 늘리면 밝기 단계가 촘촘해집니다.
- **성능**: 칸마다 원래 화면을 네 번 읽고 글자 그림을 한 번 읽는 가벼운 셰이더입니다. 글자 그림은 값이 바뀔 때만 새로 만듭니다.
- 편집기 "화면 효과" 탭 → **"ASCII"** 버튼에서 칸 크기·비율·선명하게·글자 목록·색을 막대와 버튼으로 고칠 수 있습니다.

---

## 7. 레트로 터미널 (`retro_term_config.rpy`)

옛날 단색 모니터(형광체 화면)로 보는 것처럼 바꿉니다. 화면의 **밝기를 형광체 색으로 칠해서**, 녹색 형광체 + 검은 바탕이면 흰 글자가 녹색으로 빛납니다. 참고: [cool-retro-term](https://github.com/Swordfish90/cool-retro-term).

- 기본 효과가 아니라서 `use("retro_term")`이나 대사 괄호 `fx="retro_term"`으로 켭니다. 쓰는 동안 VHS 덮개는 **기본으로 꺼집니다**(`retro_term.overlay = False`).
- 글자 빼기의 기본은 **아무것도 안 뺌**입니다. 대사까지 형광체 색으로 빛나서 터미널 화면처럼 보입니다. 대사만 원래 색으로 두려면 `exclude=("say",)`(3-8).
- **곡면 CRT**와 **VHS**를 이 효과 안에서 따로 켜고 끕니다. VHS_CRT 효과(덮개)와는 따로 노는 값이라, 덮개를 꺼도 이 효과만으로 브라운관 모양이 나옵니다. 덮개와 같이 쓰면 휘어짐이 두 번 걸려서 덮개는 기본으로 꺼 둡니다. 덮개를 켤 거면(`overlay=True`) 이 효과의 `crt`를 `False`로 하세요.

```renpy
label night:
    scene bg office_dark
    $ screen_fx.use("retro_term")                     # 녹색 터미널로 (TV가 꺼졌다 켜지며)
    e "모니터가 저절로 켜졌다."

    $ retro_term.preset("blue", duration=1.0)         # 1초 동안 파란 화면으로
    e "화면이 파랗게 바뀐다."

    $ retro_term.set(vhs=True)                        # 이 효과의 VHS 켜기
    $ retro_term.preset("broken")                     # 순간 고장
    $ renpy.pause(0.4)
    $ retro_term.reset(duration=0.5)                  # 설정 파일 값으로

    $ screen_fx.clear()                               # 선택취소: VHS로
```

### 7-1. 전체 설정

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `retro_term.enabled` | `True` | 켜기·끄기 |
| `retro_term.overlay` | `False` | 이 효과를 쓰는 동안 VHS 덮개를 기본으로 켤지. 자체 곡면 CRT가 있어서 기본은 끔 (5-1) |
| `retro_term.exclude` | `()` | 글자 빼기 (3-8) |
| `retro_term.settings` | (아래 표) | 효과 값 |
| `retro_term.presets` | 아래 참고 | 게임 중에 한 번에 바꿀 값 묶음 |
| `retro_term.warper` | `"ease"` | 부드럽게 바뀔 때의 속도 곡선 |
| `retro_term.redraw` | `0.0` | 다시 그리는 간격(초). `0` = 매 프레임 (깜빡임·노이즈가 움직임) |

### 7-2. 효과 값 (`retro_term.settings`)

**색**

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `strength` | `1.0` | 전체 세기 (0 = 원래 화면) |
| `phosphor` | `"#5cff8a"` | **형광체 색**: 글자와 밝은 곳이 빛나는 색. `"#ffb000"` 호박색, `"#c8f0ff"` 하늘색, `"#e8e8e8"` 흰색 |
| `background` | `"#061208"` | **바탕색**: 가장 어두운 곳의 색. `"#000000"` 검정, `"#1f6aa0"` 파란 바탕 |
| `color_keep` | `0.0` | 원래 색 남기기. 0 = 형광체 한 가지 색, 1 = 원래 색, 0.3 = 원래 색이 살짝 |
| `brightness` | `1.1` | 밝기 |
| `contrast` | `1.1` | 대비 |
| `ambient` | `0.15` | 유리에 비친 빛 (화면 가운데가 은은하게 밝음) |

**빛**

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `bloom` | `0.6` | 빛 번짐: 밝은 글자 주변으로 빛이 퍼짐 (0~2) |
| `bloom_size` | `3.0` | 번짐 크기(픽셀) |
| `flicker` | `0.04` | 화면 전체 밝기 깜빡임 |
| `glow_line` | `0.25` | 위에서 아래로 지나가는 밝은 줄 |
| `glow_line_speed` | `0.12` | 밝은 줄 속도 (1초에 화면 높이의 몇 배. 0.12 = 약 8초에 한 번) |

**화면 결**

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `raster` | `"scanlines"` | `"none"` 없음, `"scanlines"` 가로 주사선, `"pixels"` 픽셀 격자, `"subpixels"` RGB 서브픽셀 |
| `raster_size` | `3.0` | 결 간격(게임 화면 픽셀) |
| `raster_strength` | `0.45` | 결 진하기. 진해진 만큼 밝기는 알아서 보정 |
| `static_noise` | `0.06` | 정적 노이즈 |
| `jitter` | `0.0` | 떨림 (화면이 미세하게 덜덜) |
| `rgb_shift` | `0.0` | RGB 어긋남(픽셀) |

**곡면 CRT** (이 효과만의 값)

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `crt` | `True` | 곡면 CRT 켜기. `False`면 평평한 화면 (아래 값은 무시) |
| `curvature` | `0.25` | 휘어짐 (0 = 평평, 0.6 = 많이 휜 TV) |
| `vignette` | `0.35` | 가장자리 어둡게 |
| `frame` | `True` | 화면 둘레에 테두리(모니터 틀) |
| `frame_size` | `0.035` | 테두리 두께 (화면 크기의 비율) |
| `frame_color` | `"#1c1c1a"` | 테두리 색 |
| `frame_reflect` | `0.35` | 테두리에 비친 화면 빛 |
| `corner` | `0.05` | 화면 모서리 둥글기 |

**VHS** (이 효과만의 값. VHS_CRT 효과와 따로)

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `vhs` | `False` | VHS 켜기 |
| `vhs_roll` | `0.5` | 위에서 아래로 흐르는 띠 세기 |
| `vhs_roll_speed` | `1.0` | 띠 속도 (1 = 약 12초에 한 번) |
| `vhs_wobble` | `0.4` | 수평 흔들림 (줄마다 옆으로 출렁임) |
| `vhs_noise` | `0.4` | 띠가 지나갈 때 지직거림 |

### 7-3. 프리셋

| 이름 | 모습 |
|---|---|
| `"green"` | 녹색 형광체 + 검은 녹색 바탕 (기본과 같음) |
| `"blue"` | 파란 바탕에 밝은 하늘색 글자 |
| `"amber"` | 호박색 형광체 |
| `"white"` | 흰색 형광체 (흑백 모니터) |
| `"flat"` | 곡면·테두리 없이 색과 결만 |
| `"broken"` | 고장 난 화면 (VHS 켜고 강하게, 떨림·RGB 어긋남) |

`retro_term.set()`, `preset()`, `reset()`, `off()`, `on()`, `retro_term.Set()`, `retro_term.Preset()`, `retro_term.Toggle()`은 VHS의 같은 이름과 똑같이 동작합니다(11-4). 켜기·끄기 값(`crt`, `vhs`, `frame`)과 `raster`는 `duration`을 줘도 바로 바뀝니다.

### 7-4. 터미널 글꼴로 대사 쓰기

셰이더는 글꼴을 못 바꿉니다. 그림 같은 터미널 글씨를 원하면 대사 글꼴을 플러그인에 들어 있는 **Neo둥근모**(픽셀 글꼴)로 바꿉니다.

```renpy
## 이 대사만 (ui_kit 대사 스타일이 있을 때)
e "접속 중…" (fx="retro_term", font="screen_fx/fonts/neodgm.ttf", size=32)

## 게임 전체 (gui.rpy)
define gui.text_font = "screen_fx/fonts/neodgm.ttf"
```

Neo둥근모는 16의 배수 크기(16, 32, 48)에서 가장 또렷합니다.

### 7-5. 알아 둘 점

- **클릭 판정**: 곡면 CRT의 휘어짐과 테두리(`frame_size`)는 눈에 보이는 화면만 바꾸고 버튼의 클릭 영역은 그대로입니다. 가장자리 버튼의 보이는 위치와 클릭 위치가 어긋날 수 있으니, 메뉴가 가장자리에 있으면 `curvature`·`frame_size`를 줄이세요.
- **글자 빼기와 같이 쓸 때**: 뺀 대사창은 휘지 않고 반듯하게 위에 떠서, 테두리 위에 겹쳐 보일 수 있습니다.
- **성능**: 빛 번짐이 픽셀마다 12곳을 더 읽습니다. 아주 느린 PC에서는 `bloom = 0`.
- **잔상(burn-in)은 없습니다**: 앞 프레임을 기억해야 하는 효과라 렌파이 셰이더로는 넣지 않았습니다.
- 편집기 "화면 효과" 탭 → **"레트로 터미널"** 버튼에서 색·빛·화면 결·곡면 CRT·VHS 묶음으로 막대를 고칠 수 있습니다.

---

## 8. 게임보이 (`gameboy_config.rpy`)

옛날 휴대용 게임기의 LCD 화면처럼 바꿉니다. 화면을 **큰 점**으로 나누고, 밝기에 따라 **4가지 색(또는 2가지 색)** 으로만 칠합니다.

- 기본 효과가 아니라서 `use("gameboy")`나 대사 괄호 `fx="gameboy"`로 켭니다. 쓰는 동안 VHS 덮개는 `gameboy.overlay`(기본 켬)대로.
- 글자 빼기의 기본은 **아무것도 안 뺌**입니다. 대신 빼지 않은 글자(대사·선택지·메뉴)는 **4색만 입히고 점으로 쪼개지 않아서** 작은 대사도 그대로 읽힙니다(`text_pixel = False`). 장면(배경·캐릭터)만 점으로 바뀝니다.
- 평평한 LCD 화면만 보이게 하려면 `define gameboy.overlay = False`(덮개 끔) 또는 `use("gameboy", overlay=False)`.

```renpy
label flashback:
    scene bg corridor
    $ screen_fx.use("gameboy")                        # 게임보이 화면으로 (TV가 꺼졌다 켜지며)
    e "어릴 때 하던 게임 화면 같다."

    $ gameboy.set(mode="pixel")                       # 픽셀화로 (무늬 없이 딱 끊김)
    e "색이 딱딱 끊겨 보인다."

    $ gameboy.preset("blood", duration=1.0)           # 1초 동안 붉은 화면으로
    e "……화면이 붉어졌다."

    $ gameboy.set(pixel_size=24.0, duration=2.0)      # 2초 동안 점이 점점 커짐 (모자이크처럼)
    $ screen_fx.clear()                               # 선택취소: VHS로
```

### 8-1. 디더링과 픽셀화 (`mode`)

| | 디더링 `"dither"` (기본) | 픽셀화 `"pixel"` |
|---|---|---|
| 색과 색 사이의 밝기 | **점 무늬**(바둑판·격자)로 섞어서 표현 | 가장 가까운 색으로 **딱 끊음** |
| 그러데이션·그림자 | 부드럽게 넘어감 (점 무늬의 밀도로) | 계단처럼 띠가 생김 |
| 어울리는 그림 | 사진 같은 CG, 어두운 장면, 빛 | 단순한 그림, 도트 그림, 넓은 면 |

```renpy
$ gameboy.set(mode="dither")                    # 디더링
$ gameboy.set(mode="pixel")                     # 픽셀화
$ gameboy.set(dither="8x8")                     # 더 고운 무늬 (단계가 많아서 그러데이션이 더 부드러움)
$ gameboy.set(dither_strength=0.5)              # 색이 바뀌는 근처에만 무늬 (넓은 면은 한 색으로)
```

- 두 방식 모두 `pixel_size`(점 하나의 크기)로 화면을 나눕니다. 1280×720 게임에서 `4` = 가로 320점, `6` = 213점, `2` = 640점.
- 점 크기는 정수만 씁니다(3.5는 4로). 화면 가운데를 기준으로 나눠서, 화면 크기가 점 크기로 나눠떨어지지 않으면 가장자리 점이 조금 잘립니다.
- `dither_strength = 0`은 픽셀화와 같습니다.

### 8-2. 전체 설정

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `gameboy.enabled` | `True` | 켜기·끄기 |
| `gameboy.overlay` | `True` | 이 효과를 쓰는 동안 VHS 덮개를 기본으로 켤지. `False`면 평평한 LCD만 (5-1) |
| `gameboy.exclude` | `()` | 글자 빼기 (3-8). 빼지 않은 글자를 어떻게 그릴지는 `text_pixel` |
| `gameboy.settings` | (아래 표) | 효과 값 |
| `gameboy.presets` | 아래 참고 | 게임 중에 한 번에 바꿀 값 묶음 |
| `gameboy.warper` | `"ease"` | 부드럽게 바뀔 때의 속도 곡선 |
| `gameboy.redraw` | `0.0` | 다시 그리는 간격(초). `0` = 매 프레임 |

### 8-3. 효과 값 (`gameboy.settings`)

**화면**

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `strength` | `1.0` | 전체 세기 (0 = 원래 화면) |
| `mode` | `"dither"` | 표현 방식: `"dither"` 디더링 / `"pixel"` 픽셀화 (8-1) |
| `pixel_size` | `4.0` | 점 하나의 크기(게임 화면 픽셀) |
| `dither` | `"4x4"` | 디더링 무늬: `"4x4"` 굵은 무늬 / `"8x8"` 고운 무늬 |
| `dither_strength` | `1.0` | 디더링 세기 (1 = 고르게 섞음, 0.5 = 색이 바뀌는 근처에만, 0 = 무늬 없음) |
| `text_pixel` | `False` | 글자도 점으로 쪼갤지. `False` = 글자 층은 색만 바뀜(읽힘), `True` = 화면 전체를 한꺼번에 점으로 |

**색**

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `colors` | `4` | 색 수: `4` 또는 `2`(1번과 4번 색만 씀) |
| `color1` | `"#1c3f04"` | 1번: 가장 어두운 색 (검은 곳, 그림자) |
| `color2` | `"#456306"` | 2번: 어두운 색 |
| `color3` | `"#74870a"` | 3번: 밝은 색 |
| `color4` | `"#939f06"` | 4번: 가장 밝은 색 (흰 곳, 꺼진 LCD 바탕) |
| `brightness` | `1.0` | 밝기 (크면 밝은 색이 많아짐) |
| `contrast` | `1.0` | 대비 (크면 1번·4번 색이 많아지고 중간 색이 줄어듦) |
| `gamma` | `1.0` | 감마 (0.6 = 어두운 곳이 밝아짐, 1.5 = 더 어두워짐). 어두운 CG가 1번 색으로 뭉개지면 0.6~0.8 |

**LCD**

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `grid` | `0.4` | 점 사이 틈: 점과 점 사이로 밝은 바탕이 비침 (0 = 없음) |
| `grid_width` | `0.25` | 틈 두께 (점 크기의 비율. 0.25 = 점 4픽셀 중 1픽셀) |
| `shadow` | `0.4` | 점 그림자: 어두운 점의 그림자가 오른쪽 아래로 비침 (0 = 없음) |
| `shadow_offset` | `0.5` | 그림자 거리 (점 하나 = 1) |
| `texture` | `0.2` | LCD 얼룩: 비스듬한 결과 넓은 얼룩 (0 = 없음). 움직이지 않음 |

### 8-4. 프리셋

| 이름 | 모습 |
|---|---|
| `"dmg"` | 올리브 초록 (기본과 같음) |
| `"green"` | 선명한 초록 (도트 그림에서 흔히 쓰는 게임보이 4색) |
| `"pocket"` | 회색 (흑백에 가까운 화면) |
| `"light"` | 청록 백라이트 |
| `"bw"` | 흑백 |
| `"blood"` | 검붉은 색과 바랜 뼛빛 (공포 장면용) |
| `"1bit"` | 2색 (검정과 종이색), 고운 8×8 무늬, 점 2픽셀, 틈·그림자 없음 |
| `"clean"` | LCD 질감 없이 디더링 무늬만 (틈·그림자·얼룩 끔) |

`gameboy.set()`, `preset()`, `reset()`, `off()`, `on()`, `gameboy.Set()`, `gameboy.Preset()`, `gameboy.Toggle()`은 VHS의 같은 이름과 똑같이 동작합니다(11-4). `mode`, `dither`, `colors`, `text_pixel`은 `duration`을 줘도 바로 바뀌고, 색과 숫자 값은 부드럽게 바뀝니다. `pixel_size`는 한 단계씩 커지거나 작아집니다.

프리셋은 그 프리셋에 적힌 값만 바꾸고 앞에서 `set()`으로 바꾼 값은 지웁니다. 그래서 "붉은 화면 + 픽셀화"는 순서대로:

```renpy
$ gameboy.preset("blood")
$ gameboy.set(mode="pixel")
```

### 8-5. 글자 (`text_pixel`)

| `text_pixel` | 장면(배경·캐릭터) | 빼지 않은 글자(대사·선택지·메뉴) |
|---|---|---|
| `False` (기본) | 점으로 나누고 4색 | **4색만 입힘** (모양은 그대로라 읽힘. 점 사이 틈·그림자 없음) |
| `True` | 점으로 나누고 4색 | 똑같이 점으로 나누고 4색 (화면 전체를 한꺼번에) |

- `True`로 글자까지 점으로 쪼갤 때는 글자 크기가 점 크기의 16배쯤은 되어야 또렷합니다(점 2픽셀이면 글자 32, 점 4픽셀이면 글자 64).
- 픽셀 글꼴과 잘 어울립니다. 플러그인에 들어 있는 Neo둥근모(16의 배수 크기에서 또렷):

```renpy
e "삐빅." (fx="gameboy", font="screen_fx/fonts/neodgm.ttf", size=32)    # 이 대사만 (ui_kit 대사 스타일이 있을 때)
```

- `False`일 때 메뉴·화면 층(저장·불러오기·환경설정 화면, `show screen`으로 띄운 화면)은 그림까지 전부 "색만" 바뀝니다. 스크린 안의 그림도 점으로 만들려면 효과에서 `"screens"`를 빼고 그 그림에 `at screen_fx.scene`(3-9)을 붙이세요.

### 8-6. 알아 둘 점

- **어두운 CG**는 1번·2번 색 사이를 무늬로 섞어서 화면이 무늬로 가득해 보일 수 있습니다. `gamma`를 0.6~0.8로 낮추거나(어두운 곳이 밝아짐), `dither_strength`를 0.5로, 또는 `mode="pixel"`.
- **움직이는 그림**(흔들리는 캐릭터, 이동하는 배경)은 점 경계에서 무늬가 깜빡일 수 있습니다. 진짜 게임기 화면도 그렇습니다.
- **잔상은 없습니다**: 진짜 LCD는 반응이 느려 앞 화면이 끌리듯 남지만, 앞 프레임을 기억해야 하는 효과라 렌파이 셰이더로는 넣지 않았습니다.
- **화면 크기**는 그대로입니다. 게임보이처럼 가운데에 작은 화면을 두는 모양은 없습니다.
- **성능**: 점마다 원래 화면을 8곳 읽습니다(점 그림자 포함). 글자를 색만 입힐 때는 층마다 씌우므로, 아주 느린 PC에서는 `shadow = 0`이나 `text_pixel = True`가 조금 가볍습니다.
- 편집기 "화면 효과" 탭 → **"게임보이"** 버튼에서 화면·색·LCD 묶음으로 고칠 수 있습니다. 4가지 색은 버튼을 누르면 색 고르기 창이 열립니다.

---

## 9. 편집기로 고치기 (UI Kit이 있을 때)

개발 모드에서 Shift+M으로 편집기를 열고 **T**로 탭을 넘깁니다.

| 탭 | 쓸 수 있을 때 | 고칠 수 있는 것 | Ctrl+S 하면 |
|---|---|---|---|
| 화면 효과 → VHS 덮개 / ASCII / 레트로 터미널 / 게임보이 / (새 효과) | 어디서나 | 켜기(VHS는 범위도), **덮개 켬/끔**(효과마다), **글자 빼기**(대사와 이름, 선택지, 메뉴와 화면, 안 뺌, 전부 뺌), 고칠 대상(기본 설정, 프리셋), 효과 값 막대(VHS의 가장자리 휘어짐 등), 색, 고르기 버튼, **"이 대사부터 이 효과"**, **"이 줄부터 이 효과"**(4.1) 버튼 | `<효과 이름>_layout.rpy` (`vhs_crt_layout.rpy`, `ascii_layout.rpy`, `retro_term_layout.rpy`, `gameboy_layout.rpy` …) |
| 화면 효과 → 기본 효과, 전환 | 어디서나 | 기본 효과, **덮개 켬/끔**, 바꿀 때 전환, TV 시간, 두께, 섬광, 지직거림, 소리 음량, 서서히 시간, 기다림, 클릭으로 건너뛰기, **미리 보기** | `screen_fx_layout.rpy` |
| 화면 효과 → 줄에 넣기 (4.1) | 게임 중 | 줄 고르기(앞뒤, 번호, 목록), 화면 효과, 덮개 그대로/켬/끔, 덮개 휘어짐, 커서 자리(4.2), 전환, 넣은 줄 지우기 | **원고의 고른 줄 바로 위**에 `$ screen_fx.use(…)` 같은 줄 |
| 대사 → "화면 효과" 줄 | 대사가 떠 있을 때 | 이 대사부터 켤 효과, 선택취소, 이 줄의 전환, **덮개 그대로/켬/끔, 덮개 휘어짐, 커서 자리(4.2)**, 글자 빼기, 전환 미리 보기 | **원고의 그 대사 줄** `(fx="…", fx_overlay=…, fx_warp=…, fx_cursor=…)` |
| 타이틀 일렁임 | 타이틀 화면 | 켜기, 적용 대상, 세기, 물결 크기, 속도, 소용돌이, 반사광, 품질, 타이틀의 다른 화면 | `watermorph_layout.rpy` |

### 9-1. "화면 효과" 탭

1. 위쪽 **"효과:"** 버튼으로 고칠 효과(VHS 덮개, ASCII …) 또는 **"기본 효과, 전환"** 을 고릅니다.
2. 효과를 고르면 **그 효과가 화면에 보입니다.** 이 탭은 **효과의 설정값**을 고치는 곳이라, 지금 장면에 쓰는 효과는 바뀌지 않습니다. 패널에 "게임의 지금 장면: …"이 같이 나옵니다.
   - **지금 장면에 쓰려면** 효과 페이지 아래의 버튼 둘 중 하나를 누릅니다. 어느 쪽이든 **Ctrl+S**를 눌러야 원고에 적힙니다.
     - **"이 대사부터 이 효과"**(VHS 덮개 페이지는 "이 대사부터 덮개 켜기"): 대사가 떠 있을 때만. 대사 탭으로 넘어가 그 대사 줄 괄호에 `fx="…"`가 들어갑니다. (9-2)
     - **"이 줄부터 이 효과"**(VHS 덮개 페이지는 "이 줄부터 덮개 켜기", 4.1): "줄에 넣기" 페이지로 넘어가 지금 줄과 그 효과가 골라집니다. 줄을 바꿀 수 있고, 그 줄 위에 `$ screen_fx.use("…")`가 들어갑니다. (9-4)
   - 효과 페이지(VHS 덮개 빼고)의 **"덮개(VHS)" 켬/끔**은 그 효과를 쓰는 동안 덮개를 기본으로 켤지(`<이름>.overlay`)입니다.
3. **"고칠 대상"** 을 프리셋으로 바꾸면 그 프리셋을 미리 보면서 고칩니다. 프리셋에 들어 있는 값 옆의 "빼기"를 누르면 그 값은 기본 설정을 따릅니다.
4. 색 값(ASCII의 "글자 색"·"바탕색", 게임보이의 4가지 색 등)은 버튼을 누르면 색 고르기 창이 열립니다. ASCII의 "글자 목록"·"색 입히기"는 버튼으로 고릅니다.
   **"글자 빼기"** 줄에서 [대사와 이름] [선택지] [메뉴와 화면]을 눌러 켜고 끄면(켜진 것 = 뺌) 바로 화면에 보입니다. [안 뺌]·[전부 뺌]은 한 번에 바꾸기. 저장하면 `<효과 이름>_layout.rpy`에 `"exclude": ("say",)`처럼 적힙니다.
5. **Ctrl+S**: 바꾼 효과마다 `<효과 이름>_layout.rpy`, 기본 효과와 전환은 `screen_fx_layout.rpy`로 저장됩니다. 그 효과를 쓰는 장면에 바로 적용됩니다. (예: ASCII 설정을 저장해도, 지금 장면이 "효과 없음"이면 화면은 그대로입니다. ASCII를 쓰는 대사에서 바뀐 값이 보입니다)
6. **Ctrl+C**: 지금 고르고 있는 것(효과의 기본 설정·프리셋, 또는 전환 설정)을 설정 파일에 붙여넣을 코드로 복사합니다.

- 편집하는 동안에는 `scope`, 플레이어가 끈 상태, 게임 중에 `set()`으로 바꾼 값과 상관없이 편집 중인 값을 보여줍니다. 저장하는 것은 설정(기본값)뿐이고, 세이브에 들어가는 게임 중 값은 건드리지 않습니다.
- 편집기에서 **다른 탭**(타이틀 메뉴·선택지 등)을 쓰는 동안에도 화면 효과가 보입니다(3.4). 끄고 싶으면 V. (9-3)
- 편집기 패널은 효과가 닿지 않는 맨 위 층에 그려져서, 효과를 켠 채로도 선명합니다.

### 9-2. 대사 탭의 "화면 효과" 줄

대사가 떠 있을 때 Shift+M → 대사 탭 아래쪽에 이런 줄이 있습니다.

```
화면 효과:    [그대로] [선택취소 → 기본(효과 없음)] [ASCII] [레트로 터미널] [게임보이] [효과 없음]
전환:         [TV 껐다 켜기] [서서히] [바로] [전환 미리 보기]   [화면 효과 보기(V): 켬]
덮개(VHS):    [그대로] [켬] [끔]
덮개 휘어짐:  [그대로] [설정값] [0 평평] [0.5] [1 기본] [2] [3] [5 크게]
커서:         [그대로] [설정값] [효과까지] [덮개 밑] [효과 안 받음]
글자 빼기:    [효과 설정대로] [대사와 이름] [선택지] [메뉴와 화면]
```

1. 효과 버튼을 누르면 **"이 대사부터 그 효과"** 가 됩니다. "선택취소"는 기본 효과로 돌아가기, "그대로"는 이 줄에서 바꾸지 않기(괄호의 `fx`를 지움)입니다.
2. "덮개(VHS)", "덮개 휘어짐", "커서"(4.2) 줄은 효과를 바꾸지 않는 대사에서도 고를 수 있습니다. 커서는 `fx_cursor="top"`처럼 적힙니다(5-3). 켬/끔은 `fx_overlay=True/False`, 휘어짐은 `fx_warp=3.0`처럼 적히고, "그대로"는 괄호에서 그 값을 지웁니다(앞에서 이어짐). 휘어짐의 "설정값"은 `fx_warp="default"`(설정 파일 값으로 돌아감).
3. "전환", "글자 빼기" 줄은 이 줄에서 효과를 바꿀 때만 버튼이 보입니다. 기본 전환과 다른 것을 고르면 `fx_transition=`, 글자 빼기 버튼을 누르면 `fx_exclude=`도 같이 적힙니다(켜진 버튼 = 뺌). "효과 설정대로"는 괄호에서 그 값을 지웁니다.
4. 대사 탭도 화면 효과를 켠 채로 보여줍니다(3.4). 글자를 정확히 끌어 놓을 때 효과가 방해되면 **"화면 효과 보기(V)"** 버튼이나 V 키로 끕니다. "전환 미리 보기"는 이 줄의 전환을 다시 보여줍니다(누르면 효과 보기도 켜짐).
5. 패널 위쪽 안내 줄에 "화면 효과: 이 줄부터 ASCII + 덮개 VHS (휘어짐 1), …" 또는 "화면 효과: 효과 없음 + 덮개 VHS … (앞에서 이어짐)"이 나옵니다.
6. **Ctrl+S** 하면 원고의 그 대사 줄 괄호에 바로 적히고 원고를 다시 불러옵니다. 렌파이는 고친 줄을 같은 줄로 알아보지 못해서, **그 앞 대사(저장 지점)부터** 다시 나옵니다. 한 번 넘기면 고친 줄이 보입니다.

```renpy
## 저장 전
e "어? 화면이…"
## 대사 탭에서 [게임보이] → [서서히] → Ctrl+S 하면
e "어? 화면이…" (fx="gameboy", fx_transition="fade")
## [ASCII] → 덮개 [끔] → 글자 빼기 [대사와 이름] → Ctrl+S 하면
e "어? 화면이…" (fx="ascii", fx_overlay=False, fx_exclude=("say",))
## 효과는 그대로, 덮개 휘어짐 [3] → Ctrl+S 하면
e "어? 화면이…" (fx_warp=3.0)
## 커서 [덮개 밑] → Ctrl+S 하면
e "어? 화면이…" (fx_cursor="overlay")
```

`*_layout.rpy`의 값은 설정 파일의 같은 값보다 **우선**합니다. 설정 파일로 옮기고 싶으면 Ctrl+C로 복사해 붙여넣고 `*_layout.rpy`를 지우세요.

> 편집기 탭은 `ui_kit` 2.3 이상에서 동작합니다. 글자 빼기 줄은 2.5 이상, 덮개 켬/끔과 휘어짐 줄은 2.9 이상, "줄에 넣기"와 "이 줄부터 이 효과" 버튼은 3.0 이상.

### 9-3. 편집 중에도 효과 보기 (3.4)

편집기(Shift+M)를 열어도 화면 효과가 그대로 보이고, 편집기 패널과 안내 글자는 효과 밖이라 깨끗하게 위에 보입니다.

| 하고 싶은 것 | 방법 |
|---|---|
| 편집 중에 효과를 잠깐 끄기 / 다시 켜기 | 편집기에서 **V** (대사 탭의 "화면 효과 보기(V)" 버튼도 같음) |
| 처음부터 꺼 둔 채 편집 (3.3까지의 방식) | `screen_fx_config.rpy`에 `define screen_fx.editor_preview = False` |
| 처음부터 켠 채 편집 (기본) | `define screen_fx.editor_preview = True` |

```py
## screen_fx_config.rpy
define screen_fx.editor_preview = True     # 편집 중에도 효과 보이기 (기본)
define screen_fx.editor_preview = False    # "화면 효과" 탭이 아니면 효과를 잠시 끔
```

- V로 바꾼 값은 게임을 끌 때까지 유지되고, 다시 켜면 설정 파일 값으로 돌아갑니다.
- "화면 효과" 탭에서는 이 값과 상관없이 늘 고치는 효과를 보여줍니다.
- VHS·CRT, 레트로 터미널(곡면 CRT)처럼 **화면을 휘는 효과**는 가장자리에서 눈에 보이는 자리와 마우스로 눌리는 자리가 조금 어긋납니다. 그림이나 메뉴 항목을 정확히 끌어 놓을 때는 V로 잠깐 끄세요.
- 타이틀 일렁임(`watermorph`)도 같은 값을 따릅니다.

### 9-4. 줄에 넣기 (4.1): 아무 줄에서나 효과 바꾸기

대사 괄호(`fx=`)는 대사 줄에만 쓸 수 있습니다. `scene`, `show`, `with`, `$` 줄처럼 **대사가 아닌 줄에서** 효과를 바꾸려면 그 줄 바로 위에 `$ screen_fx.use(…)` 줄을 넣어야 하는데, 이걸 편집기가 대신 해 줍니다.

Shift+M → "화면 효과" 탭 → 위쪽 **"효과:"** 에서 **[줄에 넣기]** 를 누르면 이런 패널이 나옵니다.

```
[< []] [[] >]  줄 번호 [ 88 ]  [지금 줄로]  [L 목록 펴기]
  87  $ screen_fx.clear()
  88  * scene fx_bg                ← 고른 줄 (밝게 표시. 분홍 번호 = 게임이 지금 있는 줄, * = 저장 안 한 변경)
  89  with dissolve
  90  e "여기는 어디지?"
화면 효과:    [그대로] [선택취소 → 효과 없음] [ASCII] [레트로 터미널] [게임보이]
덮개(VHS):    [그대로] [켬] [끔]
덮개 휘어짐:  [그대로] [설정값] [0 평평] [0.5] [1 기본] [2] [3] [5 크게]
커서:         [그대로] [설정값] [효과까지] [덮개 밑] [효과 안 받음]
전환:         [설정대로] [TV 껐다 켜기] [서서히] [바로]
[이 줄 위의 효과 줄 지우기] [이 줄 되돌리기] [모두 버리기]
```

1. **줄 고르기**
   - 처음에는 **게임이 지금 있는 줄**이 골라져 있습니다. [지금 줄로]를 누르면 다시 그 줄로.
   - [< []] [[] >] 또는 키보드 `[` `]`: 한 줄씩 앞뒤로. 빈 줄, 주석, `label` 줄, `define`/`image`/`screen` 줄, 선택지 줄(`"도망친다":`)처럼 넣을 수 없는 줄은 건너뜁니다.
   - **줄 번호** 칸을 누르고 숫자를 친 뒤 Enter: 그 줄로 바로 갑니다. (원고 파일의 줄 번호. 편집기 아래에 원고를 열어 두면 편함)
   - [L 목록 펴기] 또는 L 키: 고른 줄 근처 7줄이 나오고, 눌러서 고릅니다.
2. **고르기**: 화면 효과, 덮개, 덮개 휘어짐, 커서(4.2), 전환. "그대로"는 이 줄에서 바꾸지 않기(앞에서 이어짐), "설정대로"는 기본 전환. 고르는 동안 화면에 바로 미리 보입니다.
3. **Ctrl+S**: 고른 줄 바로 위에 줄이 들어가고 원고를 다시 불러옵니다. 들여쓰기는 그 줄에 맞춥니다.
4. 같은 줄에서 다시 고르고 저장하면 **앞에 넣은 효과 줄을 바꿔 씁니다**(줄이 쌓이지 않음). [이 줄 위의 효과 줄 지우기]를 누르고 Ctrl+S 하면 넣은 줄이 지워집니다. 편집기는 `$ screen_fx.use(`, `$ screen_fx.clear(`, `$ screen_fx.set_overlay(`, `$ screen_fx.set_warp(`, `$ screen_fx.set_cursor(`로 시작하는 줄을 "효과 줄"로 봅니다. 직접 적은 같은 줄도 바꿔 쓰거나 지울 수 있습니다.
5. 저장 전 [이 줄 되돌리기]는 이 줄에서 고른 것만, [모두 버리기]는 이 페이지에서 고른 것 전부를 버립니다.

```renpy
## 저장 전
label start:
    scene fx_bg
    with dissolve

## 88번째 줄(scene fx_bg)을 고르고 [ASCII] → 덮개 [끔] → 전환 [서서히] → Ctrl+S
label start:
    $ screen_fx.use("ascii", overlay=False, transition="fade")
    scene fx_bg
    with dissolve

## 같은 줄에서 [선택취소 → 효과 없음] → Ctrl+S (앞에 넣은 줄을 바꿔 씀)
    $ screen_fx.clear()
    scene fx_bg

## 효과는 [그대로], 덮개 휘어짐 [3] → Ctrl+S
    $ screen_fx.set_warp(3)
    scene fx_bg

## 덮개만 [켬] → Ctrl+S
    $ screen_fx.set_overlay(True)
    scene fx_bg

## 효과와 덮개 휘어짐을 같이 고르면 두 줄이 들어감
    $ screen_fx.use("gameboy")
    $ screen_fx.set_warp(0)
    scene fx_bg

## 커서만 [효과 안 받음] → Ctrl+S (4.2)
    $ screen_fx.set_cursor("top")
    scene fx_bg

## 효과 [ASCII] + 커서 [덮개 밑]이면 한 줄에 같이
    $ screen_fx.use("ascii", cursor="overlay")
    scene fx_bg
```

| 이럴 때 | 쓰는 곳 | 원고에 적히는 모습 |
|---|---|---|
| 대사가 나올 때부터 바꾸기 | 대사 탭 "화면 효과" 줄 (9-2) | `e "어? 화면이…" (fx="ascii")` |
| 배경이 바뀌는 줄, `with` 줄, `$` 줄에서 바꾸기 | 화면 효과 탭 "줄에 넣기" (9-4) | `$ screen_fx.use("ascii")` + 그 줄 |
| 효과의 모양(세기, 색, 글자 크기 등) 바꾸기 | 화면 효과 탭 효과 페이지 (9-1) | `<효과 이름>_layout.rpy` |

- 렌파이는 고친 줄을 같은 줄로 알아보지 못해서, 저장하면 **그 앞의 대사(저장 지점)부터** 다시 나옵니다.
- 원고 저장 전에 원래 파일은 `game/ui_kit_backup/`에 복사됩니다. 잘못 넣었으면 거기서 되돌리세요.
- `menu`, `if` 안쪽 줄에도 넣을 수 있습니다(그 줄과 같은 들여쓰기로 들어감). 선택지 줄(`"도망친다":`)은 목록에 없습니다. 선택지를 고른 뒤에 바꾸려면 그 안쪽 첫 줄을 고르세요.
- 이 기능은 `ui_kit` 3.0의 원고 쓰기 도구(`script_edit`)를 씁니다. 2.9 이하와 같이 쓰면 줄 목록이 비고, "이 줄부터 이 효과"를 누르면 "원고 쓰기 도구(UI Kit 3.0 이상)가 없습니다."가 나옵니다.

---

## 10. 타이틀 일렁임 (`watermorph_config.rpy`)

액체 표면의 높낮이를 시간에 따라 계속 바뀌는 노이즈로 만들고, 그 기울기만큼 화면을 밀어 굴절처럼 보이게 합니다. 표면에 비친 빛(반사광)도 더할 수 있습니다.

- 타이틀 화면(`main_menu` 스크린)이 떠 있을 때만 켜집니다. 게임 플레이 중에는 적용되지 않습니다.
- `ui_kit` 타이틀 메뉴의 배경 영상(`tmenu.background_movie`)과 같이 쓸 수 있습니다.

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `watermorph.enabled` | `True` | 켜기·끄기 |
| `watermorph.target` | `"screen"` | `"screen"`: 화면 전체(배경 + 메뉴 글자), `"background"`: 배경만(글자는 선명) |
| `watermorph.amount` | `6.0` | 일렁임 세기(픽셀) |
| `watermorph.scale` | `180.0` | 물결 하나의 크기(픽셀). 클수록 느긋하고 큰 물결 |
| `watermorph.speed` | `0.6` | 흐르는 속도 |
| `watermorph.flow` | `1.2` | 소용돌이 정도. 0이면 단순한 물결 |
| `watermorph.shine` | `0.15` | 표면에 비친 빛. 0이면 없음. 검은 배경에서는 연기처럼 보입니다 |
| `watermorph.quality` | `2` | 1~3. 높을수록 섬세하지만 계산이 많음 |
| `watermorph.in_title_menus` | `False` | 타이틀에서 연 환경설정·불러오기 화면에도 적용 (`"screen"`일 때) |

- **클릭 판정**: 셰이더는 눈에 보이는 화면만 휘게 하고 버튼의 클릭 영역은 그대로 둡니다. `"screen"`일 때 `amount`를 크게 주면 보이는 글자와 클릭되는 자리가 어긋나니 8 이하를 권장합니다. 크게 일렁이게 하고 싶으면 `"background"`를 쓰세요.
- **성능**: 화면의 모든 픽셀마다 계산합니다. 저사양 PC나 모바일·웹을 생각한다면 `quality`를 1로 낮추세요.

---

## 11. VHS·CRT 효과 (`vhs_crt_config.rpy`)

VHS는 기본 효과 위에 덮는 **덮개 전용**입니다(4.0). 켜고 끄기와 왜곡 정도를 바꾸는 법은 5장, 아래는 덮개의 모양을 정하는 값 전체입니다.

### 11-1. 전체 설정

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `vhs_crt.enabled` | `True` | 효과 전체 켜기·끄기 |
| `vhs_crt.auto` | `True` | `True`: 화면 전체에 자동으로 씌움. `False`: 직접 씌움 (11-5 참고) |
| `vhs_crt.exclude` | `()` | 글자 빼기 (3-8). `("say",)`면 대사·이름은 깨끗하게 |
| `vhs_crt.scope` | `"all"` | `auto`일 때 범위. `"all"` 항상, `"game"` 게임 중에만, `"main_menu"` 타이틀(과 타이틀에서 연 메뉴, `splash`의 타이틀 전 페이지)에서만. 함수도 됨 (참일 때만 켜짐) |
| `vhs_crt.settings` | (아래 표) | 화면 효과 값 |
| `vhs_crt.presets` | `clean`, `broken` | 게임 중에 한 번에 바꿀 값 묶음 |
| `vhs_crt.warper` | `"ease"` | 부드럽게 바뀔 때의 속도 곡선 (ATL warper 이름) |
| `vhs_crt.redraw` | `0.0` | 다시 그리는 간격(초). `0` = 매 프레임. `1.0/30`이면 초당 30번 |

### 11-2. 화면 효과 값 (`vhs_crt.settings`)

적지 않은 값은 원본 셰이더의 기본값을 따릅니다. 이름에 오타가 있으면 게임을 시작할 때 어느 이름이 틀렸는지 오류 화면으로 알려줍니다.

| 이름 | 기본값 | 뜻 |
|---|---|---|
| `strength` | `1.0` | 효과 전체 세기. `0` 원래 화면 ~ `1` 효과 100% |
| `resolution` | `None` | 주사선·격자 개수 (가로, 세로). `None` = 게임 해상도의 절반 (1280×720이면 640×360) |
| `pixelate` | `True` | 칸마다 한 색으로 채워 도트 느낌 |
| `scanlines_opacity` | `0.4` | 가로 주사선 진하기 (0~1) |
| `scanlines_width` | `0.25` | 주사선 사이 틈 두께 (0~0.5) |
| `grille_opacity` | `0.3` | 세로 RGB 격자 진하기 (0~1) |
| `roll` | `True` | 위아래로 흐르는 VHS 띠 |
| `roll_speed` | `8.0` | 띠 속도. 양수 = 아래로, 음수 = 위로 |
| `roll_size` | `15.0` | 띠 크기 (0~100) |
| `roll_variation` | `1.8` | 띠 모양 변화 (0.1~5) |
| `distort_intensity` | `0.05` | 띠가 지나갈 때 화면이 옆으로 밀리는 정도 (0~0.2) |
| `noise_opacity` | `0.4` | 띠를 따라 생기는 지직거림 (0~1) |
| `noise_speed` | `5.0` | 지직거림 움직임 속도 |
| `static_noise_intensity` | `0.06` | 화면 전체 자글자글한 노이즈 (0~1) |
| `aberration` | `0.03` | 색 번짐 (-1~1) |
| `brightness` | `1.4` | 밝기 보정 (주사선·격자로 어두워진 만큼) |
| `discolor` | `True` | 바랜 VHS 색감 |
| `saturation` | `0.5` | 바랜 정도. `0` 원래 색 ~ `1` 흑백 (`discolor`일 때) |
| `contrast` | `1.2` | 대비 (`discolor`일 때) |
| `warp_amount` | `1.0` | 브라운관 가장자리 휘어짐 (0~5). `screen_fx.set_warp()`, 대사 괄호 `fx_warp=`로도 바꿈 (5-2) |
| `clip_warp` | `False` | 휘어서 생긴 바깥 검은 테두리를 투명하게 (이미지에 씌울 때 유용) |
| `vignette_intensity` | `0.4` | 가장자리를 어둡게 하는 범위 |
| `vignette_opacity` | `0.5` | 가장자리 어둡기 (0~1) |

### 11-3. 프리셋

```renpy
define vhs_crt.presets = {
    "broken": {
        "roll_speed": 20.0,
        "noise_opacity": 0.9,
        "aberration": 0.3,
    },
}
```

적은 값만 바뀌고 나머지는 `settings` 값을 따릅니다.

### 11-4. 게임 중에 바꾸기

```renpy
## 바로 바꾸기
$ vhs_crt.set(noise_opacity=0.9, aberration=0.3)

## 1초 동안 부드럽게 바꾸기
$ vhs_crt.set(distort_intensity=0.2, duration=1.0)

## 프리셋으로 바꾸기
$ vhs_crt.preset("broken", duration=0.5)

## 게임 중에 바꾼 값을 지우고 설정 파일 값으로
$ vhs_crt.reset(duration=1.0)

## 효과를 서서히 끄고 켜기 (strength만 바꿈)
$ vhs_crt.off(duration=2.0)
$ vhs_crt.on(duration=2.0)
```

- 바꾼 값은 **세이브·되감기에 같이 저장**됩니다. 새 게임을 시작하면 설정 값으로 돌아갑니다.
- 숫자 값은 `duration` 동안 부드럽게 바뀌고, 켜기·끄기 값(`roll`, `pixelate` 등)은 바로 바뀝니다.
- 순간적인 지직거림: `$ vhs_crt.preset("broken")` → `pause 0.3` → `$ vhs_crt.reset(duration=0.5)`
- 화면 버튼: `textbutton "지직" action vhs_crt.Set(noise_opacity=1.0, duration=0.3)`, `textbutton "고장" action vhs_crt.Preset("broken")`

### 11-5. 직접 씌우기 (`auto = False`)

화면 전체가 아니라 원하는 곳에만 씌우려면 `define vhs_crt.auto = False`로 두고 `vhs_crt.effect`를 씁니다.

```renpy
camera at vhs_crt.effect              ## 게임 장면(배경·캐릭터)에만. 대사창·메뉴는 그대로
camera                                ## 끄기

show tv_screen at vhs_crt.effect      ## 이미지 하나에만 (투명한 부분은 투명하게 유지)
```

- `auto = False`면 화면 전체에 자동으로 씌우는 VHS 덮개는 없고, `screen_fx.use("ascii")` 같은 기본 효과는 그대로 화면 전체에 켜집니다. 이때 `camera at vhs_crt.effect`는 따로 남아 있으니, 겹치지 않게 하려면 `camera`로 끄세요.

### 11-6. 플레이어가 끌 수 있게 하기

화면이 깜빡이고 흔들리는 효과라서, 눈이 피로하거나 깜빡임에 민감한 플레이어를 위해 **끄는 버튼을 넣어 두기를 권장**합니다. 환경설정 화면(`screens.rpy`의 `preferences` 스크린)에 넣습니다.

```renpy
vbox:
    style_prefix "check"
    label _("화면 효과")
    textbutton _("VHS 효과") action vhs_crt.Toggle()
```

플레이어의 선택은 게임을 껐다 켜도 유지됩니다(`persistent.vhs_crt_off`).

모든 화면 효과(VHS 덮개, 기본 효과, TV 전환 연출)를 한 번에 끄는 버튼은 `screen_fx.Toggle()`입니다(3-3).

```renpy
vbox:
    style_prefix "check"
    label _("화면 효과")
    textbutton _("화면 효과 전부") action screen_fx.Toggle()
    textbutton _("VHS만") action vhs_crt.Toggle()
```

### 11-7. 알아 둘 점

- **클릭 판정**: `warp_amount`가 크면 화면 가장자리 버튼의 보이는 위치와 클릭되는 위치가 어긋납니다. 기본값(1.0)에서 가장자리 기준 최대 수십 픽셀입니다. 메뉴가 가장자리에 있다면 `warp_amount`를 줄이거나, 메뉴 화면에서는 끄세요(`scope = "game"`, 또는 `camera at vhs_crt.effect`).
- **성능**: 저사양 PC·모바일·웹을 생각한다면 `redraw = 1.0/30`, `pixelate = False`, `noise_opacity = 0` 등으로 가볍게 하세요.
- **렌파이 버전**: 렌파이 7.4 이상의 모델 기반 렌더러가 필요합니다. `config.layer_transforms`가 없는 버전에서는 `auto`가 동작하지 않으니 `camera at vhs_crt.effect`를 쓰세요.

---

## 12. 새 효과 넣기 (셰이더 추가)

아래 **흑백(`mono`) 효과 코드가 견본**입니다. (4.0까지 들어 있던 흑백 효과 그대로. 흑백이 필요하면 이 두 파일을 그대로 넣어도 됩니다)

### 12-1. 견본: 흑백 효과 두 파일

`game/screen_fx/engine/mono.rpy` 로 저장 (엔진):

```renpy
## Screen FX — 흑백(mono) 효과 엔진 · 새 효과를 만들 때 복사해서 쓰는 견본
##
## 이 파일은 엔진입니다. 고치지 말고 mono_config.rpy에서 설정하세요.
##
## 화면을 흑백(또는 한 가지 색조)으로 바꾸고, 오래된 필름처럼 입자·깜빡임·
## 가장자리 어둡게를 더할 수 있습니다.
##
## ── 새 효과를 만들 때 (README.md "새 효과 넣기"에 자세히) ──────────────────────
##   1. 이 코드를 engine/<새 이름>.rpy로, 설정 코드를 <새 이름>_config.rpy로 저장
##   2. 두 파일에서 mono를 새 이름으로 모두 바꾸기 (이름공간, 셰이더 이름, 유니폼 u_mono_)
##   3. PARAMS(값 목록), GROUPS(편집기 막대), 셰이더 코드(_FRAGMENT)를 고치기
##   4. 설정 파일의 settings에 값을 적고, 게임에서 $ screen_fx.use("새 이름")
## ─────────────────────────────────────────────────────────────────────────────
##
## 이 플러그인이 만드는 이름:
##   store.mono             설정과 함수가 들어 있는 이름공간
##   셰이더 "mono.effect", 유니폼 u_mono_*
##   persistent.mono_off    플레이어가 이 효과를 끈 상태 (mono.Toggle())

init offset = 1

init -100 python in mono:

    VERSION = renpy.store.screen_fx.VERSION

    ## 값 이름 → (종류, 기본값)
    ## 종류: "float" 숫자, "bool" 켜기·끄기, "color" 색, "vec2" (가로, 세로)
    ## "strength"(전체 세기, 0~1)는 모든 효과에 꼭 있어야 합니다. 전환(서서히)에 씁니다.
    PARAMS = {
        "strength":   ("float", 1.0),
        "tint":       ("color", "#ffffff"),
        "brightness": ("float", 1.0),
        "contrast":   ("float", 1.1),
        "grain":      ("float", 0.08),
        "grain_size": ("float", 1.5),
        "flicker":    ("float", 0.03),
        "vignette":   ("float", 0.3),
    }

    ## 편집기 막대: (묶음 이름, [ (값 이름, 표시, 최소, 최대, 간격, 소수 자리) 또는 (값 이름, 표시, "bool"/"color") ])
    GROUPS = (
        ("기본", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("tint", "색 입히기", "color"),
            ("brightness", "밝기", 0.2, 2.0, 0.05, 2),
            ("contrast", "대비", 0.2, 3.0, 0.05, 2),
            )),
        ("필름", (
            ("grain", "입자(노이즈)", 0.0, 0.5, 0.01, 2),
            ("grain_size", "입자 크기 (픽셀)", 1.0, 6.0, 0.5, 1),
            ("flicker", "밝기 깜빡임", 0.0, 0.3, 0.01, 2),
            ("vignette", "가장자리 어둡게", 0.0, 1.0, 0.01, 2),
            )),
        )

    SHADER = "mono.effect"

    ## ── 셰이더 ──
    ## 유니폼 이름 = "u_mono_" + 값 이름. 종류에 따라 float / vec3(색) / vec2.

    _VARIABLES = """
        uniform sampler2D tex0;
        uniform float u_lod_bias;
        uniform float u_time;
        uniform vec2 u_model_size;
        attribute vec2 a_tex_coord;
        varying vec2 v_tex_coord;

        uniform float u_mono_strength;
        uniform vec3 u_mono_tint;
        uniform float u_mono_brightness;
        uniform float u_mono_contrast;
        uniform float u_mono_grain;
        uniform float u_mono_grain_size;
        uniform float u_mono_flicker;
        uniform float u_mono_vignette;
    """

    _FUNCTIONS = """
        float mono_hash(vec2 p) {
            p = fract(p * vec2(443.897, 441.423));
            p += dot(p, p.yx + 19.19);
            return fract((p.x + p.y) * p.x);
        }
    """

    _FRAGMENT = """
        vec4 mono_orig = texture2D(tex0, v_tex_coord, u_lod_bias);
        float mono_a = mono_orig.a;
        vec3 mono_col = (mono_a > 0.0) ? mono_orig.rgb / mono_a : vec3(0.0);

        // 밝기만 남기기 (사람 눈 기준 무게)
        float mono_g = dot(mono_col, vec3(0.299, 0.587, 0.114));
        mono_g = (mono_g - 0.5) * u_mono_contrast + 0.5;
        mono_g *= u_mono_brightness;

        // 필름: 초당 24번 바뀌는 깜빡임과 입자
        float mono_frame = floor(u_time * 24.0);
        mono_g *= 1.0 + (mono_hash(vec2(mono_frame, 7.0)) - 0.5) * 2.0 * u_mono_flicker;
        vec2 mono_px = floor(v_tex_coord * u_model_size / max(u_mono_grain_size, 1.0));
        mono_g += (mono_hash(mono_px + vec2(mono_frame * 13.1, mono_frame * 7.7)) - 0.5) * u_mono_grain;

        vec3 mono_out = clamp(vec3(mono_g) * u_mono_tint, 0.0, 1.0);

        // 가장자리 어둡게
        vec2 mono_d = v_tex_coord - 0.5;
        mono_out *= 1.0 - u_mono_vignette * smoothstep(0.25, 0.8, length(mono_d) * 1.3);

        vec4 mono_fx = vec4(mono_out * mono_a, mono_a);
        gl_FragColor = mix(mono_orig, mono_fx, clamp(u_mono_strength, 0.0, 1.0));
    """

    renpy.store.screen_fx.register_shader(SHADER,
        variables=_VARIABLES,
        fragment_functions=_FUNCTIONS,
        vertex_200="""
            v_tex_coord = a_tex_coord;
        """,
        fragment_300=_FRAGMENT)

    ## ── 효과로 등록 ──

    _fx = renpy.store.screen_fx.ShaderEffect("mono", "흑백", SHADER, PARAMS, GROUPS, uniform_prefix="u_mono_")
    _fx.order = 10      # 편집기 버튼 순서 (VHS 0, 이 효과 10, ASCII 20, 레트로 터미널 30, 게임보이 40, 따로 정하지 않은 효과 100)

    ## mono.set(), preset(), reset(), off(), on(), mono.Set(), Preset(), Toggle(), mono.effect
    _fx.export(globals())

    renpy.store.screen_fx.register(_fx)
```

`game/screen_fx/mono_config.rpy` 로 저장 (설정):

```renpy
################################################################################
## Screen FX — 흑백(mono) 효과 설정
##
## 여기만 고치면 됩니다. 적지 않은 값은 엔진의 기본값을 따릅니다.
##
## 이 효과는 기본으로는 꺼져 있다가(기본 효과는 "없음"), 스크립트에서 켭니다.
##     $ screen_fx.use("mono")        # 흑백으로 바꾸고 유지 (VHS 덮개는 아래 mono.overlay대로)
##     $ screen_fx.clear()            # 선택취소: 기본 효과로
##     e "그날의 기억." (fx="mono")   # 대사 줄 괄호로
##     $ screen_fx.use("mono", overlay=False)   # 흑백만 (덮개 끔)
##
## UI Kit 편집기(Shift+M → T로 "화면 효과" 탭 → "흑백" 버튼)로 바꿔 저장하면
## mono_layout.rpy가 만들어지고, 그 파일의 값이 여기 값보다 우선합니다.
################################################################################

## 효과 켜기·끄기 (False면 use("mono")를 해도 효과 없는 화면)
define mono.enabled = True

## 이 효과를 쓰는 동안 덮개(VHS)를 기본으로 켤지. True 켬 (오래된 흑백 비디오처럼) / False 흑백만
define mono.overlay = True

## 글자 빼기: 흑백을 씌우지 않을 글자 (괄호 안에 고른 것만 원래 색으로 남음)
##   "say"      대사·이름 (대사창)
##   "choice"   선택지
##   "screens"  메뉴·화면 (퀵메뉴, 저장·환경설정 화면, show screen으로 띄운 화면)
## 예)
##   define mono.exclude = ()                    # 아무것도 안 뺌: 글자까지 흑백 (기본. 회상 장면 전체가 옛날 사진처럼)
##   define mono.exclude = ("say", "choice")     # 대사·이름·선택지는 원래 색
## 한 번만 바꾸려면: $ screen_fx.use("mono", exclude=("say",)) 또는 대사 괄호 (fx="mono", fx_exclude=("say",))
define mono.exclude = ()

## 화면 효과 값. 적지 않은 값은 엔진의 기본값입니다.
define mono.settings = {
    "strength": 1.0,        # 전체 세기 (0 = 원래 화면, 0.5 = 반쯤 바랜 색, 1 = 완전 흑백)
    "tint": "#ffffff",      # 색 입히기. "#ffffff" = 그냥 흑백, "#e8c9a0" = 세피아(누런 옛날 사진),
                            #   "#a0c8ff" = 푸른 밤, "#ff9090" = 붉은 기억
    "brightness": 1.0,      # 밝기 (0.2~2)
    "contrast": 1.1,        # 대비 (1 = 그대로, 크면 진하게, 작으면 흐릿하게)

    ## 오래된 필름 느낌 (0이면 없음)
    "grain": 0.08,          # 입자(노이즈) 세기 (0~0.5)
    "grain_size": 1.5,      # 입자 크기(픽셀). 클수록 거친 입자
    "flicker": 0.03,        # 밝기 깜빡임 (0~0.3)
    "vignette": 0.3,        # 가장자리 어둡게 (0~1)
}

## 게임 중에 $ mono.preset("이름")으로 한 번에 바꿀 수 있는 묶음.
## 적은 값만 바뀌고 나머지는 위 settings 값을 따릅니다.
define mono.presets = {
    "sepia": {                  # 세피아 옛날 사진
        "tint": "#e8c9a0",
        "contrast": 0.95,
        "grain": 0.12,
    },
    "old_film": {               # 낡은 필름 (입자·깜빡임 강하게)
        "grain": 0.25,
        "grain_size": 2.5,
        "flicker": 0.12,
        "vignette": 0.6,
    },
    "faded": {                  # 색이 반쯤만 빠짐
        "strength": 0.6,
        "grain": 0.0,
        "flicker": 0.0,
        "vignette": 0.0,
    },
}

## 게임 중에 값 바꾸기 (VHS와 같은 방법, 세이브·되감기에 저장)
##     $ mono.set(tint="#ff9090", duration=1.0)    # 1초 동안 붉게
##     $ mono.preset("sepia", duration=0.5)        # 프리셋으로
##     $ mono.reset(duration=1.0)                  # 이 파일의 값으로 돌아감
##     $ mono.off(duration=2.0)                    # 서서히 색이 돌아옴 (strength만 0으로)
##     $ mono.on(duration=2.0)                     # 다시 흑백으로
## 화면 버튼:
##     textbutton "세피아" action mono.Preset("sepia")
##     textbutton _("흑백 효과") action mono.Toggle()   # 플레이어용 켜기·끄기

## 부드럽게 바뀔 때의 속도 곡선 ("ease", "linear", "easein", "easeout" 등 ATL warper 이름)
define mono.warper = "ease"

## 다시 그리는 간격(초). 0 = 매 프레임 (입자·깜빡임이 움직임). 1.0/24 이면 초당 24번
define mono.redraw = 0.0
```

이 두 파일을 넣고 런처에서 Lint를 돌리면 `$ screen_fx.use("mono")`, 대사 괄호 `(fx="mono")`, 편집기 "화면 효과" 탭의 "흑백" 버튼이 그대로 생깁니다.

### 12-2. 견본을 고쳐 새 효과 만들기

예를 들어 "글리치(`glitch`)" 효과를 넣는다면:

**1. 견본 두 파일을 새 이름으로 저장**

```
engine/glitch.rpy       ← 12-1의 엔진 코드
glitch_config.rpy       ← 12-1의 설정 코드
```

**2. 두 파일에서 이름 바꾸기** (편집기의 "모두 바꾸기"로 `mono` → `glitch`)

| 바꿀 곳 | 예 |
|---|---|
| 이름공간 | `init -100 python in glitch:`, `define glitch.settings` … |
| 셰이더 이름 | `SHADER = "glitch.effect"` |
| 유니폼 | `uniform float u_glitch_strength;` … , `uniform_prefix="u_glitch_"` |
| 효과 등록 | `ShaderEffect("glitch", "글리치", SHADER, PARAMS, GROUPS, uniform_prefix="u_glitch_")` |
| 버튼 순서 | `_fx.order = 50` (VHS 0, ASCII 20, 레트로 터미널 30, 게임보이 40. 작을수록 편집기 버튼이 앞) |
| 덮개 | `define glitch.overlay = True` (이 효과를 쓰는 동안 VHS 덮개를 기본으로 켤지) |

**3. `engine/glitch.rpy`에서 값 목록, 막대, 셰이더 고치기**

```renpy
    ## 값 이름 → (종류, 기본값). "strength"는 꼭 있어야 함 (전환에 씀)
    ## 종류: "float" 숫자, "bool" 켜기·끄기, "color" 색, "vec2" (가로, 세로),
    ##       "choice" 몇 개 중 하나 (("choice", 기본값, (고를 수 있는 값들)) → 셰이더에는 순서 번호 0, 1, 2…),
    ##       "str" 글자 (셰이더에 넘기지 않음. ASCII의 글자 목록처럼 파이썬에서만 씀)
    PARAMS = {
        "strength":  ("float", 1.0),
        "amount":    ("float", 0.3),     # 새 값
        "speed":     ("float", 2.0),
        "color_split": ("bool", True),
    }

    ## 편집기 막대: (묶음 이름, ( (값 이름, 표시, 최소, 최대, 간격, 소수 자리) 또는 (값 이름, 표시, "bool"/"color") ))
    GROUPS = (
        ("기본", (
            ("strength", "전체 세기", 0.0, 1.0, 0.01, 2),
            ("amount", "찢어짐 세기", 0.0, 1.0, 0.01, 2),
            ("speed", "속도", 0.0, 10.0, 0.1, 1),
            ("color_split", "색 갈라짐", "bool"),
            )),
        )
```

셰이더(`_VARIABLES`, `_FUNCTIONS`, `_FRAGMENT`) 규칙:

- `PARAMS`의 값마다 `uniform`을 하나씩 적습니다. 이름은 `u_glitch_` + 값 이름, 종류는 `float`(숫자, 켜기끄기), `vec3`(색), `vec2`.
- 원래 화면은 `texture2D(tex0, v_tex_coord, u_lod_bias)`로 읽고, 마지막에 `gl_FragColor`에 결과를 넣습니다.
- 마지막 줄은 **원래 화면과 효과를 `strength`로 섞기**로 끝냅니다. 서서히 전환과 `off()`가 이 값을 씁니다.
  ```glsl
  gl_FragColor = mix(glitch_orig, glitch_fx, clamp(u_glitch_strength, 0.0, 1.0));
  ```
- 시간은 `u_time`(초), 화면 크기(픽셀)는 `u_model_size`를 씁니다.
- 글자 빼기의 기본은 아무것도 안 뺌입니다. 바꾸려면 `glitch_config.rpy`에 `define glitch.exclude = ("say",)`. (효과 쪽 기본을 바꾸려면 `ShaderEffect`를 상속해 `default_exclude = ("say", "choice", "screens")`)
- 층마다 씌울 때(글자를 뺄 때)는 반투명한 층에도 씌워집니다. 셰이더는 **투명도가 곱해진 색**을 받으므로, `rgb / a`로 원래 색을 구해 계산하고 마지막에 `vec4(색 * a, a)`로 내보내세요. 12-1의 흑백 코드가 그렇게 되어 있습니다.
- 셰이더에 그림(텍스처)이나 계산한 값을 더 넘겨야 하면 `ShaderEffect`를 상속해 `extra(self, trans, values)`에서 `trans.u_...`에 넣습니다. `engine/ascii.rpy`의 `AsciiEffect`가 예입니다.
- 글자 층만 다르게 그리고 싶으면 `ShaderEffect`를 상속해 `layered(self)`가 `True`를 돌려주게 합니다. 그러면 글자를 하나도 안 빼도 층마다 씌우고, 셰이더는 `uniform float u_sfx_text;`가 1이면 글자 층(대사, 선택지, 메뉴), 0이면 장면 층이나 화면 전체로 압니다. `engine/gameboy.rpy`의 `GameboyEffect`가 예입니다.
- 셰이더 함수(`_FUNCTIONS`) 안에서만 쓰는 유니폼은 렌파이가 선언을 빼먹습니다. 유니폼은 `_FRAGMENT`에서 읽어서 함수에 인자로 넘기세요(`engine/gameboy.rpy`의 `gb_tone(색, vec3(감마, 대비, 밝기))`처럼).
- GLSL 변수 이름은 다른 효과와 겹치지 않게 앞에 효과 이름을 붙입니다 (`glitch_uv`, `glitch_col` …).
- 덮개 전용으로 만들려면 `ShaderEffect`를 상속해 `overlay_only = True` (VHS가 그렇게 되어 있음). 덮개는 VHS 하나만 쓰므로 보통은 필요 없습니다.

**4. `glitch_config.rpy`에 값 적기**

```renpy
define glitch.enabled = True
define glitch.overlay = True    # 이 효과를 쓰는 동안 VHS 덮개 켬
define glitch.settings = {
    "strength": 1.0,
    "amount": 0.3,      # 찢어짐 세기 (0~1)
    "speed": 2.0,
    "color_split": True,
}
define glitch.presets = {
    "heavy": { "amount": 0.9, "speed": 6.0 },
}
```

**5. 게임에서 쓰기**

```renpy
$ screen_fx.use("glitch")                 # 스크립트
e "화면이 깨진다." (fx="glitch")           # 대사 줄
$ glitch.preset("heavy", duration=0.3)    # 값 바꾸기
```

런처에서 Lint를 실행하면 이름이 틀린 곳을 알려줍니다. 편집기 "화면 효과" 탭에도 버튼이 자동으로 생깁니다.

---

## 13. 값이 적용되는 순서

| 무엇 | 순서 (뒤로 갈수록 우선) |
|---|---|
| 지금 켜진 효과 | `screen_fx.base` → `screen_fx_layout.rpy`의 base → 게임 중 `use()` / 대사 `fx=` (`clear()`하면 base로) |
| 덮개 켬/끔 | `screen_fx.overlay`와 그 효과의 `<이름>.overlay` → `screen_fx_layout.rpy`, `<이름>_layout.rpy`의 overlay → `use(overlay=…)` / `set_overlay()` / 대사 `fx_overlay=` |
| 덮개 휘어짐 | 엔진 기본값 → `vhs_crt.settings` → `vhs_crt_layout.rpy` → 게임 중 `screen_fx.set_warp()` / `vhs_crt.set()` / 대사 `fx_warp=` |
| 글자 빼기 | 효과 엔진의 기본(ASCII는 글자 전부, 나머지 안 뺌) → `<이름>.target`(예전 이름) → `<이름>.exclude` → `<이름>_layout.rpy`의 target → exclude → `use(exclude=…)` / 대사 `fx_exclude=` |
| 전환 | 엔진 기본값 → `screen_fx_config.rpy` → `screen_fx_layout.rpy` → `use(transition=…)` / 대사 `fx_transition=` |
| 효과 값 (VHS, ASCII …) | 엔진 기본값 → `<이름>.settings` → `<이름>_layout.rpy`의 settings → 게임 중 `<이름>.set()`·`preset()` 값 |
| 타이틀 일렁임 | 엔진 기본값 → `watermorph_config.rpy` → `watermorph_layout.rpy` |

---

## 14. 문제 해결

| 증상 | 확인할 것 |
|---|---|
| `use()`를 했는데 효과가 안 보임 | 그 효과의 `enabled`, 플레이어가 끄지 않았는지(`persistent.screen_fx_off`, `persistent.<이름>_off`), `strength`, 편집기에서 다른 탭을 쓰고 있지 않은지 |
| "…라는 효과가 없습니다" 오류 | 효과 이름 오타. 쓸 수 있는 이름이 오류 화면에 나옵니다 |
| 대사 괄호 `fx=`에서 "unknown keyword" 오류 | `screen_fx` 폴더가 없거나 예전 버전. 4.0으로 바꾸거나 괄호의 `fx`, `fx_overlay`, `fx_warp`, `fx_exclude`, `fx_target`을 지우기 |
| "'mono'라는 효과가 없습니다" 오류 | 4.0에서 흑백을 지웠습니다. 원고의 `use("mono")`, `fx="mono"`를 바꾸거나, 12-1의 견본 코드로 흑백을 다시 넣기 |
| 덮개에 "True(켬) / False(끔)만 씁니다" 오류 | 4.0부터 덮개는 VHS 하나. `overlay="ascii"` 같은 값을 `True`로 |
| TV 전환이 안 보이고 바로 바뀜 | `screen_fx.transition`, 건너뛰기 중인지, 되감기·불러오기 직후인지, 편집기를 열어 두지 않았는지, `persistent.screen_fx_off` |
| 전환 중에 대사가 먼저 나옴 | `screen_fx.wait = False`이거나 `use(…, wait=False)` |
| 클릭해도 전환이 안 넘어감 | `screen_fx.skippable = False` |
| 타이틀 일렁임이 안 보임 | `enabled`, 타이틀 화면인지, 편집기에서 다른 탭을 쓰고 있지 않은지 |
| 타이틀 글자가 흐릿함 | `amount`를 줄이거나 `target = "background"` |
| 화면 가장자리가 이상함 (일렁임) | 가장자리가 비지 않도록 `amount`만큼 살짝 확대해서 그립니다. `amount`를 줄이면 확대도 줄어듭니다 |
| VHS 덮개가 안 보임 | `screen_fx.overlay`가 `True`인지(예전 설정 파일의 `None`이 남아 있지 않은지), 지금 효과의 `<이름>.overlay`(레트로 터미널은 기본 끔), `use(…, overlay=False)`나 `fx_overlay=False`를 쓰지 않았는지, `vhs_crt.enabled`, `scope`, 플레이어가 끄지 않았는지(`persistent.vhs_crt_off`), `strength` |
| 편집기 "화면 효과" 탭에서 바꾸고 저장했는데 게임 화면이 그대로 | 이 탭은 효과의 설정값을 고칩니다. 지금 장면의 효과를 바꾸려면 "이 대사부터 이 효과" 버튼이나 대사 탭의 "화면 효과" 줄 → Ctrl+S (9-1) |
| VHS 효과가 두 번 겹침 | 다른 CRT 셰이더, 예전 `vhs_crt` 폴더(`.rpyc` 포함), 또는 `auto = True`인데 `camera at vhs_crt.effect`도 씀 |
| 화면이 너무 어두움 | `brightness`를 올리거나 `scanlines_opacity`, `grille_opacity`, `vignette_opacity`를 낮추기 |
| 글자가 읽기 어려움 | `pixelate = False`, `aberration`·`distort_intensity`를 낮추기, 또는 `camera at vhs_crt.effect`로 대사창 제외 |
| 이미지에 씌웠더니 검은 테두리 | `clip_warp = True` |
| 설정을 고쳤는데 그대로 | `*_layout.rpy`가 있는지 (편집기 값이 우선) |
| 편집기에 "화면 효과" 탭이 없음 | `ui_kit` 2.3 이상이 있는지, T로 탭을 넘겼는지 |
| 대사 탭에 "화면 효과" 줄이 없음 | `ui_kit` 2.3 이상과 `screen_fx` 3.0 이상이 같이 있는지 (덮개·대상 줄은 2.4·3.1 이상) |
| ASCII에서 대사가 안 읽힘 | `ascii.exclude`에 `"say"`가 있는지, `use(…, exclude=())`나 `fx_exclude=()`를 쓰지 않았는지 |
| 글자를 뺐는데 그대로 효과가 걸림 | `split_text_layers = False`인지(그러면 전부 빼기만 됨), 다른 코드가 `config.say_layer`를 바꿨는지, 하나만 적을 때 쉼표를 빠뜨리지 않았는지(`("say")`가 아니라 `("say",)`) |
| 플러그인을 넣은 뒤 다른 코드가 대사창을 못 찾음 | 그 코드가 `layer="screens"`로 대사창을 찾고 있음. `define screen_fx.split_text_layers = False` |
| 레트로 터미널이 너무 밝음 / 어두움 | `brightness`, `contrast`, `background`. 결이 진하면 `raster_strength`를 낮추기 |
| 레트로 터미널 + VHS 덮개에서 화면이 두 번 휨 | `retro_term.overlay = False`(기본)로 두거나, 덮개를 켤 거면 이 효과의 `crt`를 `False`로 |
| 게임보이 화면이 점 무늬로 가득함 | 어두운 CG는 1번·2번 색 사이를 무늬로 섞습니다. `dither_strength`를 0.5쯤으로 낮추거나, `gamma`(0.6~0.8)·`contrast`로 밝기 분포를 바꾸거나, `mode="pixel"` |
| 게임보이에서 대사가 안 읽힘 | `text_pixel = True`이면 글자도 점으로 쪼개짐. `False`로 하거나 `exclude=("say",)`. 색이 어두우면 `color4`(가장 밝은 색)를 밝게 |
| ASCII가 너무 어두움 | `color_boost`·`bg_tint`·`brightness`를 올리기. VHS를 덮었다면 `ascii.preset("glow")` |
| ASCII 글자가 흐릿함 | `crisp = True`, `cell`을 16의 배수(16, 32, 48)로 |
| ASCII 글자가 네모로 나옴 | 글자 목록의 글자가 글꼴(`ascii.font`)에 없음 |
| 스크린에 넣은 그림에 효과가 안 걸림 | 효과에서 `"screens"`(메뉴·화면)를 뺐음. 그림에 `at screen_fx.scene` (3-9) |
| 덮개가 켜졌다 꺼졌다 함 | `use()`는 부를 때마다 덮개를 설정대로 다시 정함. 이어 가려면 `overlay=`를 적기 (5-1) |
| 효과를 처음 바꿀 때 한 번 멈칫함 | 그 셰이더를 처음 쓸 때 그래픽 카드가 준비하는 시간입니다. 같은 실행 중에는 다시 멈추지 않습니다. 아주 느린 PC나 소프트웨어 렌더링에서 더 김 |
| `.rpy`를 지웠는데 계속 적용됨 | 같은 이름의 `.rpyc`도 지워야 함 |

---

## 15. 제거와 라이선스

- 제거: `game/screen_fx` 폴더를 **`.rpyc` 파일까지 포함해** 통째로 지우면 됩니다. 스크립트에서 `screen_fx.use()`, `vhs_crt.set()`, `screen_fx.set_warp()`, `ascii.set()`, `retro_term.set()`, `gameboy.set()` 등을 썼거나, 대사 괄호에 `fx=`, `fx_overlay=`, `fx_warp=`, `fx_exclude=`, `fx_target=`을 적었거나, 스크린에 `at screen_fx.scene`을 붙였다면 그것도 지우세요.
- VHS 셰이더 원본은 CC0(퍼블릭 도메인)이라 크레딧 없이도 쓸 수 있지만, 원작자에 대한 감사로 남겨 두는 것을 권합니다.
  > VHS and CRT monitor effect — Godot Shaders (CC0)
  > https://godotshaders.com/shader/vhs-and-crt-monitor-effect/
- ASCII 셰이더는 아래 셰이더의 아이디어(밝기 → 글자 그림에서 글자 고르기)를 참고해 렌파이용으로 새로 쓴 것입니다. 원본은 MIT 라이선스입니다.
  > ASCII shader — Daniel Bologna (Godot Shaders, MIT), Acerola의 ASCII 셰이더 아이디어
  > https://godotshaders.com/shader/ascii-shader/
- **글꼴**: `fonts/neodgm.ttf`는 Neo둥근모(Copyright (c) 2017-2021, Eunbin Jeong (Dalgona.). 둥근모꼴을 바탕으로 다듬은 글꼴)이며 **SIL Open Font License 1.1**입니다. "Neo둥근모"는 예약된 글꼴 이름이라, 글꼴 파일을 고쳐서 배포할 때는 다른 이름을 붙여야 합니다. 게임에 넣어 배포·판매할 수 있고, 글꼴 파일을 배포할 때는 `fonts/neodgm_OFL.txt`를 같이 두세요. 글꼴 파일만 따로 팔 수는 없습니다.
  > https://neodgm.dalgona.dev/
- 레트로 터미널 셰이더는 cool-retro-term의 모습과 설정 목록을 참고해 새로 쓴 것입니다. cool-retro-term은 GPL이라 코드는 가져오지 않았습니다.
  > cool-retro-term — Filippo Scognamiglio (Swordfish90)
  > https://github.com/Swordfish90/cool-retro-term
- 게임보이 셰이더는 아래 두 셰이더를 참고해 새로 쓴 것입니다. Retro dither(CC0)에서는 4×4 순서 디더링 무늬를, Gameboy Classic Shader에서는 LCD 모습(점 격자·점 그림자·꺼진 점이 비치는 바탕)의 생각만 가져왔습니다. Gameboy Classic Shader는 GPL v3라 코드는 가져오지 않았습니다.
  > Retro dither — tcmug (Godot Shaders, CC0)
  > https://godotshaders.com/shader/retro-dither/
  > Gameboy Classic Shader — Harlequin (GPL v3)
  > https://github.com/HarlequinVG/shaders/tree/master/gameboy_shader
- TV 전환 셰이더와 12장의 흑백 견본 셰이더는 이 플러그인에서 새로 만든 것입니다.
- MIT 라이선스입니다. 저장소의 `LICENSE`, `THIRD_PARTY.md`를 보세요.
