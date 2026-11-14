# 주의와 라이선스

## 다른 코드와 함께 쓸 때

- `ui_kit`은 렌파이 기본 스크린 `main_menu`, `navigation`, `choice`를, `hotkeys`는 `keyboard_help`를 대신 정의합니다. 다른 플러그인이나 직접 고친 코드가 같은 스크린을 또 정의하면 나중에 실행되는 쪽이 이깁니다.
- `splash`는 렌파이의 `splashscreen` 레이블로 이어집니다. 스크립트에 이미 `label splashscreen:`이 있으면 그 안에 `call splash_play`를 넣으세요. 스플래시는 게임을 처음 켤 때만 나오고 Shift+R로는 다시 나오지 않습니다(`splash.preview()`로 확인).
- `screen_fx`의 VHS 효과는 다른 CRT 셰이더와 같이 쓰면 효과가 두 번 겹칩니다.
- `screen_fx`는 대사창을 `sfx_say`, 선택지를 `sfx_choice` 층에 띄웁니다(`config.say_layer`, `config.choice_layer`). 다른 코드가 대사창 층을 `"screens"`로 정해 두고 찾는다면 `screen_fx/screen_fx_config.rpy`의 `screen_fx.split_text_layers`를 `False`로.
- `screen_fx`는 대사 괄호의 `fx=`(`fx_transition`, `fx_overlay`, `fx_exclude`)를 받기 위해 `config.say_arguments_callback`을 씁니다. 다른 코드가 이미 걸어 둔 함수는 이어서 불러 줍니다. `screen_fx` 폴더를 지우면 `fx=`를 적은 대사에서 오류가 나니 그 괄호도 지우세요.
- `ui_kit` 편집기는 화면 효과가 닿지 않는 맨 위 층에 그려집니다. 효과 탭이 아닌 다른 탭을 쓰는 동안에는 `screen_fx` 효과가 잠시 꺼집니다.
- 투명한 webm 영상은 렌파이의 side_mask 방식(왼쪽 절반 색, 오른쪽 절반 투명도)을 씁니다. 만드는 방법은 `ui_kit/README.md`에 있습니다.

## 라이선스

- VHS 셰이더 원본은 CC0입니다(크레딧은 선택). ASCII 셰이더는 MIT 라이선스 셰이더의 아이디어를, 레트로 터미널은 cool-retro-term(GPL)의 모습을, 게임보이는 Retro dither(CC0)의 디더링 무늬와 Gameboy Classic Shader(GPL)의 LCD 모습을 참고해 코드를 새로 썼습니다(크레딧은 `screen_fx/README.md` 15장).
- `screen_fx/fonts/neodgm.ttf`(Neo둥근모)는 SIL OFL 1.1입니다. 게임에 넣어 배포·판매할 수 있고, 배포할 때 `neodgm_OFL.txt`를 같이 두세요.
- pygaki 플러그인은 MIT 라이선스입니다. 글꼴처럼 라이선스가 다른 파일은 저장소의 `THIRD_PARTY.md`를 보세요.
- PyKaki(pygaki 앱)는 MIT 라이선스입니다. 함께 넣은 글꼴과 라이브러리의 라이선스는 저장소의 `pykaki/licenses/` 폴더에 있습니다.
