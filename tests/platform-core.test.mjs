import test from 'node:test';import assert from 'node:assert/strict';
import {SceneRegistry} from '../architecture/scene-registry.js';
import {createCommandBus,reducePresenter} from '../architecture/command-bus.js';
const evidence=new Set(['e1','e2','edge']);
const scene={id:'s1',type:'process',title:'Evidence-backed flow',nodes:[{id:'a',type:'text',evidenceIds:['e1']},{id:'b',type:'text',evidenceIds:['e2']}],edges:[{from:'a',to:'b',evidenceIds:['edge']}]};
test('scene registry generates semantic plan without geometry',()=>{
 const registry=new SceneRegistry(),result=registry.compile(scene,evidence);
 assert.equal(result.ok,true);assert.equal(result.plan.renderer,'flow');assert.equal(result.plan.edges.length,1);
 assert.equal(result.plan.camera.safeArea,'presenter-right');assert.equal('position' in result.plan.nodes[0],false);
});
test('registry rejects unsupported or evidence-free relationships',()=>{
 const registry=new SceneRegistry();const invalid={...scene,edges:[{from:'a',to:'b',evidenceIds:[]}]};
 assert.equal(registry.compile(invalid,evidence).ok,false);
 assert.throws(()=>registry.register('chart',{layout:'x',renderer:'x',fallback:'x'}));
});
test('gesture and keyboard commands are equivalent',()=>{
 const initial={mode:'present',sceneIndex:1,sceneCount:4,zoom:13};
 assert.deepEqual(reducePresenter(initial,{type:'NEXT_SCENE',inputSource:'gesture'}).state,
                  reducePresenter(initial,{type:'NEXT_SCENE',inputSource:'keyboard'}).state);
});
test('commands validate bounds and never skip scene limits',()=>{
 const initial={mode:'present',sceneIndex:2,sceneCount:3,zoom:13};
 assert.equal(reducePresenter(initial,{type:'NEXT_SCENE',inputSource:'keyboard'}).state.sceneIndex,2);
 assert.equal(reducePresenter(initial,{type:'GO_TO_SCENE',inputSource:'keyboard',index:9}).ok,false);
 assert.equal(reducePresenter(initial,{type:'ZOOM',inputSource:'gesture',delta:Infinity}).ok,false);
});
test('command bus preserves state when input is invalid',()=>{
 const bus=createCommandBus({mode:'edit',sceneIndex:0,sceneCount:2});
 bus.dispatch({type:'ENTER_PRESENT',inputSource:'mouse'});
 const before=bus.getState();
 bus.dispatch({type:'GO_TO_SCENE',inputSource:'gesture',index:5});
 assert.deepEqual(bus.getState(),before);
});
