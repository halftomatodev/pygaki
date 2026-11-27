// bubble: 말풍선: 대사 글 전체를 말풍선이 감싸고, 처음에 퐁 커지며 나온 뒤 글자가 한 글자씩 나옴 (만화 말풍선처럼)
// 말풍선은 글 크기에 맞춰 셰이더로 그려서 그림 파일이 필요 없습니다. 글이 여러 줄이면 말풍선도 커집니다.
// u__shape: 모양. 0 둥근 말풍선, 1 손그림 (울퉁불퉁한 선), 2 외침 (뾰족뾰족), 3 집중선 (안쪽은 둥글고 바깥으로 뾰족한 선이 뻗음)
// u__fill: 바탕색. u__line: 선 색 (집중선은 뻗는 선의 색). u__width: 선 굵기 (픽셀). u__pad: 글과 말풍선 사이 여백 (픽셀)
// u__corner: 모서리 (2 타원 ~ 6 네모에 가까움). u__tail: 꼬리 길이 (0이면 없음). u__tail_dir: 꼬리 방향 (도, 0 오른쪽, 90 아래, 180 왼쪽, 270 위)
// u__wobble: 손그림 울퉁불퉁 정도. u__jag: 외침의 뾰족한 길이. u__count: 뾰족한 개수 (집중선은 0이면 저절로)
// u__spike: 집중선이 뻗는 길이 (픽셀). u__seed: 모양을 바꾸는 수 (같은 글이면 같은 모양). u__boil: 손그림 선이 초당 바뀌는 번 (0이면 멈춤)
// u__ink: 글자 색. u__recolor: 글자를 그 색으로 바꾸는 정도 (0이면 원래 색). 글자 외곽선은 말풍선 뒤에 가려지므로 그리지 않습니다
// 그림으로 바꾸기: u__image에 그림 파일 (예: "images/bubble.png"), u__image_on=1. 셰이더로 그린 모양 대신 그 그림을 글 크기에 맞춰 늘려 깔고,
//   모서리는 늘리지 않아 선 굵기와 해상도가 유지됨 (9칸 나누기). u__slice: 그림에서 모서리로 쓸 비율 (0~0.5, 0이면 통째로 늘림)
//   u__slice_px: 화면에서 모서리 크기 (픽셀). u__image_out: 그림이 글 둘레(여백 포함)보다 더 나가는 픽셀 (꼬리, 집중선이 든 그림이면 늘림)
//   그림은 효과 값이라 대사마다 다른 그림, 같은 대사 효과 이름으로 바꿔 끼우기가 됩니다. PyKaki 미리보기는 셰이더로 그린 모양으로 보입니다
// u__pop: 퐁 나오는 시간 (글자 수, 0이면 바로). u__hide: 0이면 글자가 처음부터 다 보임
// 말풍선은 대사 글보다 크게 그려져서 대사 창 밖으로 조금 나갈 수 있습니다.
// 쓰는 법:  e "괜찮아?" (cps=25, effect="bubble")      e "앗!" (effect="bubble:u__shape=2")
//          e "그림 말풍선" (effect="bubble:u__image=images/bubble.png:u__image_on=1:u__slice=0.3:u__slice_px=40")
//          e "まさか" (effect="bubble:u__shape=3:u__fill=#000000:u__ink=#ffffff")      e "음..." (effect="bubble:u__shape=1:u__tail=0")
@effect bubble 말풍선
@cps
@slow u__pop
@redraw u__boil
@set u__shape 0.0
@set u__fill #ffffff
@set u__line #111111
@set u__width 3.0
@set u__pad 12.0
@set u__corner 3.0
@set u__tail 0.35
@set u__tail_dir 115.0
@set u__wobble 0.06
@set u__jag 0.22
@set u__count 0.0
@set u__spike 40.0
@set u__seed 0.0
@set u__boil 0.0
@set u__ink #111111
@set u__recolor 1.0
@set u__image #00000000
@set u__image_on 0.0
@set u__slice 0.3
@set u__slice_px 40.0
@set u__image_out 0.0
@set u__pop 6.0
@set u__hide 1.0
@param u__shape 0 3 모양 (0 둥근, 1 손그림, 2 외침, 3 집중선)
@param u__fill 0 0 바탕색
@param u__line 0 0 선 색
@param u__width 0 12 선 굵기
@param u__pad 0 60 여백
@param u__corner 2 6 모서리 (2 타원, 6 네모)
@param u__tail 0 1 꼬리 길이
@param u__tail_dir 0 360 꼬리 방향
@param u__wobble 0 0.2 울퉁불퉁
@param u__jag 0 0.6 뾰족한 길이
@param u__count 0 60 뾰족한 개수
@param u__spike 0 150 집중선 길이
@param u__seed 0 100 모양 바꾸기
@param u__boil 0 12 선이 바뀌는 번
@param u__ink 0 0 글자 색
@param u__recolor 0 1 글자 색 바꾸기
@param u__image_on 0 1 그림 쓰기
@param u__slice 0 0.5 그림 모서리 비율
@param u__slice_px 0 200 그림 모서리 크기
@param u__image_out 0 200 그림이 더 나가는 길이
@param u__pop 0 30 퐁 나오는 시간
@param u__hide 0 1 글자 한 글자씩
@variables
    uniform float u__shape;
    uniform vec4 u__fill;
    uniform vec4 u__line;
    uniform float u__width;
    uniform float u__pad;
    uniform float u__corner;
    uniform float u__tail;
    uniform float u__tail_dir;
    uniform float u__wobble;
    uniform float u__jag;
    uniform float u__count;
    uniform float u__spike;
    uniform float u__seed;
    uniform float u__boil;
    uniform vec4 u__ink;
    uniform float u__recolor;
    uniform sampler2D u__image;
    uniform float u__image_on;
    uniform float u__slice;
    uniform float u__slice_px;
    uniform float u__image_out;
    uniform float u__pop;
    uniform float u__hide;
    uniform float u_text_time;
    uniform float u_text_slow_duration;
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
    // 맨 윗줄 왼쪽 끝의 글자 네모 하나(메시에서 맨 처음 그려짐)를 글 전체보다 넓혀서 말풍선을 그림.
    // 글자 본 겹에서만 넓히므로 말풍선은 그 겹의 다른 글자 뒤에 한 번만 그려짐 (외곽선 겹은 텍스처 크기가 달라서 쓰지 않음)
    v__rect = a_text_pos_rect;
    v__min = a_text_min_time;
    v__bub = 0.0;
    vec2 l__d = vec2(0.0);
    if (u_text_main > 0.5 && a_text_pos_rect.x < 0.5 && a_text_pos_rect.y < 0.5) {
        float l__k = u_text_to_drawable;
        float l__s = pow(2.0, 1.0 / clamp(u__corner, 2.0, 6.0));
        vec2 l__a = res0 * 0.5 * l__s + vec2(u__pad * l__k);
        float l__grow = u__shape > 2.5 ? 0.0 : (u__shape > 1.5 ? u__jag : (u__shape > 0.5 ? u__wobble : 0.0));
        vec2 l__ext = l__a * (1.0 + l__grow + max(u__tail, 0.0) * (u__shape > 2.5 ? 0.0 : 1.0)) + vec2((u__spike * (u__shape > 2.5 ? 1.0 : 0.0) + u__width + 4.0) * l__k);
        if (u__image_on > 0.5) {
            l__ext = res0 * 0.5 + vec2((u__pad + u__image_out + 2.0) * l__k);
        }
        vec2 l__c = res0 * 0.5;
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
    vec2 l__q0 = v__pos - v__rect.xy;
    bool l__inglyph = l__q0.x >= 0.0 && l__q0.x <= v__rect.z && l__q0.y >= 0.0 && l__q0.y <= v__rect.w;
    vec4 l__c = l__inglyph ? gl_FragColor : vec4(0.0);

    // 퐁 나오기 (0 → 1, 조금 지나쳤다 돌아옴)
    float l__pd = u__pop * u_text_slow_duration;
    float l__pk = l__pd > 0.0 ? clamp(u_text_slow_time / l__pd, 0.0, 1.0) : 1.0;
    float l__pm = l__pk - 1.0;
    float l__scale = max(1.0 + 2.70158 * l__pm * l__pm * l__pm + 1.70158 * l__pm * l__pm, 0.001);

    // 글자: 한 글자씩, 색 바꾸기. 외곽선 겹은 말풍선에 가려지므로 그리지 않음
    l__c *= (u__hide < 0.5 || u_text_slow_duration <= 0.0 || v__min <= u_text_slow_time) ? 1.0 : 0.0;
    if (u_text_main > 0.5) {
        vec3 l__ink = u__ink.rgb / max(u__ink.a, 0.001);
        l__c = mix(l__c, vec4(l__ink * l__c.a, l__c.a), clamp(u__recolor, 0.0, 1.0));
    } else {
        l__c = vec4(0.0);
    }
    l__c *= clamp(l__pk * 2.5 - 1.5, 0.0, 1.0);

    if (v__bub > 0.5) {
        float l__k = u_text_to_drawable;
        float l__n = clamp(u__corner, 2.0, 6.0);
        vec2 l__a = res0 * 0.5 * pow(2.0, 1.0 / l__n) + vec2(u__pad * l__k);
        vec2 l__p = (v__pos - res0 * 0.5) / l__scale;
        vec2 l__qq = l__p / l__a;
        vec2 l__aq = max(abs(l__qq), vec2(1.0e-4));
        float l__d = pow(pow(l__aq.x, l__n) + pow(l__aq.y, l__n), 1.0 / l__n);
        // 경계까지 거리를 픽셀로 (기울기로 나눔)
        vec2 l__g = pow(l__aq / max(l__d, 1.0e-4), vec2(l__n - 1.0)) / l__a;
        float l__gl = max(length(l__g), 1.0e-5);
        float l__th = atan(l__qq.y, l__qq.x);
        float l__seed = u__seed + res0.x * 0.0137 + res0.y * 0.0071;
        if (u__boil > 0.0) {
            l__seed += floor(u_text_time * u__boil) * 7.31;
        }
        float l__lw = max(u__width * l__k, 0.0);
        float l__r = 1.0;
        vec4 l__fill = vec4(u__fill.rgb / max(u__fill.a, 0.001), 1.0) * u__fill.a;
        vec4 l__line = vec4(u__line.rgb / max(u__line.a, 0.001), 1.0) * u__line.a;
        vec4 l__b = vec4(0.0);

        if (u__image_on > 0.5) {
            // 그림: 글 둘레 네모에 9칸으로 나눠 깔기 (모서리는 늘리지 않음)
            vec2 l__h = res0 * 0.5 + vec2((u__pad + u__image_out) * l__k);
            vec2 l__x = l__p + l__h;
            vec2 l__wr = l__h * 2.0;
            float l__sl = clamp(u__slice, 0.0, 0.5);
            vec2 l__cs = min(vec2(max(u__slice_px * l__k, 0.001)), l__wr * 0.5);
            vec2 l__uv = l__x / max(l__wr, vec2(1.0));
            if (l__sl > 0.0) {
                vec2 l__mid = l__sl + (l__x - l__cs) / max(l__wr - 2.0 * l__cs, vec2(0.001)) * (1.0 - 2.0 * l__sl);
                vec2 l__lo = l__x / l__cs * l__sl;
                vec2 l__hi = 1.0 - (l__wr - l__x) / l__cs * l__sl;
                l__uv = vec2(l__x.x < l__cs.x ? l__lo.x : (l__x.x > l__wr.x - l__cs.x ? l__hi.x : l__mid.x),
                             l__x.y < l__cs.y ? l__lo.y : (l__x.y > l__wr.y - l__cs.y ? l__hi.y : l__mid.y));
            }
            bool l__on = l__x.x >= 0.0 && l__x.y >= 0.0 && l__x.x <= l__wr.x && l__x.y <= l__wr.y;
            l__b = l__on ? texture2D(u__image, clamp(l__uv, 0.0, 1.0)) : vec4(0.0);
        } else if (u__shape < 2.5) {
            // 반지름 r(각도)을 두 번 (조금 다른 각도로) 구해서, 기울어진 곳에서도 선 굵기가 고르게 거리를 맞춤
            float l__cnt = u__count > 0.5 ? u__count : clamp(floor((l__a.x + l__a.y) / (34.0 * l__k)), 10.0, 40.0);
            float l__r1 = 1.0;
            for (int l__i = 0; l__i < 2; l__i++) {
                float l__ta = l__th + float(l__i) * 0.002;
                float l__rr = 1.0;
                if (u__shape > 0.5 && u__shape < 1.5) {
                    // 손그림: 반지름을 sin 몇 개로 흔듦
                    l__rr += u__wobble * (0.5 * sin(3.0 * l__ta + l__seed) + 0.3 * sin(5.0 * l__ta + l__seed * 1.7) + 0.2 * sin(8.0 * l__ta + l__seed * 2.3));
                } else if (u__shape > 1.5) {
                    // 외침: 뾰족한 톱니, 길이는 하나씩 다름
                    float l__x = (l__ta / 6.2831853 + 0.5) * floor(l__cnt) + fract(l__seed * 0.123);
                    float l__h = fract(sin((floor(l__x) + l__seed) * 12.9898) * 43758.5453);
                    float l__tri = 1.0 - abs(fract(l__x) * 2.0 - 1.0);
                    l__rr += u__jag * (0.45 + 0.55 * l__h) * l__tri;
                }
                // 꼬리: 고른 방향으로 뾰족하게 늘어남
                if (u__tail > 0.0) {
                    float l__dt = abs(mod(l__ta - radians(u__tail_dir) + 3.14159265, 6.2831853) - 3.14159265);
                    float l__tk = max(0.0, 1.0 - l__dt / 0.32);
                    l__rr += u__tail * l__tk * l__tk * (u__shape > 1.5 ? 1.0 + u__jag : 1.0);
                }
                if (l__i == 0) {
                    l__r = l__rr;
                } else {
                    l__r1 = l__rr;
                }
            }
            if (u__shape > 0.5 && u__shape < 1.5) {
                // 손그림은 선 굵기도 바뀜
                l__lw *= 0.7 + 0.45 * (0.5 + 0.5 * sin(2.0 * l__th + l__seed * 0.7));
            }
            vec2 l__gt = vec2(-l__qq.y, l__qq.x) / max(dot(l__qq, l__qq), 1.0e-6) / l__a;
            float l__gf = max(length(sign(l__qq) * l__g - (l__r1 - l__r) / 0.002 * l__gt), 1.0e-5);
            // 한가운데 가까이는 기울기 계산이 튀므로 안쪽으로 봄
            float l__dist = l__d < 0.4 ? -1000.0 : (l__d - l__r) / l__gf;
            float l__in = 1.0 - smoothstep(-0.7, 0.7, l__dist);
            float l__ln = l__lw > 0.0 ? 1.0 - smoothstep(l__lw * 0.5 - 0.7, l__lw * 0.5 + 0.7, abs(l__dist)) : 0.0;
            l__b = l__line * l__ln + l__fill * l__in * (1.0 - l__ln * l__line.a);
        } else {
            // 집중선: 안쪽은 바탕색, 바깥으로 길이가 다른 뾰족한 선
            float l__s = l__d < 0.4 ? -1000.0 : (l__d - 1.0) / l__gl;
            float l__per = 6.2831853 * sqrt((l__a.x * l__a.x + l__a.y * l__a.y) * 0.5);
            float l__cnt = u__count > 0.5 ? u__count : clamp(floor(l__per / (5.0 * l__k)), 40.0, 240.0);
            float l__x = (l__th / 6.2831853 + 0.5) * floor(l__cnt);
            float l__h = fract(sin((floor(l__x) + l__seed) * 12.9898) * 43758.5453);
            float l__L = max(u__spike * l__k * (0.3 + 0.7 * l__h), 1.0);
            float l__w = abs(fract(l__x) - 0.5) * 2.0;
            float l__e = (1.0 - l__s / l__L) - l__w;
            float l__in = clamp(0.5 - l__s, 0.0, 1.0);
            float l__sp = clamp(l__e * l__L * 0.5, 0.0, 1.0) * clamp(l__s + 0.5, 0.0, 1.0) * (1.0 - l__in);
            l__b = l__fill * l__in + l__line * l__sp;
        }
        l__c = l__c + l__b * clamp(l__pk * 3.0, 0.0, 1.0) * (1.0 - l__c.a);
    }
    gl_FragColor = l__c;
