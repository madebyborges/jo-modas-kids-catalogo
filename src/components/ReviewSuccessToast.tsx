import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import type { ReviewStatus } from '../types/review';

export function ReviewSuccessToast({status,onClose}:{status:ReviewStatus;onClose:()=>void}) {
 const close=useRef(onClose);
 useEffect(()=>{close.current=onClose;},[onClose]);
 useEffect(()=>{const timer=window.setTimeout(()=>close.current(),5000);return()=>window.clearTimeout(timer);},[]);
 return createPortal(<div className="review-saved-message review-success-toast" role="status" aria-live="polite">
  <Check size={22}/><div><strong>Revisão salva</strong><span>{status==='approved'?'Produto marcado como correto.':status==='needs_correction'?'Correção solicitada com sucesso.':'Produto marcado como não revisado.'}</span></div>
  <button type="button" aria-label="Fechar confirmação" onClick={onClose}><X size={18}/></button>
  <div className="review-toast-countdown" aria-hidden="true"><span/></div>
 </div>,document.body);
}
