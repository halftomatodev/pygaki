# 언어 버튼 사전 (대본 편집기)

대본 편집기 화면 글은 소스에 한국어로 두고, 화면에 그려진 글을 이 사전으로 일본어·영어로 바꿉니다(`src/i18n.ts`). 도움말(F1)은 이 사전이 아니라 안내서 번역(`bundle/guide/ja/pykaki.md`, `en/pykaki.md`)을 그대로 보입니다(`src/Help.tsx`). pygaki editor(게임 안 편집 화면, F9)의 사전은 따로 `showpy/game/ui_kit/editor/editor_lang.tsv`에 있습니다.

| 파일 | 내용 |
|---|---|
| `strings.tsv` | 한 줄에 `한국어 \t 일본어 \t 영어`. 줄바꿈은 `\n`. `${…}`가 든 글은 번역에 `{0}` `{1}`(차례대로) |
| `build_dict.py` | `strings.tsv` → `src/i18n/dict.json` |
| `extract.cjs` | 소스(TypeScript 파서), 효과 파일 `@effect`·`@param` 이름, 셰이더 목록의 이름·막대 이름에서 사전에 없는 한글을 `missing.txt`로 |

화면 글을 더하거나 바꾸면:

```bash
node i18n/extract.cjs                                    # missing.txt에 사전에 없는 글
# missing.txt의 글을 번역해 strings.tsv 끝에 더함
python i18n/build_dict.py i18n src/i18n/dict.json        # 사전 다시 만들기
```

사전에 없는 글은 한국어 그대로 보입니다. 앞뒤의 기호·단축키("실행 취소 Ctrl+Z")는 떼고 찾고, " · "나 ", "로 이은 글은 조각마다 찾습니다. 게임 용어는 렌파이 공식 표현을 따릅니다(label, screen, 選択肢/Choice, セリフ/Dialogue 등). 원어민 검토를 권합니다.

번역이 빠지기 쉬운 곳: JSX에서 `{i + 1}번`처럼 글 사이에 `{}`를 끼우면 DOM 글이 조각나서 사전에 안 걸립니다(템플릿 문자열 하나로). CSS `content`로 그린 글은 DOM 글이 아니라서 `i18n.ts`의 `cssWords()`가 CSS 변수(`--t-in-use`)로 넘깁니다. 화면을 일본어로 두고 한글이 남은 글 마디를 찾아보면 빠진 곳이 보입니다(대본 글은 그대로가 맞음).
