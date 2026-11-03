// Local-first model persistence. Each asset is addressed by SHA-256, not by a mutable filename.
const DB_NAME='spatial-studio-assets',STORE='models',VERSION=1;
export async function sha256(buffer){
 if(!(buffer instanceof ArrayBuffer))throw TypeError('ArrayBuffer required');
 const digest=await crypto.subtle.digest('SHA-256',buffer);
 return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
function openDatabase(){
 return new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB){reject(Error('IndexedDB unavailable'));return}
  const req=indexedDB.open(DB_NAME,VERSION);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE,{keyPath:'hash'})};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Database unavailable'));
 });
}
async function transact(mode,run){
 const db=await openDatabase();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,mode),store=tx.objectStore(STORE);
  let value;const req=run(store);
  if(req){req.onsuccess=()=>{value=req.result};req.onerror=()=>reject(req.error||Error('Asset operation failed'))}
  tx.oncomplete=()=>resolve(value);tx.onerror=()=>reject(tx.error||Error('Transaction failed'));
  tx.onabort=()=>reject(tx.error||Error('Transaction aborted'));
 })}finally{db.close()}
}
export async function saveModelAsset({buffer,name}){
 if(!(buffer instanceof ArrayBuffer)||!buffer.byteLength||buffer.byteLength>25*1024*1024)throw Error('Invalid or oversized model');
 const hash=await sha256(buffer);
 await transact('readwrite',store=>store.put({hash,name:String(name||'model.glb').slice(0,200),buffer,byteLength:buffer.byteLength,storedAt:Date.now()}));
 return {hash,name:String(name||'model.glb').slice(0,200),byteLength:buffer.byteLength};
}
export async function loadModelAsset(hash){
 if(!/^[a-f0-9]{64}$/.test(hash||''))throw Error('Invalid asset hash');
 const record=await transact('readonly',store=>store.get(hash));
 if(!record)return null;
 if(await sha256(record.buffer)!==hash)throw Error('Model integrity check failed');
 return record;
}
export async function deleteModelAsset(hash){
 if(!/^[a-f0-9]{64}$/.test(hash||''))throw Error('Invalid asset hash');
 await transact('readwrite',store=>store.delete(hash));
}
