(()=>{
'use strict';
const canvas=document.querySelector('#flowerCanvas'),wrap=document.querySelector('.bloom-scroll'),stage=document.querySelector('.bloom-stage');
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 700px)').matches;
const gl=canvas.getContext('webgl',{alpha:true,antialias:true,powerPreference:'low-power',preserveDrawingBuffer:false});
if(!gl){stage.classList.add('no-webgl');return;}
// A single immutable parametric grid. Opening and normals are evaluated on the GPU.
const vertex=`precision highp float;
attribute vec4 aPetal;
uniform float uBloom;
uniform mat4 uMatrix;
uniform mat3 uRotation;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vDetail;
varying float vSeed;
const float PI=3.14159265;
vec3 surface(float t,float u,float angle,float ring){
 if(ring>10.){float theta=u*PI,phi=t*PI;float radius=.075;return vec3(radius*sin(phi)*cos(theta),radius*sin(phi)*sin(theta),.69+(1.-uBloom)*.50+radius*cos(phi));}
 float size=(1.65-ring*.16)*(1.+.065*sin(angle*4.3));
 float unfurl=smoothstep(ring*.025,.88+ring*.018,uBloom);
 float opening=.36+unfurl*(1.16-ring*.105);
 float te=t*(1.-.16*u*u*t*t);
 float shoulder=sin(PI*te);
 float radius=.025+(8.-ring)*.030+sin(opening)*size*te+.24*shoulder*(1.-unfurl);
 float arc=u*(.50+ring*.065)*pow(max(.001,sin(PI*t*.79)),.75);
 float a=angle+arc+.045*sin(te*3.+angle)*te;
 float edge=pow(abs(u),4.);
 float z=cos(opening)*size*te+ring*(.12-.065*unfurl)+.13*u*u*shoulder;
 z-=.17*pow(te,5.)*unfurl;
 z-=.065*pow(t,8.)*(1.-u*u)*(.6+.4*sin(angle*2.))*unfurl;
 z+=.008*sin(t*10.+angle*2.+u*4.)*edge*t+.10*u*t;
 z+=.035*sin(angle*3.1)*t;
 return vec3(cos(a)*radius,sin(a)*radius,z);
}
void main(){
 float t=aPetal.x,u=aPetal.y,a=aPetal.z,r=aPetal.w;
 vec3 p=surface(t,u,a,r);
 vec3 dt=surface(t+.001,u,a,r)-surface(t-.001,u,a,r);
 vec3 du=surface(t,u+.001,a,r)-surface(t,u-.001,a,r);
 vNormal=uRotation*normalize(cross(dt,du));
 vPosition=uRotation*p;
 vDetail=vec3(t,u,r);vSeed=sin(a*4.3+r);
 gl_Position=uMatrix*vec4(vPosition,1.);
}`;
const fragment=`precision mediump float;
varying vec3 vNormal;varying vec3 vPosition;varying vec3 vDetail;varying float vSeed;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
void main(){
 float t=vDetail.x,u=vDetail.y,r=vDetail.z;
 vec2 uv=vec2(t*5.,u*3.+vSeed*7.);
 float mottling=noise(uv)*.65+noise(uv*3.1)*.35;
 float veinPhase=u*78.+sin(t*9.+u*4.)*2.5;
 float vein=pow(.5+.5*sin(veinPhase),18.);
 vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
 n=normalize(n+vec3(sin(veinPhase)*.014,cos(t*95.+u*38.)*.008,0.));
 vec3 key=normalize(vec3(-.9,.7,1.3));
 float diffuse=max(dot(n,key),0.);
 float fill=max(dot(n,normalize(vec3(.9,-.3,.7))),0.);
 float thin=pow(max(dot(-n,key),0.),1.4);
 vec3 ivory=vec3(1.,.82,.71),rose=vec3(.62,.22,.26);
 float fade=smoothstep(.02,.93,t)*.77+.08+(mottling-.5)*.07+vSeed*.025;
 vec3 pigment=mix(rose,ivory,fade);
 float rim=pow(abs(u),7.)*smoothstep(.3,1.,t);
 pigment=mix(pigment,vec3(.78,.40,.39),rim*.16);
 float occlusion=mix(.58,1.,smoothstep(.03,.86,t));
 float sheen=pow(max(dot(n,normalize(key+vec3(0.,0.,1.))),0.),12.)*.035;
 vec3 color=pigment*(.40+.61*diffuse+.17*fill)*occlusion;
 color+=vec3(1.,.43,.27)*thin*.19+sheen;
 color*=1.-vein*.022-(mottling-.5)*.035;
 gl_FragColor=vec4(color,1.);
}`;
function compile(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s;}
let program;
try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}
catch(error){console.error('Flower renderer:',error);stage.classList.add('no-webgl');return;}
gl.useProgram(program);
const vertices=[],indices=[],rows=mobile?24:32,cols=mobile?14:20;
for(let ring=0;ring<9;ring++){
 const count=Math.max(3,10-ring);
 for(let k=0;k<count;k++){
  const base=vertices.length/4,angle=k/count*Math.PI*2+ring*2.399963;
  for(let i=0;i<=rows;i++)for(let j=0;j<=cols;j++)vertices.push(.015+.985*i/rows,j/cols*2-1,angle,ring);
  for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){
   const a=base+i*(cols+1)+j,b=a+cols+1;indices.push(a,b,b+1,a,b+1,a+1);
  }
 }
}
// A small recessed core closes the centre without an additional draw call.
{const base=vertices.length/4;for(let i=0;i<=12;i++)for(let j=0;j<=16;j++)vertices.push(i/12,j/8-1,0,11);for(let i=0;i<12;i++)for(let j=0;j<16;j++){const a=base+i*17+j,b=a+17;indices.push(a,b,b+1,a,b+1,a+1);}}
const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.STATIC_DRAW);
const attr=gl.getAttribLocation(program,'aPetal');gl.enableVertexAttribArray(attr);gl.vertexAttribPointer(attr,4,gl.FLOAT,false,16,0);
const indexBuffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,indexBuffer);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
const matrixLoc=gl.getUniformLocation(program,'uMatrix'),rotationLoc=gl.getUniformLocation(program,'uRotation'),bloomLoc=gl.getUniformLocation(program,'uBloom');
const dial=document.querySelector('#dialProgress');
let progress=0,target=0,px=0,py=0,tx=0,ty=0,frame=0,visible=true,previousTime=0,width=1,height=1;
const rotation=new Float32Array(9),matrix=new Float32Array(16);
const clamp=x=>Math.min(1,Math.max(0,x));
function resize(){width=Math.max(1,canvas.clientWidth);height=Math.max(1,canvas.clientHeight);const dpr=Math.min(devicePixelRatio||1,mobile?1.25:1.5);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);gl.viewport(0,0,canvas.width,canvas.height);scroll();}
function render(time){
 frame=0;if(!visible||document.hidden)return;
 const elapsed=Math.min(50,time-(previousTime||time-16));previousTime=time;
 const rate=reduced.matches?1:1-Math.exp(-elapsed/95);
 progress+=(target-progress)*rate;px+=(tx-px)*rate;py+=(ty-py)*rate;
 const rx=-.45+progress*.12+py*.07,ry=-.22+progress*.36+px*.08,rz=-.35+progress*.55;
 const cx=Math.cos(rx),sx=Math.sin(rx),cy=Math.cos(ry),sy=Math.sin(ry),cz=Math.cos(rz),sz=Math.sin(rz);
 rotation.set([cy*cz,cx*sz+sx*sy*cz,sx*sz-cx*sy*cz,-cy*sz,cx*cz-sx*sy*sz,sx*cz+cx*sy*sz,sy,-sx*cy,cx*cy]);
 gl.uniformMatrix3fv(rotationLoc,false,rotation);gl.uniform1f(bloomLoc,progress);
 const f=1/Math.tan(.45),distance=(mobile?4.6:5.5)-progress*.35,near=.1,far=20;
 const A=-(far+near)/(far-near),B=-2*far*near/(far-near);
 matrix.set([f/(width/height),0,0,0,0,f,0,0,0,0,A,-1,0,0,-A*distance+B,distance]);
 gl.uniformMatrix4fv(matrixLoc,false,matrix);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);
 stage.style.setProperty('--bloom',progress);dial.style.strokeDashoffset=289*(1-progress);updateCopy();
 if(Math.abs(target-progress)>.0005||Math.abs(tx-px)>.002||Math.abs(ty-py)>.002)schedule();else previousTime=0;
}
function schedule(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(render);}
function scroll(){const rect=wrap.getBoundingClientRect();target=clamp(-rect.top/Math.max(1,wrap.offsetHeight-innerHeight));schedule();}

let previous='';function updateCopy(){const en=document.documentElement.lang==='en',index=progress<.28?0:progress<.65?1:2,key=en+'-'+index;if(previous===key)return;previous=key;const text=en?[['Before the yes.','A flower.','Every story has its own way of blooming.','THE ENCOUNTER'],['Little by little.','Everything blooms.','A gesture becomes a memory. A flower becomes a world.','THE BLOOM'],['Your story.','In full bloom.','Flowers for a day that belongs only to you.','THE CELEBRATION']]:[['Antes del sí.','Una flor.','Cada historia tiene su forma de florecer.','EL ENCUENTRO'],['Poco a poco.','Todo florece.','Un gesto se vuelve recuerdo. Una flor, un universo.','EL DESPERTAR'],['Su historia.','En plena flor.','Flores para un día que solo les pertenece a ustedes.','LA CELEBRACIÓN']];const row=text[index];document.querySelector('#bloomTitle').innerHTML=row[0]+'<br><em>'+row[1]+'</em>';document.querySelector('#bloomSubtitle').textContent=row[2];document.querySelector('#sceneChapter').textContent='0'+(index+1)+' / '+row[3];document.querySelector('#dialNumber').textContent='0'+(index+1);document.querySelector('#sceneHint').textContent=en?'SCROLL TO MAKE IT BLOOM':'DESLIZA PARA HACERLA FLORECER';}
addEventListener('scroll',scroll,{passive:true});addEventListener('resize',resize);stage.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse'||reduced.matches)return;tx=e.clientX/innerWidth-.5;ty=e.clientY/innerHeight-.5;schedule()},{passive:true});new MutationObserver(()=>{previous='';updateCopy()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)scroll()},{threshold:0}).observe(wrap);document.addEventListener('visibilitychange',()=>{if(!document.hidden)schedule()});canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stage.classList.add('no-webgl')});resize();
})();
