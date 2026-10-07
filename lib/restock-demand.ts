export interface RestockDemandLine {
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  sizeId?: string | null;
  sizeName?: string | null;
  quantity: number;
}

export interface RestockNotificationMessageOptions {
  productName: string;
  variantName?: string | null;
  sizeName?: string | null;
  productUrl: string;
}

export function buildRestockNotificationMessage({
  productName,
  variantName,
  sizeName,
  productUrl,
}: RestockNotificationMessageOptions): string {
  const productLine = `Product: ${productName}`;
  const variantLine = variantName
    ? `Version: ${variantName}`
    : "Version: Standard";
  const sizeLine = sizeName ? `Size: ${sizeName}` : "Size: Any size";

  return [
    "🔥 Back in Stock!",
    "",
    "The item you were waiting for is now available.",
    "",
    productLine,
    variantLine,
    sizeLine,
    "",
    "Stock is limited.",
    "",
    `**Shop Now**: ${productUrl}`,
  ].join("\n");
}

export function summarizeRestockDemand(lines: RestockDemandLine[]) {
  const totalRequests = lines.reduce(
    (sum, line) => sum + Math.max(1, line.quantity || 1),
    0,
  );

  const byVariantMap = new Map<
    string,
    { variantName: string; totalRequests: number; sizeMap: Map<string, number> }
  >();

  for (const line of lines) {
    const variantName = line.variantName || "Default Version";
    const sizeName = line.sizeName || "Any size";
    const quantity = Math.max(1, Number(line.quantity) || 1);

    if (!byVariantMap.has(variantName)) {
      byVariantMap.set(variantName, {
        variantName,
        totalRequests: 0,
        sizeMap: new Map<string, number>(),
      });
    }

    const variantEntry = byVariantMap.get(variantName)!;
    variantEntry.totalRequests += quantity;

    const nextSizeValue = (variantEntry.sizeMap.get(sizeName) ?? 0) + quantity;
    variantEntry.sizeMap.set(sizeName, nextSizeValue);
  }

  const byVariant = Array.from(byVariantMap.values())
    .map((entry) => ({
      variantName: entry.variantName,
      totalRequests: entry.totalRequests,
      sizes: Array.from(entry.sizeMap.entries())
        .map(([sizeName, totalRequests]) => ({ sizeName, totalRequests }))
        .sort((a, b) => a.sizeName.localeCompare(b.sizeName)),
    }))
    .sort(
      (a, b) =>
        b.totalRequests - a.totalRequests ||
        a.variantName.localeCompare(b.variantName),
    );

  return {
    totalRequests,
    byVariant,
  };
}
