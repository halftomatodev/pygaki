// chat: 메신저 말풍선: 먼저 점 셋이 통통 튀는 작은 말풍선(말줄임표)이 나오고, 그 말풍선이 그대로 늘어나 대사 말풍선이 된 뒤 글자가 나옴
// 말풍선은 글 크기에 맞춰 셰이더로 그려서 그림 파일이 필요 없습니다. 글이 여러 줄이면 말풍선도 커집니다.
// u__side: 0 받은 쪽 (말줄임표가 왼쪽 위에서 나와 오른쪽·아래로 늘어남), 1 보낸 쪽 (오른쪽 위에서 나와 왼쪽·아래로 늘어남)
//   말풍선은 대사 글 자리를 감싸므로, 글을 화면 오른쪽에 두려면 대사 창의 글 자리도 오른쪽으로 둡니다
// u__recv, u__recv_ink: 받은 쪽 바탕색, 글자 색. u__send, u__send_ink: 보낸 쪽 바탕색, 글자 색
// u__typing: 말줄임표가 나와 있는 시간 (초, 0이면 바로 늘어남). u__pop: 말줄임표가 대사 말풍선으로 늘어나는 시간 (초)
// u__dot: 말줄임표 크기 (1이면 한 줄 말풍선과 같은 높이, 점도 그에 맞춤). u__dot_speed: 점이 한 번 튀는 시간 (초)
// u__radius: 모서리 둥글기 (픽셀, 한 줄이면 알약 모양까지). u__pad_x, u__pad_y: 글과 말풍선 사이 여백 (픽셀)
// u__hide: 1이면 말풍선이 다 늘어난 뒤 글자가 한 글자씩, 0이면 늘어난 끝에 글 전체가 한 번에 (그때는 글자/초를 크게)
// u__recolor: 글자를 그 색으로 바꾸는 정도 (0이면 원래 색). 글자 외곽선은 말풍선에 가려지므로 그리지 않습니다
// 말풍선은 대사 글보다 크게 그려져서 대사 창 밖으로 조금 나갈 수 있습니다. 누르면 말줄임표를 건너뛰고 바로 다 나옵니다.
// 쓰는 법:  e "지금 어디야?" (cps=30, effect="chat")      e "가는 중!" (cps=30, effect="chat:u__side=1")
//          e "음..." (cps=30, effect="chat:u__typing=3")      e "좋아" (cps=30, effect="chat:u__side=1:u__send=#0a84ff")
@effect chat 메신저 말풍선
@cps
@slowtime u__typing + u__pop
@set u__side 0.0
@set u__recv #e9e9eb
@set u__recv_ink #000000
@set u__send #34c759
@set u__send_ink #ffffff
@set u__typing 1.5
@set u__pop 0.35
@set u__dot 0.8
@set u__dot_speed 0.7
@set u__radius 21.0
@set u__pad_x 18.0
@set u__pad_y 10.0
@set u__hide 1.0
@set u__recolor 1.0
@param u__side 0 1 쪽 (0 받은 쪽 왼쪽, 1 보낸 쪽 오른쪽)
@param u__recv 0 0 받은 쪽 바탕색
@param u__recv_ink 0 0 받은 쪽 글자 색
@param u__send 0 0 보낸 쪽 바탕색
@param u__send_ink 0 0 보낸 쪽 글자 색
@param u__typing 0 6 말줄임표 시간 (초)
@param u__pop 0 1.5 늘어나는 시간 (초)
@param u__dot 0.3 2 말줄임표 크기
@param u__dot_speed 0.2 2 점이 튀는 시간 (초)
@param u__radius 0 40 모서리 둥글기
@param u__pad_x 0 60 가로 여백
@param u__pad_y 0 40 세로 여백
@param u__hide 0 1 글자 한 글자씩
@param u__recolor 0 1 글자 색 바꾸기
@variables
    uniform float u__side;
    uniform vec4 u__recv;
    uniform vec4 u__recv_ink;
    uniform vec4 u__send;
    uniform vec4 u__send_ink;
    uniform float u__typing;
    uniform float u__pop;
    uniform float u__dot;
    uniform float u__dot_speed;
    uniform float u__radius;
    uniform float u__pad_x;
    uniform float u__pad_y;
    uniform float u__hide;
    uniform float u__recolor;
    uniform float u_text_slow_time;
    uniform float u_text_to_drawable;
    uniform float u_text_main;
    uniform vec2 res0;
    attribute float a_text_min_time;
    attribute vec4 a_text_pos_rect;
    varying vec2 v__pos;
    varying vec4 v__rect;
    varying float v__min;
    varying float v__bub;
@vertex_20
    // 맨 윗줄 왼쪽 끝의 글자 네모 하나(메시에서 맨 처음 그려짐)를 글 전체보다 넓혀서 말풍선과 말줄임표를 그림 (bubble과 같은 방법)
    v__rect = a_text_pos_rect;
    v__min = a_text_min_time;
    v__bub = 0.0;
    vec2 l__d = vec2(0.0);
    if (u_text_main > 0.5 && a_text_pos_rect.x < 0.5 && a_text_pos_rect.y < 0.5) {
        float l__k = u_text_to_drawable;
        vec2 l__c = res0 * 0.5;
        vec2 l__h = l__c + vec2(u__pad_x, u__pad_y) * l__k;
        float l__ih = (a_text_pos_rect.w + 2.0 * u__pad_y * l__k) * max(u__dot, 0.0);
        vec2 l__wi = vec2(l__ih * 65.0 / 42.0, l__ih);
        vec2 l__ext = vec2(max(l__h.x, l__wi.x - l__h.x), max(l__h.y, l__wi.y - l__h.y)) + vec2(4.0 * l__k) + l__h * 0.15;
        vec2 l__mid = a_text_pos_rect.xy + a_text_pos_rect.zw * 0.5;
        vec2 l__to = vec2(gl_Position.x < l__mid.x ? l__c.x - l__ext.x : l__c.x + l__ext.x,
                          gl_Position.y < l__mid.y ? l__c.y - l__ext.y : l__c.y + l__ext.y);
        l__d = l__to - gl_Position.xy;
        gl_Position.xy = l__to;
        v__bub = 1.0;
    }
    v__pos = gl_Position.xy;
@vertex_250
    v_tex_coord += l__d / max(res0, vec2(1.0));
@fragment_360
    float l__k = u_text_to_drawable;
    float l__ts = u_text_slow_time;
    float l__right = u__side > 0.5 ? 1.0 : 0.0;
    vec4 l__fc = mix(u__recv, u__send, l__right);
    vec4 l__ic = mix(u__recv_ink, u__send_ink, l__right);
    vec4 l__fill = vec4(l__fc.rgb / max(l__fc.a, 0.001), 1.0) * l__fc.a;
    vec3 l__ink = l__ic.rgb / max(l__ic.a, 0.001);

    // 말줄임표 → 대사 말풍선으로 늘어난 정도 (0 → 1)
    float l__m = u__pop > 0.0 ? clamp((l__ts - u__typing) / u__pop, 0.0, 1.0) : (l__ts >= u__typing ? 1.0 : 0.0);

    // 글자: 다 늘어난 뒤에 (u__hide면 한 글자씩), 색 바꾸기. 외곽선 겹은 그리지 않음
    vec2 l__q0 = v__pos - v__rect.xy;
    bool l__inglyph = l__q0.x >= 0.0 && l__q0.x <= v__rect.z && l__q0.y >= 0.0 && l__q0.y <= v__rect.w;
    vec4 l__c = l__inglyph ? gl_FragColor : vec4(0.0);
    float l__gs = v__min + u__typing + u__pop * 0.8;
    l__c *= (u__hide < 0.5 ? clamp((l__m - 0.75) * 4.0, 0.0, 1.0) : (l__gs <= l__ts ? 1.0 : 0.0));
    if (u_text_main > 0.5) {
        l__c = mix(l__c, vec4(l__ink * l__c.a, l__c.a), clamp(u__recolor, 0.0, 1.0));
    } else {
        l__c = vec4(0.0);
    }

    if (v__bub > 0.5) {
        // 받은 쪽(왼쪽) 모양으로 그리고, 보낸 쪽은 좌우를 뒤집음
        vec2 l__p = v__pos - res0 * 0.5;
        l__p.x *= u__side > 0.5 ? -1.0 : 1.0;
        vec2 l__h = res0 * 0.5 + vec2(u__pad_x, u__pad_y) * l__k;
        float l__r = min(max(u__radius, 0.0) * l__k, min(l__h.x, l__h.y));

        // 말줄임표 말풍선: 대사 말풍선 자리의 위쪽 끝, 한 줄 높이(맨 윗줄 첫 글자 네모의 높이)에 맞춤
        float l__ih = (v__rect.w + 2.0 * u__pad_y * l__k) * max(u__dot, 0.0);
        vec2 l__wi = vec2(l__ih * 65.0 / 42.0, l__ih);
        vec2 l__icn = vec2(-l__h.x + l__wi.x * 0.5, -l__h.y + l__wi.y * 0.5);

        // 처음 나타남: 작게 커지며 흐릿하게 → 또렷하게 (말줄임표가 없으면 늘어나기와 같이)
        float l__fi = u__typing > 0.0 ? min(0.2, u__typing * 0.25) : max(u__pop * 0.3, 0.001);
        float l__ap = clamp(l__ts / max(l__fi, 0.001), 0.0, 1.0);
        float l__sc = 0.85 + 0.15 * l__ap;

        // 말줄임표 네모에서 대사 말풍선 네모로 (자리, 크기, 모서리를 같이 옮김). 조금 지나쳤다 돌아옴
        float l__mm = l__m - 1.0;
        float l__e = 1.0 + 2.2 * l__mm * l__mm * l__mm + 1.2 * l__mm * l__mm;
        vec2 l__bc = mix(l__icn, vec2(0.0), l__e);
        vec2 l__bh = max(mix(l__wi * 0.5 * l__sc, l__h, l__e), vec2(0.5));
        float l__br = min(mix(l__wi.y * 0.5 * l__sc, l__r, clamp(l__e, 0.0, 1.0)), min(l__bh.x, l__bh.y));
        vec2 l__bp = l__p - l__bc;
        vec2 l__q = abs(l__bp) - l__bh + vec2(l__br);
        float l__sd = length(max(l__q, vec2(0.0))) + min(max(l__q.x, l__q.y), 0.0) - l__br;
        float l__bin = 1.0 - smoothstep(-0.7, 0.7, l__sd);

        // 점 셋: 차례로 튀고, 늘어나기 시작하면 금방 사라짐
        float l__da = 1.0 - clamp(l__m * 5.0, 0.0, 1.0);
        float l__dots = 0.0;
        if (u__typing > 0.0 && l__da > 0.0) {
            float l__dr = l__ih * 4.5 / 42.0 * l__sc;
            vec2 l__ip = l__p - l__icn;
            for (int l__i = 0; l__i < 3; l__i++) {
                float l__fl = float(l__i);
                float l__ph = fract(max(l__ts - l__fl * 0.15 * u__dot_speed / 0.7, 0.0) / max(u__dot_speed, 0.05));
                float l__up = (0.5 - 0.5 * cos(6.2831853 * l__ph)) * 1.33 * l__dr;
                vec2 l__dc = vec2((l__fl - 1.0) * 3.56 * l__dr, -l__up);
                // 보낸 쪽은 좌우를 뒤집었으므로 점 차례도 거꾸로 보이지 않게 되돌림
                l__dc.x *= u__side > 0.5 ? -1.0 : 1.0;
                l__dots = max(l__dots, 1.0 - smoothstep(l__dr - 0.7, l__dr + 0.7, length(l__ip - l__dc)));
            }
            l__dots *= l__da;
        }
        vec4 l__dcol = vec4(mix(l__fill.rgb, l__ink, 0.45), 1.0);
        vec4 l__b = mix(l__fill, l__dcol, l__dots) * l__bin * l__ap;
        l__c = l__c + l__b * (1.0 - l__c.a);
    }
    gl_FragColor = l__c;
