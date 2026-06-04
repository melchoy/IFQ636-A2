import path from "node:path";

import { ProductModel } from "../../apps/backend/src/modules/products/product.model.js";

import { ProductImageResolver } from "./product-image-resolver.js";
import type { SeedContext, SeedRecord } from "./seed-types.js";
import { UploadAssetStore } from "./upload-asset-store.js";

const productImageResolver = new ProductImageResolver();
const uploadAssetStore = new UploadAssetStore();

export async function installProductUploadAsset(
  input: SeedRecord,
  _document: SeedRecord,
  persisted: SeedRecord,
  context: SeedContext,
) {
  const sku = typeof persisted.sku === "string" ? persisted.sku : null;
  const slug = typeof input.slug === "string" ? input.slug : undefined;

  if (!sku || typeof persisted.imageUrl === "string") {
    return;
  }

  const productsAssetDir = path.join(context.assetsDir, "products");
  const assetPath = await productImageResolver.resolve({
    productsAssetDir,
    sku,
    slug,
  });

  if (!assetPath) {
    return;
  }

  const uploaded = await uploadAssetStore.installProductImage(assetPath);

  await ProductModel.findOneAndUpdate(
    { sku },
    { imageUrl: uploaded.imageUrl },
    { new: true },
  );
}
