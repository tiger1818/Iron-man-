// Evidence-first compiler. It does not use AI, infer missing numbers, or fabricate relationships.
const uid=()=>globalThis.crypto?.randomUUID?.()||'id-'+Math.random().toString(36).slice(2);
const normalize=s=>String(s??'').replace(/\r\n?/g,'\n').trim();
const numeric=s=>{const v=String(s??'').trim();if(!/^[+-]?(?:[$€£]\s*)?\d[\d,]*(?:\.\d+)?\s*%?$/.test(v))return null;const n=Number(v.replace(/[$€£,%\s]/g,''));return Number.isFinite(n)?n:null};
function splitCSV(line){const out=[];let cell='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cell+='"';i++}else quoted=!quoted}else if(c===','&&!quoted){out.push(cell.trim());cell=''}else cell+=c}out.push(cell.trim());return out}
function tableAt(lines,start){const rows=[];let end=start;for(;end<lines.length&&rows.length<80;end++){const line=lines[end].trim();if(!line||!line.includes(','))break;rows.push(splitCSV(line))}if(rows.length<3)return null;const width=rows[0].length;if(width<2||width>12||rows.some(r=>r.length!==width))return null;return {rows,end}}
export function compileEvidence(input,{title='Untitled presentation',sourceName='User content'}={}){
 const text=normalize(input);if(!text)throw Error('No content to compile');
 const lines=text.split('\n'),evidence=[],slides=[],warnings=[];
 const cite=(line,raw)=>{const e={id:'ev-'+(evidence.length+1),source:sourceName,line:line+1,excerpt:String(raw).slice(0,500)};evidence.push(e);return e.id};
 let i=0;while(i<lines.length&&slides.length<60){if(!lines[i].trim()){i++;continue}
  const table=tableAt(lines,i);
  if(table){const rows=table.rows,headers=rows[0],data=rows.slice(1),ref=cite(i,rows.map(r=>r.join(',')).join('\n'));const quantitative=data.every(row=>row.slice(1).some(v=>numeric(v)!==null));const kind=quantitative?'data':'table';slides.push({id:uid(),title:headers[0]||'Source table',layout:'grid',kind,notes:'Values extracted from '+sourceName+'. Check against the source before presenting.',sourceIds:[ref],table:{headers,rows:data},items:data.slice(0,12).map(r=>({id:uid(),text:r[0]+': '+r.slice(1).join(' | '),sourceIds:[ref]}))});i=table.end;continue}
  const heading=lines[i].trim().replace(/^#{1,6}\s*/,'');const start=i;const chunk=[];while(i<lines.length&&chunk.length<7){const line=lines[i].trim();if(!line){i++;if(chunk.length)break;continue}if(i>start&&/^#{1,6}\s+/.test(line))break;chunk.push({text:line.replace(/^[-*•]\s*/,''),line:i});i++}
  if(!chunk.length){i++;continue}
  const isHeading=/^#{1,6}\s+/.test(lines[start]);const body=isHeading?chunk.slice(1):chunk;const slideTitle=isHeading?heading:(slides.length===0?title:'Source content · '+(slides.length+1));
  const items=(body.length?body:[chunk[0]]).map(row=>{const ref=cite(row.line,row.text);return {id:uid(),text:row.text.slice(0,300),sourceIds:[ref]}});slides.push({id:uid(),title:slideTitle.slice(0,180),kind:'concept',layout:'grid',notes:'Source: '+sourceName+'. Relationships are not inferred.',sourceIds:items.flatMap(x=>x.sourceIds),items});
 }
 if(i<lines.length)warnings.push('Content truncated at 60 slides; review the source.');
 if(!slides.length)throw Error('No usable content found');
 if(slides.every(s=>s.kind==='concept'))warnings.push('No structured numeric tables detected. Concept panels preserve source text; no relationships were inferred.');
 return {schemaVersion:2,title,selected:0,slides,evidence,warnings,sourceName};
}
export function validateEvidence(deck){const ids=new Set((deck.evidence||[]).map(e=>e.id));const missing=[];for(const s of deck.slides||[])for(const id of [...(s.sourceIds||[]),...(s.items||[]).flatMap(x=>x.sourceIds||[])])if(!ids.has(id))missing.push(id);return {valid:missing.length===0,missing};}
