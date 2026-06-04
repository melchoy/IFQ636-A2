import { AdminUser } from "../../apps/backend/src/modules/admin-users/admin-user.model.js";
import { CustomerModel } from "../../apps/backend/src/modules/customers/customer.model.js";
import { ProductModel } from "../../apps/backend/src/modules/products/product.model.js";

import { installProductUploadAsset } from "./seed-assets.js";
import type { SeedDefinition, SeedTarget } from "./seed-types.js";

export const seedTargets: SeedTarget[] = ["admin", "customers", "products"];

export const seedDefinitions: Record<SeedTarget, SeedDefinition> = {
  admin: {
    target: "admin",
    file: "admin.seed.json",
    model: AdminUser,
    uniqueBy: "email",
    fields: {
      email: { type: "string", required: true, transform: "lowercase" },
      password: {
        type: "string",
        required: true,
        transform: "hashAdminPassword",
      },
    },
    mapToDocument(record) {
      return {
        email: record.email,
        passwordHash: record.password,
      };
    },
  },
  customers: {
    target: "customers",
    file: "customers.seed.json",
    model: CustomerModel,
    uniqueBy: "email",
    fields: {
      firstName: { type: "string", required: true },
      lastName: { type: "string", required: true },
      email: { type: "string", required: true, transform: "lowercase" },
      password: {
        type: "string",
        required: true,
        transform: "hashCustomerPassword",
      },
      status: { type: "string", default: "active" },
      accessLevel: { type: "string", default: "standard" },
    },
    mapToDocument(record) {
      return {
        firstName: record.firstName,
        lastName: record.lastName,
        email: record.email,
        passwordHash: record.password,
        status: record.status,
        accessLevel: record.accessLevel,
      };
    },
  },
  products: {
    target: "products",
    file: "products.seed.json",
    model: ProductModel,
    uniqueBy: "sku",
    fields: {
      name: { type: "string", required: true },
      slug: { type: "string" },
      sku: { type: "string", required: true, transform: "uppercase" },
      description: { type: "string", required: true },
      imageUrl: { type: "string" },
      price: { type: "number", required: true },
      stock: { type: "number", required: true },
      status: { type: "string", default: "active", transform: "productStatus" },
      visibility: {
        type: "string",
        default: "public",
        transform: "productVisibility",
      },
    },
    mapToDocument(record) {
      const document: Record<string, unknown> = {
        name: record.name,
        sku: record.sku,
        description: record.description,
        price: record.price,
        stock: record.stock,
        status: record.status,
        visibility: record.visibility,
      };

      if (typeof record.imageUrl === "string") {
        document.imageUrl = record.imageUrl;
      }

      return document;
    },
    afterUpsert: installProductUploadAsset,
  },
};
