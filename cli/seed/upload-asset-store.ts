import { readFile } from "node:fs/promises";
import path from "node:path";

import { storeProductImage } from "../../apps/backend/src/modules/product-images/product-image.service.js";

export type InstalledUploadAsset = {
  imageUrl: string;
};

export class UploadAssetStore {
  async installProductImage(assetPath: string): Promise<InstalledUploadAsset> {
    const buffer = await readFile(assetPath);
    const stored = await storeProductImage({
      buffer,
      originalName: path.basename(assetPath),
    });

    return {
      imageUrl: stored.imageUrl,
    };
  }
}
