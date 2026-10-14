import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Star, Trash2, ImagePlus, LoaderCircle } from 'lucide-react';
import type { Product } from '../types/product';
import { ProductImage } from './ProductImage';
import { cleanupUploads, fetchPhotoSets, PHOTO_LIMIT, savePhotoSet, uploadProductPhoto, validatePhotoFile, type PhotoSet } from '../services/productPhotos';

export function ProductPhotoEditor({product,initialColor,onClose,onSaved}:{product:Product;initialColor:string;onClose:()=>void;onSaved:(set:PhotoSet)=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),addInput=useRef<HTMLInputElement>(null),replaceInput=useRef<HTMLInputElement>(null),replaceIndex=useRef(0);
 const uploads=useRef<{path:string;url:string}[]>([]);const loadGeneration=useRef(0);const [color,setColor]=useState(initialColor);
 const [sets,setSets]=useState<PhotoSet[]>([]),[urls,setUrls]=useState<string[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[dirty,setDirty]=useState(false);
 const choices=product.colors.some(c=>c.name)?product.colors.map(c=>c.name):[''];
 useEffect(()=>{dialog.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.current?.close();document.body.style.overflow=overflow;};},[]);
 async function load(){const request=++loadGeneration.current;setLoaded(false);setError('');try{const rows=await fetchPhotoSets();if(request!==loadGeneration.current)return;setSets(rows.filter(s=>s.product_reference===product.reference));setLoaded(true);}catch{if(request===loadGeneration.current)setError('Não foi possível carregar as fotos salvas. Tente novamente.');}}
 useEffect(()=>{void load();return()=>{loadGeneration.current++;};},[product.reference]);
 useEffect(()=>{if(loaded){const existing=sets.find(s=>s.color===color);setUrls(existing?.image_urls??(color?product.colors.find(c=>c.name===color)?.imageUrls??[]:product.imageUrls));setDirty(false);}},[loaded,color,sets]);
 async function close(){if(busy)return;setBusy(true);try{await cleanupUploads(uploads.current.map(u=>u.path));uploads.current=[];onClose();}catch{setError('Não foi possível cancelar o envio. Tente fechar novamente.');}finally{setBusy(false);}}
 async function addFiles(files:FileList|null,index?:number){
  if(!files?.length)return;setError('');const list=Array.from(files);
  try{if(index===undefined&&urls.length+list.length>PHOTO_LIMIT)throw Error(`São permitidas até ${PHOTO_LIMIT} fotos por cor.`);list.forEach(validatePhotoFile);setBusy(true);
   const next=[...urls];for(const file of list){const uploaded=await uploadProductPhoto(file);uploads.current.push(uploaded);if(index===undefined)next.push(uploaded.url);else next[index]=uploaded.url;setUrls([...next]);setDirty(true);}
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível enviar a foto. Tente novamente.');}finally{setBusy(false);if(addInput.current)addInput.current.value='';if(replaceInput.current)replaceInput.current.value='';}
 }
 async function save(){setBusy(true);setError('');try{
  const set=await savePhotoSet(product.reference,color,urls,sets.find(s=>s.color===color)??null);
  const unused=uploads.current.filter(u=>!urls.includes(u.url));uploads.current=[];
  // The association is already committed; cleanup failure must not hide success.
  void cleanupUploads(unused.map(u=>u.path)).catch(()=>{});onSaved(set);
 }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar as fotos. Tente novamente.');}finally{setBusy(false);}}
 return createPortal(<dialog ref={dialog} className="photo-editor" aria-label="Editar fotos do produto" onCancel={event=>{event.preventDefault();void close();}}>
  <header><div><h2>Editar fotos</h2><p>{product.name} · Ref. {product.reference}</p></div><button type="button" aria-label="Fechar editor de fotos" disabled={busy} onClick={()=>void close()}><X size={20}/></button></header>
  <div className="photo-editor-body"><label>Fotos de qual cor?<select value={color} disabled={busy||dirty||!loaded} onChange={event=>setColor(event.target.value)}>{choices.map(c=><option key={c} value={c}>{c||'Fotos gerais / cor não informada'}</option>)}</select></label>
  <p className="muted">Envie fotos reais do modelo e da cor selecionada. JPG, PNG ou WebP, até 10 MB por foto. A primeira foto é a principal.</p>
  {!loaded&&!error&&<p role="status">Carregando fotos…</p>}
  {loaded&&<><div className="photo-editor-grid">{urls.map((url,index)=><article key={`${url}-${index}`}><ProductImage url={url} name={`Foto ${index+1} · ${color||product.name}`}/><div className="photo-editor-tools"><strong>{index===0?'Principal':`Foto ${index+1}`}</strong><button type="button" disabled={busy||index===0} aria-label={`Tornar foto ${index+1} principal`} onClick={()=>{setUrls([url,...urls.filter((_,i)=>i!==index)]);setDirty(true);}}><Star size={16}/></button><button type="button" disabled={busy} aria-label={`Substituir foto ${index+1}`} onClick={()=>{replaceIndex.current=index;replaceInput.current?.click();}}><ImagePlus size={16}/></button><button type="button" disabled={busy} aria-label={`Remover foto ${index+1}`} onClick={()=>{setUrls(urls.filter((_,i)=>i!==index));setDirty(true);}}><Trash2 size={16}/></button></div></article>)}</div>{!urls.length&&<p className="empty-photo-message">Esta cor está sem foto. Envie uma imagem para adicioná-la.</p>}
  <input ref={addInput} type="file" aria-label="Adicionar arquivos de fotos" hidden accept="image/jpeg,image/png,image/webp" multiple onChange={event=>void addFiles(event.target.files)}/>
  <input ref={replaceInput} type="file" aria-label="Arquivo para substituir foto" hidden accept="image/jpeg,image/png,image/webp" onChange={event=>void addFiles(event.target.files,replaceIndex.current)}/>
  <button type="button" disabled={busy||urls.length>=PHOTO_LIMIT} onClick={()=>addInput.current?.click()}><Upload size={17}/> Enviar fotos</button>
  <p className="muted">As alterações aparecem para todos após clicar em Salvar fotos.{dirty&&' Salve ou cancele antes de editar outra cor.'}</p></>}
  {error&&<p role="alert" className="error">{error}</p>}{!loaded&&error&&<button disabled={busy} onClick={()=>void load()}>Tentar novamente</button>}
  </div><footer><button type="button" disabled={busy} onClick={()=>void close()}>Cancelar</button><button className="primary" type="button" disabled={busy||!loaded||!dirty} onClick={()=>void save()}>{busy?<LoaderCircle size={17} className="spin"/>:<Upload size={17}/>} {busy?'Aguarde…':'Salvar fotos'}</button></footer>
 </dialog>,document.body);
}
