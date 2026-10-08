import { unzipSync, strFromU8 } from 'fflate';
import { XMLParser } from 'fast-xml-parser';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import type { SourceRow } from '../src/types/product';
export const sourcePath='data-source/olist_cadastro_mestre_imagens_por_cor.xlsx';
const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@',removeNSPrefix:true,parseTagValue:false,trimValues:false,htmlEntities:true});
type Xml = Record<string,any>;
const list=(v:any):any[]=>v===undefined?[]:Array.isArray(v)?v:[v];
function richText(v:any):string {if(v==null)return '';if(typeof v==='string')return v;return v.t!==undefined?String(typeof v.t==='object'?v.t['#text']??'':v.t):list(v.r).map(r=>richText(r)).join('');}
function colIndex(ref:string){const letters=ref.match(/^[A-Z]+/)?.[0]??'';let n=0;for(const c of letters)n=n*26+c.charCodeAt(0)-64;return n-1;}
export async function readWorkbook(workbookPath=sourcePath){
 const buffer=await readFile(workbookPath);const zip=unzipSync(buffer);const xml=(name:string):Xml=>{if(!zip[name])throw new Error(`Parte XLSX ausente: ${name}`);return parser.parse(strFromU8(zip[name]));};
 const workbook=xml('xl/workbook.xml').workbook;const relations=list(xml('xl/_rels/workbook.xml.rels').Relationships.Relationship);
 const shared=zip['xl/sharedStrings.xml']?list(xml('xl/sharedStrings.xml').sst.si).map(richText):[];
 const sheets:Record<string,{fields:string[];rows:SourceRow[]}>={};
 for(const sheet of list(workbook.sheets.sheet)){
  const rel=relations.find(r=>r['@Id']===sheet['@id']);if(!rel)throw new Error('Relacionamento da aba ausente');const target=rel['@Target'];const name=target.startsWith('/')?target.slice(1):path.posix.normalize('xl/'+target);
  const rows=list(xml(name).worksheet.sheetData.row);const values=rows.map(row=>{const cells:(string|number|boolean|null)[]=[];for(const cell of list(row.c)){const idx=colIndex(cell['@r']);const type=cell['@t'];let value:string|number|boolean|null=null;
   if(type==='s')value=shared[Number(cell.v)]??null;else if(type==='inlineStr')value=richText(cell.is);else if(type==='b')value=cell.v==='1';else if(type==='e')throw new Error(`Erro de célula ${sheet['@name']}!${cell['@r']}: ${cell.v}`);else if(cell.v!==undefined)value=type==='str'?String(cell.v):Number.isFinite(Number(cell.v))?Number(cell.v):String(cell.v);
   if(cell.f!==undefined&&cell.v===undefined)throw new Error(`Fórmula sem valor calculado em ${cell['@r']}`);cells[idx]=value;}return cells;});
  const fields=values[0].map(v=>String(v??''));const sourceRows=values.slice(1).map(cells=>Object.fromEntries(fields.map((field,i)=>[field,cells[i]??null])) as SourceRow).filter(r=>Object.values(r).some(v=>v!==null));
  sheets[sheet['@name']]={fields,rows:sourceRows};
 }
 const sheet=Object.values(sheets).find(s=>['Código (SKU)','Código do pai','Tipo do produto','Variações'].every(f=>s.fields.includes(f)));if(!sheet)throw new Error('Aba de importação Olist não encontrada.');
 return {sheets,sheet,hash:createHash('sha256').update(buffer).digest('hex')};
}

