import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Review } from '../types/review';
import { supabase } from '../services/supabase';
import { fetchReviews } from '../services/reviews';
import { ensureReviewSession } from '../services/reviewSession';
interface ReviewContext { user:User|null; reviews:Record<string,Review>; ready:boolean; loading:boolean; error:string; refresh:()=>Promise<Review[]>; accept:(review:Review)=>void }
const Context=createContext<ReviewContext|null>(null);
export function ReviewProvider({children}:{children:ReactNode}) {
 const [user,setUser]=useState<User|null>(null);const [reviews,setReviews]=useState<Record<string,Review>>({}); const [loading,setLoading]=useState(!!supabase); const [ready,setReady]=useState(false); const [error,setError]=useState(supabase?'':'Revisões indisponíveis: Supabase ainda não configurado.');const identity=useRef<string|null>(null);const revision=useRef(0);
 const refresh=useCallback(async()=>{const request=++revision.current;let current=identity.current;setLoading(true); try{if(!current){const session=await ensureReviewSession();current=session.user.id;identity.current=current;setUser(session.user);}const rows=await fetchReviews();if(!current||current!==identity.current)throw new Error('Sessão alterada durante a consulta.');if(request!==revision.current)return rows;setReviews(Object.fromEntries(rows.map(r=>[r.product_reference,r])));setError('');setReady(true);return rows;}catch(e){if(request===revision.current&&current===identity.current){setReady(false);setError('O catálogo está disponível, mas as revisões estão temporariamente indisponíveis.');}throw e;}finally{if(request===revision.current)setLoading(false);}},[]);
 useEffect(()=>{if(!supabase)return;let active=true;ensureReviewSession().then(session=>{if(!active)return;identity.current=session.user.id;setUser(session.user);setError('');setLoading(false);}).catch(()=>{if(active){setError('Conferência indisponível. Não foi possível iniciar o acesso automático ao Supabase.');setLoading(false);}}); const {data:{subscription}}=supabase.auth.onAuthStateChange((_event,session)=>{const next=session?.user.id??null;if(identity.current!==next){identity.current=next;setReviews({});setReady(false);}setUser(session?.user??null);});return()=>{active=false;subscription.unsubscribe();};},[]);
 useEffect(()=>{if(!user){setReviews({});setReady(false);return;}void refresh().catch(()=>{}); const onFocus=()=>void refresh().catch(()=>{});window.addEventListener('focus',onFocus);return()=>window.removeEventListener('focus',onFocus);},[user?.id,refresh]);
 return <Context.Provider value={{user,reviews,ready,loading,error,refresh,accept:r=>{if(identity.current===r.reviewer_id){revision.current++;setLoading(false);setReady(true);setError('');setReviews(old=>({...old,[r.product_reference]:r}));}} }}>{children}</Context.Provider>;
}
export function useReviews(){const context=useContext(Context);if(!context)throw new Error('ReviewProvider ausente');return context;}
