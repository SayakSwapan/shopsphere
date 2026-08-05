export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function generateSlugSuggestions(
  nameOrSlug: string,
  existingSlugs: string[]
): string[] {
  const base = slugify(nameOrSlug);
  if (!base) return [];

  const set = new Set(existingSlugs);
  const suggestions: string[] = [];

  let counter = 0;
  while (suggestions.length < 5 && counter <= 20) {
    const candidate = counter === 0 ? base : `${base}-${counter}`;
    if (!set.has(candidate) && !suggestions.includes(candidate)) {
      suggestions.push(candidate);
    }
    counter++;
  }

  return suggestions;
}
