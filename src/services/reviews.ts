import { supabase } from './supabase';
import type { Product } from '../types/product';
import type { Review, ReviewStatus } from '../types/review';
export async function fetchReviews(): Promise<Review[]> {
 if(!supabase) throw new Error('Supabase não configurado.');
 const {data,error}=await supabase.from('product_reviews').select('*').order('product_reference').abortSignal(AbortSignal.timeout(12000)).retry(false); if(error) throw error; return data as Review[];
}
export function validateReview(status:ReviewStatus,comment:string,name:string) {
 if(!name.trim()) throw new Error('Informe o nome do revisor.');
 if(status==='needs_correction' && !comment.trim()) throw new Error('Informe a observação para solicitar correção.');
}
export async function saveReview(p:Product,status:ReviewStatus,comment:string,name:string):Promise<Review> {
 validateReview(status,comment,name); if(!supabase) throw new Error('Supabase não configurado.');
 const {data:{user},error:authError}=await supabase.auth.getUser(); if(authError||!user) throw new Error('O acesso automático expirou. Atualize a conferência e tente novamente.');
 const payload={product_reference:p.reference,parent_sku:p.parentSku,status,comment:status==='needs_correction'?comment.trim():null,reviewer_name:name.trim(),reviewer_id:user.id,reviewed_at:status==='pending'?null:new Date().toISOString()};
 const {data,error}=await supabase.from('product_reviews').upsert(payload,{onConflict:'product_reference'}).select().abortSignal(AbortSignal.timeout(12000)).single().retry(false); if(error) throw error; return data as Review;
}
