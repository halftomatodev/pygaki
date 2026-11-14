// marquee: 옆으로 흐르기: 줄이 처음부터 다 보이고, 오른쪽에서 왼쪽으로 끝없이 흘러감 (전광판처럼). 양 끝은 흐려짐
// 줄마다 그 대사 글의 폭 안에서 돌고, 왼쪽으로 나간 글자는 간격(u__gap)만큼 뒤에 오른쪽에서 다시 들어옴
// u__speed: 빠르기 (1초에 픽셀). u__gap: 끝과 처음 사이 간격 (픽셀). u__dir: 0 왼쪽으로, 1 오른쪽으로
// u__fade: 양 끝 흐려지는 폭 (픽셀)
// 글이 짧으면 흐르는 폭도 짧습니다. 넓게 흐르게 하려면 글 뒤에 빈칸을 넣거나 대사창 폭을 정해 둡니다.
// 쓰는 법:  e "오늘의 소식: 비가 옵니다." (effect="marquee")      e "천천히." (effect="marquee:u__speed=40:u__gap=120")
@effect marquee 옆으로 흐르기
@redraw always
@set u__speed 90.0
@set u__gap 80.0
@set u__dir 0.0
@set u__fade 28.0
@param u__speed 10 400 빠르기
@param u__gap 0 400 끝과 처음 사이
@param u__dir 0 1 방향 (0 왼쪽, 1 오른쪽)
@param u__fade 0 120 끝 흐려지는 폭
@variables
    uniform float u__speed;
    uniform float u__gap;
    uniform float u__dir;
    uniform float u__fade;
    uniform float u_time;
    uniform float u_text_to_drawable;
    uniform vec2 res0;
    attribute vec4 a_text_pos_rect;
    varying float v__x;
@vertex_30
    // 글자 네모 가운데를 기준으로 통째로 옮겨서, 한 글자가 둘로 갈라지지 않게 함
    float l__w = res0.x;
    float l__span = l__w + max(u__gap, 0.0) * u_text_to_drawable;
    float l__off = mod(u_time * u__speed * u_text_to_drawable, max(l__span, 1.0));
    if (u__dir > 0.5) {
        l__off = l__span - l__off;
    }
    float l__cx = a_text_pos_rect.x + a_text_pos_rect.z * 0.5;
    float l__nx = mod(l__cx - l__off, max(l__span, 1.0));
    gl_Position.x += l__nx - l__cx;
    v__x = gl_Position.x;
@fragment_350
    float l__f = max(u__fade * u_text_to_drawable, 0.001);
    float l__a = clamp(v__x / l__f, 0.0, 1.0) * clamp((res0.x - v__x) / l__f, 0.0, 1.0);
    gl_FragColor = gl_FragColor * l__a;
