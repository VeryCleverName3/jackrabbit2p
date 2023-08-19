let libs = 
`

//https://www.shadertoy.com/view/XsX3zB
/* discontinuous pseudorandom uniformly distributed in [-0.5, +0.5]^3 */
vec3 random3(vec3 c) {
	float j = 4096.0*sin(dot(c,vec3(17.0, 59.4, 15.0)));
	vec3 r;
	r.z = fract(512.0*j);
	j *= .125;
	r.x = fract(512.0*j);
	j *= .125;
	r.y = fract(512.0*j);
	return r-0.5;
}

/* skew constants for 3d simplex functions */
const float F3 =  0.3333333;
const float G3 =  0.1666667;

/* 3d simplex noise */
float simplex3d(vec3 p) {
	 /* 1. find current tetrahedron T and it's four vertices */
	 /* s, s+i1, s+i2, s+1.0 - absolute skewed (integer) coordinates of T vertices */
	 /* x, x1, x2, x3 - unskewed coordinates of p relative to each of T vertices*/
	 
	 /* calculate s and x */
	 vec3 s = floor(p + dot(p, vec3(F3)));
	 vec3 x = p - s + dot(s, vec3(G3));
	 
	 /* calculate i1 and i2 */
	 vec3 e = step(vec3(0.0), x - x.yzx);
	 vec3 i1 = e*(1.0 - e.zxy);
	 vec3 i2 = 1.0 - e.zxy*(1.0 - e);
	 	
	 /* x1, x2, x3 */
	 vec3 x1 = x - i1 + G3;
	 vec3 x2 = x - i2 + 2.0*G3;
	 vec3 x3 = x - 1.0 + 3.0*G3;
	 
	 /* 2. find four surflets and store them in d */
	 vec4 w, d;
	 
	 /* calculate surflet weights */
	 w.x = dot(x, x);
	 w.y = dot(x1, x1);
	 w.z = dot(x2, x2);
	 w.w = dot(x3, x3);
	 
	 /* w fades from 0.6 at the center of the surflet to 0.0 at the margin */
	 w = max(0.6 - w, 0.0);
	 
	 /* calculate surflet components */
	 d.x = dot(random3(s), x);
	 d.y = dot(random3(s + i1), x1);
	 d.z = dot(random3(s + i2), x2);
	 d.w = dot(random3(s + 1.0), x3);
	 
	 /* multiply d by w^4 */
	 w *= w;
	 w *= w;
	 d *= w;
	 
	 /* 3. return the sum of the four surflets */
	 return dot(d, vec4(52.0));
}


//ty IQ for most of these
float smin( float a, float b, float k )
{
    float h = max( k-abs(a-b), 0.0 )/k;
    return min( a, b ) - h*h*k*(1.0/4.0);
}

vec3 bend(vec3 p, float k)
{
    float c = cos(k*p.x);
    float s = sin(k*p.x);
    mat2  m = mat2(c,-s,s,c);
    vec3  q = vec3(m*p.xy,p.z);
    return q;
}
vec3 rotY(vec3 v, float a){
    return vec3(v.x*cos(a)+v.z*sin(a),v.y,-v.x*sin(a) + v.z*cos(a));
}

vec3 rotX(vec3 v, float a){
    return vec3(v.x, v.y*cos(a)-v.z*sin(a), v.y*sin(a)+v.z*cos(a));
}

vec3 palette( in float t, in vec3 a, in vec3 b, in vec3 c, in vec3 d )
{
    return a + b*cos( 6.28318*(c*t+d) );
}
float dot2(in vec3 v ) { return dot(v,v); }

float sdBox( vec3 p, vec3 b ){
  vec3 q = abs(p) - b;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

float sdBox( in vec2 p, in vec2 b ){
    vec2 d = abs(p)-b;
    return length(max(d,0.0)) + min(max(d.x,d.y),0.0);
}
float sdCapsule( vec3 p, vec3 a, vec3 b, float r )
{
  vec3 pa = p - a, ba = b - a;
  float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
  return length( pa - ba*h ) - r;
}
float sdTorus( vec3 p, vec2 t )
{
  vec2 q = vec2(length(p.xz)-t.x,p.y);
  return length(q)-t.y;
}
float sdRoundCone( vec3 p, vec3 a, vec3 b, float r1, float r2 )
{
  // sampling independent computations (only depend on shape)
  vec3  ba = b - a;
  float l2 = dot(ba,ba);
  float rr = r1 - r2;
  float a2 = l2 - rr*rr;
  float il2 = 1.0/l2;
    
  // sampling dependant computations
  vec3 pa = p - a;
  float y = dot(pa,ba);
  float z = y - l2;
  float x2 = dot2( pa*l2 - ba*y );
  float y2 = y*y*l2;
  float z2 = z*z*l2;

  // single square root!
  float k = sign(rr)*rr*rr*x2;
  if( sign(z)*a2*z2>k ) return  sqrt(x2 + z2)        *il2 - r2;
  if( sign(y)*a2*y2<k ) return  sqrt(x2 + y2)        *il2 - r1;
                        return (sqrt(x2*a2*il2)+y*rr)*il2 - r1;
}
float sdVerticalCapsule( vec3 p, float h, float r )
{
  p.y -= clamp( p.y, 0.0, h );
  return length( p ) - r;
}
float sdCappedCylinder( vec3 p, float h, float r )
{
  vec2 d = abs(vec2(length(p.xz),p.y)) - vec2(r,h);
  return min(max(d.x,d.y),0.0) + length(max(d,0.0));
}
float sdSphere(vec3 p, float r){
    return length(p) - r;
}

vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}
  
vec4 permute(vec4 x) {
    return mod289(((x * 34.0) + 1.0) * x);
}
float noise(vec3 p) {
    vec3 a = floor(p);
    vec3 d = p - a;
    d = d * d * (3.0 - 2.0 * d);
  
    vec4 b = a.xxyy + vec4(0.0, 1.0, 0.0, 1.0);
    vec4 k1 = permute(b.xyxy);
    vec4 k2 = permute(k1.xyxy + b.zzww);
  
    vec4 c = k2 + a.zzzz;
    vec4 k3 = permute(c);
    vec4 k4 = permute(c + 1.0);
  
    vec4 o1 = fract(k3 * (1.0 / 41.0));
    vec4 o2 = fract(k4 * (1.0 / 41.0));
  
    vec4 o3 = o2 * d.z + o1 * (1.0 - d.z);
    vec2 o4 = o3.yw * d.x + o3.xz * (1.0 - d.x);
  
    return o4.y * d.y + o4.x * (1.0 - d.y);
}
//stars from https://www.shadertoy.com/view/msdXzl
vec3 nmzHash33(vec3 q) {
    uvec3 p = uvec3(ivec3(q));
    p = p * uvec3(374761393U, 1103515245U, 668265263U) + p.zxy + p.yzx;
    p = p.yzx * (p.zxy ^ (p >> 3U));
    return vec3(p ^ (p >> 16U)) * (1.0 / vec3(0xffffffffU));
}
vec3 stars(in vec3 p) {
    vec3 c = vec3(0.);
    float resX = 500.;
  
    for(float i = 0.; i < 5.; i++) {
        vec3 q = fract(p * (.15 * resX)) - 0.5;
        vec3 id = floor(p * (.15 * resX));
        vec2 rn = nmzHash33(id).xy;
        float c2 = 1. - smoothstep(0., .6, length(q));
        c2 *= step(rn.x, .0005 + i * 0.002);
        c += c2 * (mix(vec3(1.0, 0.49, 0.1), vec3(0.75, 0.9, 1.), rn.y) * 0.25 + 0.75);
        p *= 1.4;
    }
    return c * c;
}

`;

let libsAfterDe = `
vec3 grad(vec3 p){
    float eps = 0.01;
    return normalize(vec3((de(p+vec3(eps, 0., 0.)) - de(p-vec3(eps,0.,0.)))/(2.*eps), (de(p+vec3(0., eps, 0.)) - de(p-vec3(0.,eps,0.)))/(2.*eps), (de(p+vec3(0., 0., eps)) - de(p-vec3(0.,0.,eps)))/(2.*eps)));
}
float light(vec3 p, vec3 l){
    return clamp(dot(grad(p), l), 0., 1.);
}

float specLight(vec3 p, vec3 l){
    vec3 pos = normalize(p-camPos);
    vec3 ray = reflect(l, grad(p));
    return clamp(dot(pos, ray), 0., 1.);
}

`
function rotY(v, a){
    return [v[0]*cos(a) + v[2]*sin(a), v[1], -v[0]*sin(a) + v[2]*cos(a)];
}
function rotX(v, a){
    return [v[0], v[1]*cos(a)-v[2]*sin(a), v[1]*sin(a)+v[2]*cos(a)];
}
function plus(a1, a2){
    return [a1[0] + a2[0], a1[1] + a2[1], a1[2] + a2[2]];
}
function times(a, s){
    return [a[0]*s, a[1]*s, a[2]*s];
}
function min(){
    return Math.min(...arguments);
}
function max(){
    return Math.max(...arguments);
}
function abs(x){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(Math.abs(i));
        }
        return temp;
    }
    return Math.abs(x);
}
function mod(x, m){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(((i%m)+m)%m);
        }
        return temp;
    }
    return ((x%m)+m)%m;
}
function cos(x){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(Math.cos(i));
        }
        return temp;
    }
    return Math.cos(x);
}
function sin(x){
    if(x.length != undefined){
        let temp = [];
        for(let i of x){
            temp.push(Math.sin(i));
        }
        return temp;
    }
    return Math.sin(x);
}
function len(v){
    return Math.hypot(...v);
}
function normalize(v){
    if(len(v) == 0){
        return [0,0,0];
    }
    return times(v, 1/len(v));
}
function dot(a, b){
    return a[0]*b[0] + a[1]*b[1] + a[2]*b[2];
}
function cross(a, b){
    return [
        a[1]*b[2]-a[2]*b[1],
        a[2]*b[0]-a[0]*b[2],
        a[0]*b[1]-a[1]*b[0]
    ];
}
function reflect(d, n){
    return plus(d, times(n, -2*dot(d,n)));
}
function deNormal(p){
    let eps = 0.01;
    eps /= 2;
    return normalize([
        de(plus(p, [eps, 0, 0])) - de(plus(p, [-eps, 0, 0])),
        de(plus(p, [0, eps, 0])) - de(plus(p, [0, -eps, 0])),
        de(plus(p, [0, 0, eps])) - de(plus(p, [0, 0, -eps]))
    ]);
}
function lerp(a,b,w){
    return a+(b-a)*w;
}

function sdBox3(p, b){
    let q = plus(abs(p), times(b, -1));
    return len([max(q[0], 0),max(q[1], 0),max(q[2], 0)]) + min(max(q[0],q[1],q[2]), 0);
}

function dirFromAngle(ax, ay){
    let dir = [0,0,1];
    dir = rotX(dir, -ay);
    dir = rotY(dir, ax);

    return dir;
}

function march(df, p, dir){
    let eps = 0.01;
    let range = 10000;
    let totDist = 0;

    let dist = df(p);
    while(dist > eps && totDist < range){
        p = plus(p, times(dir, dist));
        totDist += dist;
        dist = df(p);
    }

    if(dist < eps){
        return p;
    } else {
        return false;
    }
}