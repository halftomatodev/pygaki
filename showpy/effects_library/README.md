# 효과 모음

pygaki와 같이 오는 효과 파일을 두는 곳입니다. 여기 있는 효과는 게임에 저절로 들어가지 않고,
pygaki 앱의 [효과] 화면에서 [넣기]를 누르면 그 게임의 `game/ui_kit/effects/`로 복사됩니다.

- 파일 하나에 효과 하나, 파일 이름은 `효과이름.glsl`
- 형식은 `showpy/game/ui_kit/effects/README.md`의 "적는 법"과 같습니다 (글자 효과는 `@effect`, 그림 효과는 `@transition`)
- 새 프로젝트마다 들어가는 샘플 여섯은 `showpy/game/ui_kit/effects/`에 그대로 둡니다. 그 샘플도 게임에서 빼면 앱의 모음 쪽에 보입니다
- PyKaki는 빌드할 때 이 폴더의 `.glsl`을 그대로 가져갑니다 (사본 없음). 앱 안에 들어가므로 묶음에는 이 폴더를 따로 두지 않습니다
- 효과를 더하려면 여기에 파일을 넣고 PyKaki를 다시 빌드합니다 (앱 [효과] 화면의 샘플로 먼저 돌려 봄)

## 들어 있는 효과

| 파일 | 종류 | 이름 | 모양 | 고칠 값 |
|---|---|---|---|---|
| `slide.glsl` | 그림 | `slide` 옆으로 밀기 | 새 그림이 옆에서 들어오며 앞 그림을 밀어냄 | `dir` 방향 (0 왼쪽, 1 오른쪽, 2 위, 3 아래) |
| `mosaic.glsl` | 그림 | `mosaic` 모자이크로 바뀌기 | 앞 그림이 굵은 모자이크로 뭉개졌다가 새 그림으로 풀림 | `size` 가장 굵을 때 칸 크기(픽셀) |
| `blinds.glsl` | 그림 | `blinds` 가로 블라인드 | 가로 줄 여러 개가 한꺼번에 열리며 새 그림이 나옴 | `count` 줄 수, `vertical` 1이면 세로 줄, `soft` 가장자리 부드러움 |

게임에 넣은 뒤 원고에서는 이렇게 씁니다.

```renpy
scene bg hall with img_fx.use("slide")
scene bg hall with img_fx.use("slide", 0.8, dir=2)
scene bg hall with img_fx.use("mosaic", 1.5, size=120)
show mina with img_fx.use("blinds", 1.0, count=14, vertical=1)
```
