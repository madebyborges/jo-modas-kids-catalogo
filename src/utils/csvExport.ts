import type { Product } from '../types/product';
import { statusLabels, type Review } from '../types/review';
export function exportRows(products:Product[],reviews:Review[]) {
 const map=new Map(reviews.map(r=>[r.product_reference,r]));return products.map(p=>{const r=map.get(p.reference);return {'Referência':p.reference,'SKU pai':p.parentSku,'Nome':p.name,'Marca':p.brand,'Status':statusLabels[r?.status??'pending'],'Comentário':r?.comment??'','Revisor':r?.reviewer_name??'','Data da revisão':r?.reviewed_at??''};});
}
export function csvCell(value:unknown){let s=String(value??'');if(/^[\s]*[=+\-@\t\r]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function toCSV(rows:ReturnType<typeof exportRows>){return '\uFEFF'+[Object.keys(rows[0]||{'Referência':'','SKU pai':'','Nome':'','Marca':'','Status':'','Comentário':'','Revisor':'','Data da revisão':''}).map(csvCell).join(';'),...rows.map(r=>Object.values(r).map(csvCell).join(';'))].join('\r\n');}
export function download(content:string,name:string,type:string){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
