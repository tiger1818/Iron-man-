// Deterministic, framework-neutral spatial layout and connection geometry.
// All positions derive from viewport-safe layout rules; edges require evidence.
// Coordinates use Three.js world convention: +X right, +Y up.
const finite=n=>typeof n==='number'&&Number.isFinite(n);
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const measure=node=>{
 const length=String(node.text||node.label||node.title||'').length;
 return {width:clamp(2.1+Math.min(length,130)*.008,2.1,3.15),height:clamp(1.05+Math.ceil(length/42)*.17,1.05,1.75)};
};
export function layoutScene(scene,{width=11,height=6.8,presenterRight=2.2,gap=.35}={}){
 if(!scene||!Array.isArray(scene.nodes))throw new TypeError('Scene nodes required');
 if(!finite(width)||!finite(height)||width<=0||height<=0)throw new RangeError('Invalid viewport');
 const usableWidth=width-clamp(presenterRight,0,width*.45);
 const nodes=scene.nodes;
 const count=nodes.length;
 if(!count)return {nodes:[],edges:[],bounds:{width:usableWidth,height},warnings:[]};
 const cols=Math.max(1,Math.min(4,Math.ceil(Math.sqrt(count*usableWidth/height))));
 const rows=Math.ceil(count/cols);
 const slotW=usableWidth/cols,slotH=height/rows;
 const minW=1.2,minH=.65;
 const warnings=[];
 if(slotW<minW||slotH<minH)warnings.push('Dense scene: use pagination or readable HTML fallback');
 const sizes=nodes.map(measure);
 const positions=nodes.map((node,i)=>{
  const col=i%cols,row=Math.floor(i/cols),size=sizes[i];
  const w=Math.min(size.width,Math.max(.5,slotW-gap));
  const h=Math.min(size.height,Math.max(.4,slotH-gap));
  return {id:node.id,x:-width/2+(col+.5)*slotW,y:height/2-(row+.5)*slotH,z:0,width:w,height:h,sourceNode:node};
 });
 const byId=new Map(positions.map(n=>[n.id,n]));
 const edges=[];
 for(const e of scene.edges||[]){
  const from=byId.get(e.from),to=byId.get(e.to);
  if(!from||!to||!Array.isArray(e.evidenceIds)||e.evidenceIds.length===0)throw Error('Edge requires known endpoints and source evidence');
  const dx=to.x-from.x,dy=to.y-from.y;
  const horizontal=Math.abs(dx)>=Math.abs(dy);
  const sx=from.x+(horizontal?Math.sign(dx)*from.width/2:0),sy=from.y+(horizontal?0:Math.sign(dy)*from.height/2);
  const tx=to.x-(horizontal?Math.sign(dx)*to.width/2:0),ty=to.y-(horizontal?0:Math.sign(dy)*to.height/2);
  edges.push({from:e.from,to:e.to,evidenceIds:[...e.evidenceIds],points:[{x:sx,y:sy,z:-.1},{x:tx,y:ty,z:-.1}],label:e.label||null});
 }
 return {nodes:positions,edges,bounds:{width:usableWidth,height},warnings};
}
export function fitCamera(layout,{aspect=16/9,fovDegrees=42,padding=1.2}={}){
 if(!finite(aspect)||aspect<=0)throw RangeError('Invalid camera aspect');
 const nodes=layout.nodes||[];
 if(!nodes.length)return {target:{x:0,y:0,z:0},distance:13,near:.1,far:100};
 const minX=Math.min(...nodes.map(n=>n.x-n.width/2)),maxX=Math.max(...nodes.map(n=>n.x+n.width/2));
 const minY=Math.min(...nodes.map(n=>n.y-n.height/2)),maxY=Math.max(...nodes.map(n=>n.y+n.height/2));
 const h=(maxY-minY)*padding,w=(maxX-minX)*padding;
 const fov=clamp(fovDegrees,10,100)*Math.PI/180;
 const distance=Math.max(h/(2*Math.tan(fov/2)),w/(2*Math.tan(fov/2)*aspect),3);
 return {target:{x:(minX+maxX)/2,y:(minY+maxY)/2,z:0},distance,near:Math.max(.01,distance/100),far:Math.max(100,distance*10)};
}
