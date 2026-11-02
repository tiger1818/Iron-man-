// Data-to-visual contract. No invented quantities, units, geometry, or links.
export function numberValue(value) {
 const text=String(value??'').trim();
 if(!/^[+-]?(?:[$€£]\s*)?\d[\d,]*(?:\.\d+)?\s*%?$/.test(text))return null;
 const n=Number(text.replace(/[$€£,%\s]/g,''));
 return Number.isFinite(n)?n:null;
}
export function chartSpec(table) {
 if(!table||!Array.isArray(table.headers)||!Array.isArray(table.rows)||table.headers.length<2)return {ok:false,reason:'Missing table'};
 const headers=table.headers.map(String);
 const candidates=headers.slice(1).map((name,i)=>({name,index:i+1,values:table.rows.map(row=>numberValue(row[i+1]))}));
 const series=candidates.filter(s=>s.values.length>0&&s.values.every(v=>v!==null)).slice(0,4);
 if(!series.length)return {ok:false,reason:'No fully numeric series; retaining the exact source table'};
 const labels=table.rows.map(row=>String(row[0]??''));
 if(labels.length>20)return {ok:false,reason:'More than 20 categories; retaining the readable table'};
 const values=series.flatMap(s=>s.values), min=Math.min(0,...values),max=Math.max(0,...values);
 if(max===min)return {ok:false,reason:'No meaningful numeric range'};
 const percent=series.every(s=>s.values.every((_,i)=>String(table.rows[i][s.index]).includes('%')));
 const currency=series.every(s=>s.values.every((_,i)=>/[$€£]/.test(String(table.rows[i][s.index]))));
 return {ok:true,labels,series,min,max,unit:percent?'%':currency?'currency':'unspecified',sourceValues:table.rows};
}
