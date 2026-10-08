import type { Product } from '../types/product';
export const money=(n?:number)=>n===undefined?'Preço não informado':new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
export const productPrice=(p:Product)=>p.priceMax!==undefined&&p.price!==p.priceMax?`${money(p.price)} – ${money(p.priceMax)}`:money(p.price);
export const date=(s?:string|null)=>s?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short',timeZone:'America/Sao_Paulo'}).format(new Date(s)):'—';
export const normalize=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
