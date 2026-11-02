import test from 'node:test';import assert from 'node:assert/strict';
import {placeAnnotations} from '../architecture/annotation-layout.js';
import {createModelRuntime} from '../architecture/model-runtime.js';
test('labels never collide with other labels or focal object',()=>{
 const annotations=Array.from({length:8},(_,i)=>({id:'a'+i,anchor:{x:500,y:50+i*80},text:'Part '+i}));
 const focal={x:330,y:30,width:340,height:640};
 const r=placeAnnotations(annotations,{width:1000,height:750,protectedRect:focal});
 const overlaps=(a,b)=>a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;
 for(const a of r.annotations){assert.equal(overlaps(a.rect,focal),false)}
 for(let i=0;i<r.annotations.length;i++)for(let j=i+1;j<r.annotations.length;j++)assert.equal(overlaps(r.annotations[i].rect,r.annotations[j].rect),false);
});
test('dense labels hide gracefully instead of overlapping',()=>{
 const a=Array.from({length:40},(_,i)=>({id:'a'+i,anchor:{x:400,y:300}}));
 const r=placeAnnotations(a,{width:800,height:500});
 assert.ok(r.hidden>0);assert.ok(r.warnings.length>0);
});
test('model runtime preserves component hierarchy and world anchors',async()=>{
 class Vector3{constructor(x=0,y=0,z=0){this.x=x;this.y=y;this.z=z}}
 class Box3{setFromObject(o){this.obj=o;return this}isEmpty(){return false}getSize(v){v.x=4;v.y=6;v.z=3;return v}getCenter(v){v.x=2;v.y=3;v.z=1;return v}get max(){return {y:6,x:4}}get min(){return {y:0,x:0}}}
 const child={name:'Aorta',type:'Mesh',isMesh:true,children:[],userData:{},updateWorldMatrix(){},getWorldPosition:()=>new Vector3(),geometry:{dispose(){}},material:{dispose(){}}};
 const root={name:'Heart',type:'Group',children:[child],userData:{},updateMatrixWorld(){},updateWorldMatrix(){},traverse(fn){fn(this);fn(child)},removeFromParent(){}};
 child.parent=root;
 class GLTFLoader{async parseAsync(){return {scene:root,animations:[]}}}
 const runtime=createModelRuntime({THREE:{Box3,Vector3},GLTFLoader});
 const m=await runtime.loadArrayBuffer({assetId:'heart',buffer:new ArrayBuffer(8)});
 const node=m.hierarchy.nodes.find(n=>n.name==='Aorta');
 assert.equal(node.parentId,m.hierarchy.nodes[0].id);
 assert.equal(runtime.selectNode('heart',node.id).node.name,'Aorta');
 assert.equal(runtime.getAnchor('heart',node.id).y,3);
 assert.equal(runtime.dispose('heart'),true);
});
