import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Upload, X, Star, Trash2, ImagePlus, LoaderCircle } from 'lucide-react';
import type { Product } from '../types/product';
import { SuccessToast } from './SuccessToast';
import { ProductImage } from './ProductImage';
import { cleanupUploads, fetchPhotoSets, PHOTO_LIMIT, savePhotoSet, uploadProductPhoto, validatePhotoFile, type PhotoSet } from '../services/productPhotos';

export function ProductPhotoEditor({product,initialColor,onClose,onSaved}:{product:Product;initialColor:string;onClose:()=>void;onSaved:(set:PhotoSet)=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),addInput=useRef<HTMLInputElement>(null),replaceInput=useRef<HTMLInputElement>(null),replaceIndex=useRef(0);
 const operation=useRef(false);const [feedback,setFeedback]=useState<{message:string;key:number}>();const loadGeneration=useRef(0);const [color,setColor]=useState(initialColor);
 const [sets,setSets]=useState<PhotoSet[]>([]),[urls,setUrls]=useState<string[]>([]),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const choices=product.colors.some(c=>c.name)?product.colors.map(c=>c.name):[''];
 useEffect(()=>{dialog.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.current?.close();document.body.style.overflow=overflow;};},[]);
 async function load(){const request=++loadGeneration.current;setLoaded(false);setError('');try{const rows=await fetchPhotoSets();if(request!==loadGeneration.current)return;setSets(rows.filter(s=>s.product_reference===product.reference));setLoaded(true);}catch{if(request===loadGeneration.current)setError('Não foi possível carregar as fotos salvas. Tente novamente.');}}
 useEffect(()=>{void load();return()=>{loadGeneration.current++;};},[product.reference]);
 useEffect(()=>{if(loaded){const existing=sets.find(s=>s.color===color);setUrls(existing?.image_urls??(color?product.colors.find(c=>c.name===color)?.imageUrls??[]:product.imageUrls));}},[loaded,color,sets]);
 function close(){if(!operation.current)onClose();}
 async function commit(next:string[],message:string){
  const set=await savePhotoSet(product.reference,color,next,sets.find(s=>s.color===color)??null);
  setSets(old=>[...old.filter(s=>s.color!==color),set]);setUrls(set.image_urls);onSaved(set);setFeedback({message,key:Date.now()});
 }
 async function change(next:string[],message:string){if(operation.current)return;operation.current=true;setBusy(true);setError('');setFeedback(undefined);try{await commit(next,message);}catch(e){setError(e instanceof Error?e.message:'Não foi possível concluir a alteração. Tente novamente.');}finally{operation.current=false;setBusy(false);}}
 async function addFiles(files:FileList|null,index?:number){
  if(!files?.length||operation.current)return;operation.current=true;setBusy(true);setError('');setFeedback(undefined);const list=Array.from(files);const uploaded:{path:string;url:string}[]=[];let associationAttempted=false;
  try{if(index===undefined&&urls.length+list.length>PHOTO_LIMIT)throw Error(`São permitidas até ${PHOTO_LIMIT} fotos por cor.`);list.forEach(validatePhotoFile);
   const next=[...urls];for(const file of list){const photo=await uploadProductPhoto(file);uploaded.push(photo);if(index===undefined)next.push(photo.url);else next[index]=photo.url;}
   associationAttempted=true;await commit(next,index!==undefined?'Foto substituída com sucesso.':list.length===1?'Foto adicionada com sucesso.':`${list.length} fotos adicionadas com sucesso.`);
  }catch(e){
   if(!associationAttempted)void cleanupUploads(uploaded.map(u=>u.path)).catch(()=>{});
   setError(e instanceof Error?e.message:'Não foi possível adicionar a foto. Tente novamente.');
  }finally{operation.current=false;setBusy(false);if(addInput.current)addInput.current.value='';if(replaceInput.current)replaceInput.current.value='';}
 }
 return createPortal(<dialog ref={dialog} className="photo-editor" aria-label="Editar fotos do produto" onCancel={event=>{event.preventDefault();void close();}}>
  <header><div><h2>Editar fotos</h2><p>{product.name} · Ref. {product.reference}</p></div><button type="button" aria-label="Fechar editor de fotos" disabled={busy} onClick={()=>void close()}><X size={20}/></button></header>
  <div className="photo-editor-body"><label>Fotos de qual cor?<select value={color} disabled={busy||!loaded} onChange={event=>setColor(event.target.value)}>{choices.map(c=><option key={c} value={c}>{c||'Fotos gerais / cor não informada'}</option>)}</select></label>
  <p className="muted">Envie fotos reais do modelo e da cor selecionada. JPG, PNG ou WebP, até 10 MB por foto. A primeira foto é a principal.</p>
  {!loaded&&!error&&<p role="status">Carregando fotos…</p>}
  {loaded&&<><div className="photo-editor-grid">{urls.map((url,index)=><article key={`${url}-${index}`}><ProductImage url={url} name={`Foto ${index+1} · ${color||product.name}`}/><div className="photo-editor-tools"><strong>{index===0?'Principal':`Foto ${index+1}`}</strong><button type="button" disabled={busy||index===0} aria-label={`Tornar foto ${index+1} principal`} onClick={()=>void change([url,...urls.filter((_,i)=>i!==index)],'Foto principal atualizada com sucesso.')}><Star size={16}/></button><button type="button" disabled={busy} aria-label={`Substituir foto ${index+1}`} onClick={()=>{replaceIndex.current=index;replaceInput.current?.click();}}><ImagePlus size={16}/></button><button type="button" disabled={busy} aria-label={`Remover foto ${index+1}`} onClick={()=>void change(urls.filter((_,i)=>i!==index),'Foto removida com sucesso.')}><Trash2 size={16}/></button></div></article>)}</div>{!urls.length&&<p className="empty-photo-message">Esta cor está sem foto. Envie uma imagem para adicioná-la.</p>}
  <input ref={addInput} type="file" aria-label="Adicionar arquivos de fotos" hidden accept="image/jpeg,image/png,image/webp" multiple onChange={event=>void addFiles(event.target.files)}/>
  <input ref={replaceInput} type="file" aria-label="Arquivo para substituir foto" hidden accept="image/jpeg,image/png,image/webp" onChange={event=>void addFiles(event.target.files,replaceIndex.current)}/>
  <button type="button" disabled={busy||urls.length>=PHOTO_LIMIT} onClick={()=>addInput.current?.click()}><Upload size={17}/> Enviar fotos</button>
  <p className="muted">Cada alteração é salva automaticamente e aparece para todos.</p></>}
  {error&&<p role="alert" className="error">{error}</p>}{!loaded&&error&&<button disabled={busy} onClick={()=>void load()}>Tentar novamente</button>}
  </div><footer>{busy&&<span role="status"><LoaderCircle size={17} className="spin"/> Atualizando fotos…</span>}<button type="button" disabled={busy} onClick={close}>Concluir</button></footer>
  {feedback&&<SuccessToast key={feedback.key} title="Fotos atualizadas" message={feedback.message} onClose={()=>setFeedback(undefined)} container={dialog.current}/>}
 </dialog>,document.body);
}
