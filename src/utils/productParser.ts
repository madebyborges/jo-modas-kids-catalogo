export function parseNumber(value: unknown): number | undefined {
 if (value === null || value === undefined || value === '') return undefined;
 if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
 let text = String(value).trim().replace(/^R\$\s*/, '').replace(/\s/g, '');
 if (text.includes(',')) text = text.replace(/\./g, '').replace(',', '.');
 if (!/^-?\d+(\.\d+)?$/.test(text)) return undefined;
 const result = Number(text); return Number.isFinite(result) ? result : undefined;
}
export function parseVariation(text: string) {
 const values: Record<string, string> = {}; let malformed = false;
 for (const segment of text.split('||')) {
  const i = segment.indexOf(':');
  if (i < 1) { malformed = true; continue; }
  const key = segment.slice(0, i).trim(); const value = segment.slice(i + 1);
  if (!['Cor', 'Tamanho'].includes(key) || key in values || !value.trim()) malformed = true;
  values[key] = value;
 }
 return { color: values.Cor, size: values.Tamanho || '', malformed: malformed || !values.Tamanho };
}
export function safeImageUrl(url: string) { try { return ['https:', 'http:'].includes(new URL(url).protocol); } catch { return false; } }
