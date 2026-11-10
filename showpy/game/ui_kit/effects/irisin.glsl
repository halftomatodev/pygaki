// irisin: 원으로 열리기: 한 점에서 커지는 원 안으로 새 그림이 나타남
// u__x, u__y: 원의 가운데 (0~1, 0.5가 화면 가운데). u__soft: 원 가장자리의 부드러움
// 쓰는 법:  scene bg hall with img_fx.use("irisin")      show mina with img_fx.use("irisin", 1.2, x=0.3)
@transition irisin 원으로 열리기
@time 0.8
@set u__x 0.5
@set u__y 0.5
@set u__soft 0.03
@param u__x 0 1 가운데 가로
@param u__y 0 1 가운데 세로
@param u__soft 0 0.5 가장자리 부드러움
@variables
    uniform float u__x;
    uniform float u__y;
    uniform float u__soft;
@fragment
    vec2 l__c = vec2(u__x, u__y);
    float l__far = length(max(l__c, 1.0 - l__c) * l__size);
    float l__e = l__t * l__t * (3.0 - 2.0 * l__t);
    float l__r = l__e * l__far * (1.0 + u__soft);
    float l__k = 1.0 - smoothstep(l__r - u__soft * l__far - 0.001, l__r, length((l__uv - l__c) * l__size));
    gl_FragColor = mix(l__old, l__new, l__k * step(0.0001, l__t));
