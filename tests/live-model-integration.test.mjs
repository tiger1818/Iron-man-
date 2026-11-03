import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=readFileSync(new URL('../studio.js',import.meta.url),'utf8');
test('live studio exposes real model import and overlays',()=>{
 for(const id of ['modelFile','modelClear','modelInfo','modelLabels','presentLabels'])assert.match(html,new RegExp('id="'+id+'"'));
 assert.match(html,/accept="\.glb,model\/gltf-binary"/);
});
test('model adapter is integrated into both rendering worlds',()=>{
 assert.match(app,/createModelRuntime\(\{THREE,GLTFLoader\}\)/);
 assert.match(app,/for\(const \[world,overlay\] of \[\[main,\$\('modelLabels'\)\],\[live,\$\('presentLabels'\)\]\]\)/);
 assert.match(app,/placeAnnotations\(candidates/);
 assert.match(app,/projectAnchor\(/);
});
test('model loading applies a finite size budget and self-contained format restriction',()=>{
 assert.match(app,/file\.size>25\*1024\*1024/);
 assert.match(app,/endsWith\('\.glb'\)/);
});
