import type { Catalog, Product } from '../types/product';
import { supabase } from './supabase';
import { ensureReviewSession } from './reviewSession';
import { validateSize } from './productSizes';

export interface VariationChange {
 id:string; product_reference:string; parent_sku:string; color:string; size:string;
 action:'added'|'removed'|'updated'; stock:number; variant_sku:string;
 user_id:string; created_at:string;
}
export function changeDescription(row:VariationChange){
 return `${{added:'Adicionou',removed:'Removeu',updated:'Atualizou'}[row.action]} tamanho ${row.size}, ${row.color||'Cor não informada'}${row.action==='removed'?'':`, estoque ${row.stock}`}`;
}
export function validateVariation(product:Product,color:string,size:string,stock:number,action:VariationChange['action']){
 validateSize(size);
 if(!Number.isSafeInteger(stock)||stock<0||stock>2147483647)throw Error('Informe uma quantidade inteira entre 0 e 2147483647.');
 const group=product.colors.find(c=>c.name===color);
 if(!group)throw Error('Cor não encontrada. Reabra o produto.');
 const exists=group.variants.some(v=>v.size===size);
 if(action==='added'&&exists)throw Error(`O tamanho ${size} já existe nesta cor.`);
 if(action!=='added'&&!exists)throw Error('Este tamanho não existe mais. Reabra o produto.');
}
export async function fetchVariationChanges(){
 if(!supabase)throw Error('Alterações indisponíveis. Catálogo em somente leitura.');
 const rows:VariationChange[]=[];
 for(let offset=0;;offset+=1000){
  const {data,error}=await supabase.from('product_variation_changes').select('*').order('id').range(offset,offset+999);
  if(error)throw error;
  rows.push(...data as VariationChange[]);if(data.length<1000)return rows;
 }
}
export async function saveVariationChange(product:Product,color:string,size:string,stock:number,action:VariationChange['action'],expectedId:string|null){
 size=size.trim();validateVariation(product,color,size,stock,action);
 if(!supabase)throw Error('Catálogo em somente leitura.');
 await ensureReviewSession();
 const {data,error}=await supabase.rpc('record_variation_change',{
  p_reference:product.reference,p_parent:product.parentSku,p_color:color,p_size:size,p_stock:stock,p_action:action,
  p_sku:product.colors.find(c=>c.name===color)?.variants.find(v=>v.size===size)?.sku??`manual:${crypto.randomUUID()}`,p_expected:expectedId
 }).single();
 if(error)throw Error(error.message);
 return data as VariationChange;
}
export function applyVariationChanges(catalog:Catalog,rows:VariationChange[]):Catalog{
 const products=catalog.products.map(p=>{
  const history=rows.filter(r=>r.product_reference===p.reference&&r.parent_sku===p.parentSku).sort((a,b)=>Number(a.id)-Number(b.id));
  const colors=p.colors.map(c=>{
   let variants=[...c.variants];
   for(const r of history.filter(r=>r.color===c.name)){
    const existing=variants.find(v=>v.sku===r.variant_sku)||variants.find(v=>v.size===r.size);
    variants=variants.filter(v=>v!==existing);
    if(r.action!=='removed')variants.push(existing?{...existing,size:r.size,stock:r.stock}:{sku:r.variant_sku,parentSku:p.parentSku,color:c.name,size:r.size,stock:r.stock,price:p.price,observations:'Variação adicionada na conferência',imageUrls:c.imageUrls,source:{},sourceRow:0});
   }
   return {...c,variants,stock:variants.reduce((sum,v)=>sum+v.stock,0)};
  });
  const activeSkus=new Set(colors.flatMap(c=>c.variants.map(v=>v.sku)));
  const changedSkus=new Set(history.map(r=>r.variant_sku));
  const dataWarnings=p.dataWarnings.filter(w=>!w.sku||!changedSkus.has(w.sku)||activeSkus.has(w.sku));
  return {...p,colors,dataWarnings,totalStock:colors.reduce((sum,c)=>sum+c.stock,0),variationHistory:history.map(changeDescription)};
 });
 return {...catalog,products,summary:{...catalog.summary,withWarnings:products.filter(p=>p.dataWarnings.length>0).length,variants:products.reduce((n,p)=>n+p.colors.reduce((m,c)=>m+c.variants.length,0),0),stock:products.reduce((n,p)=>n+p.totalStock,0)}};
}
