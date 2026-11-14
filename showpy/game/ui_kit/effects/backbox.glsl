// backbox: 뒤에 상자: 줄마다 글자 뒤에 색 상자가 깔리고, 글자가 나오는 만큼 끊기지 않고 오른쪽으로 길어짐 (방송 자막, 노래방 자막처럼)
// 렌파이가 글자 네모를 빈틈없이 붙여 그려서 상자가 이어집니다. 줄 앞뒤 여백은 줄 끝의 빈 글자 자리에 그립니다.
// u__color: 상자 색 (투명도는 #rrggbbaa 또는 u__alpha). u__alpha: 상자 진하기. u__pad_x: 줄 앞뒤 여백 (픽셀)
// u__top, u__bottom: 줄 높이에서 위, 아래를 잘라 낼 비율 (줄 사이에 틈이 생김). u__lead: 상자가 글자보다 먼저 나가는 정도 (글자 수)
// u__round: 줄 끝 모서리 둥글기 (픽셀). u__grow: 0이면 상자가 처음부터 다 깔림. u__hide: 0이면 글자도 처음부터 다 보임
// 노래방과 겹치기 (줄 전체가 보이고 상자도 다 깔린 채 칠해짐): effect="backbox:u__grow=0:u__hide=0|karaoke"
// 쓰는 법:  e "자막처럼." (cps=25, effect="backbox")      e "파란 상자." (effect="backbox:u__color=#1e6fff:u__alpha=0.9")
@effect backbox 뒤에 상자
@cps
@slow 1.0
@set u__color #101010
@set u__alpha 0.85
@set u__pad_x 14.0
@set u__top 0.06
@set u__bottom 0.06
@set u__lead 1.5
@set u__round 4.0
@set u__grow 1.0
@set u__hide 1.0
@param u__color 0 0 상자 색
@param u__alpha 0 1 상자 진하기
@param u__pad_x 0 60 앞뒤 여백
@param u__top 0 0.45 위 잘라 내기
@param u__bottom 0 0.45 아래 잘라 내기
@param u__lead 0 10 먼저 나가기
@param u__round 0 30 모서리 둥글기
@param u__grow 0 1 점점 길어지기
@param u__hide 0 1 글자 한 글자씩
@variables
    uniform vec4 u__color;
    uniform float u__alpha;
    uniform float u__pad_x;
    uniform float u__top;
    uniform float u__bottom;
    uniform float u__lead;
    uniform float u__round;
    uniform float u__grow;
    uniform float u__hide;
    uniform float u_text_slow_duration;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_depth;
    uniform float u_text_max_depth;
    uniform sampler2D tex0;
    uniform vec2 res0;
    attribute float a_text_min_time;
    attribute float a_text_time;
    attribute float a_text_pseudo_glyph;
    attribute vec4 a_text_pos_rect;
    varying vec2 v_tex_coord;
    varying vec2 v__q;
    varying vec4 v__rect;
    varying float v__time;
    varying float v__min;
    varying float v__kind;
@vertex_20
    // 줄 앞의 빈 글자(Text 왼쪽 끝에 붙음)는 왼쪽으로, 줄 끝의 빈 글자는 오른쪽으로 여백만큼 넓힘
    float l__pad = u__pad_x * u_text_to_drawable;
    float l__left = gl_Position.x < a_text_pos_rect.x + a_text_pos_rect.z * 0.5 ? 1.0 : 0.0;
    float l__start = a_text_pos_rect.x < 1.0 + u_text_to_drawable * 2.0 ? 1.0 : 0.0;
    float l__dx = 0.0;
    if (a_text_pseudo_glyph < 0.5) {
        // 줄 앞의 빈 글자가 폭이 0이면(왼쪽 정렬) 줄 첫 글자를 왼쪽으로 넓혀 앞 여백을 그림
        if (l__start > 0.5 && l__left > 0.5) {
            l__dx = -l__pad;
        }
    } else {
        if (l__start > 0.5 && l__left > 0.5) {
            l__dx = min(0.0, (a_text_pos_rect.x + a_text_pos_rect.z - l__pad) - gl_Position.x);
        } else if (l__start < 0.5 && l__left < 0.5) {
            l__dx = max(0.0, (a_text_pos_rect.x + l__pad) - gl_Position.x);
        }
    }
    gl_Position.x += l__dx;
    v__q = gl_Position.xy - a_text_pos_rect.xy;
    v__rect = a_text_pos_rect;
    v__time = a_text_time;
    v__min = a_text_min_time;
    v__kind = a_text_pseudo_glyph > 0.5 ? (l__start > 0.5 ? 1.0 : 2.0) : 0.0;
@vertex_250
    v_tex_coord.x += l__dx / max(res0.x, 1.0);
@fragment_360
    bool l__inglyph = v__q.x >= 0.0 && v__q.x <= v__rect.z;
    vec4 l__c = (l__inglyph && v__kind < 0.5) ? gl_FragColor : vec4(0.0);
    // 글자는 한 글자씩 (렌파이 typewriter처럼)
    l__c *= (u__hide < 0.5 || u_text_slow_duration <= 0.0 || v__min <= u_text_slow_time) ? 1.0 : 0.0;
    if (u_text_depth >= u_text_max_depth - 0.5) {
        float l__h = v__rect.w;
        float l__pad = u__pad_x * u_text_to_drawable;
        float l__lead = u__lead * u_text_slow_duration;
        float l__now = u_text_slow_duration > 0.0 ? u_text_slow_time + l__lead : 1.0e6;
        if (u__grow < 0.5) {
            l__now = 1.0e6;
        }
        // 위아래 잘라 내기
        float l__in = step(l__h * u__top, v__q.y) * step(v__q.y, l__h * (1.0 - u__bottom));
        // 점점 길어지기: 이 점이 나올 때가 지났는지 (글자 안에서는 왼쪽부터 오른쪽으로 부드럽게)
        float l__show = 0.0;
        float l__ex = 0.0;
        if (v__kind < 0.5 && l__inglyph) {
            l__show = step(v__time, l__now);
        } else {
            // 여백: 글자 쪽에서 바깥쪽으로 자람 (줄 첫 글자를 넓힌 곳, 줄 앞 빈 글자, 줄 끝 빈 글자)
            float l__d = v__kind < 0.5 ? -v__q.x : (v__kind < 1.5 ? (v__rect.z - v__q.x) : v__q.x);
            float l__k = u_text_slow_duration > 0.0 ? clamp((l__now - v__min) / max(u_text_slow_duration * 0.8, 0.0001), 0.0, 1.0) : 1.0;
            if (u__grow < 0.5) {
                l__k = 1.0;
            }
            l__show = (l__d >= 0.0 && l__d <= l__pad * l__k) ? 1.0 : 0.0;
            l__ex = l__pad - l__d;
            // 바깥 모서리 둥글게
            float l__r = min(u__round * u_text_to_drawable, min(l__pad, l__h * 0.5));
            if (l__r > 0.5 && l__ex < l__r) {
                float l__y0 = l__h * u__top;
                float l__y1 = l__h * (1.0 - u__bottom);
                float l__cy = clamp(v__q.y, l__y0 + l__r, l__y1 - l__r);
                float l__dd = length(vec2(l__r - l__ex, v__q.y - l__cy));
                l__show *= 1.0 - smoothstep(l__r - 1.0, l__r, l__dd);
            }
        }
        float l__a = clamp(u__alpha, 0.0, 1.0) * u__color.a * l__in * l__show;
        vec4 l__box = vec4(u__color.rgb / max(u__color.a, 0.001), 1.0) * l__a;
        l__c = l__c + l__box * (1.0 - l__c.a);
    }
    gl_FragColor = l__c;
