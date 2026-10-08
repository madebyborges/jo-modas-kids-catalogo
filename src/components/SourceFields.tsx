import type { SourceRow } from '../types/product';
export function SourceFields({source}:{source:SourceRow}) {return <dl className="data-list">{Object.entries(source).filter(([,v])=>v!==null&&v!=='').map(([k,v])=><div key={k}><dt>{k}</dt><dd>{String(v)}</dd></div>)}</dl>;}
