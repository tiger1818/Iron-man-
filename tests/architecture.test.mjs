import test from 'node:test';import assert from 'node:assert/strict';
import {SCHEMA_VERSION,SCENE_TYPES,validateScene} from '../architecture/contracts.js';
test('v3 schema and scene registry are stable',()=>{assert.equal(SCHEMA_VERSION,3);assert.ok(SCENE_TYPES.includes('model'));assert.ok(SCENE_TYPES.includes('network'))});
test('rejects invented process edges',()=>{const scene={id:'a',type:'process',nodes:[{id:'n1',type:'text',evidenceIds:[]},{id:'n2',type:'text',evidenceIds:[]}],edges:[{from:'n1',to:'n2',evidenceIds:[]}]};assert.equal(validateScene(scene,new Set()).ok,false)});
test('accepts evidence-backed process edges',()=>{const scene={id:'a',type:'process',nodes:[{id:'n1',type:'text',evidenceIds:['ev1']},{id:'n2',type:'text',evidenceIds:['ev2']}],edges:[{from:'n1',to:'n2',evidenceIds:['ev3']}]};assert.equal(validateScene(scene,new Set(['ev1','ev2','ev3'])).ok,true)});
test('rejects unknown scene type',()=>{assert.equal(validateScene({id:'a',type:'magic',nodes:[]}).ok,false)});
