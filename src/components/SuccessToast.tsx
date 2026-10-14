import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
export function SuccessToast({title,message,onClose,container}:{title:string;message:string;onClose:()=>void;container?:HTMLElement|null}) {
 const close=useRef(onClose);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{const timer=window.setTimeout(()=>close.current(),5000);return()=>window.clearTimeout(timer);},[]);
 return createPortal(<div className="review-saved-message review-success-toast" role="status" aria-live="polite">
  <Check size={22}/><div><strong>{title}</strong><span>{message}</span></div>
  <button type="button" aria-label="Fechar confirmação" onClick={onClose}><X size={18}/></button>
  <div className="review-toast-countdown" aria-hidden="true"><span/></div>
 </div>,container??document.body);
}
