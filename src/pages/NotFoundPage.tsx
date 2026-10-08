import { Link } from 'react-router-dom';
export function NotFoundPage(){return <div className="empty"><h1>Página não encontrada</h1><p>Confira o endereço ou volte ao catálogo.</p><Link className="button primary" to="/">Abrir catálogo</Link></div>;}
