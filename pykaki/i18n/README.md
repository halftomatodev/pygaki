# 언어 버튼 사전 (대본 편집기)

대본 편집기 화면 글은 소스에 한국어로 두고, 화면에 그려진 글을 이 사전으로 일본어·영어로 바꿉니다(`src/i18n.ts`). 도움말 문서(`docs/GUIDE.md`)는 한국어만입니다.

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
