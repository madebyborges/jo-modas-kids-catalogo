import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import type { Catalog } from '../src/types/product';
import { applySizeEdits, validateSize } from '../src/services/productSizes';
test('Correção de tamanho por SKU preserva estoque, preços, cores e dados originais',()=>{
 const catalog=JSON.parse(readFileSync('public/data/products.json','utf8')) as Catalog;const snapshot=JSON.stringify(catalog);const p=catalog.products.find(p=>p.reference==='2656.100')!;
 const v=p.colors.find(c=>c.name==='Azul Marinho')!.variants.find(v=>v.size==='25/36')!;
 const result=applySizeEdits(catalog,[{sku:v.sku,product_reference:p.reference,color:'Azul Marinho',size:'25/26',version:1}]);const after=result.products.find(p=>p.reference==='2656.100')!;
 assert.equal(after.colors[0].variants.find(item=>item.sku===v.sku)!.size,'25/26');assert.equal(after.totalStock,p.totalStock);assert.equal(after.price,p.price);assert.deepEqual(after.colors.map(c=>c.stock),p.colors.map(c=>c.stock));assert.deepEqual(after.colors.flatMap(c=>c.variants.map(v=>[v.sku,v.stock,v.price])),p.colors.flatMap(c=>c.variants.map(v=>[v.sku,v.stock,v.price])));assert.equal(JSON.stringify(catalog),snapshot);assert.deepEqual(after.source,p.source);
 assert.ok(!after.dataWarnings.some(w=>w.type==='suspicious_size'&&w.sku===v.sku));assert.ok(p.dataWarnings.some(w=>w.type==='suspicious_size'));
 const ignored=applySizeEdits(catalog,[{sku:v.sku,product_reference:p.reference,color:'Preta',size:'99',version:1}]);assert.deepEqual(ignored.products.find(item=>item.reference===p.reference)!.colors,p.colors);
});
test('Tamanhos duplos são valores únicos e entradas inválidas não são salvas',()=>{
 for(const value of ['19/20','21/22','23/24','25/26','27/28','29/30','31/32','33/34','35/36','25/36','26'])assert.doesNotThrow(()=>validateSize(value));
 for(const value of ['','abc','26,27','26 / 27','26/27/28','1234','-1'])assert.throws(()=>validateSize(value));
});
