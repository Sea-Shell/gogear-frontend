// Morning Topo category color palette
export const CATEGORY_COLORS: Record<string, string> = {
  'Tents & Shelters': '#7d9b76', // sage
  'Sleep Systems': '#8baec4',    // sky
  'Cookware': '#c4943e',         // amber
  'Hydration': '#5a8ba4',       // teal-ish
  'Navigation': '#b85c4a',       // ember-ish
  'Lighting': '#d4a86a',         // gold
  'Tools & Repair': '#8b7e6c',  // warm brown
  'Clothing': '#9b9b8a',         // olive
  'Footwear': '#6b6b5e',         // dark olive
  'Medical': '#b85c4a',          // ember
  'Hygiene': '#a4b4a4',         // muted sage
  'Electronics': '#7a8794',      // slate
  'Miscellaneous': '#adaba7',    // ink-faint
};

export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return '#adaba7';
  return CATEGORY_COLORS[category] ?? '#adaba7';
}
