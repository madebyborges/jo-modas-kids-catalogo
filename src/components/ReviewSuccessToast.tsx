import type { ReviewStatus } from '../types/review';
import { SuccessToast } from './SuccessToast';
export function ReviewSuccessToast({status,onClose}:{status:ReviewStatus;onClose:()=>void}) {
 return <SuccessToast title="Revisão salva" message={status==='approved'?'Produto marcado como correto.':status==='needs_correction'?'Correção solicitada com sucesso.':'Produto marcado como não revisado.'} onClose={onClose}/>;
}
