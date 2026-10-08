import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { safeImageUrl } from '../utils/productParser';

export function ProductImage({url,name,emptyText='Imagem ainda não cadastrada'}:{url?:string;name:string;emptyText?:string}) {
 const [failedUrl,setFailedUrl]=useState<string>();
 return url && safeImageUrl(url) && failedUrl!==url ? <img src={url} alt={name} loading="lazy" draggable={false} onError={()=>setFailedUrl(url)}/> : <div className="image-fallback"><ImageOff size={30} strokeWidth={1.2}/><span>{emptyText}</span></div>;
}
