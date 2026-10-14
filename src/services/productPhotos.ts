import { supabase } from './supabase';
import { ensureReviewSession } from './reviewSession';
import type { Catalog } from '../types/product';
export interface PhotoSet {product_reference:string;color:string;image_urls:string[];version:number;updated_at?:string;updated_by?:string}
export const PHOTO_LIMIT=12;
export function validatePhotoFile(file:File){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type))throw Error('Selecione uma imagem JPG, PNG ou WebP.');
 if(!file.size||file.size>10*1024*1024)throw Error('Cada foto deve ter no máximo 10 MB.');
}
export async function fetchPhotoSets(){
 if(!supabase)throw Error('Fotos indisponíveis: Supabase não configurado.');
 const {data,error}=await supabase.from('product_photo_sets').select('*').limit(1000).abortSignal(AbortSignal.timeout(12000));if(error)throw error;return data as PhotoSet[];
}
export async function savePhotoSet(reference:string,color:string,urls:string[],previous:PhotoSet|null){
 if(!supabase)throw Error('Fotos indisponíveis.');
 if(urls.length>PHOTO_LIMIT)throw Error(`São permitidas até ${PHOTO_LIMIT} fotos por cor.`);
 const session=await ensureReviewSession();const payload={product_reference:reference,color,image_urls:urls,updated_by:session.user.id};
 const query=previous?supabase.from('product_photo_sets').update(payload).eq('product_reference',reference).eq('color',color).eq('version',previous.version):supabase.from('product_photo_sets').insert(payload);
 const {data,error}=await query.select().maybeSingle();if(error?.code==='23505'||(!data&&!error))throw Error('As fotos foram alteradas em outro navegador. Feche e abra novamente o editor para tentar novamente.');if(error)throw error;return data as PhotoSet;
}
export async function uploadProductPhoto(file:File){
 validatePhotoFile(file);if(!supabase)throw Error('Envio de fotos indisponível.');
 // Decode before uploading to reject corrupt files disguised as images.
 const bitmap=await createImageBitmap(file).catch(()=>{throw Error('Não foi possível ler esta imagem. Escolha outro arquivo.');});bitmap.close();
 const session=await ensureReviewSession();const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[file.type];
 const path=`${session.user.id}/${crypto.randomUUID()}.${extension}`;
 const {error}=await supabase.storage.from('product-photos').upload(path,file,{contentType:file.type,upsert:false,cacheControl:'31536000'});if(error)throw error;
 return {path,url:supabase.storage.from('product-photos').getPublicUrl(path).data.publicUrl};
}
export async function cleanupUploads(paths:string[]){if(paths.length&&supabase){const {error}=await supabase.storage.from('product-photos').remove(paths);if(error)throw error;}}
export function applyPhotoSets(catalog:Catalog,sets:PhotoSet[]):Catalog{
 const map=new Map(sets.map(s=>[JSON.stringify([s.product_reference,s.color]),s.image_urls]));
 return {...catalog,products:catalog.products.map(p=>({...p,imageUrls:map.get(JSON.stringify([p.reference,'']))??p.imageUrls,colors:p.colors.map(c=>({...c,imageUrls:map.get(JSON.stringify([p.reference,c.name]))??c.imageUrls}))}))};
}
