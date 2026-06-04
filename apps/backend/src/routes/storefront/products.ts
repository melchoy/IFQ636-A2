import type { ProductDetailResponse, ProductListResponse } from "@otbt/types";
import type { FastifyInstance } from "fastify";

import { HttpError } from "../../middleware/error-handler.js";
import { getProduct, listProducts } from "../../modules/products/product.service.js";

type ProductParams = {
  productId: string;
};

export async function storefrontProductsRoutes(app: FastifyInstance) {
  app.get("/", async () => {
    const products = await listProducts({
      status: "active",
      visibility: "public",
    });

    const response: ProductListResponse = {
      products: products.map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
      })),
    };

    return response;
  });

  app.get<{ Params: ProductParams }>("/:productId", async (request) => {
    const product = await getProduct(request.params.productId, {
      status: "active",
      visibility: "public",
    });

    if (!product) {
      throw new HttpError(404, "Product not found");
    }

    const response: ProductDetailResponse = {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        description: product.description,
        imageUrl: product.imageUrl,
        price: product.price,
        stock: product.stock,
        status: product.status,
        visibility: product.visibility,
      },
    };

    return response;
  });
}
