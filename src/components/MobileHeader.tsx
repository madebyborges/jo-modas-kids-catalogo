import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Menu, MoreVertical, Search, X } from 'lucide-react';
export function MobileHeader({product=false,onFilters}:{product?:boolean;onFilters?:()=>void}) {
 const dialog=useRef<HTMLDialogElement>(null);
 return <><header className={`mobile-header ${product?'mobile-product-header':''}`}>
 {product?<Link to="/" className="mobile-icon-button" aria-label="Voltar ao catálogo"><ArrowLeft size={23}/></Link>:<button className="mobile-icon-button" aria-label="Abrir menu" onClick={()=>dialog.current?.showModal()}><Menu size={23}/></button>}
 <div className="mobile-header-title">{product?<strong>Produto</strong>:<><h1>Catálogo para Conferência</h1><p>Revise os produtos antes da publicação.</p></>}</div>
 <button className="mobile-icon-button" aria-label={product?'Opções do produto':'Ir para busca'} onClick={()=>product?dialog.current?.showModal():document.querySelector<HTMLInputElement>('.search input')?.focus()}>{product?<MoreVertical size={22}/>:<Search size={23}/>}</button>
 </header><dialog ref={dialog} className="mobile-menu" onClick={e=>{if(e.target===dialog.current)dialog.current.close();}}><div className="section-title"><h2>Jo Modas Kids</h2><button aria-label="Fechar menu" className="mobile-icon-button" onClick={()=>dialog.current?.close()}><X size={22}/></button></div><nav aria-label="Menu mobile">{[['/','Catálogo'],['/revisao','Conferência e progresso'],['/configuracoes','Configurações']].map(([to,label])=><Link to={to} key={to} onClick={()=>dialog.current?.close()}>{label}</Link>)}{onFilters&&<button onClick={()=>{dialog.current?.close();onFilters();}}>Filtros e ordenação</button>}</nav></dialog></>;
}
