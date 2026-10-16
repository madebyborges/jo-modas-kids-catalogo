import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoaderCircle, X } from 'lucide-react';
import type { Product } from '../types/product';
import { fetchSizeEdits, saveSizeEdit, validateSize, type SizeEdit } from '../services/productSizes';
import { SuccessToast } from './SuccessToast';

export function ProductSizeEditor({product,initialColor,onSaved,onClose}:{product:Product;initialColor:string;onSaved:(row:SizeEdit)=>void;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null),operation=useRef(false),generation=useRef(0),rows=useRef<SizeEdit[]>([]),draftRef=useRef<Record<string,string>>({});
 const [drafts,setDrafts]=useState<Record<string,string>>({}),[color,setColor]=useState(initialColor),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[errorSku,setErrorSku]=useState(''),[feedback,setFeedback]=useState<{key:number;message:string}>();
 const variants=product.colors.flatMap(c=>c.variants.map(v=>({...v,colorName:c.name})));const selected=product.colors.find(c=>c.name===color);
 useEffect(()=>{dialog.current?.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{dialog.current?.close();document.body.style.overflow=overflow;};},[]);
 async function load(){const request=++generation.current;setLoaded(false);setError('');try{const data=(await fetchSizeEdits()).filter(r=>r.product_reference===product.reference);if(request!==generation.current)return;rows.current=data;draftRef.current=Object.fromEntries(variants.map(v=>[v.sku,data.find(r=>r.sku===v.sku&&r.color===v.colorName)?.size??v.size]));setDrafts({...draftRef.current});setLoaded(true);}catch{if(request===generation.current)setError('Não foi possível carregar os tamanhos. Tente novamente.');}}
 useEffect(()=>{void load();return()=>{generation.current++;};},[product.reference]);
 async function save(sku:string):Promise<boolean>{
  if(operation.current||!loaded)return false;const variant=variants.find(v=>v.sku===sku);if(!variant)return false;
  const size=(draftRef.current[sku]??variant.size).trim(),previous=rows.current.find(r=>r.sku===sku)??null;
  if(size===(previous?.size??variant.size))return true;
  setError('');setErrorSku('');setFeedback(undefined);
  try{
   validateSize(size);if(variants.some(v=>v.sku!==sku&&v.colorName===variant.colorName&&(draftRef.current[v.sku]??v.size).trim()===size))throw Error(`O tamanho ${size} já existe nesta cor. Cada variação deve ter um tamanho diferente.`);
   operation.current=true;setBusy(true);const row=await saveSizeEdit(product.reference,variant.colorName,sku,size,previous);
   rows.current=[...rows.current.filter(r=>r.sku!==sku),row];draftRef.current[sku]=row.size;setDrafts({...draftRef.current});onSaved(row);setFeedback({key:Date.now(),message:`Tamanho atualizado para ${row.size} com sucesso.`});return true;
  }catch(e){setColor(variant.colorName);setErrorSku(sku);setError(e instanceof Error?e.message:'Não foi possível atualizar o tamanho. Tente novamente.');return false;}finally{operation.current=false;setBusy(false);}
 }
 async function close(){if(operation.current)return;if(loaded)for(const v of variants)if(!await save(v.sku))return;onClose();}
 return createPortal(<dialog ref={dialog} className="photo-editor size-editor" aria-label="Editar tamanhos do produto" onCancel={event=>{event.preventDefault();void close();}}>
  <header><div><h2>Editar tamanhos</h2><p>{product.name} · Ref. {product.reference}</p></div><button data-size-close type="button" aria-label="Fechar editor de tamanhos" disabled={busy} onPointerDown={e=>e.preventDefault()} onClick={()=>void close()}><X size={20}/></button></header>
  <div className="photo-editor-body"><label>Cor dos tamanhos<select disabled={busy||!loaded} value={color} onChange={e=>{setColor(e.target.value);setFeedback(undefined);setError('');}}>{product.colors.map(c=><option key={c.name} value={c.name}>{c.name||'Cor não informada'}</option>)}</select></label>
   <p className="muted">Edite o tamanho e pressione Enter ou saia do campo para salvar automaticamente. Tamanhos como 25/26 são um único valor. O estoque e o SKU permanecem vinculados à mesma variação.</p>
   {!loaded&&!error&&<p role="status">Carregando tamanhos…</p>}
   {loaded&&selected?.variants.map(v=><div key={v.sku} className={`size-edit-row ${errorSku===v.sku?'size-edit-error':''}`}><div><strong>{v.stock} {v.stock===1?'unidade':'unidades'}</strong><small>SKU: {v.sku}</small></div><label>Tamanho<input aria-label={`Tamanho do SKU ${v.sku}`} value={drafts[v.sku]??v.size} disabled={busy} maxLength={7} autoComplete="off" onChange={e=>{draftRef.current[v.sku]=e.target.value;setDrafts({...draftRef.current});setError('');setErrorSku('');}} onBlur={e=>{if(!(e.relatedTarget as HTMLElement|null)?.closest('[data-size-close]'))void save(v.sku);}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void save(v.sku);}}}/></label></div>)}
   {error&&<p role="alert" className="error">{error}</p>}{!loaded&&error&&<button onClick={()=>void load()}>Tentar novamente</button>}
  </div><footer>{busy&&<span role="status"><LoaderCircle size={17} className="spin"/> Atualizando tamanho…</span>}<button data-size-close type="button" disabled={busy} onPointerDown={e=>e.preventDefault()} onClick={()=>void close()}>Concluir</button></footer>
  {feedback&&<SuccessToast key={feedback.key} title="Tamanho atualizado" message={feedback.message} container={dialog.current} onClose={()=>setFeedback(undefined)}/>}
 </dialog>,document.body);
}
