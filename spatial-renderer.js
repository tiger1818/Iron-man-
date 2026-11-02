// Spatial scene engine. Explicit source content only; no synthetic geometry claims.
// Uses Three.js supplied by the host so every world shares one library instance.
export function createSpatialRenderer(THREE){
 const colors=[0x4ac9ed,0xd7ac66,0x8c9ef7,0x5bc9aa];
 function textSprite(text,{width=3.2,height=.58,font=34}={}){
   const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=192;
   const ctx=canvas.getContext('2d');ctx.fillStyle='rgba(10,24,39,.96)';ctx.fillRect(0,0,1024,192);
   ctx.strokeStyle='#3c718d';ctx.lineWidth=3;ctx.strokeRect(2,2,1020,188);
   ctx.fillStyle='#eaf7ff';ctx.font='600 '+font+'px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
   const words=String(text??'').replace(/\s+/g,' ').trim();
   let visible=words;while(ctx.measureText(visible).width>970&&visible.length>1)visible=visible.slice(0,-2);
   if(visible!==words)visible=visible.trimEnd()+'…';
   ctx.fillText(visible,512,96);
   const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
   const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthTest:false}));
   sprite.scale.set(width,height,1);return sprite;
 }
 function addText(group,text,x,y,z,options){const sprite=textSprite(text,options);sprite.position.set(x,y,z);group.add(sprite);return sprite}
 function addLine(group,coords,color=0x456b82){const geometry=new THREE.BufferGeometry().setFromPoints(coords.map(p=>new THREE.Vector3(...p)));const line=new THREE.Line(geometry,new THREE.LineBasicMaterial({color}));group.add(line);return line}
 function clear(group){group.traverse(o=>{o.geometry?.dispose();const materials=o.material?Array.isArray(o.material)?o.material:[o.material]:[];for(const m of materials){m.map?.dispose();m.dispose()}});while(group.children.length)group.remove(group.children[0])}
 function concept(group,slide){
   const items=(slide.items||[]).slice(0,12);const n=items.length;if(!n)return;
   // No connections are drawn: source text alone does not establish relationships.
   const cols=n<=4?2:3,rows=Math.ceil(n/cols),spacingX=3.35,spacingY=Math.min(1.9,5.6/Math.max(1,rows));
   items.forEach((item,i)=>{
     const x=(i%cols-(cols-1)/2)*spacingX,y=((rows-1)/2-Math.floor(i/cols))*spacingY;
     const panel=new THREE.Mesh(new THREE.BoxGeometry(3.03,1.25,.14),new THREE.MeshStandardMaterial({color:0x12344c,metalness:.28,roughness:.4,emissive:0x071b2d}));
     panel.position.set(x,y,0);group.add(panel);
     const border=new THREE.LineSegments(new THREE.EdgesGeometry(panel.geometry),new THREE.LineBasicMaterial({color:colors[i%colors.length]}));border.position.copy(panel.position);group.add(border);
     addText(group,item.text,x,y,.14,{width:2.88,height:.75,font:31});
   });
 }
 function bars(group,spec){
   const {labels,series,min,max,sourceValues}=spec,range=max-min;
   const base=-2.35,chartHeight=4.5,left=-4.0,plotWidth=8.3,zeroY=base+(0-min)/range*chartHeight;
   for(let k=0;k<=4;k++){const v=min+range*k/4,y=base+k*chartHeight/4;
     addLine(group,[[left-.3,y,0],[left+plotWidth,y,0]],k===0?0x607d95:0x2d4c62);
     addText(group,Number(v.toPrecision(5)).toLocaleString(),left-.98,y,.05,{width:1.15,height:.3,font:30});
   }
   addLine(group,[[left-.3,zeroY,.04],[left+plotWidth,zeroY,.04]],0xa4b7c7);
   const slot=plotWidth/labels.length,barWidth=Math.min(.75,slot*.72/series.length);
   labels.forEach((label,i)=>{
     const center=left+(i+.5)*slot;
     addText(group,label,center,-2.8,.1,{width:Math.min(2,slot*.95),height:.35,font:30});
     series.forEach((serie,j)=>{
       const value=serie.values[i],barHeight=Math.abs(value)/range*chartHeight;
       const x=center+(j-(series.length-1)/2)*barWidth,y=zeroY+(value>=0?1:-1)*barHeight/2;
       const mesh=new THREE.Mesh(new THREE.BoxGeometry(barWidth,Math.max(.008,barHeight),.48),new THREE.MeshStandardMaterial({color:colors[j%colors.length],metalness:.2,roughness:.38}));
       mesh.position.set(x,y,0);mesh.userData={label,series:serie.name,value,sourceValue:sourceValues[i][serie.index]};group.add(mesh);
       const valueY=zeroY+(value>=0?1:-1)*(barHeight+.26);
       addText(group,String(sourceValues[i][serie.index]),x,valueY,.4,{width:Math.max(.5,barWidth*1.8),height:.27,font:29});
     });
   });
   series.forEach((serie,i)=>addText(group,serie.name,left+1+i*2.25,2.65,.1,{width:2.1,height:.36,font:30}));
 }
 function render(group,slide,spec){clear(group);if(!slide)return {type:'empty'};if(slide.table&&spec?.ok){bars(group,spec);return {type:'chart',count:spec.labels.length}}concept(group,slide);return {type:slide.table?'table-fallback':'concept',count:(slide.items||[]).length}}
 return {render,clear};
}
