import type { Catalog } from '../types/product';
import { useReviews } from '../hooks/useReviews';
export function StatsCards({catalog}:{catalog:Catalog}) {
 const {reviews,ready}=useReviews();const approved=catalog.products.filter(p=>reviews[p.reference]?.status==='approved').length;const correction=catalog.products.filter(p=>reviews[p.reference]?.status==='needs_correction').length;
 const items=[['Modelos',catalog.summary.parents],['Variações',catalog.summary.variants],['Unidades',catalog.summary.stock],['Corretos',ready?approved:'—'],['Precisam corrigir',ready?correction:'—'],['Não revisados',ready?catalog.summary.parents-approved-correction:'—'],['Com alertas',catalog.summary.withWarnings]];
 return <div className="stats">{items.map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>;
}
