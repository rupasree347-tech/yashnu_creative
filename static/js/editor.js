(() => {
const canvas = document.getElementById('designCanvas');
const ctx = canvas.getContext('2d');
const $ = id => document.getElementById(id);
let elements = [];
let selectedId = null;
let nextId = 1;
let drag = null;
let currentProjectId = null;
let designType = 'poster';
const defaults = {
  logo: {w:600,h:600,bg:'#f8f1e8',heading:'A brand of your own'},
  web: {w:900,h:600,bg:'#f7f7f3',heading:'A web page concept'},
  poster: {w:600,h:750,bg:'#f8f1e8',heading:'Your next big idea.'},
  ad: {w:800,h:450,bg:'#e4edcf',heading:'A brand story'}
};
function uid(){return nextId++}
function add(type, props={}) {
  const base = {id:uid(),type,x:canvas.width*.12,y:canvas.height*.15,w:Math.min(canvas.width*.76,360),h:70,color:'#252720',text:'Your text',fontSize:48,fontFamily:'Arial',fontWeight:'700'};
  if(type==='rect') Object.assign(base,{x:canvas.width*.15,y:canvas.height*.2,w:canvas.width*.7,h:canvas.height*.22,color:'#d8f36a'});
  if(type==='circle') Object.assign(base,{x:canvas.width*.3,y:canvas.height*.2,w:150,h:150,color:'#d8f36a'});
  if(type==='image') Object.assign(base,{x:canvas.width*.2,y:canvas.height*.2,w:240,h:180,src:''});
  const el=Object.assign(base,props,{id:props.id || base.id});
  elements.push(el); selectedId=el.id; render(); syncProperties(); return el;
}
function selected(){return elements.find(e=>e.id===selectedId)}
function render(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle=$('bgColor').value;ctx.fillRect(0,0,canvas.width,canvas.height);
  for(const el of elements){
    ctx.save();
    if(el.type==='rect'){ctx.fillStyle=el.color;ctx.fillRect(el.x,el.y,el.w,el.h)}
    else if(el.type==='circle'){ctx.fillStyle=el.color;ctx.beginPath();ctx.ellipse(el.x+el.w/2,el.y+el.h/2,Math.abs(el.w/2),Math.abs(el.h/2),0,0,Math.PI*2);ctx.fill()}
    else if(el.type==='text'){
      ctx.fillStyle=el.color;ctx.font=`${el.fontWeight||'400'} ${el.fontSize||32}px "${el.fontFamily||'Arial'}"`;ctx.textBaseline='top';
      const lines=String(el.text||'').split('\n');lines.forEach((line,i)=>ctx.fillText(line,el.x,el.y+i*(el.fontSize||32)*1.15));
    } else if(el.type==='image' && el.src){
      let img=imageCache[el.src];
      if(img && img.complete){ctx.drawImage(img,el.x,el.y,el.w,el.h)}
      else {ctx.fillStyle='#e5e5dd';ctx.fillRect(el.x,el.y,el.w,el.h);ctx.fillStyle='#777';ctx.font='12px Arial';ctx.fillText('Loading image…',el.x+10,el.y+15)}
    }
    if(el.id===selectedId){ctx.strokeStyle='#86a53b';ctx.lineWidth=2;ctx.setLineDash([5,4]);ctx.strokeRect(el.x-4,el.y-4,el.w+8,el.h+8);ctx.setLineDash([]);ctx.fillStyle='#86a53b';ctx.fillRect(el.x+el.w-4,el.y+el.h-4,8,8)}
    ctx.restore();
  }
}
const imageCache={};
function loadImage(src){return new Promise((resolve,reject)=>{if(imageCache[src]?.complete)return resolve(imageCache[src]);const img=new Image();img.onload=()=>{imageCache[src]=img;resolve(img);render()};img.onerror=reject;img.src=src})}
function syncProperties(){
  const el=selected();$('propertyFields').hidden=!el;$('emptySelection').hidden=!!el;
  if(!el)return;
  $('selectedKind').textContent=el.type.toUpperCase()+' OBJECT';
  $('textLabel').hidden=el.type!=='text';$('objectText').hidden=el.type!=='text';
  $('fontFields').hidden=el.type!=='text';
  $('objectText').value=el.text||'';
  $('objectColor').value=el.color||'#222222';$('objectHex').textContent=($('objectColor').value).toUpperCase();
  $('fontSize').value=el.fontSize||48;$('fontSizeValue').textContent=el.fontSize||48;
  $('fontFamily').value=el.fontFamily||'Arial';$('fontWeight').value=el.fontWeight||'400';
  $('objectX').value=Math.round(el.x);$('objectY').value=Math.round(el.y);$('objectW').value=Math.round(el.w);$('objectH').value=Math.round(el.h);
}
function updateSelected(key,value){const el=selected();if(!el)return;el[key]=value;render();if(['x','y','w','h'].includes(key))syncProperties()}
function setSize(w,h){canvas.width=w;canvas.height=h;$('canvasDimensions').textContent=`${w} × ${h} px`;render()}
function starter(which){
  elements=[];selectedId=null;
  const bg=defaults[designType]||defaults.poster;$('bgColor').value=bg.bg;
  if(which==='minimal'){
    add('text',{x:canvas.width*.12,y:canvas.height*.24,w:canvas.width*.76,h:90,text:'LESS, BUT\nBETTER.',fontSize:Math.round(canvas.width*.105),fontFamily:'Georgia',fontWeight:'700',color:'#292a24'});
    add('text',{x:canvas.width*.13,y:canvas.height*.58,w:canvas.width*.7,h:30,text:'A BRAND WITH CLARITY',fontSize:14,fontWeight:'400',color:'#77796e'});
  } else if(which==='launch'){
    $('bgColor').value='#f0c5ac';
    add('circle',{x:canvas.width*.55,y:canvas.height*.1,w:canvas.width*.35,h:canvas.width*.35,color:'#f4e9a3'});
    add('text',{x:canvas.width*.1,y:canvas.height*.24,w:canvas.width*.8,h:170,text:'MEET THE\nNEXT BIG THING.',fontSize:Math.round(canvas.width*.09),fontWeight:'700',color:'#29372d'});
    add('text',{x:canvas.width*.11,y:canvas.height*.65,w:canvas.width*.7,h:35,text:'MADE TO MOVE YOU  →',fontSize:16,color:'#29372d',fontWeight:'400'});
  } else {
    $('bgColor').value='#dce8c4';
    add('circle',{x:canvas.width*.3,y:canvas.height*.14,w:canvas.width*.4,h:canvas.width*.4,color:'#a9c084'});
    add('text',{x:canvas.width*.1,y:canvas.height*.31,w:canvas.width*.8,h:130,text:'GROW WITH\nGOODNESS.',fontSize:Math.round(canvas.width*.09),fontFamily:'Georgia',color:'#34472b'});
    add('text',{x:canvas.width*.12,y:canvas.height*.68,w:canvas.width*.7,h:30,text:'NATURAL BY NATURE',fontSize:14,color:'#34472b',fontWeight:'400'});
  }
  selectedId=null;render();syncProperties();
}
function hitTest(x,y){
  for(let i=elements.length-1;i>=0;i--){const e=elements[i];if(x>=e.x-5&&x<=e.x+e.w+5&&y>=e.y-5&&y<=e.y+e.h+5)return e}
  return null;
}
function coords(ev){const r=canvas.getBoundingClientRect();return {x:(ev.clientX-r.left)*canvas.width/r.width,y:(ev.clientY-r.top)*canvas.height/r.height}}
canvas.addEventListener('pointerdown',ev=>{const p=coords(ev),el=hitTest(p.x,p.y);selectedId=el?.id??null;drag=el?{id:el.id,dx:p.x-el.x,dy:p.y-el.y}:null;canvas.setPointerCapture(ev.pointerId);render();syncProperties()});
canvas.addEventListener('pointermove',ev=>{if(!drag)return;const p=coords(ev),el=elements.find(e=>e.id===drag.id);if(!el)return;el.x=Math.max(0,Math.min(canvas.width-el.w,p.x-drag.dx));el.y=Math.max(0,Math.min(canvas.height-el.h,p.y-drag.dy));render();syncProperties()});
canvas.addEventListener('pointerup',()=>{drag=null});
$('addText').onclick=()=>add('text',{text:'Add your headline',fontSize:48});
$('addRect').onclick=()=>add('rect');
$('addCircle').onclick=()=>add('circle');
$('bgColor').oninput=()=>{$('bgHex').textContent=$('bgColor').value.toUpperCase();render()};
$('objectText').oninput=e=>updateSelected('text',e.target.value);
$('objectColor').oninput=e=>{$('objectHex').textContent=e.target.value.toUpperCase();updateSelected('color',e.target.value)};
$('fontSize').oninput=e=>{$('fontSizeValue').textContent=e.target.value;updateSelected('fontSize',Number(e.target.value))};
$('fontFamily').onchange=e=>updateSelected('fontFamily',e.target.value);
$('fontWeight').onchange=e=>updateSelected('fontWeight',e.target.value);
[['objectX','x'],['objectY','y'],['objectW','w'],['objectH','h']].forEach(([id,key])=>$(id).onchange=e=>updateSelected(key,Math.max(key==='w'||key==='h'?1:0,Number(e.target.value)||0)));
$('deleteBtn').onclick=()=>{elements=elements.filter(e=>e.id!==selectedId);selectedId=null;render();syncProperties()};
$('clearBtn').onclick=()=>{if(confirm('Clear all objects from this canvas?')){elements=[];selectedId=null;render();syncProperties()}};
$('canvasPreset').onchange=e=>{const sizes={poster:[600,750],square:[600,600],landscape:[800,450],web:[900,600]};setSize(...sizes[e.target.value])};
$('designType').onchange=e=>{designType=e.target.value;$('canvasHeading').textContent=defaults[designType].heading};
document.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>starter(b.dataset.template));
$('imageUpload').onchange=async e=>{
  const file=e.target.files[0];if(!file)return;
  const fd=new FormData();fd.append('image',file);
  try{const res=await fetch('/api/upload',{method:'POST',body:fd});const data=await res.json();if(!res.ok)throw Error(data.error||'Upload failed');await loadImage(data.url);add('image',{src:data.url,w:Math.min(300,canvas.width*.6),h:Math.min(220,canvas.height*.35)});}
  catch(err){alert(err.message)}finally{e.target.value=''}
};
$('exportBtn').onclick=()=>{render();const a=document.createElement('a');a.download=($('projectName').value.trim()||'brandstudio-design').replace(/[^\w-]+/g,'-')+'.png';a.href=canvas.toDataURL('image/png');a.click()};
$('saveBtn').onclick=async()=>{
  $('saveStatus').textContent='Saving…';
  try{
    const payload={id:currentProjectId,name:$('projectName').value.trim()||'Untitled design',design_type:designType,canvas:{width:canvas.width,height:canvas.height,background:$('bgColor').value,elements}};
    const res=await fetch('/api/projects',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
    const data=await res.json();if(!res.ok)throw Error(data.error||'Save failed');
    currentProjectId=data.id;$('saveStatus').textContent='Saved';history.replaceState({},'',`/editor?id=${currentProjectId}`);
  }catch(err){$('saveStatus').textContent='Save failed';alert(err.message)}
};
function loadProject(project){
  const c=project.canvas_json||{};designType=project.design_type||'poster';$('designType').value=designType;
  $('projectName').value=project.name||'Untitled design';currentProjectId=project.id;
  setSize(c.width||600,c.height||750);$('bgColor').value=c.background||'#f8f1e8';$('bgHex').textContent=$('bgColor').value.toUpperCase();
  elements=(c.elements||[]).map(e=>({...e}));nextId=Math.max(1,...elements.map(e=>Number(e.id)||0))+1;selectedId=null;
  elements.filter(e=>e.type==='image'&&e.src).forEach(e=>loadImage(e.src).catch(()=>{}));
  $('canvasHeading').textContent=(defaults[designType]||defaults.poster).heading;$('saveStatus').textContent='Loaded';render();syncProperties();
}
if(window.INITIAL_PROJECT){loadProject(window.INITIAL_PROJECT)}
else {
  designType=window.INITIAL_TYPE||'poster';if(!defaults[designType])designType='poster';
  $('designType').value=designType;$('canvasHeading').textContent=defaults[designType].heading;
  setSize(defaults[designType].w,defaults[designType].h);$('bgColor').value=defaults[designType].bg;$('bgHex').textContent=defaults[designType].bg.toUpperCase();
  starter('minimal');$('saveStatus').textContent='Unsaved changes';
}
})();
