import { useEffect, useState } from 'react';
import type { Catalog, Company } from '../types/product';
export function useProducts() {
 const [catalog,setCatalog]=useState<Catalog|null>(null); const [company,setCompany]=useState<Company>({fiscal:[],notes:[]}); const [error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController(); async function load(){try { const [a,b]=await Promise.all([fetch(`${import.meta.env.BASE_URL}data/products.json`,{signal:controller.signal}),fetch(`${import.meta.env.BASE_URL}data/company.json`,{signal:controller.signal})]); if(!a.ok||!b.ok) throw new Error('Falha ao carregar os dados do catálogo.'); const [products,fiscal]=await Promise.all([a.json(),b.json()]); if(!Array.isArray(products.products)) throw new Error('Formato do catálogo inválido.'); setCatalog(products);setCompany(fiscal);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Erro ao carregar catálogo.');}} void load();return()=>controller.abort();},[]);
 return {catalog,company,error};
}
