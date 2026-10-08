import { test, expect, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
const catalogData=JSON.parse(await readFile('public/data/products.json','utf8'));
import type { Review } from '../../src/types/review';
const user={id:'00000000-0000-4000-8000-000000000001',aud:'authenticated',role:'authenticated',email:'revisora@example.test',app_metadata:{provider:'email'},user_metadata:{full_name:'Revisora de teste'},created_at:'2026-01-01T00:00:00Z'};
async function mockSupabase(page:Page,sessionGate?:Promise<void>){
 let rows:Review[]=[];let fail=false;let signups=0;const visitor={...user,is_anonymous:true,email:undefined,user_metadata:{}};
 await page.route('http://127.0.0.1:9999/**',async route=>{
  const req=route.request();const url=new URL(req.url());const headers={'access-control-allow-origin':'*','access-control-allow-headers':'*','access-control-allow-methods':'GET,POST,OPTIONS'};
  if(req.method()==='OPTIONS'){await route.fulfill({status:204,headers});return;}
  if(fail){await route.fulfill({status:503,json:{message:'Teste de indisponibilidade'},headers});return;}
  let body:unknown={};
  if(url.pathname.endsWith('/signup')){await sessionGate;signups++;body={access_token:'test-access-token',token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user:visitor};}
  else if(url.pathname.endsWith('/token'))body={access_token:'test-access-token',token_type:'bearer',expires_in:3600,refresh_token:'test-refresh',user};
  else if(url.pathname.endsWith('/user'))body=visitor;
  else if(url.pathname.endsWith('/product_reviews')){
   if(req.method()==='POST'){const r=req.postDataJSON() as Review;r.updated_at=new Date().toISOString();rows=[...rows.filter(x=>x.product_reference!==r.product_reference),r];body=r;}
   else body=rows;
  }
  await route.fulfill({status:200,json:body,headers});
 });
 return {signupCount:()=>signups,outage:()=>{fail=true;},getRows:()=>rows,setComment:(comment:string)=>{rows=rows.map(r=>({...r,comment}));}};
}
async function prepareReviews(page:Page){await page.goto('/#/revisao');await expect(page.getByRole('heading',{name:'Dashboard de conferência'})).toBeVisible();await expect(page.getByText('Progresso da conferência',{exact:true})).toBeVisible();}

test('Galeria desktop e mobile: setas, expansão, zoom, arraste, pinça e swipe',async({page})=>{
 await mockSupabase(page);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 const product=catalogData.products.find((p:{reference:string})=>p.reference==='2305.2081');const photos=product.colors[0].imageUrls;
 const touch=await page.context().newCDPSession(page);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('/#/produto/2305.2081');const gallery=page.locator('.gallery-main');const photo=gallery.locator('img');
  await expect(photo).toHaveAttribute('src',photos[0]);await gallery.getByRole('button',{name:'Próxima foto',exact:true}).click();await expect(photo).toHaveAttribute('src',photos[1]);
  await gallery.getByRole('button',{name:'Foto anterior',exact:true}).click();await expect(photo).toHaveAttribute('src',photos[0]);
  const box=(await gallery.boundingBox())!;const cy=box.y+box.height/2;
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x+box.width*.75,y:cy,id:1}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:box.x+box.width*.25,y:cy,id:1}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(photo).toHaveAttribute('src',photos[1]);await expect(page.getByRole('dialog')).toHaveCount(0);
  const before=await page.evaluate(()=>scrollY);await gallery.getByRole('button',{name:'Ampliar imagem do produto'}).click();const viewer=page.getByRole('dialog',{name:'Visualizador de imagens'});await expect(viewer).toBeVisible();await expect(viewer.locator('img')).toHaveAttribute('src',photos[1]);
  await viewer.getByRole('button',{name:'Aumentar zoom'}).click();await expect(viewer.getByLabel('Nível de zoom')).toHaveText('150%');
  const stage=viewer.locator('.image-viewer-stage'),bounds=(await stage.boundingBox())!;const cx=bounds.x+bounds.width/2,y=bounds.y+bounds.height/2;
  await page.mouse.move(cx,y);await page.mouse.down();await page.mouse.move(cx+35,y+20);await page.mouse.up();await expect(viewer.locator('.image-viewer-photo')).toHaveAttribute('style',/translate\(35px, 20px\)/);
  await viewer.getByRole('button',{name:'Redefinir zoom'}).click();await expect(viewer.getByLabel('Nível de zoom')).toHaveText('100%');
  await stage.dblclick();await expect(viewer.getByLabel('Nível de zoom')).toHaveText('200%');await viewer.getByRole('button',{name:'Redefinir zoom'}).click();
  await page.mouse.move(cx,y);await page.mouse.wheel(0,-100);await expect(viewer.getByLabel('Nível de zoom')).toHaveText('120%');await viewer.getByRole('button',{name:'Redefinir zoom'}).click();
  await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx-30,y,id:1},{x:cx+30,y,id:2}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-70,y,id:1},{x:cx+70,y,id:2}]});
  await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await expect(viewer.getByLabel('Nível de zoom')).not.toHaveText('100%');
  await viewer.getByRole('button',{name:'Próxima foto',exact:true}).click();await expect(viewer.locator('img')).toHaveAttribute('src',photos[2]);await expect(viewer.getByLabel('Nível de zoom')).toHaveText('100%');
  await page.keyboard.press('ArrowLeft');await expect(viewer.locator('img')).toHaveAttribute('src',photos[1]);
  await viewer.getByRole('button',{name:'Aumentar zoom'}).click();await page.screenshot({path:`../galeria-ampliada-${width}.png`});
  await viewer.getByRole('button',{name:'Fechar imagem ampliada'}).click();await expect(viewer).toHaveCount(0);expect(await page.evaluate(()=>scrollY)).toBe(before);
  await gallery.getByRole('button',{name:'Ampliar imagem do produto'}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('/#/produto/2749.101');await expect(page.getByRole('button',{name:'Ampliar imagem do produto'})).toBeDisabled();await expect(page.getByRole('button',{name:'Próxima foto',exact:true})).toHaveCount(0);
 }
 expect(errors).toEqual([]);
});

test('Mobile: três status abrem popup sem âncora, comentário obrigatório e salvar fecha modal',async({page})=>{
 const backend=await mockSupabase(page);await prepareReviews(page);
 for(const width of [320,390]){
  await page.setViewportSize({width,height:844});await page.goto('/#/produto/25006.101');
  for(const label of ['Não revisado','Correto','Precisa corrigir']){
   await page.evaluate(()=>window.scrollTo(0,500));const before=await page.evaluate(()=>scrollY);
   await page.locator('.product-review-actions').getByRole('button',{name:label,exact:true}).click();const modal=page.getByRole('dialog',{name:'Conferência do produto'});await expect(modal).toBeVisible();expect(await page.evaluate(()=>scrollY)).toBe(before);
   const bounds=(await modal.boundingBox())!;expect(bounds.x).toBeGreaterThanOrEqual(0);expect(bounds.x+bounds.width).toBeLessThanOrEqual(width);expect(bounds.y+bounds.height).toBeLessThanOrEqual(844);
   if(label==='Precisa corrigir'){await modal.getByRole('button',{name:'Salvar conferência'}).click();await expect(modal).toBeVisible();expect(backend.getRows()).toHaveLength(0);await expect(modal.getByLabel(/O que precisa corrigir/)).toBeFocused();}
   await page.getByRole('button',{name:'Fechar conferência'}).click();await expect(modal).toHaveCount(0);expect(await page.evaluate(()=>scrollY)).toBe(before);
  }
 }
 await page.locator('.product-review-actions').getByRole('button',{name:'Precisa corrigir',exact:true}).click();await page.getByLabel(/O que precisa corrigir/).fill('Verificar descrição e fotografia.');await page.screenshot({path:'../conferencia-modal-mobile.png'});
 await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByRole('dialog')).toHaveCount(0);await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].status).toBe('needs_correction');
});

test('Escolha de conferência durante carregamento é preservada ao iniciar sessão',async({page})=>{
 let release!:()=>void;const gate=new Promise<void>(resolve=>{release=resolve;});const backend=await mockSupabase(page,gate);
 await page.goto('/#/produto/25006.101');await page.locator('.product-review-actions').getByRole('button',{name:'Correto',exact:true}).click();
 await expect(page.getByText('Preparando conferência…',{exact:true})).toBeVisible();release();
 await expect(page.getByRole('button',{name:'Está correto',exact:true})).toHaveAttribute('aria-pressed','true');
 await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].status).toBe('approved');
});

test('Catálogo real: agrupamento, busca, filtros, ordenação e alertas',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await mockSupabase(page);await page.goto('/');await expect(page.locator('.product-card')).toHaveCount(46);
 await page.getByRole('textbox',{name:'Buscar produtos'}).fill('2656.100');await expect(page.locator('.product-card')).toHaveCount(1);await page.locator('.product-card').click();await expect(page.locator('.variant').getByText('25/36',{exact:true})).toBeVisible();await expect(page.getByText(/Tamanho 25\/36 precisa ser conferido/)).toBeVisible();
 await page.getByRole('button',{name:/^Preta/}).click();await expect(page.locator('.variant').getByText('25/26',{exact:true})).toBeVisible();await expect(page.locator('.variant').getByText('25/36',{exact:true})).toHaveCount(0);
 await page.goto('/#/produto/2580.11');await expect(page.getByText('Referência precisa ser conferida. Existe também o produto 2580.110.')).toBeVisible();await page.goto('/');
 await page.getByRole('button',{name:'Abrir filtros'}).click();await page.getByLabel('Marca',{exact:true}).selectOption('Molekinho');await page.getByRole('button',{name:'Ver produtos'}).click();const brandCount=await page.locator('.product-card').count();expect(brandCount).toBeGreaterThan(0);expect(brandCount).toBeLessThan(46);
 await page.getByLabel('Ordenar',{exact:true}).selectOption('stock_desc');await expect(page.locator('.product-card').first()).toContainText('26 unidades');
 await page.getByRole('button',{name:'Abrir filtros'}).click();await page.getByRole('button',{name:'Limpar filtros'}).click();await page.getByLabel('Imagens',{exact:true}).selectOption('yes');await page.getByRole('button',{name:'Ver produtos'}).click();await expect(page.locator('.product-card')).toHaveCount(catalogData.products.filter((p:any)=>p.colors.some((c:any)=>c.name)?p.colors.some((c:any)=>c.imageUrls.length):p.imageUrls.length).length);await page.getByRole('button',{name:'Abrir filtros'}).click();await page.getByLabel('Imagens',{exact:true}).selectOption('no');await page.getByRole('button',{name:'Ver produtos'}).click();await expect(page.locator('.product-card')).toHaveCount(catalogData.products.filter((p:any)=>p.colors.some((c:any)=>c.name)?!p.colors.some((c:any)=>c.imageUrls.length):!p.imageUrls.length).length);await page.getByRole('button',{name:'Abrir filtros'}).click();await page.getByRole('button',{name:'Limpar filtros'}).click();await page.getByRole('button',{name:'Ver produtos'}).click();
 const data=JSON.parse(await readFile('public/data/products.json','utf8'));const sku=data.products[0].colors[0].variants[0].sku;await page.getByRole('textbox',{name:'Buscar produtos'}).fill(sku);await expect(page.locator('.product-card')).toHaveCount(1);expect(errors).toEqual([]);
});
test('Sessão automática, aprovação, comentário obrigatório, persistência, dashboard e exportações (API simulada)',async({page})=>{
 const backend=await mockSupabase(page);await prepareReviews(page);await page.goto('/#/produto/25006.101');await page.locator('.product-review-actions').getByRole('button',{name:'Correto',exact:true}).click();await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].status).toBe('approved');
 await page.reload();await expect(page.locator('.desktop-product-status .badge')).toContainText('Correto');await page.locator('.product-review-actions').getByRole('button',{name:'Precisa corrigir',exact:true}).click();await page.getByRole('button',{name:'Salvar conferência'}).click();expect(backend.getRows()[0].status).toBe('approved');
 await page.getByLabel(/O que precisa corrigir/).fill('Conferir foto e preço.');await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].comment).toBe('Conferir foto e preço.');
 await page.goto('/#/revisao');await expect(page.locator('.correction-row')).toContainText('Conferir foto e preço.');await expect(page.getByText('1 de 46 produtos revisados')).toBeVisible();
 backend.setComment('Observação atualizada em outra sessão.');
 const csvPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar conferência CSV'}).click();const csv=await csvPromise;expect((await readFile((await csv.path())!,'utf8'))).toContain('Observação atualizada em outra sessão.');
 const jsonPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exportar JSON',exact:true}).click();const json=await jsonPromise;const exported=JSON.parse(await readFile((await json.path())!,'utf8'));expect(exported.products.length).toBe(46);expect(exported.reviews[0].status).toBe('needs_correction');expect(exported.reviews[0].comment).toBe('Observação atualizada em outra sessão.');
 await page.goto('/');await page.getByRole('button',{name:'Abrir filtros'}).click();await page.getByLabel('Status da revisão',{exact:true}).selectOption('needs_correction');await page.getByRole('button',{name:'Ver produtos'}).click();await expect(page.locator('.product-card')).toHaveCount(1);
 await expect(page.getByRole('link',{name:'Entrar',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Sair',exact:true})).toHaveCount(0);expect(backend.signupCount()).toBe(1);
});
test('Indisponibilidade do Supabase mantém catálogo e cancela exportação',async({page})=>{const backend=await mockSupabase(page);await prepareReviews(page);backend.outage();await page.getByRole('button',{name:'Atualizar revisões'}).click();await expect(page.getByText('O catálogo está disponível, mas as revisões estão temporariamente indisponíveis.')).toBeVisible();await expect(page.getByRole('button',{name:'Exportar JSON',exact:true})).toBeDisabled();await page.goto('/');await expect(page.locator('.product-card')).toHaveCount(46);});
test('Mobile: uma cor, sem cor, tamanhos simples e duplos, sem overflow',async({page})=>{await mockSupabase(page);await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('.product-card')).toHaveCount(46);for(const reference of ['25005.203','2750.101','2749.300','2656.100']){await page.goto(`/#/produto/${reference}`);await expect(page.locator('.variant').first()).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();}await page.goto('/#/produto/25005.203');await expect(page.locator('.color-options')).toHaveCount(0);await expect(page.getByText('GTIN',{exact:true})).toBeVisible();});
test('Galeria: URL inválida e falha de imagem usam fallback',async({page})=>{await mockSupabase(page);const data=JSON.parse(await readFile('public/data/products.json','utf8'));data.products[0].imageUrls=['https://invalid.example.test/not-found.jpg','javascript:invalid'];await page.route('**/data/products.json',r=>r.fulfill({json:data}));await page.route('https://invalid.example.test/**',r=>r.fulfill({status:404}));await page.goto(`/#/produto/${data.products[0].reference}`);await expect(page.locator('.gallery-main .image-fallback')).toBeVisible();await page.getByRole('button',{name:'Imagem 2',exact:true}).click();await expect(page.locator('.gallery-main .image-fallback')).toBeVisible();});

test('Mobile: chips, menu, filtros, tamanho e revisão com comentário (API simulada)',async({page})=>{
 const backend=await mockSupabase(page);await page.setViewportSize({width:390,height:844});await prepareReviews(page);await page.goto('/');
 await page.getByRole('button',{name:'Molekinho',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(17);
 await page.getByRole('button',{name:'Todos',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(46);
 await page.getByRole('button',{name:'Abrir menu'}).click();await page.getByRole('button',{name:'Filtros e ordenação'}).click();await page.getByLabel('Ordenar',{exact:true}).selectOption('stock_desc');await page.getByRole('button',{name:'Ver produtos'}).click();await expect(page.locator('.product-card').first()).toContainText('26 un.');
 await page.goto('/#/produto/25006.101');await page.getByRole('button',{name:/^Dourado /}).click();await page.getByRole('button',{name:/^Tamanho 26,/}).click();await expect(page.getByRole('button',{name:/^Tamanho 26,/})).toHaveAttribute('aria-pressed','true');
 const before=await page.evaluate(()=>scrollY);await page.locator('.product-review-actions').getByRole('button',{name:'Precisa corrigir',exact:true}).click();await expect(page.getByRole('dialog',{name:'Conferência do produto'})).toBeVisible();expect(await page.evaluate(()=>scrollY)).toBe(before);await expect(page.locator('.review-panel')).toBeVisible();await page.getByRole('button',{name:'Salvar conferência'}).click();expect(backend.getRows()).toHaveLength(0);
 await page.getByLabel(/O que precisa corrigir/).fill('Conferir fotografia do modelo.');await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].status).toBe('needs_correction');
 await page.getByRole('link',{name:'Voltar ao catálogo'}).click();await expect(page.locator('.product-card').filter({hasText:'25006.101'})).toContainText('Pendente');
});

test('Desktop: navegação lateral, linhas responsivas e conferência rápida (API simulada)',async({page})=>{
 const backend=await mockSupabase(page);await prepareReviews(page);await page.goto('/');
 for(const width of [800,1024,1440]){await page.setViewportSize({width,height:1000});await expect(page.locator('.desktop-sidebar')).toBeVisible();await expect(page.locator('.product-card')).toHaveCount(46);const rows=await page.locator('.product-card').evaluateAll(cards=>cards.slice(0,2).map(c=>({x:c.getBoundingClientRect().x,y:c.getBoundingClientRect().y})));expect(rows[0].x).toBe(rows[1].x);expect(rows[1].y).toBeGreaterThan(rows[0].y);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();}
 await page.getByRole('button',{name:'Molekinha',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(29);await page.getByRole('textbox',{name:'Buscar produtos'}).fill('25006.101');await page.locator('.product-card').click();await expect(page.locator('.desktop-sidebar').getByRole('link',{name:'Produtos',exact:true})).toHaveClass('active');await expect(page.locator('.desktop-registration-summary')).toContainText('17 unidades');
 await page.locator('.product-review-actions').getByRole('button',{name:'Correto',exact:true}).click();await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].status).toBe('approved');await page.getByRole('link',{name:'Voltar ao catálogo'}).click();await page.getByRole('button',{name:'Revisados',exact:true}).click();await expect(page.locator('.product-card')).toHaveCount(1);await expect(page.locator('.product-card')).toContainText('25006.101');
});

test('Configurações e conferência sem email/senha, preferência e sessão reutilizada (API simulada)',async({page})=>{
 const backend=await mockSupabase(page);await page.goto('/#/configuracoes');await expect(page.getByRole('heading',{name:'Configurações',exact:true})).toBeVisible();await expect(page.getByText('Conferência disponível.',{exact:true})).toBeVisible();await expect(page.getByLabel('Senha',{exact:true})).toHaveCount(0);await expect(page.getByLabel('Email',{exact:true})).toHaveCount(0);
 await page.getByLabel('Nome na conferência',{exact:true}).fill('Jo Modas');await page.getByRole('button',{name:'Salvar preferência'}).click();await expect(page.getByText('Preferência salva.',{exact:true})).toBeVisible();await page.goto('/#/produto/25006.101');await page.locator('.product-review-actions').getByRole('button',{name:'Correto',exact:true}).click();await expect(page.getByLabel('Nome do revisor')).toHaveValue('Jo Modas');await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByText('Revisão salva',{exact:true})).toBeVisible();expect(backend.getRows()[0].reviewer_name).toBe('Jo Modas');await page.reload();await expect(page.locator('.desktop-product-status .badge')).toContainText('Correto');expect(backend.signupCount()).toBe(1);await page.goto('/#/review-login');await expect(page.getByRole('heading',{name:'Configurações',exact:true})).toBeVisible();await page.setViewportSize({width:320,height:760});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
});

test('Falha no acesso automático: mantém catálogo e permite tentar novamente (API simulada)',async({page})=>{
 await mockSupabase(page);await page.route('http://127.0.0.1:9999/auth/v1/signup',r=>r.fulfill({status:422,json:{message:'Anonymous sign-ins are disabled'}}));await page.goto('/');await expect(page.locator('.product-card')).toHaveCount(46);await expect(page.getByText('Conferência indisponível. Não foi possível iniciar o acesso automático ao Supabase.')).toBeVisible();await page.goto('/#/configuracoes');await page.unroute('http://127.0.0.1:9999/auth/v1/signup');await page.getByRole('button',{name:'Tentar novamente',exact:true}).click();await expect(page.getByText('Conferência disponível.',{exact:true})).toBeVisible();
});


test('Desktop: rodapé fixo e modal sem deslocar a página',async({page})=>{
 await mockSupabase(page);const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
 await page.goto('/#/produto/25006.101');await expect(page.locator('.product-review-actions')).toBeVisible();
 for(const width of [800,1440]){
  await page.setViewportSize({width,height:900});
  for(const scroll of [0,1000]){
   await page.evaluate(y=>window.scrollTo(0,y),scroll);
   const bounds=await page.locator('.product-review-actions').boundingBox();expect(bounds).not.toBeNull();expect(Math.round(bounds!.y+bounds!.height)).toBe(900);
   const before=await page.evaluate(()=>scrollY);
   await page.locator('.product-review-actions').getByRole('button',{name:'Precisa corrigir',exact:true}).click();
   await expect(page.getByRole('dialog',{name:'Conferência do produto'})).toBeVisible();await expect(page.getByLabel(/O que precisa corrigir/)).toBeVisible();
   expect(await page.evaluate(()=>scrollY)).toBe(before);
   await page.getByRole('button',{name:'Salvar conferência'}).click();await expect(page.getByRole('dialog')).toBeVisible();
   if(width===1440&&scroll===0)await page.screenshot({path:'../desktop-review-modal.png'});
   await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);expect(await page.evaluate(()=>scrollY)).toBe(before);
  }
 }
 await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:'../desktop-review-fixed.png'});expect(errors).toEqual([]);
});

test('Fotos por cor: galeria e estoque acompanham seleção, cor ausente não herda foto de outra',async({page})=>{
 await mockSupabase(page);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});await page.goto('/#/produto/2656.100');
  const p=catalogData.products.find((p:{reference:string})=>p.reference==='2656.100');const main=page.locator('.product-hero .gallery-main');
  await expect(main.locator('img')).toHaveAttribute('src',p.colors[0].imageUrls[0]);await expect(page.locator('.variant').getByText('25/36',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:/^Preta /}).click();await expect(main.locator('img')).toHaveAttribute('src',p.colors[1].imageUrls[0]);await expect(main.locator('img')).toHaveAttribute('alt',/Preta/);await expect(page.locator('.variant').getByText('25/36',{exact:true})).toHaveCount(0);
  await page.goto('/#/produto/25006.101');await expect(page.getByRole('button',{name:/^Dourado /})).toHaveAttribute('aria-pressed','true');await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('src',/82890_1/);await page.getByRole('button',{name:/^Prata /}).click();await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('src',/7510715511289/);
  await page.getByRole('button',{name:'Imagem 2',exact:true}).first().click();await page.getByRole('button',{name:/^Dourado /}).click();await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('src',/82890_1/);
  await page.getByRole('button',{name:/^Prata /}).click();await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('src',/\/0.jpeg$/);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBeTruthy();
 }
 await page.screenshot({path:'../produto-imagens-por-cor-mobile.png'});
 await page.setViewportSize({width:1440,height:1000});await page.goto('/#/produto/2656.100');await page.screenshot({path:'../produto-imagens-por-cor-desktop.png'});
});

test('Fotos incompatíveis: Bege não mostra Rosa, Capivara não mostra gatinho, Branco não mostra Preto',async({page})=>{
 await mockSupabase(page);
 for(const width of [1440,390]){
  await page.setViewportSize({width,height:900});
  for(const ref of ['2749.101','2118.582']){
   await page.goto('/');const card=page.locator('.product-card').filter({hasText:`Ref. ${ref}`});await expect(card.locator('.card-image img')).toHaveCount(0);await expect(card.locator('.image-fallback')).toBeVisible();await card.click();
   await expect(page.locator('.product-hero img')).toHaveCount(0);await expect(page.locator('.product-hero .image-fallback')).toBeVisible();await page.getByText('Imagens originais sem associação de cor',{exact:true}).click();await expect(page.getByRole('link',{name:/Conferir link original 1/})).toBeVisible();await expect(page.locator('details.panel img')).toHaveCount(0);
  }
  await page.goto('/#/produto/2609.233');await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('src',/33300/);await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('alt',/Azul Marinho/);
  await page.goto('/#/produto/2745.103');await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('src',/capivara-branco/);await expect(page.locator('.product-hero .gallery-main img')).toHaveAttribute('alt',/Branco Capivara/);
 }
 await page.goto('/#/produto/2749.101');await page.screenshot({path:'../cor-bege-foto-incompativel-bloqueada.png'});
 await page.locator('.product-review-actions').getByRole('button',{name:'Precisa corrigir',exact:true}).click();await page.getByLabel(/O que precisa corrigir/).fill('Foto Bege pendente.');await page.getByRole('button',{name:'Salvar conferência'}).click();await page.goto('/#/revisao');await expect(page.locator('.correction-row')).toContainText('2749.101');await expect(page.locator('.correction-row img')).toHaveCount(0);
});


