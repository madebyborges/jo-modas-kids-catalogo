import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateData } from '../scripts/validateData';
import { readWorkbook } from '../scripts/workbook';
import { readFile } from 'node:fs/promises';
import { displayImageUrls } from '../src/utils/productImages';
import { parseNumber, parseVariation, safeImageUrl } from '../src/utils/productParser';
import { csvCell, exportRows, toCSV } from '../src/utils/csvExport';
test('Reconcilia JSON com todas as linhas e campos do XLSX',async()=>{await validateData();});
test('Preços brasileiros, zero e entradas inválidas',()=>{assert.equal(parseNumber('R$ 1.234,56'),1234.56);assert.equal(parseNumber('159,90'),159.9);assert.equal(parseNumber(0),0);assert.equal(parseNumber('abc'),undefined);});
test('Preserva tamanhos e cores comerciais como strings únicas',()=>{for(const size of ['19/20','21/22','23/24','25/26','27/28','29/30','31/32','33/34','35/36','25/36'])assert.equal(parseVariation(`Cor:Azul Marinho||Tamanho:${size}`).size,size);assert.equal(parseVariation('Cor:Branco/Prata/Pink||Tamanho:27').color,'Branco/Prata/Pink');assert.ok(parseVariation('CorAzul').malformed);});
test('Exportação CSV preserva aspas e impede fórmula',()=>{assert.equal(csvCell('a"b'),'"a""b"');assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.ok(toCSV(exportRows([],[])).startsWith('\uFEFF'));});
test('URLs seguras para imagens',()=>{assert.ok(safeImageUrl('https://example.com/a.jpg'));assert.ok(!safeImageUrl('javascript:alert(1)'));});
test('Enriquecimento altera somente células vazias de imagens, preserva todas as abas e associa cores exatas',async()=>{
 const [original,enriched]=await Promise.all([readWorkbook('data-source/olist_cadastro_mestre_com_links_imagens.xlsx'),readWorkbook()]);
 assert.deepEqual(Object.keys(enriched.sheets),Object.keys(original.sheets));let additions=0;
 for(const [name,sheet] of Object.entries(original.sheets)){
  assert.deepEqual(enriched.sheets[name].fields,sheet.fields);assert.equal(enriched.sheets[name].rows.length,sheet.rows.length);
  for(const [i,row] of sheet.rows.entries()) for(const [key,value] of Object.entries(row)){
   const next=enriched.sheets[name].rows[i][key];if(next===value)continue;
   assert.equal(name,'Importar_Olist');assert.match(key,/^URL imagem/);assert.ok(value==null||value==='');assert.ok(typeof next==='string'&&safeImageUrl(next));additions++;
  }
 }
 assert.ok(additions>0);
 const data=await validateData();const manifest=JSON.parse(await readFile('data-source/image-sources.json','utf8'));
 for(const p of data.products)for(const c of p.colors)assert.deepEqual(c.imageUrls,[...new Set(c.variants.flatMap(v=>v.imageUrls))]);
 for(const entry of manifest.entries){const p=data.products.find(p=>p.reference===entry.reference);assert.ok(p);const c=p.colors.find(c=>c.name===entry.color);assert.ok(c);if(entry.color)assert.deepEqual(c.imageUrls,entry.imageUrls);}
});
test('Fotos gerais incompatíveis não viram fallback de uma cor cadastrada',async()=>{
 const data=await validateData();
 for(const reference of ['2749.101','2118.582']){
  const p=data.products.find(p=>p.reference===reference)!;assert.ok(p.imageUrls.length);assert.deepEqual(displayImageUrls(p),[]);assert.ok(p.dataWarnings.some(w=>w.type==='mismatched_image'));
 }
 const blue=data.products.find(p=>p.reference==='2609.233')!;assert.equal(displayImageUrls(blue).length,1);assert.match(displayImageUrls(blue)[0],/33300/);assert.ok(!displayImageUrls(blue).some(url=>url.includes('15745')));
 const capivara=data.products.find(p=>p.reference==='2745.103')!;assert.equal(displayImageUrls(capivara).length,2);assert.ok(displayImageUrls(capivara).every(url=>url.includes('capivara-branco')));assert.ok(capivara.dataWarnings.some(w=>w.type==='mismatched_image'));
});
