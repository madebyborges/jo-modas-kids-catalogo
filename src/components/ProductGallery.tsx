import { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { safeImageUrl } from '../utils/productParser';
import { ImageViewer } from './ImageViewer';
import { ProductImage } from './ProductImage';
import type { ReviewStatus } from '../types/review';
export { ProductImage } from './ProductImage';
export function ProductGallery({urls,name,emptyText,reviewStatus='pending',reviewReady=true}:{urls:string[];name:string;emptyText?:string;reviewStatus?:ReviewStatus;reviewReady?:boolean}) {
 const [selected,setSelected]=useState(0);
 const [expanded,setExpanded]=useState(false);const touch=useRef<{x:number;y:number}|undefined>(undefined);
 function move(delta:number){setSelected(index=>(index+delta+urls.length)%urls.length);}
 const canExpand=!!urls[selected]&&!!safeImageUrl(urls[selected]);
 return <div className="gallery" data-review-status={reviewReady?reviewStatus:"unknown"}><div className="gallery-main" onTouchStart={event=>{if(event.touches.length===1)touch.current={x:event.touches[0].clientX,y:event.touches[0].clientY};else touch.current=undefined;}} onTouchEnd={event=>{const start=touch.current;touch.current=undefined;if(!start||urls.length<2)return;const dx=event.changedTouches[0].clientX-start.x,dy=event.changedTouches[0].clientY-start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3){event.preventDefault();move(dx<0?1:-1);}}} onTouchCancel={()=>{touch.current=undefined;}}>
  <button className="gallery-expand" type="button" aria-label="Ampliar imagem do produto" disabled={!canExpand} onClick={()=>setExpanded(true)}><ProductImage key={urls[selected]||'empty'} url={urls[selected]} name={name} emptyText={emptyText}/>{canExpand&&<span className="gallery-expand-icon"><Maximize2 size={18}/></span>}</button>
  {urls.length>1&&<><button className="gallery-nav gallery-prev" type="button" aria-label="Foto anterior" onClick={()=>move(-1)}><ChevronLeft size={22}/></button><button className="gallery-nav gallery-next" type="button" aria-label="Próxima foto" onClick={()=>move(1)}><ChevronRight size={22}/></button></>}
 </div>{urls.length>1&&<div className="thumbnails">{urls.map((url,i)=><button key={url} type="button" aria-label={`Ver imagem ${i+1}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}><ProductImage url={url} name={`${name}, imagem ${i+1}`}/></button>)}</div>}<div className="gallery-dots" aria-label="Imagens do produto">{(urls.length?urls:[undefined]).map((url,i)=><button type="button" key={url??'empty'} aria-label={`Imagem ${i+1}`} aria-pressed={i===selected} onClick={()=>setSelected(i)}/>)}</div>{expanded&&<ImageViewer urls={urls} name={name} selected={selected} onSelect={setSelected} onClose={()=>setExpanded(false)}/>}</div>;
}
