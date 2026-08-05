export interface VariantForm {
   id: string;
  genderId: string;
  genderName: string;
  sizeId: string;
  sizeName: string;
  sku: string;
  stock: number;
}

export interface ProductFormValues {
  name: string;
  slug: string;

  description: string;

  sellingPrice: number;
  costPrice: number;

  maximumDiscount: number;

  gstPercentage: number;

  taxIncluded: boolean;

  weight: number;

  stock: number;

  lowStockAlert: number;

  categoryId: string;

  status: boolean;

  isFeatured: boolean;

  isTrending: boolean;

  isReturnable: boolean;

  isReplaceable: boolean;

  returnDays: number;

  replaceDays: number;

  metaTitle: string;

  metaDescription: string;

  metaKeywords: string;

  mainImage: string;

  images: string[];

  variants: VariantForm[];

  discountType: string;
  discountValue: number;
  salePrice: number;
  finalPrice: number;
  offerStart: string;
  offerEnd: string;

  sizeChartId: string;

  // Custom printing (name / number / design image) allowed for this product.
  customPrintEnabled: boolean;
  customPrintName: boolean;
  customPrintNumber: boolean;
  customPrintImage: boolean;
  // Print styles the customer can pick from for this product.
  // Empty / undefined means "any active print type".
  customPrintTypeIds: string[];
}