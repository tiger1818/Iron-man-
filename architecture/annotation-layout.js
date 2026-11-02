// Screen-space label placement around real projected 3D anchors.
// Labels remain in HTML overlay and connectors use screen-space polylines.
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function placeAnnotations(annotations,{width,height,margin=24,cardWidth=240,cardHeight=82,gap=14,protectedRect=null}={}){
 if(!(width>0&&height>0))throw Error('Viewport required');
 const safe=protectedRect||{x:width*.35,y:height*.1,width:width*.3,height:height*.8};
 const blocked=[safe];
 const result=[],warnings=[];
 const intersects=(a,b,pad=0)=>a.x<b.x+b.width+pad&&a.x+a.width+pad>b.x&&a.y<b.y+b.height+pad&&a.y+a.height+pad>b.y;
 const candidates=(anchor)=>{
  const slots=[];
  for(const side of ['left','right']){
   const x=side==='left'?margin:width-margin-cardWidth;
   for(let y=margin;y+cardHeight<=height-margin;y+=cardHeight+gap)slots.push({x,y,width:cardWidth,height:cardHeight,side});
  }
  return slots.sort((a,b)=>{
   const cost=c=>Math.hypot(c.x+c.width/2-anchor.x,c.y+c.height/2-anchor.y)+(c.side==='left'&&anchor.x<width/2?0:0);
   return cost(a)-cost(b);
  });
 };
 for(const annotation of annotations){
  const anchor=annotation.anchor;
  if(!anchor||!Number.isFinite(anchor.x)||!Number.isFinite(anchor.y)){warnings.push('Annotation missing projected anchor: '+annotation.id);continue}
  const slot=candidates(anchor).find(s=>!blocked.some(b=>intersects(s,b,gap)));
  if(!slot){warnings.push('Insufficient room for annotation: '+annotation.id);continue}
  blocked.push(slot);
  const end={x:slot.side==='left'?slot.x+slot.width:slot.x,y:clamp(anchor.y,slot.y+10,slot.y+slot.height-10)};
  const mid={x:slot.side==='left'?end.x+gap:end.x-gap,y:end.y};
  result.push({id:annotation.id,assetId:annotation.assetId,nodeId:annotation.nodeId,rect:slot,
   connector:{from:{x:anchor.x,y:anchor.y},elbow:mid,to:end},evidenceIds:[...(annotation.evidenceIds||[])],text:annotation.text||''});
 }
 return {annotations:result,warnings,hidden:annotations.length-result.length};
}
export function projectAnchor(worldPoint,camera,viewport,THREE){
 if(!worldPoint||!camera||!THREE?.Vector3)throw TypeError('Projection requires point, camera and THREE');
 const p=new THREE.Vector3(worldPoint.x,worldPoint.y,worldPoint.z).project(camera);
 return {x:(p.x+1)*viewport.width/2,y:(1-p.y)*viewport.height/2,behindCamera:p.z>1||p.z< -1};
}
