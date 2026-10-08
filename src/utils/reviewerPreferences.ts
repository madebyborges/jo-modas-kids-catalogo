const key='jo-modas-reviewer-name';
export function readReviewerName(){try{return localStorage.getItem(key)?.trim().slice(0,160)||'';}catch{return '';}}
export function storeReviewerName(name:string){if(!name||name.length>160)throw new Error('Informe um nome válido.');localStorage.setItem(key,name);}
