export const SCHEMA_VERSION = 3;
export const SCENE_TYPES = ['concept','comparison','timeline','process','network','chart','table','model','media'];
export const SOURCE_KINDS = ['pdf','pptx','docx','xlsx','csv','txt','md','json','gltf','glb'];
export function validateScene(scene,evidenceIds=new Set()) {
 const errors=[];
 if(!scene||typeof scene.id!=='string'||!SCENE_TYPES.includes(scene.type)) errors.push('Invalid scene identity or type');
 if(!Array.isArray(scene?.nodes)) errors.push('Nodes array required');
 for(const node of scene?.nodes||[]) {
  if(!node.id||!node.type||!Array.isArray(node.evidenceIds))errors.push('Node missing identity or evidence list');
  for(const id of node.evidenceIds||[])if(!evidenceIds.has(id))errors.push('Unresolved evidence '+id);
 }
 for(const edge of scene?.edges||[]) {
  const ids=new Set((scene.nodes||[]).map(n=>n.id));
  if(!ids.has(edge.from)||!ids.has(edge.to)||!Array.isArray(edge.evidenceIds)||!edge.evidenceIds.length||edge.evidenceIds.some(id=>!evidenceIds.has(id)))errors.push('Ungrounded or invalid relationship');
 }
 return {ok:errors.length===0,errors};
}
