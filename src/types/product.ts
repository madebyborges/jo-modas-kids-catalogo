export type SourceRow = Record<string, string | number | boolean | null>;
export interface DataWarning { type: string; message: string; severity: 'info' | 'warning' | 'error'; sku?: string }
export interface ProductVariant { sku: string; parentSku: string; size: string; color?: string; stock: number; price?: number; observations: string; imageUrls: string[]; source: SourceRow; sourceRow: number }
export interface ProductColor { name: string; stock: number; variants: ProductVariant[]; imageUrls: string[] }
export interface Product {
 parentSku: string; reference: string; name: string; brand: string; category: string; suggestedCategory: string;
 price?: number; priceMax?: number; totalStock: number; description: string; complementaryDescription: string;
 ncm: string; origin: string; gtin: string; unit: string; status: string; productType: string; supplierCode: string;
 seoTitle: string; seoDescription: string; seoKeywords: string; slug: string; imageUrls: string[];
 colors: ProductColor[]; observations: string[]; dataWarnings: DataWarning[]; source: SourceRow; marketplace: SourceRow; sourceRow: number;
}
export interface Catalog { products: Product[]; generatedAt: string; sourceFile: string; sourceHash: string; fields: string[]; summary: { parents: number; variants: number; stock: number; withWarnings: number; withoutImage: number; withoutGtin: number; withoutOrigin: number }; warnings: DataWarning[] }
export interface Company { fiscal: SourceRow[]; notes: { title: string; text: string }[] }
