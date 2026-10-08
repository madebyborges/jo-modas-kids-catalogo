import type { Product } from '../types/product';
// Apenas evita repetir a referência na apresentação; o nome integral permanece
// no JSON, na descrição e nos campos originais consultáveis.
export function displayName(p:Product) { const suffix=` Ref. ${p.reference}`;return p.name.endsWith(suffix)?p.name.slice(0,-suffix.length):p.name; }
