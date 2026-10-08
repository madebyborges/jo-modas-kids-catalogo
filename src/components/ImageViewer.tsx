import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, Minus, Plus, RotateCcw, X } from 'lucide-react';
import { ProductImage } from './ProductImage';

type Point = { x:number; y:number };
type Transform = Point & { scale:number };
const initial:Transform = {scale:1,x:0,y:0};
const distance = (a:Point,b:Point) => Math.hypot(a.x-b.x,a.y-b.y);

export function ImageViewer({urls,name,selected,onSelect,onClose}:{urls:string[];name:string;selected:number;onSelect:(index:number)=>void;onClose:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 const stage=useRef<HTMLDivElement>(null);
 const [transform,setTransform]=useState<Transform>(initial);
 const current=useRef(initial);
 const pointers=useRef(new Map<number,Point>());
 const gesture=useRef<{start:Point;offset:Transform;distance:number;center:Point}|undefined>(undefined);
 function apply(value:Transform){
  const scale=Math.max(1,Math.min(4,value.scale));
  const width=stage.current?.clientWidth??0,height=stage.current?.clientHeight??0;
  const next={scale,x:Math.max(-width*(scale-1)/2,Math.min(width*(scale-1)/2,value.x)),y:Math.max(-height*(scale-1)/2,Math.min(height*(scale-1)/2,value.y))};
  current.current=next;setTransform(next);
 }
 function reset(){apply(initial);}
 function move(delta:number){pointers.current.clear();gesture.current=undefined;reset();onSelect((selected+delta+urls.length)%urls.length);}
 function zoom(scale:number){apply({...current.current,scale});}
 function seed(){
  const points=[...pointers.current.values()];if(!points.length){gesture.current=undefined;return;}
  const center=points.length>1?{x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2}:points[0];
  gesture.current={start:points[0],offset:current.current,distance:points.length>1?distance(points[0],points[1]):0,center};
 }
 function down(event:PointerEvent<HTMLDivElement>){
  if(event.pointerType==='mouse'&&event.button!==0)return;
  event.currentTarget.setPointerCapture(event.pointerId);pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});seed();
 }
 function drag(event:PointerEvent<HTMLDivElement>){
  if(!pointers.current.has(event.pointerId)||!gesture.current)return;
  pointers.current.set(event.pointerId,{x:event.clientX,y:event.clientY});const points=[...pointers.current.values()],g=gesture.current;
  if(points.length>1&&g.distance){
   const scale=Math.max(1,Math.min(4,g.offset.scale*distance(points[0],points[1])/g.distance));
   const bounds=stage.current!.getBoundingClientRect(),center={x:(points[0].x+points[1].x)/2,y:(points[0].y+points[1].y)/2};
   const anchor={x:g.center.x-bounds.left-bounds.width/2,y:g.center.y-bounds.top-bounds.height/2},ratio=scale/g.offset.scale;
   apply({scale,x:anchor.x-(anchor.x-g.offset.x)*ratio+center.x-g.center.x,y:anchor.y-(anchor.y-g.offset.y)*ratio+center.y-g.center.y});
  }else if(g.offset.scale>1)apply({...g.offset,x:g.offset.x+event.clientX-g.start.x,y:g.offset.y+event.clientY-g.start.y});
 }
 function up(event:PointerEvent<HTMLDivElement>,cancelled=false){
  const g=gesture.current;const wasSingle=pointers.current.size===1;const hadPointer=pointers.current.delete(event.pointerId);
  if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  if(hadPointer&&!cancelled&&wasSingle&&g&&g.offset.scale===1&&urls.length>1){const dx=event.clientX-g.start.x,dy=event.clientY-g.start.y;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.3)move(dx<0?1:-1);}
  seed();
 }
 useEffect(()=>{
  const element=dialog.current,overflow=document.body.style.overflow;document.body.style.overflow='hidden';element?.showModal();
  const surface=stage.current;
  const wheel=(event:WheelEvent)=>{event.preventDefault();zoom(current.current.scale+(event.deltaY<0?.2:-.2));};
  surface?.addEventListener('wheel',wheel,{passive:false});
  return()=>{surface?.removeEventListener('wheel',wheel);element?.close();document.body.style.overflow=overflow;};
 },[]);
 return createPortal(<dialog ref={dialog} className="image-viewer" aria-label="Visualizador de imagens" onCancel={onClose} onKeyDown={event=>{
  if(event.key==='ArrowRight'&&urls.length>1){event.preventDefault();move(1);}if(event.key==='ArrowLeft'&&urls.length>1){event.preventDefault();move(-1);}
  if(event.key==='+'||event.key==='='){event.preventDefault();zoom(current.current.scale+.5);}if(event.key==='-'){event.preventDefault();zoom(current.current.scale-.5);}
 }}>
  <header className="image-viewer-header"><div><strong>{name}</strong><span aria-live="polite">Foto {selected+1} de {urls.length}</span></div><button type="button" aria-label="Fechar imagem ampliada" onClick={onClose}><X size={22}/></button></header>
  <div className="image-viewer-content">
   <div ref={stage} className={`image-viewer-stage ${transform.scale>1?'is-zoomed':''}`} onPointerDown={down} onPointerMove={drag} onPointerUp={event=>up(event)} onPointerCancel={event=>up(event,true)} onDoubleClick={()=>zoom(current.current.scale===1?2:1)}>
    <div className="image-viewer-photo" style={{transform:`translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`}}><ProductImage key={urls[selected]} url={urls[selected]} name={`${name}, foto ${selected+1}`}/></div>
   </div>
   {urls.length>1&&<><button className="viewer-nav viewer-prev" type="button" aria-label="Foto anterior" onClick={()=>move(-1)}><ChevronLeft size={24}/></button><button className="viewer-nav viewer-next" type="button" aria-label="Próxima foto" onClick={()=>move(1)}><ChevronRight size={24}/></button></>}
  </div>
  <footer className="image-viewer-toolbar"><div className="image-viewer-zoom"><button type="button" aria-label="Diminuir zoom" disabled={transform.scale<=1} onClick={()=>zoom(current.current.scale-.5)}><Minus size={20}/></button><output aria-label="Nível de zoom">{Math.round(transform.scale*100)}%</output><button type="button" aria-label="Aumentar zoom" disabled={transform.scale>=4} onClick={()=>zoom(current.current.scale+.5)}><Plus size={20}/></button><button type="button" aria-label="Redefinir zoom" onClick={reset}><RotateCcw size={18}/></button></div><p>Use + e − ou dois dedos para ampliar. Arraste para ver os detalhes.</p></footer>
 </dialog>,document.body);
}
