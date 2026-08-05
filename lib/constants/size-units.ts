export const SIZE_UNITS = [
  "Inch",
  "CM",
  "MM",
  "EU",
  "UK",
  "US",
  "Letter",
  "Number",
  "None",
];

export const SIZE_CATEGORY_LABELS: Record<string, string> = {
  CLOTHING: "Clothing (S/M/L/XL)",
  SHOES: "Shoes (EU/UK/US)",
  FREESIZE: "Free Size (One Size Fits All)",
  SALWAAR: "Salwaar/Kurta (S/M/L/XL)",
  LINGERIE: "Lingerie (32-42 or S/M/L)",
  BALL: "Sports Ball (Size 3/4/5)",
  BAT: "Cricket Bat (Size 0-6)",
  ACCESSORIES: "Accessories (One Size)",
};

export const SIZE_CATEGORY_SUGGESTIONS = Object.keys(SIZE_CATEGORY_LABELS);

export const SIZE_CATEGORY_COMMON_SIZES: Record<string, string[]> = {
  CLOTHING: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  SHOES: ["6", "7", "8", "9", "10", "11", "12", "13"],
  FREESIZE: ["Free Size"],
  SALWAAR: ["S", "M", "L", "XL", "XXL"],
  LINGERIE: ["32", "34", "36", "38", "40", "42", "S", "M", "L", "XL"],
  BALL: ["Size 3", "Size 4", "Size 5"],
  BAT: ["Size 0", "Size 1", "Size 2", "Size 3", "Size 4", "Size 5", "Size 6"],
  ACCESSORIES: ["One Size"],
};
