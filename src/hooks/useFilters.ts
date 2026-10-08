import { displayImageUrls } from '../utils/productImages';
import { useMemo, useState } from 'react';
import type { Product } from '../types/product';
import type { Review } from '../types/review';
import { normalize } from '../utils/formatters';
export const initialFilters={query:'',brand:'',category:'',color:'',status:'',warnings:'',images:'',order:'name_asc',gender:''};
export type Filters=typeof initialFilters;
export function filterProducts(products:Product[],filters:Filters,reviews:Record<string,Review>,ready:boolean){
 const query=normalize(filters.query);
 const result=products.filter(p=>{
  const search=[p.name,p.reference,p.parentSku,p.brand,...p.colors.flatMap(c=>[c.name,...c.variants.flatMap(v=>[v.sku,v.size])])].join(' ');
  return (!query||normalize(search).includes(query))&&(!filters.brand||p.brand===filters.brand)&&(!filters.gender||normalize(p.category||p.suggestedCategory).includes(filters.gender==='girl'?'feminin':'masculin'))&&(!filters.category||p.category===filters.category||p.suggestedCategory===filters.category)&&(!filters.color||p.colors.some(c=>c.name===filters.color))&&(!filters.status||!ready||(reviews[p.reference]?.status??'pending')===filters.status)&&(!filters.warnings||(filters.warnings==='yes')===(p.dataWarnings.length>0))&&(!filters.images||(filters.images==='yes')===(displayImageUrls(p).length>0));
 });
 return result.sort((a,b)=>{switch(filters.order){case 'name_desc':return b.name.localeCompare(a.name,'pt-BR');case 'reference':return a.reference.localeCompare(b.reference,'pt-BR',{numeric:true});case 'price_asc':return (a.price??Infinity)-(b.price??Infinity);case 'price_desc':return (b.price??-Infinity)-(a.price??-Infinity);case 'stock_asc':return a.totalStock-b.totalStock;case 'stock_desc':return b.totalStock-a.totalStock;default:return a.name.localeCompare(b.name,'pt-BR');}});
}
export function useFilters(products:Product[],reviews:Record<string,Review>,ready:boolean){const [filters,setFilters]=useState(initialFilters);const filtered=useMemo(()=>filterProducts(products,filters,reviews,ready),[products,filters,reviews,ready]);return {filters,setFilters,filtered};}
