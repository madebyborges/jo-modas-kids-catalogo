export type ReviewStatus = 'pending' | 'approved' | 'needs_correction';
export interface Review { id?: string; product_reference: string; parent_sku: string; status: ReviewStatus; comment: string | null; reviewer_name: string; reviewed_at: string | null; updated_at?: string; reviewer_id?: string }
export const statusLabels: Record<ReviewStatus, string> = { pending: 'Não revisado', approved: 'Correto', needs_correction: 'Precisa corrigir' };
