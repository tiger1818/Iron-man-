import * as THREE from 'https://esm.sh/three@0.170.0';
import {extractDocument} from './document-import.js';
import {compileEvidence,validateEvidence} from './evidence-compiler.js';
import {chartSpec} from './visual-contract.js';
import {createSpatialRenderer} from './spatial-renderer.js';
import {createModelRuntime} from './architecture/model-runtime.js';
import {placeAnnotations,projectAnchor} from './architecture/annotation-layout.js';
const $=id=>document.getElementById(id), uid=()=>crypto.randomUUID(), clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
let deck={title:'Spatial Presentation System',selected:0,slides:[]}, tracking=null;
const saved=localStorage.getItem('spatial-studio-v1');try{if(saved)deck=validate(JSON.parse(saved))}catch{}
function validate(d){if(!d||typeof d.title!=='string'||!Array.isArray(d.slides)||d.slides.length>100)throw Error('Invalid project');return {evidence:Array.isArray(d.evidence)?d.evidence.slice(0,5000):[],warnings:Array.isArray(d.warnings)?d.warnings:[],sourceName:String(d.sourceName||'Unknown source'),title:d.title.slice(0,180),selected:clamp(Number(d.selected)||0,0,Math.max(0,d.slides.length-1)),slides:d.slides.map(s=>({id:String(s.id||uid()),title:String(s.title||'Untitled').slice(0,180),layout:['orbit','line','grid'].includes(s.layout)?s.layout:'orbit',notes:String(s.notes||'').slice(0,5000),kind:String(s.kind||'concept'),sourceIds:Array.isArray(s.sourceIds)?s.sourceIds:[],table:s.table||null,items:(Array.isArray(s.items)?s.items:[]).slice(0,60).map(n=>({id:String(n.id||uid()),text:String(n.text||'').slice(0,1000),sourceIds:Array.isArray(n.sourceIds)?n.sourceIds:[]}))}))}}
const save=()=>{try{localStorage.setItem('spatial-studio-v1',JSON.stringify(deck));status('Saved locally. Export for backup.')}catch{status('Storage unavailable; export your project.')}};
const status=t=>$('status').textContent=t;
function generate(){const topic=$('topic').value.trim(),source=$('source').value.trim();if(!topic||!source)return status('Enter title and source content first.');if(deck.slides.length&&!confirm('Replace scenes? Export a backup first.'))return;try{const result=compileEvidence(source,{title:topic,sourceName:window.currentSourceName||'Pasted source'});deck={title:result.title,selected:0,slides:result.slides,evidence:result.evidence,warnings:result.warnings,sourceName:result.sourceName};render();save();status('Compiled '+result.slides.length+' source-grounded scenes, '+result.evidence.length+' evidence references. '+result.warnings.join(' '))}catch(err){status('Compilation failed: '+err.message)}}
function makeWorld(canvas){const r=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true});r.setPixelRatio(Math.min(devicePixelRatio,2));r.outputColorSpace=THREE.SRGBColorSpace;const s=new THREE.Scene();const c=new THREE.PerspectiveCamera(50,1,.1,100);c.position.set(0,0,13);const g=new THREE.Group();s.add(g);s.add(new THREE.AmbientLight(0xffffff,1.5));const light=new THREE.PointLight(0x5bdcf8,80);light.position.set(3,5,7);s.add(light);return {r,s,c,g,canvas}}
const main=makeWorld($('gl')), live=makeWorld($('presentCanvas'));let yaw=-.25,pitch=.15,zoom=13;
const spatial=createSpatialRenderer(THREE);
let modelRuntime=null,activeModel=null,selectedModelNode=null;
const modelHolders=new Map(),modelOverlays=new Map();
function clearModel(){
 for(const [world,holder] of modelHolders){holder.removeFromParent();world.g.visible=true}
 modelHolders.clear();for(const overlay of modelOverlays.values())overlay.replaceChildren();modelOverlays.clear();
 if(activeModel)modelRuntime.dispose(activeModel.assetId);
 activeModel=null;selectedModelNode=null;
}
function modelOverlay(world){
 if(!activeModel)return;
 const overlay=modelOverlays.get(world),holder=modelHolders.get(world);if(!overlay||!holder)return;
 const rect=world.canvas.getBoundingClientRect(),width=rect.width,height=rect.height;
 if(width<320||height<240){overlay.replaceChildren();return}
 const root=holder.children[0];root.updateMatrixWorld(true);
 const candidates=[];
 for(const entry of activeModel.hierarchy.nodes.filter(n=>n.mesh).slice(0,12)){
  let object=null;root.traverse(o=>{if(o.userData?.spatialNodeId===entry.id)object=o});
  if(!object)continue;
  const bounds=new THREE.Box3().setFromObject(object);if(bounds.isEmpty())continue;
  const anchor=projectAnchor(bounds.getCenter(new THREE.Vector3()),world.c,{width,height},THREE);
  candidates.push({id:entry.id,nodeId:entry.id,assetId:activeModel.assetId,anchor,text:entry.name});
 }
 const result=placeAnnotations(candidates,{width,height,margin:12,cardWidth:Math.min(190,width*.24),cardHeight:62,gap:9,protectedRect:{x:width*.27,y:height*.08,width:width*.46,height:height*.84}});
 overlay.replaceChildren();
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 '+width+' '+height);svg.setAttribute('class','model-connector');
 for(const a of result.annotations){
  const line=document.createElementNS('http://www.w3.org/2000/svg','polyline'),p=a.connector;
  line.setAttribute('points',p.from.x+','+p.from.y+' '+p.elbow.x+','+p.elbow.y+' '+p.to.x+','+p.to.y);
  line.setAttribute('fill','none');line.setAttribute('stroke',a.nodeId===selectedModelNode?'#8cefff':'#427f9d');line.setAttribute('stroke-width','1.5');svg.append(line);
  const btn=document.createElement('button');btn.className='model-annotation'+(a.nodeId===selectedModelNode?' active':'');btn.style.left=a.rect.x+'px';btn.style.top=a.rect.y+'px';btn.style.width=a.rect.width+'px';btn.textContent=a.text;
  btn.onclick=()=>{selectedModelNode=a.nodeId;$('modelInfo').textContent='Selected component: '+a.text+' (asset name, not verified scientific evidence).';for(const w of modelHolders.keys())w.labelKey=''};
  overlay.append(btn);
 }
 overlay.prepend(svg);
}
function updateModel(){
 if(!activeModel)return;
 for(const [world,holder] of modelHolders){
  holder.rotation.set(pitch,yaw,0);
  const rect=world.canvas.getBoundingClientRect(),key=[rect.width|0,rect.height|0,pitch.toFixed(3),yaw.toFixed(3),zoom.toFixed(2),selectedModelNode].join(':');
  if(world.labelKey!==key){world.labelKey=key;modelOverlay(world)}
 }
}
async function loadModel(file){
 if(!file.name.toLowerCase().endsWith('.glb'))throw Error('Only self-contained GLB supported');
 if(file.size>25*1024*1024)throw Error('GLB maximum is 25 MB');
 if(!modelRuntime){const {GLTFLoader}=await import('https://esm.sh/three@0.170.0/examples/jsm/loaders/GLTFLoader.js');modelRuntime=createModelRuntime({THREE,GLTFLoader})}
 const buffer=await file.arrayBuffer();
 clearModel();
 activeModel=await modelRuntime.loadArrayBuffer({assetId:uid(),buffer,sourceName:file.name});
 for(const [world,overlay] of [[main,$('modelLabels')],[live,$('presentLabels')]]){
  const holder=new THREE.Group(),root=activeModel.root.clone(true);
  const factor=5.6/Math.max(activeModel.size.x,activeModel.size.y,activeModel.size.z,.001);
  root.scale.multiplyScalar(factor);root.position.sub(activeModel.center.clone().multiplyScalar(factor));
  holder.add(root);world.s.add(holder);modelHolders.set(world,holder);modelOverlays.set(world,overlay);world.g.visible=false;world.labelKey='';
 }
 yaw=-.25;pitch=.15;zoom=12;
 $('modelInfo').textContent='Loaded '+file.name+' · '+activeModel.hierarchy.nodes.length+' nodes. Labels are model metadata, not verified facts. Model bytes are not included in project export.';
 updateModel();
}
$('modelFile').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{await loadModel(file);status('Real GLB model loaded. Drag to rotate and select component labels.')}catch(err){status('GLB import failed: '+err.message)}finally{e.target.value=''}};
$('modelClear').onclick=()=>{clearModel();$('modelInfo').textContent='Model removed; original scene restored.'};

function sceneNodes(world,slide){const spec=slide?.table?chartSpec(slide.table):null;return spatial.render(world.g,slide,spec)}

function resize(w){const rect=w.canvas.getBoundingClientRect();const width=Math.max(1,rect.width),height=Math.max(1,rect.height);w.r.setSize(width,height,false);w.c.aspect=width/height;w.c.updateProjectionMatrix()}
function frame(){updateModel();for(const w of [main,live]){if(w===live&&!$('present').open)continue;const rect=w.canvas.getBoundingClientRect();if(rect.width<1||rect.height<1)continue;const width=Math.round(rect.width),height=Math.round(rect.height);if(w.width!==width||w.height!==height){resize(w);w.width=width;w.height=height}w.g.rotation.set(pitch,yaw,0);w.c.position.z=zoom;w.r.render(w.s,w.c)}}main.r.setAnimationLoop(frame);
function render(){deck.selected=clamp(deck.selected,0,Math.max(0,deck.slides.length-1));$('topic').value=deck.title;const s=deck.slides[deck.selected];$('heading').textContent=s?s.title:'No scenes';$('presentTitle').textContent=s?.title||deck.title;$('counter').textContent=deck.slides.length?(deck.selected+1)+' / '+deck.slides.length:'0 / 0';$('sceneTitle').value=s?.title||'';$('layout').value=s?.layout||'orbit';$('notes').value=s?.notes||'';const panel=$('dataPanel');panel.replaceChildren();if(s?.table){const table=document.createElement('table'),thead=document.createElement('thead'),head=document.createElement('tr');for(const value of s.table.headers){const th=document.createElement('th');th.textContent=value;head.append(th)}thead.append(head);table.append(thead);const tbody=document.createElement('tbody');for(const row of s.table.rows){const tr=document.createElement('tr');for(const value of row){const td=document.createElement('td');td.textContent=value;tr.append(td)}tbody.append(tr)}table.append(tbody);panel.append(table);const note=document.createElement('small');note.textContent='Source: '+(deck.sourceName||'Imported content')+' · Exact extracted values; no inferred numbers.';panel.prepend(note)}for(const w of [main,live]){sceneNodes(w,s);w.g.visible=!activeModel}$('scenes').replaceChildren();deck.slides.forEach((item,i)=>{const b=document.createElement('button');b.className='scene'+(i===deck.selected?' active':'');b.textContent=(i+1)+'. '+item.title;b.onclick=()=>{deck.selected=i;render();save()};$('scenes').append(b)});$('nodes').replaceChildren();s?.items.forEach((n,i)=>{const inp=document.createElement('textarea');inp.rows=2;inp.value=n.text;inp.setAttribute('aria-label','Node '+(i+1));inp.oninput=()=>{if(n.text!==inp.value){n.text=inp.value;n.sourceIds=[];s.sourceIds=[...new Set(s.items.flatMap(item=>item.sourceIds||[]))];if(!s.notes.includes('Edited content requires source verification.'))s.notes=(s.notes?s.notes+'\n':'')+'Edited content requires source verification.';sceneNodes(main,s);sceneNodes(live,s);save()}};$('nodes').append(inp)})}
function navigate(step){if(!deck.slides.length)return;deck.selected=(deck.selected+step+deck.slides.length)%deck.slides.length;render();save()}
$('generate').onclick=generate;$('prev').onclick=$('pPrev').onclick=()=>navigate(-1);$('next').onclick=$('pNext').onclick=()=>navigate(1);
$('add').onclick=()=>{deck.slides.push({id:uid(),title:'New scene',layout:'orbit',notes:'',items:[{id:uid(),text:'Edit this node'}]});deck.selected=deck.slides.length-1;render();save()};
$('addNode').onclick=()=>{const s=deck.slides[deck.selected];if(!s)return;if(s.items.length>=60)return status('Limit: 60 nodes per scene.');s.items.push({id:uid(),text:'New node'});render();save()};
$('remove').onclick=()=>{if(!deck.slides.length||!confirm('Delete this scene?'))return;deck.slides.splice(deck.selected,1);render();save()};
$('sceneTitle').oninput=e=>{const s=deck.slides[deck.selected];if(!s)return;s.title=e.target.value;$('heading').textContent=s.title;$('presentTitle').textContent=s.title;save()};
$('sceneTitle').onchange=render;$('layout').onchange=e=>{const s=deck.slides[deck.selected];if(s){s.layout=e.target.value;render();save()}};$('notes').oninput=e=>{const s=deck.slides[deck.selected];if(s){s.notes=e.target.value;save()}};
$('reset').onclick=()=>{yaw=-.25;pitch=.15;zoom=13};$('new').onclick=()=>{if(!confirm('Start new project? Export first if you need a backup.'))return;clearModel();deck={title:'Untitled',selected:0,slides:[]};render();save()};
$('save').onclick=()=>{const blob=new Blob([JSON.stringify(deck,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='spatial-project.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
$('open').onclick=()=>$('projectFile').click();$('projectFile').onchange=async e=>{try{const f=e.target.files[0];if(!f)return;const d=validate(JSON.parse(await f.text()));if(!confirm('Replace current project?'))return;clearModel();deck=d;render();save()}catch(err){status('Invalid project: '+err.message)}e.target.value=''};
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;status('Extracting '+f.name+'…');try{const result=await extractDocument(f);if(!result.text)throw Error('No extractable text found');$('source').value=result.text.slice(0,30000);window.currentSourceName=f.name;status('Extracted '+f.name+(result.pages?' ('+result.pages+' pages/slides/sheets)':'')+'. Review before generating. '+result.warnings.join(' '))}catch(err){status('Import failed: '+err.message)}finally{e.target.value=''}};
$('show').onclick=()=>{if(!deck.slides.length)return status('Create a scene first.');$('present').showModal();resize(live)};$('close').onclick=()=>$('present').close();
let dragging=false,lastX=0,lastY=0;for(const canvas of [$('gl'),$('presentCanvas')]){canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId)});canvas.addEventListener('pointermove',e=>{if(!dragging)return;yaw+=(e.clientX-lastX)*.008;pitch=clamp(pitch+(e.clientY-lastY)*.008,-1.2,1.2);lastX=e.clientX;lastY=e.clientY});canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('wheel',e=>{e.preventDefault();zoom=clamp(zoom+e.deltaY*.01,5,26)},{passive:false})}
document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();navigate(1)}if(e.key==='ArrowLeft'){e.preventDefault();navigate(-1)}if(e.key===' '){e.preventDefault();if(!$('present').open)$('show').click();else navigate(1)}});
$('camera').onclick=async()=>{if(tracking){tracking.stop();tracking=null;$('cam').hidden=true;$('camera').textContent='Enable hand tracking';return}try{const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});const video=$('cam');video.srcObject=stream;video.hidden=false;await video.play();const {HandLandmarker,FilesetResolver}=await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/+esm');const vision=await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm');const modelAssetPath='https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task';let detector;try{detector=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath,delegate:'GPU'},runningMode:'VIDEO',numHands:1})}catch{detector=await HandLandmarker.createFromOptions(vision,{baseOptions:{modelAssetPath,delegate:'CPU'},runningMode:'VIDEO',numHands:1})}let running=true,last=0,lastInference=0,pinchStart=0,cooldown=0;const loop=()=>{if(!running)return;try{const now=performance.now();if(video.readyState>=2&&video.currentTime!==last&&now-lastInference>=80){last=video.currentTime;lastInference=now;const result=detector.detectForVideo(video,now);const hand=result.landmarks?.[0];const dot=$('pointer');if(hand){const tip=hand[8],thumb=hand[4],dist=Math.hypot(tip.x-thumb.x,tip.y-thumb.y);dot.style.display='block';dot.style.left=(1-tip.x)*100+'%';dot.style.top=tip.y*100+'%';if(dist<.05){if(!pinchStart)pinchStart=performance.now();if(performance.now()-pinchStart>1100&&performance.now()>cooldown){navigate(1);cooldown=performance.now()+2200;pinchStart=0}}else pinchStart=0}else{dot.style.display='none';pinchStart=0}}}catch(e){status('Tracking error: '+e.message)}requestAnimationFrame(loop)};tracking={stop(){running=false;stream.getTracks().forEach(t=>t.stop());detector.close();video.srcObject=null;$('pointer').style.display='none'}};$('camera').textContent='Disable hand tracking';status('Hand tracking active. Hold index/thumb pinch for 1.1s to advance.');loop()}catch(e){$('cam').srcObject?.getTracks().forEach(t=>t.stop());$('cam').hidden=true;status('Camera unavailable: '+e.message)}};
if(!deck.slides.length){deck.slides=[{id:uid(),title:'Spatial Studio',layout:'orbit',notes:'',items:['Live 3D renderer','Editable concepts','Keyboard fallback','Opt-in webcam tracking'].map(text=>({id:uid(),text}))}]};}render();save();