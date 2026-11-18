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

처음에는 토큰을 정의만 했고, 그 뒤 사용자가 데모를 보고 고른 것부터 적용한다(6장).

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

## 6. 데모로 고른 것

- **메뉴 등장: 스프링으로 정함, 적용함.** 데모에서 지금 / 토큰 / 스프링을 비교해 사용자가 스프링을 골랐다. `.fmenu`(플래그 메뉴, 폴더 메뉴)가 `--spring-scale`(0.9)·`--pop-blur`에서 `--dur-view` `--ease-spring`으로 커지고, 투명도는 150ms `--ease-out`으로 따로 온다. 커지는 기준점은 단추 쪽 모서리(`FlagMenu.tsx`에서 메뉴가 단추 위로 뜨면 `bottom right`, 아래면 `top right`). 닫을 때 움직임은 아직 없다(메뉴가 바로 사라짐).
- **상단 탭 전환: 데모 만듦, 고르는 중.** 지금 / 미끄러짐 / 유체 세 방식. 유체는 색 막대의 가는 쪽 끝이 먼저(340ms 스프링), 반대쪽 끝이 60ms 늦게(460ms 스프링) 따라와 늘어났다 줄어들고, 화면은 이동 방향으로 32px 밀려 들어온다(450ms 스프링, 흐림 4px). 고르면 `Toolbar.tsx`의 `ViewSwitch`와 `App.tsx`의 화면 바꾸기에 적용한다. 화면 쪽은 `document.startViewTransition()`이나 화면 칸에 직접 애니메이션을 붙이는 방법 중에서 고른다.

## 7. 끈적(gooey) 효과 검토

- **원리**: 모양들을 한 층에 그리고 그 층에 SVG 필터(흐림 `feGaussianBlur` → 알파 문턱 `feColorMatrix` `0 0 0 22 -10` → `feComposite atop`)를 씌우면, 가까운 모양끼리 녹아 붙는다. 글자는 필터에 같이 넣으면 뭉개지니 위의 선명한 층에 따로 둔다. 테두리도 필터가 지우니 그림자는 바깥 층에 `drop-shadow`로.
- **Electron 33에서 됨** (2026-11-18 직접 확인). 4px 떨어진 두 원 사이가 필터를 켜자 채워졌다. 흐림 7px에서 8px 간격은 안 붙었다. 흐림 값과 간격을 같이 맞춘다.
- **참고 자료**
  - CSS만 쓴 gooey 메뉴 gist: 삼각형 가상 요소와 키프레임으로 흉내 낸 옛 방식. Font Awesome, Bootstrap을 쓴다. 생각만 참고하고 코드는 가져오지 않는다.
  - React gooey 메뉴 컴포넌트(MIT): 위 SVG 필터 방식. `motion` 라이브러리, Tailwind v4, React 19 기준이다. pykaki는 React 18에 Tailwind도 motion도 없으니 그대로 가져오지 않고, 같은 원리를 CSS·Web Animations로 새로 짠다. 코드를 옮겨 쓰면 `pykaki/licenses/`에 MIT 고지를 넣는다.
  - gooey 드롭다운 컴포넌트 사이트: 클라우드 세션 네트워크에서 막혀 못 봤다. 로컬에서 볼 때 Tailwind·motion이 필요한지, 라이선스가 무엇인지 확인.
- **데모**: 메뉴(단추가 녹아 늘어나 판이 되고 떨어짐, 8% 출렁 스프링 520ms)와 탭(떠난 자리 물방울이 실처럼 늘어나다 끊김) 두 가지를 만들었다. 사용자가 고르는 중.
- **주의**: 필터 층은 움직이는 동안 매 프레임 다시 그리니, 작은 칸(메뉴, 탭 줄)에만 쓰고 화면 전체에는 쓰지 않는다. 애니메이션 줄이기면 필터를 끄고 페이드만.

## 8. 탭에 끈적 적용 (사용자가 고름)

- `Toolbar.tsx` `ViewSwitch`: 맨 위 탭 줄에 `top-switch` 클래스와 끈적 층(`.vs-goo` 안 `.vs-pill`, `.vs-drop`)을 넣었다. 색 막대는 앞쪽 끝이 340ms, 뒤쪽 끝이 60ms 늦게 460ms(`--ease-spring`)로 따라오고, 떠난 자리 물방울이 420ms 동안 줄어들며 필터 `#pk-goo`(흐림 5px, 알파 ×20 −9, `App.tsx`의 `svg-defs`)로 막대와 녹아 붙었다 끊어진다. 글자 크기·언어가 바뀌면 `ResizeObserver`로 막대만 다시 맞춘다. 다른 화면 안의 작은 `.view-switch`(효과, 셰이더, 갤러리)는 그대로.
- `App.tsx`: 화면을 바꾸면 새 화면에 `.view-in`을 붙여 탭이 움직인 방향(`--dir`, `VIEW_ORDER` 차례)에서 32px 밀려 들어온다(`--dur-view` `--ease-spring`, 흐림 `--pop-blur`, 투명도 200ms). 나가는 화면은 바로 사라진다(React가 바로 뺌).
- 애니메이션 줄이기: 막대는 바로 옮기고 필터는 끄고, 새 화면은 150ms 페이드만.
- 웹 빌드를 크롬으로 열어 탭을 눌러 봄: 물방울이 남고, 막대가 새 탭에 정확히 맞고, 오류 없음. 윈도우 앱에서는 아직 안 봄.

## 9. 메뉴: 사용자가 보낸 영상의 끈적 드롭다운

- 영상(어두운 바탕, 흰 알약 단추 아래로 흰 메뉴 판이 녹아 나옴)을 프레임으로 재서 데모로 똑같이 만들어 봄. 같은 원리(흐림 + 알파 문턱)라 된다.
- 잰 타이밍: 30ms에 단추 밑에서 물방울, 230ms까지 단추에 붙은 채 커짐, 230~370ms 글자 페이드, 330ms쯤 목이 끊어져 8px 떨어짐, 450ms쯤 자리 잡음, 화살표 뒤집힘. 닫기 약 400ms: 글자 먼저, 판이 단추 밑으로 빨려 들어가 잠깐 불룩.
- 데모 값: 판이 단추 폭 60%의 단추 안쪽에서 시작, 세로 440ms·가로 30ms 늦게 440ms 출렁 스프링(8%), 글자 230ms에 140ms 페이드, 간격 8px·흐림 6px, 닫기 글자 80ms·판 300ms.
- 앱에 넣을 때 할 일: 단추가 메뉴 판과 같은 색으로 채워진 알약이어야 이 모양이 난다(지금 pygaki 메뉴 단추는 글자만 있는 단추). 메뉴는 `document.body`로 포털해 `position: fixed`라, 포털 안에 단추 자리를 덮는 액체 층(단추 모양 + 판)을 그리고 단추 글자는 그 위 선명한 층에 다시 그리거나, 단추와 메뉴를 한 층 안에 두도록 구조를 바꾼다. 밝은 화면에서는 판과 바탕이 비슷해 그림자로만 모양이 보이니 그림자를 조금 진하게.

## 10. 모든 드롭다운 메뉴에 끈적 드롭다운 (사용자 결정)

- 공용 부품 `pykaki/src/GooMenu.tsx`: 메뉴 판 안 맨 앞에 `<GooMenu anchor ready />`를 두면 판 배경을 뒤 액체 층(`.goo-liq`, body에 붙임)에 따로 그린다. 단추는 판과 같은 색 알약으로 칠하고(`.goo-anchor`), 액체 층은 단추 자리에 구멍을 내(mask) 진짜 단추 글자가 보이게 한다.
- 적용한 메뉴: 플래그 `PickMenu`(플래그 추가, 화면 만들기), 폴더 메뉴 `FolderMenu`, 나타나는 방식 `TransPicker`. 대화 상자(`.modal`), 플래그 칸 고치기 창(`.fd-pop`), 줄 옆 단추 묶음(`.side-pop`), 툴팁, 기본 `<select>`(57곳, 운영체제가 그림)는 메뉴가 아니거나 바꿀 수 없어 그대로.
- **연결 부분 끊기**: 흐림 6px면 9px보다 가까운 간격은 계속 붙어 보인다(메뉴 간격은 4~6px). 그래서 300ms부터 140ms 동안 흐림을 6 → 0으로 줄여 목을 끊고, 0이 되면 필터를 끈다. 닫을 때 흐림 6으로 되돌려 다시 녹아 붙으며 빨려 들어간다.
- 닫기: React가 판을 빼기 직전(GooMenu 정리 함수)에 판을 복제해 두고 복제를 80ms 페이드, 판 모양은 300ms 동안 단추 안쪽으로 빨려 들어간 뒤 액체 층과 단추 칠을 지운다.
- 열린 동안 찾기로 목록이 줄어 판 크기가 바뀌면 `ResizeObserver`로 판 모양을 따라간다.
- 애니메이션 줄이기: 액체 층 없이 판 제 배경으로 짧은 페이드.
- 웹 빌드에서 플래그 [+ 추가]로 확인: 열리고, 목이 끊어진 뒤 필터 꺼짐, 닫힌 뒤 액체 층·단추 칠 모두 지워짐, 오류 없음.

## 11. 상단 탭과 카드를 fluidkit 유리로 (사용자 결정)

- 사용자가 상단 탭과 카드의 유리 효과를 fluidkit(React 유리·물방울 UI 라이브러리, MIT, `motion` 필요, React 18 이상) 것으로 바꾸라고 함. npm `fluidkit@0.5.0`, `motion@12.43.0` 설치. 고지는 `pykaki/licenses/MIT-fluidkit.txt`, `MIT-motion.txt`. 배포 파일에 외부 주소나 `fetch`가 없는 것 확인(SVG 이름공간 주소만).
- 상단 탭: 앞서 직접 짠 끈적 탭(막대 + 물방울 + `#pk-goo` 필터)을 지우고 `LiquidTabs`(`flow="slide"`, `material="glass"`, `size="sm"`, 반사·그림자 켬)로. 막대 색은 `--accent` 82%, 글자 색은 `--muted`를 rgb로 바꿔 넘김(`useThemeInk`, 환경 설정이 바뀌면 다시 읽음). 처음엔 탭 바탕까지 강조색 유리가 되어 글자가 안 보여서 바탕은 `style`로 옅은 회색으로 덮음. 새 화면이 미끄러져 들어오는 것(`App.tsx` `.view-in`)은 그대로.
- 카드: `<section class="sec card">`를 `LiquidCard`(`material="glass"`, `radius=14`)로. 내용이 `[data-fluidkit='liquid-card-content']` 칸 안으로 한 겹 들어가서 `.sec > h3` 같은 CSS를 `:is(.sec, .card > [data-fluidkit='liquid-card-content']) > h3`로 고침(인스펙터의 맨 `.sec`도 계속 맞게). 카드 바탕·그림자 CSS는 빼고 LiquidCard가 그림. 접힘·사용 중 색은 `tint`로.
- 웹 빌드 크기 5,957KB → 6,131KB(gzip 3,219 → 3,278KB). 웹 빌드를 크롬으로 열어 확인: 카드 10장 유리로, 탭 막대 흐름, 오류 없음. 윈도우 앱과 어두운 화면은 아직 안 봄.
- 드롭다운 메뉴는 그대로 `GooMenu`(fluidkit에도 `LiquidMenu`가 있지만 사용자가 고른 끈적 드롭다운을 유지).
