// Framework-neutral adapter boundaries. An adapter must implement the declared methods.
// These contracts intentionally avoid React, Three.js, storage and network dependencies.
export const PORTS=Object.freeze({
 sourceParser:['supports','extract'],
 evidenceVerifier:['verify'],
 sceneCompiler:['compile'],
 layoutEngine:['layout'],
 renderer:['mount','applyPlan','dispose'],
 projectRepository:['load','save','listRevisions'],
 assetRepository:['put','get','delete'],
 inputAdapter:['start','stop','subscribe']
});
export function assertAdapter(name,adapter){
 const required=PORTS[name];
 if(!required)throw new Error('Unknown adapter port: '+name);
 if(!adapter||typeof adapter!=='object')throw new TypeError(name+' adapter required');
 const missing=required.filter(method=>typeof adapter[method]!=='function');
 if(missing.length)throw new TypeError(name+' missing methods: '+missing.join(', '));
 return adapter;
}
export function createIngestionPipeline({parser,verify,compile}){
 assertAdapter('sourceParser',parser);
 assertAdapter('evidenceVerifier',verify);
 assertAdapter('sceneCompiler',compile);
 return Object.freeze({
  async run(file,{signal,sourceId}={}){
   if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
   if(!parser.supports(file))throw new TypeError('Unsupported source');
   const extracted=await parser.extract(file,{signal,sourceId});
   if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
   if(!extracted||!Array.isArray(extracted.blocks))throw new Error('Parser must preserve source blocks');
   const verified=await verify.verify(extracted,{signal});
   if(!verified||!Array.isArray(verified.evidence))throw new Error('Verifier must return evidence');
   if(signal?.aborted)throw new DOMException('Import cancelled','AbortError');
   const scenes=await compile.compile({source:extracted,evidence:verified.evidence},{signal});
   if(!scenes||!Array.isArray(scenes.scenes))throw new Error('Compiler must return semantic scenes');
   return {source:extracted,evidence:verified.evidence,scenes:scenes.scenes,warnings:[...(extracted.warnings||[]),...(verified.warnings||[]),...(scenes.warnings||[])]};
  }
 });
}
