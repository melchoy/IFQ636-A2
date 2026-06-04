import { hashAdminPassword } from "../../apps/backend/src/modules/admin-users/admin-user.passwords.js";
import { hashCustomerPassword } from "../../apps/backend/src/modules/customers/customer.passwords.js";

import type { FieldTransformName } from "./seed-types.js";

export async function applyFieldTransform(
  transform: FieldTransformName,
  value: unknown,
) {
  if (transform === "lowercase") {
    return typeof value === "string" ? value.toLowerCase() : value;
  }

  if (transform === "uppercase") {
    return typeof value === "string" ? value.toUpperCase() : value;
  }

  if (transform === "productStatus") {
    if (value === "available" || value === "limited") {
      return "active";
    }
    return value;
  }

  if (transform === "productVisibility") {
    if (value === "restricted") {
      return "members_only";
    }
    return value;
  }

  if (transform === "hashAdminPassword") {
    if (typeof value !== "string") {
      throw new Error("Admin password must be a string before hashing");
    }
    return hashAdminPassword(value);
  }

  if (transform === "hashCustomerPassword") {
    if (typeof value !== "string") {
      throw new Error("Customer password must be a string before hashing");
    }
    return hashCustomerPassword(value);
  }

  throw new Error(`Unknown seed transform: ${transform}`);
}
