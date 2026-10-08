import { useState } from 'react';
import { ImageOff } from 'lucide-react';
import { safeImageUrl } from '../utils/productParser';
export function ProductImage({url,name,emptyText='Imagem ainda não cadastrada'}:{url?:string;name:string;emptyText?:string}) {
 const [failedUrl,setFailedUrl]=useState<string>();
 return url && safeImageUrl(url) && failedUrl!==url ? <img src={url} alt={name} loading="lazy" onError={()=>setFailedUrl(url)}/> : <div className="image-fallback"><ImageOff size={30} strokeWidth={1.2}/><span>{emptyText}</span></div>;
}
export function ProductGallery({urls,name,emptyText}:{urls:string[];name:string;emptyText?:string}) {
 const [selected,setSelected]=useState(0);
 return <div className="gallery"><div className="gallery-main"><ProductImage key={urls[selected]||'empty'} url={urls[selected]} name={name} emptyText={emptyText}/></div>{urls.length>1&&<div className="thumbnails">{urls.map((url,i)=><button key={url} type="button" aria-label={`Ver imagem ${i+1}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}><ProductImage url={url} name={`${name}, imagem ${i+1}`}/></button>)}</div>}<div className="gallery-dots" aria-label="Imagens do produto">{(urls.length?urls:[undefined]).map((url,i)=><button type="button" key={url??'empty'} aria-label={`Imagem ${i+1}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}/>)}</div></div>;
}
