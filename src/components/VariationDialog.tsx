import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Product } from '../types/product';
import { changeDescription, saveVariationChange, type VariationChange } from '../services/variationChanges';

export function VariationDialog({product,color,size,changes,onSaved,onClose,onConflict}:{product:Product;color:string;size?:string;changes:VariationChange[];onSaved:(row:VariationChange,message:string)=>void;onClose:()=>void;onConflict:()=>Promise<void>}){
 const dialog=useRef<HTMLDialogElement>(null),pending=useRef(false);
 const [draft,setDraft]=useState(size??''),[stock,setStock]=useState(String(product.colors.find(c=>c.name===color)?.variants.find(v=>v.size===size)?.stock??0));
 const [mode,setMode]=useState<'actions'|'edit'|'remove'>(size?'actions':'edit'),[busy,setBusy]=useState(false),[error,setError]=useState('');
 useEffect(()=>{const previous=document.body.style.overflow;document.body.style.overflow='hidden';dialog.current?.showModal();return()=>{dialog.current?.close();document.body.style.overflow=previous;};},[]);
 async function save(action:VariationChange['action']){
  if(pending.current)return;pending.current=true;setBusy(true);setError('');
  try{
   if(!/^\d+$/.test(stock))throw Error('Informe uma quantidade inteira, maior ou igual a zero.');
   const latest=changes.filter(r=>r.product_reference===product.reference&&r.color===color&&r.size===draft.trim()).sort((a,b)=>Number(b.id)-Number(a.id))[0];
   const row=await saveVariationChange(product,color,draft,Number(stock),action,latest?.id??null);
   onSaved(row,changeDescription(row));
  }catch(e){setError(e instanceof Error?e.message:'Não foi possível salvar. Tente novamente.');void onConflict();}
  finally{pending.current=false;setBusy(false);}
 }
 return createPortal(<dialog ref={dialog} className="photo-editor variation-dialog" aria-label={size?`Tamanho ${size}`:'Adicionar tamanho'} onCancel={e=>{e.preventDefault();if(!pending.current)onClose();}}>
  <header><div><h2>{mode==='remove'?'Remover tamanho':size?`Tamanho ${size}`:'Adicionar tamanho'}</h2><p>{color||'Cor não informada'} · Ref. {product.reference}</p></div><button aria-label="Fechar" disabled={busy} onClick={onClose}>×</button></header>
  <div className="photo-editor-body">
   {mode==='actions'?<><p>Estoque: {stock} unidades</p><button onClick={()=>setMode('edit')}>Editar estoque</button><button onClick={()=>setMode('remove')}>Remover tamanho</button></>:mode==='remove'?<><p>Remover tamanho <strong>{size}</strong> da cor <strong>{color||'Cor não informada'}</strong>?</p><p>Essa alteração ficará registrada na revisão do produto.</p></>:<form id="variation-form" onSubmit={e=>{e.preventDefault();void save(size?'updated':'added');}}><label>Tamanho<input autoFocus disabled={busy||!!size} maxLength={7} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Ex.: 27/28" required/></label><label>{size?'Estoque':'Quantidade inicial'}<input autoFocus={!!size} disabled={busy} type="number" min="0" max="2147483647" step="1" value={stock} onChange={e=>setStock(e.target.value)} required/></label></form>}
   {error&&<p role="alert" className="error">{error}</p>}{busy&&<p role="status">Salvando alteração…</p>}
  </div><footer><button disabled={busy} onClick={onClose}>Cancelar</button>{mode==='remove'?<button disabled={busy} onClick={()=>void save('removed')}>Remover</button>:mode==='edit'?<button disabled={busy} type="submit" form="variation-form">{size?'Salvar estoque':'Adicionar'}</button>:null}</footer>
 </dialog>,document.body);
}
