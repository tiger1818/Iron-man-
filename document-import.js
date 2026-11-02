// Client-side document extraction. No document is uploaded by this module.
// Third-party libraries load from pinned CDN versions on first use.
const MAX_BYTES = 15 * 1024 * 1024;
const clean = text => String(text || '').replace(/\u0000/g,'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim();
export async function extractDocument(file) {
  if (!file || file.size > MAX_BYTES) throw new Error('File must be smaller than 15 MB');
  const name = file.name.toLowerCase(), ext = name.split('.').pop();
  if (['txt','md','csv'].includes(ext)) return {text:clean(await file.text()),warnings:[],pages:1};
  if (ext === 'json') {
    const data=JSON.parse(await file.text());
    return {text:clean(JSON.stringify(data,null,2)),warnings:[],pages:1};
  }
  if (ext === 'docx') {
    const mammoth=await import('https://esm.sh/mammoth@1.9.1');
    const result=await mammoth.extractRawText({arrayBuffer:await file.arrayBuffer()});
    return {text:clean(result.value),warnings:result.messages.map(m=>m.message),pages:null};
  }
  if (ext === 'xlsx' || ext === 'xls') {
    const XLSX=await import('https://esm.sh/xlsx@0.18.5');
    const book=XLSX.read(await file.arrayBuffer(),{type:'array',cellDates:true});
    const parts=book.SheetNames.map(name=>'Sheet: '+name+'\n'+XLSX.utils.sheet_to_csv(book.Sheets[name]));
    return {text:clean(parts.join('\n\n')),warnings:['Check formulas and formatting against the original workbook.'],pages:book.SheetNames.length};
  }
  if (ext === 'pptx') {
    const {default:JSZip}=await import('https://esm.sh/jszip@3.10.1');
    const zip=await JSZip.loadAsync(await file.arrayBuffer());
    const paths=Object.keys(zip.files).filter(p=>/^ppt\/slides\/slide\d+\.xml$/.test(p)).sort((a,b)=>Number(a.match(/slide(\d+)/)[1])-Number(b.match(/slide(\d+)/)[1]));
    const parser=new DOMParser(),parts=[];
    for(const path of paths){const xml=parser.parseFromString(await zip.files[path].async('text'),'application/xml');const runs=[...xml.getElementsByTagNameNS('http://schemas.openxmlformats.org/drawingml/2006/main','t')].map(n=>n.textContent);parts.push('Slide '+(parts.length+1)+'\n'+runs.join(' • '))}
    return {text:clean(parts.join('\n\n')),warnings:['Slide images, charts, diagrams and speaker notes are not extracted.'],pages:paths.length};
  }
  if (ext === 'pdf') {
    const pdfjs=await import('https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs';
    const pdf=await pdfjs.getDocument({data:await file.arrayBuffer()}).promise;
    const parts=[];for(let i=1;i<=pdf.numPages;i++){const page=await pdf.getPage(i);const text=await page.getTextContent();parts.push('Page '+i+'\n'+text.items.map(x=>x.str||'').join(' '))}
    const output=clean(parts.join('\n\n'));
    return {text:output,warnings:output.length<40?['Very little text detected. Scanned PDFs require OCR, which is not implemented.']:[],pages:pdf.numPages};
  }
  throw new Error('Unsupported document type: '+ext);
}
