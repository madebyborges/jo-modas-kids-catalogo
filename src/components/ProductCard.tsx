import { Link } from 'react-router-dom';
import { ArrowUpRight, TriangleAlert, Box, Layers3 } from 'lucide-react';
import type { Product } from '../types/product';
import { displayImageUrls } from '../utils/productImages';
import { ProductImage } from './ProductGallery';
import { ReviewStatusBadge } from './ReviewStatus';
import { productPrice } from '../utils/formatters';
import { useReviews } from '../hooks/useReviews';
import { displayName } from '../utils/productDisplay';
export function ProductCard({product:p}:{product:Product}) {
 const {reviews,ready}=useReviews();const sizes=new Set(p.colors.flatMap(c=>c.variants.map(v=>v.size)));
 return <Link to={`/produto/${encodeURIComponent(p.reference||p.parentSku)}`} className="product-card"><div className="card-image"><ProductImage url={displayImageUrls(p)[0]} name={p.name}/>{p.dataWarnings.length>0&&<span className="image-warning"><TriangleAlert size={13}/>{p.dataWarnings.length} alertas</span>}</div><div className="card-body"><div className="card-meta"><span>{p.brand||'Marca não informada'}</span><ArrowUpRight size={17}/></div><h2><span className="desktop-product-name">{displayName(p)}</span><span className="mobile-product-name">{displayName(p)}</span></h2><p className="muted card-reference">Ref. {p.reference||'Não informada'}<span className="card-parent-sku"> · {p.parentSku}</span></p><p className="mobile-card-brand">{p.brand||'Marca não informada'}</p><strong className="price">{productPrice(p)}</strong><p className="card-stock">{p.totalStock} unidades <span>· {p.colors.filter(c=>c.name).length} cores · {sizes.size} tamanhos</span></p><div className="card-footer"><ReviewStatusBadge status={reviews[p.reference]?.status} known={ready}/><span>Conferir produto</span></div></div><div className="mobile-card-facts"><span><i className="pink-color-dot"/>{p.colors.filter(c=>c.name).length} cores</span><span><Layers3 size={16}/>{sizes.size} tamanhos</span><span><Box size={16}/><span className="mobile-stock-count">{p.totalStock} un.</span><span className="desktop-stock-count">{p.totalStock} unidades</span></span></div></Link>;
}
