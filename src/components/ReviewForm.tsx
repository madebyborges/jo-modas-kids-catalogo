import { useEffect, useState } from 'react';
import { Check, LoaderCircle } from 'lucide-react';
import type { Product } from '../types/product';
import type { ReviewStatus } from '../types/review';
import { useReviews } from '../hooks/useReviews';
import { saveReview, validateReview } from '../services/reviews';
import { ReviewStatusBadge } from './ReviewStatus';
import { date } from '../utils/formatters';
import { readReviewerName } from '../utils/reviewerPreferences';
export function ReviewForm({product:p,intent,onSaved}:{product:Product;intent?:{status:ReviewStatus;serial:number};onSaved?:()=>void}) {
 const {user,reviews,ready,loading,error,accept,refresh}=useReviews(); const review=reviews[p.reference];
 const [status,setStatus]=useState<ReviewStatus>(review?.status??'pending');const [comment,setComment]=useState(review?.comment??'');const [name,setName]=useState(readReviewerName()||String(user?.user_metadata.full_name??'Visitante'));const [busy,setBusy]=useState(false);const [message,setMessage]=useState('');const [failure,setFailure]=useState('');
 useEffect(()=>{setStatus(intent?.status??review?.status??'pending');setComment(review?.comment??'');setName(readReviewerName()||String(user?.user_metadata.full_name??'Visitante'));},[review,user,intent]);
 useEffect(()=>{if(intent){setStatus(intent.status);setMessage('');}},[intent]);
 async function submit(e:React.FormEvent){e.preventDefault();setFailure('');setMessage('');try{validateReview(status,comment,name);setBusy(true);accept(await saveReview(p,status,comment,name));setMessage('Revisão salva');onSaved?.();}catch(e){setFailure(e instanceof Error?e.message:'Não foi possível salvar a revisão. Tente novamente.');}finally{setBusy(false);}}
 return <section className="panel review-panel"><div className="section-title"><h2>Conferência</h2><ReviewStatusBadge status={review?.status} known={ready}/></div>{!ready?<><p role="status">{loading?'Preparando conferência…':error||'Conferência temporariamente indisponível.'}</p><button onClick={()=>void refresh().catch(()=>{})} disabled={loading}>Tentar novamente</button></>:<form onSubmit={submit}><label>Nome do revisor<input required value={name} onChange={e=>setName(e.target.value)} maxLength={160} autoComplete="name"/></label><div className="review-options">{(['approved','needs_correction','pending'] as const).map(s=><button type="button" key={s} aria-pressed={status===s} className={status===s?'selected':''} onClick={()=>{setStatus(s);setMessage('');}}>{s==='approved'?'Está correto':s==='needs_correction'?'Precisa corrigir':'Não revisado'}</button>)}</div>{status==='needs_correction'&&<label>O que precisa corrigir? <span className="required">Obrigatório</span><textarea required value={comment} onChange={e=>setComment(e.target.value)} placeholder="Descreva o que precisa ser ajustado neste produto." maxLength={5000} rows={4}/></label>}<button className="primary" disabled={busy||loading}>{busy?<LoaderCircle size={16} className="spin"/>:<Check size={16}/>} {busy?'Salvando…':'Salvar conferência'}</button>{review&&<p className="muted">Última revisão: {review.reviewer_name} · {date(review.reviewed_at)}{review.comment&&<><br/>{review.comment}</>}</p>}</form>}{message&&<p role="status" className="success">{message}</p>}{failure&&<p role="alert" className="error">Não foi possível salvar a revisão. {failure} Tente novamente.</p>}</section>;
}

