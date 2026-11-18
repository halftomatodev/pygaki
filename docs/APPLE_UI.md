# 애플식 화면 움직임 작업 넘겨받기 (apple_ui)

클라우드 세션(2026-11-18)에서 한 일을 로컬 작업으로 이어 가려고 정리한 문서. 로컬에서 이 브랜치를 받은 뒤 이 문서를 읽고, 필요한 내용은 `docs/HANDOFF.md`와 맞는 `docs/local/` 파일로 옮긴다. 다 옮기면 이 파일은 지워도 된다.

## 1. 요청

애플식 UI 모션(절제된 타이밍, 비대칭 이징, Z축 확대·흐림으로 얕은 깊이감)을 대본 편집기 화면 움직임의 원칙으로 삼고, 데스크톱 앱(Electron)에서 쓸 수 있는지 확인한다. 기준 자료는 Apple Human Interface Guidelines의 Motion 장(https://developer.apple.com/design/human-interface-guidelines/motion)과 사용자가 보여 준 애플식 모션 요약이다.

## 2. 한 일 (커밋 "화면 움직임 원칙(docs/MOTION.md)과 움직임 토큰 추가")

| 파일 | 내용 |
|---|---|
| `pykaki/docs/MOTION.md` | 움직임 원칙 문서(새 파일). 원칙 6가지, 상황별 시간·곡선 표, CSS 쓰는 법, 빼는 것, Electron 확인 결과 |
| `pykaki/src/styles.css` | `:root`에 움직임 토큰, `prefers-reduced-motion` 대응 |
| `pykaki/CLAUDE.md` | 꼭 지킬 것에 "움직임은 MOTION.md를 따르고 토큰만 쓴다" |

토큰:

| 토큰 | 값 | 쓰는 곳 |
|---|---|---|
| `--ease` | `cubic-bezier(0.4, 0, 0.2, 1)` | 자리 바꿈 |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | 나타남 |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | 사라짐 |
| `--ease-spring` | 감쇠 스프링을 `linear()`로 옮김(1% 넘었다 돌아옴) | 끌어 놓은 것이 제자리로 |
| `--dur-hover` / `--dur-press` / `--dur-pop` / `--dur-view` | 100 / 150 / 250 / 400ms | 호버 / 누름 / 팝업 / 화면 전환 |
| `--pop-scale` / `--pop-blur` | 0.96 / 4px | 뜨는 창이 여기서 제자리로 |

운영체제의 '애니메이션 줄이기'가 켜지면 `--pop-scale: 1`, `--pop-blur: 0`, 스프링은 `--ease-out`, `--dur-view`는 150ms가 되어 짧은 페이드만 남는다.

**지금 화면에는 아직 아무것도 바뀌지 않았다.** 토큰을 정의만 했고, 기존 transition·animation은 그대로다.

## 3. 확인한 것

- 앱과 같은 Electron 33.2.1(Chromium 130.0.6723.137)을 리눅스 xvfb에서 직접 켜서 확인. 모두 됨:
  `cubic-bezier()`, `linear()` 이징, `backdrop-filter`, `filter: blur()`, `scale`·`translate` 낱개 속성, `@starting-style`, `transition-behavior: allow-discrete`, `document.startViewTransition()`, `element.animate()`(끝까지 재생), `prefers-reduced-motion`.
- `npm run build` 통과, 빌드된 `dist/index.html`에 토큰과 reduced-motion 규칙이 들어간 것 확인.
- 윈도우 실기에서는 아직 안 봤다. 윈도우에서 `prefers-reduced-motion`은 설정 > 접근성 > 시각 효과 > '애니메이션 효과'를 따른다.

## 4. 결정과 그 까닭

- `cubic-bezier(0.4, 0, 0.2, 1)`은 사실 구글 머티리얼의 표준 곡선이라 애플 고유가 아니다. 자리 바꿈용 `--ease`로만 쓰고, 애플 느낌(스프링)은 `--ease-spring`으로 따로 둔다.
- SF Pro 글꼴은 애플 기기 밖 사용·재배포가 안 되니 쓰지 않는다. 지금 `--font`(Pretendard 등) 그대로.
- 모션 블러는 브라우저에 없어서 뺀다. 빛 쓸기 효과는 기다림 표시(`.gal-wait`)에만.
- 글자 등장 효과 미리보기(`.fx-*`)는 게임 셰이더와 같아야 하니 원칙 밖.
- 넓은 면에 `backdrop-filter`를 쓰면 윈도우 저사양에서 느릴 수 있어 작은 띠·창에만.

## 5. 다음 할 일

1. 기존 움직임을 토큰으로 바꾸기(`pykaki/src/styles.css`에 transition·animation 약 30곳). 먼저 할 곳:
   - 메뉴 등장 `fmenu-in`, 토스트 `toast-in`, 옆 칸 `side-in`, 태그 막대 → `--dur-pop` `--ease-out` + `--pop-scale`·`--pop-blur`
   - 대화 상자 `.modal-bg`(지금 등장 움직임 없음) → `@starting-style`로 페이드 + 확대
   - 버튼·입력칸 호버 `0.15s` → `--dur-hover`
   - 스위치 `.fw-switch`·슬라이더 `.fw-slider` → `--dur-press`, 손잡이는 `--ease-spring`
   - 상자 자리 정렬 `.animating .react-flow__node`(0.4s ease) → `--dur-view` `--ease`
2. 화면 바꾸기(대본 편집 ↔ 효과 ↔ 셰이더)에 `document.startViewTransition()`으로 겹쳐 바꾸기 검토.
3. 윈도우 앱에서 직접 보고, 애니메이션 효과 끄기를 켠 상태도 확인.
4. 바꾼 뒤 `npm run build`, 그리고 `pykaki/docs/SPEC.md`에 움직임이 바뀐 곳 적기.
