# 함께 들어 있는 것, 참고한 것

showpy의 코드는 [MIT 라이선스](LICENSE)입니다. 아래는 그 밖의 것들입니다.

## 함께 배포하는 파일

| 파일 | 출처 | 라이선스 |
|---|---|---|
| `game/screen_fx/fonts/neodgm.ttf` | [Neo둥근모](https://neodgm.dalgona.dev/), Copyright (c) 2017-2021, Eunbin Jeong (Dalgona.) | SIL Open Font License 1.1 (`game/screen_fx/fonts/neodgm_OFL.txt`). MIT가 아니며, 글꼴과 라이선스 파일을 함께 배포해야 합니다 |

## 참고한 셰이더

코드를 그대로 가져오지 않고, 생각을 참고해 새로 썼습니다.

| 효과 | 참고한 것 | 그쪽 라이선스 | 참고한 내용 |
|---|---|---|---|
| VHS 덮개 | [VHS and CRT monitor effect](https://godotshaders.com/shader/vhs-and-crt-monitor-effect/) | CC0 | 원본 셰이더 |
| ASCII | [ASCII shader](https://godotshaders.com/shader/ascii-shader/), Daniel Bologna, Acerola의 아이디어 | MIT | 밝기로 글자를 고르는 생각 |
| 레트로 터미널 | [cool-retro-term](https://github.com/Swordfish90/cool-retro-term), Filippo Scognamiglio | GPL | 모습과 설정 목록 (코드 없음) |
| 게임보이 | [Retro dither](https://godotshaders.com/shader/retro-dither/), tcmug | CC0 | 4×4 디더링 무늬 |
| 게임보이 | [Gameboy Classic Shader](https://github.com/HarlequinVG/shaders/tree/master/gameboy_shader), Harlequin | GPL v3 | LCD 모습의 생각 (코드 없음) |

자세한 내용은 `game/screen_fx/README.md` 15장에 있습니다.

## 샘플

`examples/pykaki_sample`의 그림과 소리는 이 저장소를 위해 코드로 만든 시험용이며 MIT로 함께 배포합니다.
