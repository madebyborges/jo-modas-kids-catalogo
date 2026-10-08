import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Product } from '../types/product';
import type { ReviewStatus } from '../types/review';
import { ReviewForm } from './ReviewForm';

export function ReviewDialog({product,intent,onClose,onSaved}:{product:Product;intent:{status:ReviewStatus;serial:number};onClose:()=>void;onSaved:(status:ReviewStatus)=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{
  const element=dialog.current;
  const previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  element?.showModal();
  return ()=>{element?.close();document.body.style.overflow=previousOverflow;};
 },[]);
 return createPortal(<dialog ref={dialog} className="review-dialog" aria-label="Conferência do produto" onCancel={onClose} onClick={event=>{if(event.target===event.currentTarget){const bounds=event.currentTarget.getBoundingClientRect();if(event.clientX<bounds.left||event.clientX>bounds.right||event.clientY<bounds.top||event.clientY>bounds.bottom)onClose();}}}>
  <button type="button" className="review-dialog-close" aria-label="Fechar conferência" onClick={onClose}><X size={20}/></button>
  <p className="review-dialog-product">{product.name}<span>Ref. {product.reference} · SKU pai {product.parentSku}</span></p>
  <ReviewForm product={product} intent={intent} onSaved={onSaved}/>
 </dialog>,document.body);
}

