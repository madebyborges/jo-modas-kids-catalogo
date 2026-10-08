import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { readWorkbook, sourcePath } from './workbook';
import { parseNumber, parseVariation, safeImageUrl } from '../src/utils/productParser';
import type { Catalog, DataWarning, Product, ProductVariant, SourceRow } from '../src/types/product';
const str = (r: SourceRow, k: string) => r[k] == null ? '' : String(r[k]);
const images = (r: SourceRow) => Object.entries(r).filter(([k,v]) => /^URL imagem/.test(k) && v != null && String(v) !== '').map(([,v]) => String(v));
export async function buildCatalog() {
 const { sheet, sheets, hash } = await readWorkbook(); const all = sheet.rows;
 const imageAudit:{entries:{reference:string;status:string;reason:string}[]}=JSON.parse(await readFile('data-source/image-audit.json','utf8'));
 const parents = all.filter(r => r['Tipo do produto'] === 'V'); const children = all.filter(r => r['Tipo do produto'] === 'S');
 const globalWarnings: DataWarning[] = []; const counts = new Map<string, number>();
 all.forEach(r => { const sku = str(r,'Código (SKU)'); counts.set(sku,(counts.get(sku)||0)+1); });
 for (const [sku,n] of counts) if (!sku || n > 1) globalWarnings.push({type:'duplicate_sku',severity:'error',message:`SKU ausente ou duplicado: ${sku}`,sku});
 const parentSkus = new Set(parents.map(r => str(r,'Código (SKU)')));
 for (const r of children) if (!parentSkus.has(str(r,'Código do pai'))) globalWarnings.push({type:'orphan',severity:'error',message:`Filho ${r['Código (SKU)']} sem pai válido.`,sku:str(r,'Código (SKU)')});
 if (all.length !== parents.length + children.length) globalWarnings.push({type:'unknown_type',severity:'error',message:'Existe linha com tipo de produto desconhecido.'});
 const metadata = sheets.Revisao_Marketplaces?.rows || [];
 const products: Product[] = parents.map(r => {
  const parentSku = str(r,'Código (SKU)'); const reference = str(r,'Cód do fornecedor'); const marketplace = metadata.find(m => str(m,'Referência') === reference) || {};
  const warnings: DataWarning[] = []; const warn = (type:string,message:string,severity:DataWarning['severity']='warning',sku?:string) => warnings.push({type,message,severity,...(sku ? {sku}: {})});
  const variants: ProductVariant[] = children.filter(c => str(c,'Código do pai') === parentSku).map(c => {
   const sku = str(c,'Código (SKU)'); const variation = parseVariation(str(c,'Variações')); const stock = parseNumber(c.Estoque); const price = parseNumber(c.Preço);
   if (variation.malformed) warn('malformed_variation',`Variação mal formatada: ${c.Variações}`,'error',sku);
   if (stock === undefined) warn('invalid_stock','Estoque ausente ou inválido.','error',sku);
   if ((stock ?? 0) < 0) warn('negative_stock','Estoque negativo.','error',sku);
   if (price === undefined) warn('missing_price','Preço ausente ou inválido.','warning',sku);
   if (variation.size.includes('/')) { const [a,b] = variation.size.split('/').map(Number); if (!Number.isInteger(a) || b !== a+1) warn('suspicious_size',`Tamanho ${variation.size} precisa ser conferido (${variation.color || 'cor não informada'}).`,'warning',sku); }
   else if (!/^\d+$/.test(variation.size)) warn('inconsistent_size',`Tamanho precisa ser conferido: ${variation.size}`,'warning',sku);
   for (const key of ['Marca','NCM (Classificação fiscal)','Origem','GTIN/EAN']) if (str(c,key) !== str(r,key)) warn('inconsistent_field',`${key} do filho difere do pai.`,'warning',sku);
   return {sku,parentSku,size:variation.size,color:variation.color,stock:stock ?? 0,price,observations:str(c,'Observações'),imageUrls:images(c),source:c,sourceRow:all.indexOf(c)+2};
  });
  if (!variants.length) warn('no_children','Produto pai sem filhos.','error');
  const colorNames = [...new Set(variants.map(v => v.color || ''))];
  if (colorNames.includes('')) warn('missing_color','Há variações sem cor informada.','info');
  if (colorNames.some(c => c !== c.trim()) || (colorNames.includes('') && colorNames.length > 1)) warn('inconsistent_color','Cadastro de cores precisa ser conferido.');
  const colorKeys = colorNames.map(c => c.trim().toLocaleLowerCase('pt-BR'));
  if (new Set(colorKeys).size !== colorKeys.length) warn('inconsistent_color','Cores semelhantes com grafia diferente.');
  const colorSizes = variants.map(v => `${v.color || ''}|${v.size}`);
  if (new Set(colorSizes).size !== colorSizes.length) warn('duplicate_variation','Mais de um SKU para a mesma cor e tamanho.');
  const colors = colorNames.map(name => { const list = variants.filter(v => (v.color||'') === name); return { name, stock:list.reduce((s,v)=>s+v.stock,0),variants:list,imageUrls:[...new Set(list.flatMap(v=>v.imageUrls))] }; });
  const prices = variants.flatMap(v => v.price === undefined ? [] : [v.price]); const parentPrice = parseNumber(r.Preço);
  if (!prices.length && parentPrice === undefined) warn('missing_price','Preço não informado.');
  if (new Set(prices).size > 1 || (parentPrice !== undefined && prices.some(p => p !== parentPrice))) warn('inconsistent_price','Preços diferentes entre pai e/ou variações. Confira cada SKU.');
  const imageUrls = [...new Set([...images(r),...variants.flatMap(v=>v.imageUrls)])];
  if (!imageUrls.some(safeImageUrl)) warn('missing_image','Imagem ainda não cadastrada.','info');
  for(const c of colors) if(c.name&&!c.imageUrls.some(safeImageUrl)) warn('missing_color_image',`Sem imagem confirmada para a cor ${c.name}.`,'info');
  if (imageUrls.some(u=>!safeImageUrl(u))) warn('invalid_image','URL de imagem inválida.');
  for(const entry of imageAudit.entries.filter(e=>e.reference===reference&&e.status==='incompatible')) warn('mismatched_image',`${entry.reason} Link original preservado para auditoria; foto excluída da exibição.`);
  for (const [key,type,label] of [['NCM (Classificação fiscal)','missing_ncm','NCM'],['Origem','missing_origin','Origem'],['GTIN/EAN','missing_gtin','GTIN'],['Marca','missing_brand','Marca'],['Cód do fornecedor','missing_reference','Referência'],['Categoria','missing_category','Categoria do cadastro']]) if (!str(r,key)) warn(type,`${label} não informado.`,'info');
  if (reference === '2580.11') warn('similar_reference','Referência precisa ser conferida. Existe também o produto 2580.110.');
  if (str(marketplace,'Pendências/alertas')) warn('marketplace',str(marketplace,'Pendências/alertas'));
  const totalStock = variants.reduce((s,v)=>s+v.stock,0);
  if (marketplace['Estoque total'] != null && parseNumber(marketplace['Estoque total']) !== totalStock) warn('stock_mismatch','Estoque diverge da aba Revisao_Marketplaces.','error');
  return {parentSku,reference,name:str(r,'Descrição'),brand:str(r,'Marca'),category:str(r,'Categoria'),suggestedCategory:str(marketplace,'Categoria sugerida'),price:parentPrice ?? (prices.length ? Math.min(...prices):undefined),priceMax:prices.length ? Math.max(...prices):parentPrice,totalStock,description:str(r,'Descrição'),complementaryDescription:str(r,'Descrição complementar'),ncm:str(r,'NCM (Classificação fiscal)'),origin:str(r,'Origem'),gtin:str(r,'GTIN/EAN'),unit:str(r,'Unidade'),status:str(r,'Situação'),productType:str(r,'Tipo do produto'),supplierCode:str(r,'Cód do fornecedor'),seoTitle:str(r,'Título SEO'),seoDescription:str(r,'Descrição SEO'),seoKeywords:str(r,'Palavras chave SEO'),slug:str(r,'Slug'),imageUrls,colors,observations:[...new Set([str(r,'Observações'),...variants.map(v=>v.observations)].filter(Boolean))],dataWarnings:warnings,source:r,marketplace,sourceRow:all.indexOf(r)+2};
 });
 const refs = products.map(p=>p.reference); if (new Set(refs).size !== refs.length) globalWarnings.push({type:'duplicate_reference',severity:'error',message:'Referências duplicadas: não podem ser chave única de revisão.'});
 const catalog: Catalog = {products,generatedAt:new Date().toISOString(),sourceFile:sourcePath,sourceHash:hash,fields:sheet.fields,summary:{parents:products.length,variants:children.length,stock:products.reduce((s,p)=>s+p.totalStock,0),withWarnings:products.filter(p=>p.dataWarnings.length).length,withoutImage:products.filter(p=>!p.imageUrls.some(safeImageUrl)).length,withoutGtin:products.filter(p=>!p.gtin).length,withoutOrigin:products.filter(p=>!p.origin).length},warnings:globalWarnings};
 return {catalog,company:{fiscal:sheets.Tributacao_Olist?.rows||[],notes:(sheets.LEIA_ANTES?.rows||[]).map(row=>({title:String(Object.values(row)[0]||''),text:String(Object.values(row)[1]||'')}))}};
}
export async function importData() {
 const {catalog,company} = await buildCatalog();
 const errors = [...catalog.warnings,...catalog.products.flatMap(p=>p.dataWarnings)].filter(w=>w.severity==='error');
 if (errors.length) throw new Error(`Importação interrompida para não perder dados: ${JSON.stringify(errors)}`);
 await mkdir('public/data',{recursive:true});
 await writeFile('public/data/products.json',JSON.stringify(catalog,null,2)); await writeFile('public/data/company.json',JSON.stringify(company,null,2));
 console.log(JSON.stringify(catalog.summary,null,2));
}
if (process.argv[1]?.endsWith('importProducts.ts')) await importData();
