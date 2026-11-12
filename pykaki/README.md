# PyKaki

**파이썬을 몰라도 렌파이(Ren'Py) 대본을 쓸 수 있는 에디터예요.**
상자와 선으로 이야기 흐름을 그리고, 대사를 쓰고, 렌파이 스크립트(`.rpy`)로 내보내요.

pygaki 묶음(렌파이 SDK + pygaki 플러그인 + 이 앱) 안의 데스크톱 앱으로 써요. 렌파이 런처의 [pygaki로 편집]으로 열어요. 웹 버전은 2026-11-12에 없앴어요.

## 할 수 있는 것

- 상자(대사 묶음)와 선(흐름)으로 대본 쓰기, 선택지와 분기
- 배경 바꾸기, 캐릭터 보이기/숨기기, 배경음악, 효과음을 **명령 없이 칸만 채워서** 넣기
- 줄을 끌어서 순서 바꾸기
- 렌파이로 게임을 켜고, 고른 상자나 줄로 바로 가기 ([렌파이에서 여기로 이동])
- 문제(연결 안 된 선, 빈 대사, 잘못된 이름) 검사
- `.rpy`로 내보내기
- [pygaki 플러그인](https://github.com/halftomatodev/pygaki/tree/main/showpy)와 연결: 렌파이 편집기에서 넣은 그림, 영상, 소리가 대본에도 나타나요
- 집중 모드(화면을 비우고 쓰는 줄만 또렷하게), 화면 색·글꼴(Pretendard 400/500/600, Neo둥근모)·단축키 바꾸기

자세한 사용법은 [사용 가이드](docs/GUIDE.md)를 보세요.

## 내 대본은 어디에 저장되나요?

서버가 없어요. 대본은 **내 컴퓨터에만** 있어요.

- 자동 저장: 렌파이 프로젝트 폴더 맨 위의 `프로젝트이름.flow.json`에 바로 저장돼요. 다른 컴퓨터에서 이어 쓸 때도 이 파일을 가져가요.
- 버전 목록(자동 저장본과 [버전 저장])은 앱 안(IndexedDB)에 있어요.

## 직접 고쳐서 쓰기 (개발자용)

```bash
npm install      # 처음 한 번
npm run dev      # 개발 서버 (http://localhost:5173, 개발용. 렌파이 프로젝트는 못 열어요)
npm run build    # dist/index.html 한 파일로 빌드 (데스크톱 앱이 이 화면을 씀)
cd app && npm ci && npm start   # 데스크톱 앱
```

구현 명세는 [docs/SPEC.md](docs/SPEC.md)에 있어요.

## 라이선스

[MIT](LICENSE) © halftomato
누구나 자유롭게 쓰고, 고치고, 다시 배포할 수 있어요. 저작권 표시와 라이선스 문구만 남겨 주세요.

PyKaki는 Ren'Py의 공식 도구가 아니에요.

함께 들어 있는 글꼴 **Pretendard**(길형진)와 **Neo둥근모**(Dalgona, 원작 김중태)는 SIL Open Font License 1.1을 따라요 ([Pretendard](licenses/OFL-Pretendard.txt), [Neo둥근모](licenses/OFL-NeoDunggeunmo.txt)).
