import type {
  AdminProductCreateRequest,
  AdminProductCreateResponse,
  AdminProductDetailResponse,
  AdminProductListResponse,
  AdminProductUpdateRequest,
  AdminProductUpdateResponse,
} from "@otbt/types";
import type { FastifyInstance } from "fastify";
import { Error as MongooseError } from "mongoose";

import { HttpError } from "../../middleware/error-handler.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import {
  deleteProductImage,
  storeProductImage,
} from "../../modules/product-images/product-image.service.js";
import {
  clearProductImage,
  createProduct,
  getProduct,
  listProducts,
  updateProduct,
} from "../../modules/products/product.service.js";

type ProductParams = {
  productId: string;
};

function handleProductRouteError(error: unknown): never {
  if (error instanceof MongooseError.ValidationError) {
    throw new HttpError(400, error.message);
  }

  throw error;
}

export async function adminProductsRoutes(app: FastifyInstance) {
  app.post<{ Params: ProductParams }>(
    "/:productId/images",
    { preHandler: requireAdmin },
    async (request, reply) => {
      const product = await getProduct(request.params.productId);

      if (!product) {
        throw new HttpError(404, "Product not found");
      }

      const file = await request.file();

      if (!file) {
        throw new HttpError(400, "Image file is required");
      }

      if (!file.mimetype.startsWith("image/")) {
        throw new HttpError(400, "Only image uploads are allowed");
      }

      const storedImage = await storeProductImage({
        buffer: await file.toBuffer(),
        originalName: file.filename,
      });

      reply.status(201);
      return { imageUrl: storedImage.imageUrl };
    },
  );

  app.delete<{ Params: ProductParams }>(
    "/:productId/image",
    { preHandler: requireAdmin },
    async (request) => {
      try {
        const product = await getProduct(request.params.productId);

        if (!product) {
          throw new HttpError(404, "Product not found");
        }

        if (product.imageUrl) {
          await deleteProductImage(product.imageUrl);
        }

        const updatedProduct = await clearProductImage(request.params.productId);

        if (!updatedProduct) {
          throw new HttpError(404, "Product not found");
        }

        const response: AdminProductUpdateResponse = { product: updatedProduct };
        return response;
      } catch (error) {
        handleProductRouteError(error);
      }
    },
  );

  app.get("/", { preHandler: requireAdmin }, async () => {
    const products = await listProducts();
    const response: AdminProductListResponse = { products };

    return response;
  });

  app.post<{ Body: AdminProductCreateRequest }>(
    "/",
    { preHandler: requireAdmin },
    async (request, reply) => {
      try {
        const product = await createProduct(request.body);
        const response: AdminProductCreateResponse = { product };

        reply.status(201);
        return response;
      } catch (error) {
        handleProductRouteError(error);
      }
    },
  );

  app.get<{ Params: ProductParams }>(
    "/:productId",
    { preHandler: requireAdmin },
    async (request) => {
      const product = await getProduct(request.params.productId);

      if (!product) {
        throw new HttpError(404, "Product not found");
      }

      const response: AdminProductDetailResponse = { product };
      return response;
    },
  );

  app.patch<{ Body: AdminProductUpdateRequest; Params: ProductParams }>(
    "/:productId",
    { preHandler: requireAdmin },
    async (request) => {
      try {
        const product = await updateProduct(request.params.productId, request.body);

        if (!product) {
          throw new HttpError(404, "Product not found");
        }

        const response: AdminProductUpdateResponse = { product };
        return response;
      } catch (error) {
        handleProductRouteError(error);
      }
    },
  );
}
