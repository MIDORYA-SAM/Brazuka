import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js';

const root = document.getElementById('game');
const onlineCount = document.getElementById('onlineCount');
const connectionStatus = document.getElementById('connectionStatus');
const playerNameLabel = document.getElementById('playerName');
const chatMessages = document.getElementById('chatMessages');
const nameModal = document.getElementById('nameModal');
const toast = document.getElementById('toast');

let socket, selfId = null, myName = 'Visitante', selfAvatar = null;
const avatars = new Map();
const keys = new Set();
const clock = new THREE.Clock();
const scene = new THREE.Scene();
scene.background = new THREE.Color('#a9d9bd');
scene.fog = new THREE.Fog('#a9d9bd', 42, 100);

const camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 180);
camera.position.set(0, 6, 10);
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
root.appendChild(renderer.domElement);

scene.add(new THREE.HemisphereLight('#e9fff2', '#718a67', 2.0));
const sun = new THREE.DirectionalLight('#fff4d6', 2.4);
sun.position.set(-15, 28, 12); sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024); sun.shadow.camera.left = -35; sun.shadow.camera.right = 35;
sun.shadow.camera.top = 35; sun.shadow.camera.bottom = -35; scene.add(sun);

const mat = (color, roughness = 1) => new THREE.MeshStandardMaterial({ color, roughness, flatShading: true });
const grassMat = mat('#78b77c'), roadMat = mat('#707c76'), sidewalkMat = mat('#d9d7c8');
const plazaMat = mat('#c5c9b4'), whiteMat = mat('#f3f1e5'), greenMat = mat('#23834d');
function box(w,h,d,material,x,y,z, parent=scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  m.position.set(x,y,z); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
function cylinder(rt,rb,h,material,x,y,z,segments=8,parent=scene) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt,rb,h,segments),material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;
}

// Ground and broad avenue
box(150,.2,150,grassMat,0,-.18,0);
box(18,.12,115,roadMat,0,-.04,0);
box(5,.16,115,sidewalkMat,-11.5,.01,0);
box(5,.16,115,sidewalkMat,11.5,.01,0);
box(10,.12,10,plazaMat,0,.02,0);
for(let z=-53;z<55;z+=7) box(.18,.025,3,whiteMat,0,.04,z);
for(let side of [-1,1]) {
  for(let z=-48;z<=48;z+=12) {
    // stylized trees
    cylinder(.13,.18,1.8,mat('#72553a'),side*15,.8,z,6);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.25,0), mat(side===-1?'#3f965c':'#4b9d62'));
    crown.position.set(side*15,2.35,z); crown.castShadow=true; scene.add(crown);
    cylinder(.12,.12,1.4,mat('#53665b'),side*9,.7,z+3,6);
    box(.28,.25,.3,mat('#f5d77a'),side*9,1.35,z+3);
  }
}
// Brazilian-inspired landmark, not an official emblem
box(4,.45,2,greenMat,0,.45,-13);
box(3.4,.3,1.6,mat('#e9ce48'),0,.8,-13);
const landmark = new THREE.Group(); landmark.position.set(0,1.1,-13); scene.add(landmark);
const diamond = new THREE.Mesh(new THREE.OctahedronGeometry(1.1,0),mat('#3979c5'));
diamond.scale.set(1.4,.72,.2); diamond.rotation.z=Math.PI/4; diamond.position.y=.45; landmark.add(diamond);
cylinder(.16,.16,1.5,mat('#f1e9c8'),0,1.1,0,8,landmark);
const sign = box(5,.12,.12,whiteMat,0,3.2,-13); sign.rotation.z=0;
const signText = makeLabel('PRAÇA BRASIL', '#153a25', '#c4f477');
signText.position.set(0,3.6,-12.9); scene.add(signText);

// Small low-poly kiosks and benches
for(let z of [-25, -2, 21, 39]) {
  for(let side of [-1,1]) {
    const x=side*8.5;
    box(2.5,1.8,2,mat(side===-1?'#d8a16e':'#7caa84'),x,.9,z);
    box(2.8,.25,2.3,mat('#d9e0c8'),x,1.95,z);
    box(.18,1.2,.18,mat('#70553a'),x-1,.6,z-.7);
    box(.18,1.2,.18,mat('#70553a'),x+1,.6,z-.7);
  }
}
for(let z=-45;z<=45;z+=15){
  box(2,.18,.65,mat('#986d4e'),-5,.35,z);
  box(.12,.45,.12,mat('#6b5944'),-5.8,.1,z);
  box(.12,.45,.12,mat('#6b5944'),-4.2,.1,z);
}
function makeLabel(text, color='#ffffff', bg='#153322') {
  const c=document.createElement('canvas'); c.width=512;c.height=128;
  const ctx=c.getContext('2d');ctx.fillStyle=bg;ctx.beginPath();ctx.roundRect(8,8,496,112,22);ctx.fill();
  ctx.fillStyle=color;ctx.font='bold 46px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(text).slice(0,32),256,65);
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(2.6,.65),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  return mesh;
}

function createAvatar(data) {
  const group=new THREE.Group(); group.position.set(data.x||0,0,data.z||0);
  const bodyMat=mat(data.color||'#f4f0d9'), skin=mat('#bd875f'), pants=mat('#31483b');
  const body=new THREE.Mesh(new THREE.BoxGeometry(.62,.85,.35),bodyMat);body.position.y=1.05;body.castShadow=true;group.add(body);
  const head=new THREE.Mesh(new THREE.IcosahedronGeometry(.29,1),skin);head.position.y=1.72;head.castShadow=true;group.add(head);
  const legs=[];
  for(const x of [-.19,.19]){const leg=new THREE.Mesh(new THREE.BoxGeometry(.2,.55,.23),pants);leg.position.set(x,.35,0);leg.castShadow=true;group.add(leg);legs.push(leg);}
  for(const x of [-.42,.42]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.18,.63,.2),skin);arm.position.set(x,1.05,0);arm.rotation.z=x<0?-.1:.1;group.add(arm);}
  // Held banner
  const pole=cylinder(.035,.035,1.45,mat('#e6e3d3'),.55,1.45,0,5,group);
  const banner=box(.9,.48,.05,mat('#1c854c'),1,1.92,0,group);
  const label=makeLabel(data.banner||'BRASIL','#fff','#167b43');label.scale.set(.42,.22,1);label.position.set(1,1.92,.04);group.add(label);
  const nameTag=makeLabel(data.name||'Visitante','#ffffff','#10251c');nameTag.scale.set(.72,.18,1);nameTag.position.set(0,2.45,0);group.add(nameTag);
  group.userData={banner,label,nameTag,legs,body};
  scene.add(group); return group;
}
function updateAvatarData(avatar, data) {
  if(data.banner && avatar.userData.label) {
    avatar.remove(avatar.userData.label);
    const label=makeLabel(data.banner,'#fff','#167b43');label.scale.set(.42,.22,1);label.position.set(1,1.92,.04);avatar.add(label);avatar.userData.label=label;
  }
}
function addChat(name,message,color='#c4f477',system=false) {
  const div=document.createElement('div');
  if(system){div.className='system-message';div.textContent=message;}
  else {div.className='chat-message';const strong=document.createElement('strong');strong.textContent=name;strong.style.color=color;const p=document.createElement('p');p.textContent=message;div.append(strong,p);}
  chatMessages.appendChild(div);
  while(chatMessages.children.length>70)chatMessages.firstChild.remove();
  chatMessages.scrollTop=chatMessages.scrollHeight;
}
function showToast(text){toast.textContent=text;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2400);}

let cameraYaw=0, cameraPitch=.22, dragging=false, lastX=0,lastY=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0)return;dragging=true;lastX=e.clientX;lastY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointermove',e=>{if(!dragging)return;const dx=e.clientX-lastX,dy=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;cameraYaw-=dx*.005;cameraPitch=THREE.MathUtils.clamp(cameraPitch+dy*.003,-.1,.8);});
renderer.domElement.addEventListener('pointerup',()=>dragging=false);
renderer.domElement.addEventListener('pointercancel',()=>dragging=false);
window.addEventListener('keydown',e=>{keys.add(e.key.toLowerCase());if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key))e.preventDefault();});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>keys.clear());

// Mobile joystick
const joystick=document.getElementById('joystick'), stick=document.getElementById('stick');
let joyActive=false,joyX=0,joyY=0;
if(joystick){
 joystick.addEventListener('pointerdown',e=>{joyActive=true;joystick.setPointerCapture(e.pointerId);moveJoy(e);});
 joystick.addEventListener('pointermove',e=>{if(joyActive)moveJoy(e);});
 const endJoy=()=>{joyActive=false;joyX=0;joyY=0;stick.style.transform='translate(0px,0px)';};
 joystick.addEventListener('pointerup',endJoy);joystick.addEventListener('pointercancel',endJoy);
}
function moveJoy(e){const r=joystick.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2;let dx=e.clientX-cx,dy=e.clientY-cy;const max=34,len=Math.hypot(dx,dy)||1;if(len>max){dx=dx/len*max;dy=dy/len*max;}joyX=dx/max;joyY=dy/max;stick.style.transform=`translate(${dx}px,${dy}px)`;}

let lastSend=0, frame=0;
function animate(){
 requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);frame+=dt;
 if(selfAvatar){
   let forward=(keys.has('w')||keys.has('arrowup')?-1:0)+(keys.has('s')||keys.has('arrowdown')?1:0)-joyY;
   let strafe=(keys.has('d')||keys.has('arrowright')?1:0)+(keys.has('a')||keys.has('arrowleft')?-1:0)+joyX;
   const len=Math.hypot(forward,strafe);
   if(len>.1){
     forward/=Math.max(1,len);strafe/=Math.max(1,len);
     const speed=6.3;
     const angle=cameraYaw;
     const dx=(strafe*Math.cos(angle)+forward*Math.sin(angle))*speed*dt;
     const dz=(-forward*Math.cos(angle)+strafe*Math.sin(angle))*speed*dt;
     selfAvatar.position.x=THREE.MathUtils.clamp(selfAvatar.position.x+dx,-42,42);
     selfAvatar.position.z=THREE.MathUtils.clamp(selfAvatar.position.z+dz,-52,52);
     selfAvatar.rotation.y=Math.atan2(dx,dz);
     selfAvatar.userData.legs.forEach((leg,i)=>{leg.rotation.x=Math.sin(frame*10+i*Math.PI)*.5;});
   }else selfAvatar.userData.legs.forEach(leg=>leg.rotation.x*=.7);
   if(socket?.connected && performance.now()-lastSend>70){
     lastSend=performance.now();socket.emit('player:move',{x:selfAvatar.position.x,z:selfAvatar.position.z,rot:selfAvatar.rotation.y});
   }
   const target=new THREE.Vector3(selfAvatar.position.x,1.15,selfAvatar.position.z);
   const dist=10, horiz=Math.cos(cameraPitch)*dist, vert=3+Math.sin(cameraPitch)*dist;
   camera.position.lerp(new THREE.Vector3(target.x+Math.sin(cameraYaw)*horiz,target.y+vert,target.z+Math.cos(cameraYaw)*horiz),.12);
   camera.lookAt(target);
 }
 for(const [id,a] of avatars){if(id!==selfId){a.userData.nameTag.lookAt(camera.position);a.userData.label.lookAt(camera.position);}}
 renderer.render(scene,camera);
}
animate();
window.addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));});

function connect(name){
 myName=name;playerNameLabel.textContent=name;
 socket=io({auth:{name},transports:['websocket','polling']});
 socket.on('connect',()=>{connectionStatus.textContent='Online';connectionStatus.style.color='#b8f36b';});
 socket.on('disconnect',()=>{connectionStatus.textContent='Reconectando...';connectionStatus.style.color='#f0b36b';onlineCount.textContent='Reconectando';});
 socket.on('connect_error',()=>{connectionStatus.textContent='Falha na conexão';});
 socket.on('server:full',()=>showToast('A praça está cheia. Tente novamente.'));
 socket.on('world:init',data=>{
   selfId=data.selfId;
   data.players.forEach(p=>{
     let a=avatars.get(p.id);if(!a){a=createAvatar(p);avatars.set(p.id,a);}
     if(p.id===selfId){selfAvatar=a;a.userData.nameTag.lookAt(camera.position);}
   });
   onlineCount.textContent=`${avatars.size} na praça`;
   addChat('SISTEMA','Você entrou na praça. Seja respeitoso com os outros.');
 });
 socket.on('player:joined',p=>{
   if(!avatars.has(p.id))avatars.set(p.id,createAvatar(p));
   onlineCount.textContent=`${avatars.size} na praça`;addChat('SISTEMA',`${p.name} chegou à praça.`);
 });
 socket.on('player:moved',p=>{
   const a=avatars.get(p.id);if(!a)return;
   if(p.id!==selfId){a.position.x=THREE.MathUtils.lerp(a.position.x,p.x,.55);a.position.z=THREE.MathUtils.lerp(a.position.z,p.z,.55);a.rotation.y=p.rot;}
 });
 socket.on('player:updated',p=>{const a=avatars.get(p.id);if(a)updateAvatarData(a,p);});
 socket.on('player:left',id=>{const a=avatars.get(id);if(a){scene.remove(a);avatars.delete(id);}onlineCount.textContent=`${avatars.size} na praça`;});
 socket.on('chat:message',m=>addChat(m.name,m.message,m.color));
}

document.getElementById('nameForm').addEventListener('submit',e=>{
 e.preventDefault();const name=document.getElementById('nameInput').value.trim().slice(0,18)||'Visitante';
 nameModal.style.display='none';connect(name);
});
document.getElementById('chatForm').addEventListener('submit',e=>{
 e.preventDefault();const input=document.getElementById('chatInput');const msg=input.value.trim();if(!msg)return;
 if(socket?.connected){socket.emit('chat:send',msg);input.value='';}else showToast('Conectando ao servidor...');
});
document.getElementById('bannerButton').addEventListener('click',()=>{
 const value=document.getElementById('bannerInput').value.trim().slice(0,32)||'BRASIL';
 if(socket?.connected)socket.emit('player:banner',value);else showToast('Entre na praça primeiro.');
});
document.getElementById('bannerInput').addEventListener('keydown',e=>{if(e.key==='Enter')document.getElementById('bannerButton').click();});
document.getElementById('menuButton').addEventListener('click',()=>{
 document.querySelector('.left-panel').classList.toggle('collapsed');
 document.querySelector('.right-panel').classList.toggle('collapsed');
});
