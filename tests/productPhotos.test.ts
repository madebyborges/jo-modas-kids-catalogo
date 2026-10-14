import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { applyPhotoSets, validatePhotoFile } from '../src/services/productPhotos';
import type { Catalog } from '../src/types/product';
test('Fotos compartilhadas alteram somente a cor escolhida e preservam dados da planilha',()=>{
 const source=JSON.parse(readFileSync('public/data/products.json','utf8')) as Catalog;const before=JSON.stringify(source);
 const changed=applyPhotoSets(source,[{product_reference:'25006.101',color:'Dourado',image_urls:['https://example.test/real-photo.jpg'],version:1},{product_reference:'2749.101',color:'Bege',image_urls:[],version:1}]);
 const p=changed.products.find(p=>p.reference==='25006.101')!,original=source.products.find(p=>p.reference==='25006.101')!;
 assert.deepEqual(p.colors.find(c=>c.name==='Dourado')!.imageUrls,['https://example.test/real-photo.jpg']);
 assert.deepEqual(p.colors.find(c=>c.name==='Prata'),original.colors.find(c=>c.name==='Prata'));assert.deepEqual(p.source,original.source);assert.equal(p.totalStock,original.totalStock);assert.equal(p.price,original.price);assert.equal(JSON.stringify(source),before);
 assert.deepEqual(changed.products.find(p=>p.reference==='2749.101')!.colors.find(c=>c.name==='Bege')!.imageUrls,[]);
});
test('Uploads recusam arquivo vazio, formato indevido e imagem maior que 10 MB',()=>{
 assert.throws(()=>validatePhotoFile(new File(['text'],'photo.svg',{type:'image/svg+xml'})),/JPG, PNG ou WebP/);
 assert.throws(()=>validatePhotoFile(new File([],'empty.jpg',{type:'image/jpeg'})),/10 MB/);
 assert.throws(()=>validatePhotoFile(new File([new Uint8Array(10485761)],'big.jpg',{type:'image/jpeg'})),/10 MB/);
 assert.doesNotThrow(()=>validatePhotoFile(new File(['valid-size'],'photo.jpg',{type:'image/jpeg'})));
});
