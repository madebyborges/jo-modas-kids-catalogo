import { supabase } from './supabase';
import { ensureReviewSession } from './reviewSession';
import type { Catalog } from '../types/product';
export interface SizeEdit {sku:string;product_reference:string;color:string;size:string;version:number;updated_at?:string;updated_by?:string}
export function validateSize(size:string){if(!/^\d{1,3}(\/\d{1,3})?$/.test(size))throw Error('Informe um tamanho como 26 ou 25/26. Tamanhos combinados são um único valor.');}
export async function fetchSizeEdits(){
 if(!supabase)throw Error('Edição de tamanhos indisponível.');
 const {data,error}=await supabase.from('product_variant_sizes').select('*').limit(1000).abortSignal(AbortSignal.timeout(12000));if(error)throw error;return data as SizeEdit[];
}
export async function saveSizeEdit(reference:string,color:string,sku:string,size:string,previous:SizeEdit|null){
 validateSize(size);if(!supabase)throw Error('Edição de tamanhos indisponível.');const session=await ensureReviewSession();
 const payload={sku,product_reference:reference,color,size,updated_by:session.user.id};
 const query=previous?supabase.from('product_variant_sizes').update(payload).eq('sku',sku).eq('version',previous.version):supabase.from('product_variant_sizes').insert(payload);
 const {data,error}=await query.select().maybeSingle();if(error?.code==='23505'||(!data&&!error))throw Error('Este tamanho foi alterado em outro navegador ou já existe nesta cor. Feche e abra novamente o editor.');if(error)throw error;return data as SizeEdit;
}
export function applySizeEdits(catalog:Catalog,rows:SizeEdit[]):Catalog {
 const map=new Map(rows.map(r=>[r.sku,r]));return {...catalog,products:catalog.products.map(p=>{
  const changes=new Map<string,string>();const colors=p.colors.map(c=>({...c,variants:c.variants.map(v=>{const row=map.get(v.sku);if(!row||row.product_reference!==p.reference||row.color!==c.name)return v;changes.set(v.sku,row.size);return {...v,size:row.size};})}));
  const dataWarnings=p.dataWarnings.filter(w=>w.type!=='suspicious_size'||!w.sku||!changes.has(w.sku)||changes.get(w.sku)==='25/36');
  for(const [sku,size] of changes)if(size==='25/36'&&!dataWarnings.some(w=>w.type==='suspicious_size'&&w.sku===sku))dataWarnings.push({type:'suspicious_size',sku,severity:'warning',message:'Tamanho 25/36 precisa ser conferido. Valor preservado, sem correção automática.'});
  return {...p,colors,dataWarnings};
 })};
}
