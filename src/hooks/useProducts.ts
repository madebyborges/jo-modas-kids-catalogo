import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { applyPhotoSets, fetchPhotoSets, type PhotoSet } from '../services/productPhotos';
import type { Catalog, Company } from '../types/product';
export function useProducts() {
 const [catalog,setCatalog]=useState<Catalog|null>(null); const [company,setCompany]=useState<Company>({fiscal:[],notes:[]}); const [error,setError]=useState('');
 useEffect(()=>{const controller=new AbortController(); async function load(){try { const [a,b]=await Promise.all([fetch(`${import.meta.env.BASE_URL}data/products.json`,{signal:controller.signal}),fetch(`${import.meta.env.BASE_URL}data/company.json`,{signal:controller.signal})]); if(!a.ok||!b.ok) throw new Error('Falha ao carregar os dados do catálogo.'); const [products,fiscal]=await Promise.all([a.json(),b.json()]); if(!Array.isArray(products.products)) throw new Error('Formato do catálogo inválido.'); setCatalog(products);setCompany(fiscal);}catch(e){if(!controller.signal.aborted)setError(e instanceof Error?e.message:'Erro ao carregar catálogo.');}} void load();return()=>controller.abort();},[]);
 const [photoSets,setPhotoSets]=useState<PhotoSet[]>([]);const generation=useRef(0);const {pathname}=useLocation();
 const refreshPhotos=useCallback(async()=>{const request=++generation.current;try{const rows=await fetchPhotoSets();if(request===generation.current)setPhotoSets(rows);}catch{/* Keep the spreadsheet catalog available while photo storage is offline. */}},[]);
 useEffect(()=>{void refreshPhotos();const onFocus=()=>void refreshPhotos();window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus);},[pathname,refreshPhotos]);
 const acceptPhotos=useCallback((set:PhotoSet)=>{generation.current++;setPhotoSets(old=>[...old.filter(s=>s.product_reference!==set.product_reference||s.color!==set.color),set]);},[]);
 const displayed=useMemo(()=>catalog?applyPhotoSets(catalog,photoSets):null,[catalog,photoSets]);
 return {catalog:displayed,company,error,acceptPhotos};
}
