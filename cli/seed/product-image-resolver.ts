import {
  DefaultProductImageStrategy,
  SkuImageStrategy,
  SlugImageStrategy,
  type ProductImageResolutionInput,
  type ProductImageResolutionStrategy,
} from "./image-resolution-strategy.js";

export class ProductImageResolver {
  constructor(
    private readonly strategies: ProductImageResolutionStrategy[] = [
      new SlugImageStrategy(),
      new SkuImageStrategy(),
      new DefaultProductImageStrategy(),
    ],
  ) {}

  async resolve(input: ProductImageResolutionInput) {
    for (const strategy of this.strategies) {
      const result = await strategy.resolve(input);
      if (result) {
        return result;
      }
    }

    return null;
  }
}
