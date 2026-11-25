# 화면 움직임 원칙

대본 편집기 화면(데스크톱 앱 포함)의 전환·애니메이션은 이 원칙을 따른다. 기준은 Apple Human Interface Guidelines의 Motion 장(https://developer.apple.com/design/human-interface-guidelines/motion)과, 절제된 타이밍·비대칭 이징·얕은 깊이감을 쓰는 애플식 UI 모션이다.

값은 `src/styles.css` 맨 위 `:root`의 움직임 토큰에 있다. 새 `transition`·`animation`은 숫자를 직접 쓰지 말고 토큰을 쓴다.

## 1. 원칙

1. **목적이 있을 때만 움직인다.** 움직임은 무엇이 바뀌었는지, 어디서 와서 어디로 갔는지 알려 줄 때만 쓴다. 꾸미려고 움직이지 않는다. 한 번에 여러 요소를 따로 움직이지 않고, 시선을 하나로 모은다.
2. **짧게, 기다리게 하지 않는다.** 움직이는 동안에도 입력을 받는다. 애니메이션이 끝나야 누를 수 있는 버튼은 만들지 않는다. 같은 동작을 다시 하면 하던 움직임을 지금 자리에서 이어서 바꾼다(`transition`은 저절로 그렇게 된다, `@keyframes`는 처음부터 다시 시작하니 되풀이되는 상태 변화에는 `transition`을 쓴다).
3. **누른 것에 바로 답한다.** 호버·누름은 100~150ms 안에 보인다.
4. **비대칭 이징.** 나타날 때는 빨리 나와 길게 감속(`--ease-out`), 사라질 때는 천천히 시작해 빨리 끝(`--ease-in`), 자리 바꿈은 `--ease`. 기본 `ease`나 `linear`는 진행 막대, 도는 표시처럼 일정한 속도가 맞는 것에만 쓴다.
5. **얕은 깊이감.** 뜨는 창(메뉴, 대화 상자, 팝오버)은 XY로 크게 미끄러지지 않고 살짝 작고 흐린 상태(`--pop-scale` 0.96, `--pop-blur` 4px)에서 제자리로 온다. 반투명 유리 느낌이 필요하면 `backdrop-filter: blur() saturate()`를 쓰되 배경 위 작은 띠·창에만 쓴다(넓은 면은 윈도우 저사양에서 느리다).
6. **사용자 설정을 따른다.** 운영체제의 '애니메이션 줄이기'(윈도우: 설정 > 접근성 > 시각 효과 > 애니메이션 효과)가 켜지면 `prefers-reduced-motion`이 참이 되고, 토큰이 확대·흐림·튐을 빼고 짧은 페이드만 남긴다. 토큰을 쓰면 따로 할 일이 없다.

## 2. 시간과 곡선

| 상황 | 시간 | 곡선 |
|---|---|---|
| 호버, 테두리·배경 색 | `--dur-hover` 100ms | `--ease-out` |
| 누름, 스위치, 체크 | `--dur-press` 150ms | `--ease-out` |
| 메뉴·팝업·대화 상자 등장 | `--dur-pop` 250ms | `--ease-out` (사라짐은 `--ease-in`, 시간은 2/3쯤) |
| 화면 전환, 상자 자리 정렬, 큰 칸 열고 닫기 | `--dur-view` 400ms | `--ease` 또는 `--ease-spring` |

`--ease-spring`은 감쇠 스프링을 `linear()`로 옮긴 곡선이다(1% 넘었다 돌아옴). 끌어서 놓은 것이 제자리로 갈 때처럼 손의 움직임을 이어받는 곳에만 쓴다.

## 3. 쓰는 법

```css
.pop { animation: pop-in var(--dur-pop) var(--ease-out); }
@keyframes pop-in { from { opacity: 0; scale: var(--pop-scale); filter: blur(var(--pop-blur)); } }

/* 처음 나타날 때를 transition으로: 중간에 닫아도 자연스럽게 되돌아간다 */
.sheet { transition: opacity var(--dur-pop) var(--ease-out), scale var(--dur-pop) var(--ease-out); }
@starting-style {.sheet { opacity: 0; scale: var(--pop-scale); } }
```

- `transform` 하나에 여러 값을 넣기보다 `scale`, `translate`, `rotate` 속성을 따로 쓴다(서로 덮어쓰지 않음).
- 움직이는 속성은 `opacity`, `transform`(`scale`·`translate`), `filter`만. `width`·`height`·`top`·`left`는 레이아웃을 다시 계산하니 피한다(진행 막대 같은 작은 것은 괜찮다).
- 화면 전체가 바뀌는 곳은 `document.startViewTransition()`으로 이전 화면과 새 화면을 겹쳐 바꿀 수 있다.
- JS로 움직일 때는 `element.animate()`(Web Animations)에 같은 토큰 값을 쓴다. 토큰 값은 `getComputedStyle(document.documentElement).getPropertyValue('--ease-out')`로 읽는다.

## 4. 유리 면과 끈적 움직임

- **상단 탭**(`Toolbar.tsx` `ViewSwitch`)과 **카드**(`Card.tsx`)는 fluidkit(`LiquidTabs`, `LiquidCard`, MIT, motion 위에서 돈다)의 유리 재질을 쓴다. 탭 막대는 물방울처럼 흘러가고 꼬리가 늦게 따라와 다시 합쳐진다(`flow="slide"`). 탭 바탕은 옅은 회색, 막대만 강조색 유리. 카드는 반투명 바탕 색 유리라 뒤의 캔버스가 비친다(접으면 하늘색, 사용 중이면 연두).
- fluidkit은 애니메이션 줄이기를 스스로 따른다(막대는 바로 옮기고 카드는 원래 움직이지 않음).
- **드롭다운 메뉴**는 `GooMenu.tsx`의 끈적 드롭다운: 단추에서 녹아 나와 커지고, 자리를 잡으면 흐림을 0으로 줄여 목을 완전히 끊는다.
- 새 유리 면을 만들 때는 직접 `backdrop-filter`를 쓰기보다 fluidkit의 재질(`material="glass"`, `tint`)을 쓴다. 글자는 필터가 걸린 층에 넣지 않는다.

## 5. 빼는 것

- **모션 블러**: 브라우저에 없다. 흉내 내려고 프레임마다 `filter`를 바꾸지 않는다.
- **빛이 쓸고 지나가는 반짝임**: 기다리는 자리 표시(`.gal-wait`)에만 쓴다. 평소 화면에는 쓰지 않는다.
- **SF Pro 글꼴**: 애플 기기 밖에서 쓰거나 묶어 배포할 수 없다. 글꼴은 지금처럼 `--font`(Pretendard 등)를 쓴다.
- **글자 등장 효과**(`.fx-*`): 게임에서 보일 모양을 그대로 보여 주는 미리보기라 이 원칙 밖이다. 렌파이 쪽 셰이더와 같아야 한다.

## 6. 데스크톱 앱에서 되는지

앱은 Electron 33.2.1(Chromium 130)을 쓴다. 2026-11-18에 그 Electron을 직접 켜서 다음이 모두 되는 것을 확인했다:
`cubic-bezier()`, `linear()` 이징, `backdrop-filter`, `filter: blur()`, `scale`·`translate` 낱개 속성, `@starting-style`, `transition-behavior: allow-discrete`, `document.startViewTransition()`, `element.animate()`, `prefers-reduced-motion`.
`prefers-reduced-motion`은 윈도우의 '애니메이션 효과' 설정을 따른다.
