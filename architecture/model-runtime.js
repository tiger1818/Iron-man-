// Three.js adapter: imports genuine GLB/glTF scene hierarchy and preserves node paths.
// Factory injection keeps the domain independent of the rendering library.
export function createModelRuntime({THREE,GLTFLoader}){
 if(!THREE?.Box3||!GLTFLoader)throw new TypeError('THREE and GLTFLoader required');
 const loader=new GLTFLoader();
 const models=new Map();
 function indexHierarchy(root){
  const nodes=[],byId=new Map(),byPath=new Map();
  const walk=(obj,path,parentId)=>{
   const segment=(obj.name||obj.type||'object').replaceAll('/','_');
   const id=path+'/'+segment+'['+(obj.parent?obj.parent.children.indexOf(obj):0)+']';
   const node={id,name:obj.name||obj.type,type:obj.type,parentId,mesh:!!obj.isMesh,children:obj.children.length};
   nodes.push(node);byId.set(id,obj);byPath.set(id,node);
   obj.userData.spatialNodeId=id;
   for(const child of obj.children)walk(child,id,id);
  };
  walk(root,'',null);
  return {nodes,byId,byPath};
 }
 async function loadArrayBuffer({assetId,buffer,sourceName='model.glb'}){
  if(!assetId||!(buffer instanceof ArrayBuffer))throw new TypeError('Asset id and ArrayBuffer required');
  if(models.has(assetId))throw Error('Asset id already loaded');
  const gltf=await loader.parseAsync(buffer,'');
  const root=gltf.scene;
  if(!root)throw Error('No scene in model');
  root.updateMatrixWorld(true);
  const hierarchy=indexHierarchy(root);
  const bounds=new THREE.Box3().setFromObject(root);
  if(bounds.isEmpty())throw Error('Model contains no visible geometry');
  const size=bounds.getSize(new THREE.Vector3()),center=bounds.getCenter(new THREE.Vector3());
  const model={assetId,sourceName,root,hierarchy,animations:gltf.animations||[],bounds,size,center,disposed:false};
  models.set(assetId,model);return model;
 }
 function getAnchor(assetId,nodeId,{point='center'}={}){
  const model=models.get(assetId),obj=model?.hierarchy.byId.get(nodeId);
  if(!obj)throw Error('Unknown model node');
  obj.updateWorldMatrix(true,false);
  const bounds=new THREE.Box3().setFromObject(obj);
  if(bounds.isEmpty())return obj.getWorldPosition(new THREE.Vector3());
  const p=bounds.getCenter(new THREE.Vector3());
  if(point==='top')p.y=bounds.max.y;
  if(point==='bottom')p.y=bounds.min.y;
  if(point==='left')p.x=bounds.min.x;
  if(point==='right')p.x=bounds.max.x;
  return p;
 }
 function selectNode(assetId,nodeId){
  const model=models.get(assetId),obj=model?.hierarchy.byId.get(nodeId);
  if(!obj)throw Error('Unknown model node');
  return {object:obj,anchor:getAnchor(assetId,nodeId),node:model.hierarchy.byPath.get(nodeId)};
 }
 function dispose(assetId){
  const model=models.get(assetId);if(!model)return false;
  const textures=new Set(),geometries=new Set(),materials=new Set();
  model.root.traverse(obj=>{
   if(obj.geometry)geometries.add(obj.geometry);
   const mats=obj.material?(Array.isArray(obj.material)?obj.material:[obj.material]):[];
   for(const m of mats){materials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value)}
  });
  for(const g of geometries)g.dispose();
  for(const m of materials)m.dispose();
  for(const t of textures){t.dispose();t.image?.close?.()}
  model.root.removeFromParent();model.disposed=true;models.delete(assetId);return true;
 }
 return {loadArrayBuffer,getAnchor,selectNode,dispose,getModel:id=>models.get(id)||null};
}
