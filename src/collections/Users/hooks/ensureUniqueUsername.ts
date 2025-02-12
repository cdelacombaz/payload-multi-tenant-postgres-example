import type { CollectionBeforeValidateHook } from "payload";
import { ValidationError } from "payload";
import { User } from "@/payload-types";

export const ensureUniqueUsername: CollectionBeforeValidateHook<User> = async ({
  data,
  originalDoc,
  req,
}) => {
  const username = data?.username;

  // Skip validation if username is not being set/changed and tenants aren't being modified
  if (
    (!username && !data?.tenants) ||
    (originalDoc?.username === username && !data?.tenants)
  ) {
    return data;
  }

  // Get incoming tenant IDs from the data
  const incomingTenantIDs =
    data?.tenants?.map((t) =>
      typeof t.tenant === "object" ? t.tenant.id : t.tenant
    ) || [];

  // Get current tenant IDs from the original doc
  const currentTenantIDs =
    originalDoc?.tenants?.map((t) =>
      typeof t.tenant === "object" ? t.tenant.id : t.tenant
    ) || [];

  // Combine all tenant IDs we need to check against
  const tenantsToCheck = [
    ...new Set([...incomingTenantIDs, ...currentTenantIDs]),
  ];

  if (tenantsToCheck.length > 0) {
    const findDuplicateUsers = await req.payload.find({
      collection: "users",
      where: {
        and: [
          {
            "tenants.tenant": {
              in: tenantsToCheck,
            },
          },
          {
            username: {
              equals: username,
            },
          },
          // Exclude the current user if this is an update
          originalDoc?.id
            ? {
                id: {
                  not_equals: originalDoc.id,
                },
              }
            : {},
        ],
      },
    });

    if (findDuplicateUsers.docs.length > 0) {
      throw new ValidationError({
        errors: [
          {
            message: `The username "${username}" is already in use by another user.`,
            path: "username",
          },
        ],
      });
    }
  }

  return data;
};
