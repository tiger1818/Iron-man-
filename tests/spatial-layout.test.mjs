import test from 'node:test';import assert from 'node:assert/strict';
import {layoutScene,fitCamera} from '../architecture/spatial-layout.js';
const nodes=Array.from({length:8},(_,i)=>({id:'n'+i,text:'Panel '+i}));
test('layout keeps all nodes in presenter-safe stage bounds',()=>{
 const layout=layoutScene({nodes},{width:12,height:7,presenterRight:2.5});
 const left=-6,right=6-2.5;
 for(const n of layout.nodes){assert.ok(n.x-n.width/2>=left-.0001);assert.ok(n.x+n.width/2<=right+.0001);assert.ok(n.y+n.height/2<=3.5+.0001);assert.ok(n.y-n.height/2>=-3.5-.0001)}
});
test('layout is deterministic and avoids panel overlaps',()=>{
 const a=layoutScene({nodes}),b=layoutScene({nodes});assert.deepEqual(a,b);
 for(let i=0;i<a.nodes.length;i++)for(let j=i+1;j<a.nodes.length;j++){
  const x=a.nodes[i],y=a.nodes[j],overlapX=Math.abs(x.x-y.x)<(x.width+y.width)/2-.001,overlapY=Math.abs(x.y-y.y)<(x.height+y.height)/2-.001;
  assert.equal(overlapX&&overlapY,false);
 }
});
test('only evidence-backed connectors are drawn',()=>{
 assert.equal(layoutScene({nodes:nodes.slice(0,2)}).edges.length,0);
 assert.throws(()=>layoutScene({nodes:nodes.slice(0,2),edges:[{from:'n0',to:'n1',evidenceIds:[]}]}),/source evidence/);
 const a=layoutScene({nodes:nodes.slice(0,2),edges:[{from:'n0',to:'n1',evidenceIds:['e1']}]});
 assert.equal(a.edges.length,1);assert.equal(a.edges[0].points.length,2);
});
test('camera fit is finite and responsive to aspect',()=>{
 const layout=layoutScene({nodes});
 const wide=fitCamera(layout,{aspect:16/9}),narrow=fitCamera(layout,{aspect:9/16});
 assert.ok(Number.isFinite(wide.distance));assert.ok(narrow.distance>=wide.distance);
});
test('dense layouts request readable fallback',()=>{
 const dense=layoutScene({nodes:Array.from({length:100},(_,i)=>({id:'n'+i}))});
 assert.ok(dense.warnings.length>0);
});
