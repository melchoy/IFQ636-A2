import { access } from "node:fs/promises";
import path from "node:path";

const imageExtensions = [".webp", ".png", ".jpg", ".jpeg", ".avif"] as const;

export type ProductImageResolutionInput = {
  productsAssetDir: string;
  sku: string;
  slug?: string;
};

export type ProductImageResolutionStrategy = {
  name: string;
  resolve(input: ProductImageResolutionInput): Promise<string | null>;
};

async function exists(filePath: string) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function resolveNamedAsset(productsAssetDir: string, name: string) {
  for (const extension of imageExtensions) {
    const candidate = path.join(productsAssetDir, `${name}${extension}`);
    if (await exists(candidate)) {
      return candidate;
    }
  }

  return null;
}

export class SlugImageStrategy implements ProductImageResolutionStrategy {
  name = "slug";

  async resolve(input: ProductImageResolutionInput) {
    return input.slug
      ? resolveNamedAsset(input.productsAssetDir, input.slug)
      : null;
  }
}

export class SkuImageStrategy implements ProductImageResolutionStrategy {
  name = "sku";

  async resolve(input: ProductImageResolutionInput) {
    return resolveNamedAsset(input.productsAssetDir, input.sku);
  }
}

export class DefaultProductImageStrategy implements ProductImageResolutionStrategy {
  name = "default-product";

  async resolve(input: ProductImageResolutionInput) {
    return resolveNamedAsset(input.productsAssetDir, "default-product");
  }
}
