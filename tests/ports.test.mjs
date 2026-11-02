import test from 'node:test';import assert from 'node:assert/strict';
import {assertAdapter,createIngestionPipeline} from '../architecture/ports.js';
import {SceneRegistry} from '../architecture/scene-registry.js';
test('adapter port rejects missing methods',()=>assert.throws(()=>assertAdapter('renderer',{mount(){}}),/missing methods/));
test('pipeline preserves source blocks and evidence without a renderer',async()=>{
 const parser={supports:()=>true,extract:async()=>({blocks:[{id:'b1',text:'Revenue 100',locator:{page:1}}],warnings:[]})};
 const verify={verify:async()=>({evidence:[{id:'ev1',blockId:'b1',quote:'Revenue 100'}]})};
 const compile={compile:async()=>({scenes:[{id:'s1',type:'concept',title:'Revenue',nodes:[{id:'n1',type:'text',evidenceIds:['ev1']}]}]})};
 const result=await createIngestionPipeline({parser,verify,compile}).run({name:'sample.pdf'});
 assert.equal(result.source.blocks[0].locator.page,1);
 assert.equal(result.evidence[0].quote,'Revenue 100');
 assert.equal(new SceneRegistry().compile(result.scenes[0],new Set(['ev1'])).ok,true);
});
test('pipeline rejects flat-text parser output',async()=>{
 const parser={supports:()=>true,extract:async()=>({text:'lost source positions'})};
 const verify={verify:async()=>({evidence:[]})};
 const compile={compile:async()=>({scenes:[]})};
 await assert.rejects(()=>createIngestionPipeline({parser,verify,compile}).run({name:'x.pdf'}),/preserve source blocks/);
});
test('custom scene adapter can be registered without changing core',()=>{
 const registry=new SceneRegistry();
 registry.register('volumetric',{layout:'volumetric',renderer:'volume-view',fallback:'slice-list'});
 const result=registry.compile({id:'v1',type:'volumetric',title:'Slices',nodes:[]},new Set());
 assert.equal(result.ok,true);assert.equal(result.plan.renderer,'volume-view');
});
