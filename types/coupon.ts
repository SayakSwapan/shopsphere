export interface Coupon {
  id: string;

  code: string;

  title: string;

  description: string | null;

  discountType: "FLAT" | "PERCENTAGE";

  discountValue: number;

  minimumOrder: number | null;

  maxDiscount: number | null;

  firstOrderOnly: boolean;

  freeShipping: boolean;

  endDate: string;
}
