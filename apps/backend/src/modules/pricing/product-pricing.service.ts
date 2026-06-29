import type { Product } from "@otbt/types";

import {
  BaseProductPrice,
  MembershipDiscountPriceDecorator,
  type ProductPriceContext,
} from "./product-price.js";

export type PriceableProduct = Pick<
  Product,
  "membershipDiscountEnabled" | "price"
>;

export interface ProductPricingOptions {
  membershipDiscountRate: number;
}

export class ProductPricingService {
  constructor(private readonly options: ProductPricingOptions) {}

  createProductPrice(product: PriceableProduct) {
    const basePrice = new BaseProductPrice(product.price);

    if (!product.membershipDiscountEnabled) {
      return basePrice;
    }

    return new MembershipDiscountPriceDecorator(
      basePrice,
      this.options.membershipDiscountRate,
    );
  }

  calculateProductPrice(
    product: PriceableProduct,
    context: ProductPriceContext = {},
  ) {
    return this.createProductPrice(product).calculate(context);
  }
}
