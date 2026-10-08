import type { Product } from '../types/product';

// Fotos gerais não comprovam uma cor. Manter todos os links em source/imageUrls
// para auditoria, mas exibir apenas associações de cor quando há cores cadastradas.
export function displayImageUrls(product: Product): string[] {
 return product.colors.some(color=>Boolean(color.name))
  ? [...new Set(product.colors.flatMap(color=>color.imageUrls))]
  : product.imageUrls;
}
