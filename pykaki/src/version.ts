// 대본 파일에 남기는 "쓴 판" 표시 (SPEC 9-3)
// FEATURE: 대본 파일을 제대로 읽는 데 필요한 기능 판 번호. 예전 판이 모르는 줄 종류나 값을 대본에 더할 때만 1 올린다
export const FEATURE = 8; // 5: 상자와 label의 셰이더 (shader). 6: 셰이더와 TV 전환의 세부 값 (shader.va, vb, tv). 7: 상자와 label의 대사 소리·속도, 커서, 클릭 대기 (ui). 8: 셰이더 전환 pixelsort, datamosh와 그 초 (shader.time)
// 2: 글자 효과 slidein, shake, inkfill, glyphbox (showpy ui_kit 4.0). 3: 글 상자 box, tail, box_rotate, 효과 겹치기, 새 화면 효과 이름. 4: 효과 폴더의 글자 효과 이름, 그림 전환 img_fx.use (ui_kit 4.3)
// 빌드한 날과 커밋 (vite.config.ts가 넣음)
export const BUILD: string = __BUILD__;
