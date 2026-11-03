import test from 'node:test';import assert from 'node:assert/strict';
import {makeTwoPartGLB} from './fixtures/two-part-glb.mjs';
test('generated fixture is a valid self-contained glTF 2.0 GLB container',()=>{
 const bytes=makeTwoPartGLB(),view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);
 assert.equal(view.getUint32(0,true),0x46546c67);assert.equal(view.getUint32(4,true),2);
 assert.equal(view.getUint32(8,true),bytes.length);
 const jsonLength=view.getUint32(12,true);assert.equal(view.getUint32(16,true),0x4e4f534a);
 const json=JSON.parse(new TextDecoder().decode(bytes.slice(20,20+jsonLength)));
 assert.equal(json.nodes.length,3);assert.equal(json.meshes.length,2);
 assert.deepEqual(json.nodes.slice(1).map(n=>n.name),['Left Component','Right Component']);
 assert.equal(json.buffers[0].uri,undefined);
 const offset=20+jsonLength;assert.equal(view.getUint32(offset+4,true),0x004e4942);
 assert.equal(view.getUint32(offset,true)%4,0);
 assert.equal(offset+8+view.getUint32(offset,true),bytes.length);
});
