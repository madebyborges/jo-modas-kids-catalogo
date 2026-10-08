import { supabase } from './supabase';
import type { Session } from '@supabase/supabase-js';
let pending:Promise<Session>|null=null;
/** Reutiliza a sessão existente ou cria uma identidade anônima sem email/senha. */
export function ensureReviewSession():Promise<Session>{
 if(pending)return pending;
 const client=supabase;if(!client)return Promise.reject(new Error('Supabase ainda não configurado.'));
 pending=(async()=>{
  const existing=await client.auth.getSession();if(existing.error)throw existing.error;
  if(existing.data.session)return existing.data.session;
  const {data,error}=await client.auth.signInAnonymously();if(error)throw error;
  if(!data.session)throw new Error('Não foi possível iniciar a conferência.');return data.session;
 })().finally(()=>{pending=null;});return pending;
}
