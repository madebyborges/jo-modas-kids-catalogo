import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { readWorkbook } from './workbook';
import { parseNumber, parseVariation } from '../src/utils/productParser';
import type { Catalog, SourceRow } from '../src/types/product';
const sourceImages=(row:SourceRow)=>Object.entries(row).filter(([field,value])=>/^URL imagem/.test(field)&&value!=null&&String(value)!=='').map(([,value])=>String(value));
export async function validateData() {
 const catalog: Catalog = JSON.parse(await readFile('public/data/products.json','utf8'));
 const {sheet,hash} = await readWorkbook(); const parents = sheet.rows.filter(r=>r['Tipo do produto']==='V'); const children = sheet.rows.filter(r=>r['Tipo do produto']==='S');
 assert.equal(catalog.sourceHash,hash,'JSON desatualizado'); assert.equal(catalog.products.length,parents.length);
 assert.equal(new Set(catalog.products.map(p=>p.parentSku)).size,parents.length);
 const variants = catalog.products.flatMap(p=>p.colors.flatMap(c=>c.variants)); assert.equal(variants.length,children.length);
 assert.equal(new Set([...catalog.products.map(p=>p.parentSku),...variants.map(v=>v.sku)]).size,sheet.rows.length);
 for (const row of children) {
  const v = variants.find(v=>v.sku===String(row['Código (SKU)'])); assert.ok(v,'Filho ausente');
  assert.equal(v.parentSku,String(row['Código do pai'])); assert.ok(catalog.products.some(p=>p.parentSku===v.parentSku));
  const parsed = parseVariation(String(row.Variações)); assert.equal(v.size,parsed.size,'Tamanho alterado'); assert.equal(v.color,parsed.color,'Cor alterada');
  assert.equal(v.price,parseNumber(row.Preço),'Preço alterado'); assert.equal(v.stock,parseNumber(row.Estoque));
  assert.equal(v.observations,String(row.Observações ?? '')); assert.deepEqual(v.source,row,'Campos originais do filho alterados');
  assert.deepEqual(v.imageUrls,sourceImages(row),'Links de imagem do filho alterados');
 }
 for (const p of catalog.products) {
  const row = parents.find(r=>r['Código (SKU)']===p.parentSku); assert.ok(row); assert.deepEqual(p.source,row);
  for(const [field,key] of [['reference','Cód do fornecedor'],['supplierCode','Cód do fornecedor'],['name','Descrição'],['description','Descrição'],['complementaryDescription','Descrição complementar'],['brand','Marca'],['category','Categoria'],['ncm','NCM (Classificação fiscal)'],['origin','Origem'],['gtin','GTIN/EAN'],['seoTitle','Título SEO'],['seoDescription','Descrição SEO'],['seoKeywords','Palavras chave SEO'],['slug','Slug']] as const) assert.equal(p[field],String(row[key]??''),`Campo normalizado alterado: ${field}`);
  assert.ok(p.observations.includes(String(row.Observações)));
  assert.deepEqual(p.imageUrls,[...new Set([...sourceImages(row),...children.filter(child=>child['Código do pai']===p.parentSku).flatMap(sourceImages)])],'Galeria não corresponde aos links da planilha');
  assert.equal(p.totalStock,p.colors.reduce((sum,c)=>sum+c.stock,0));
  for (const c of p.colors) assert.equal(c.stock,c.variants.reduce((sum,v)=>sum+v.stock,0));
  const prices=p.colors.flatMap(c=>c.variants).flatMap(v=>v.price===undefined?[]:[v.price]);
  assert.equal(p.price,parseNumber(row.Preço)??(prices.length?Math.min(...prices):undefined));
  if (p.marketplace['Pendências/alertas']) assert.ok(p.dataWarnings.some(w=>w.message===p.marketplace['Pendências/alertas']));
 }
 assert.equal(catalog.summary.stock,children.reduce((s,r)=>s+(parseNumber(r.Estoque)??0),0));
 const similar=catalog.products.find(p=>p.reference==='2580.11'); if(similar) assert.ok(similar.dataWarnings.some(w=>w.type==='similar_reference'));
 const unusual=catalog.products.find(p=>p.reference==='2656.100'); if(unusual?.colors.some(c=>c.variants.some(v=>v.size==='25/36'))) assert.ok(unusual.dataWarnings.some(w=>w.type==='suspicious_size'));
 console.log('PASS: pais, filhos, SKUs, estoques, cores, tamanhos combinados, preços, observações, todos os campos e alertas reconciliados com XLSX.'); console.log(catalog.summary);
 return catalog;
}
if(process.argv[1]?.endsWith('validateData.ts')) await validateData();
