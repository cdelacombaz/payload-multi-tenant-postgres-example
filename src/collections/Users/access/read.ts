import type { User } from "@/payload-types";
import type { Access, Where } from "payload";

import { parseCookies } from "payload";

import { isSuperAdmin } from "../../../access/isSuperAdmin";
import { getUserTenantIDs } from "../../../utilities/getUserTenantIDs";
import { isAccessingSelf } from "./isAccessingSelf";

export const readAccess: Access<User> = ({ req, id }) => {
  if (!req?.user) {
    return false;
  }

  if (isAccessingSelf({ id, user: req.user })) {
    return true;
  }

  const cookies = parseCookies(req.headers);
  const superAdmin = isSuperAdmin(req.user);
  const selectedTenant = cookies.get("payload-tenant");
  const adminTenantAccessIDs = getUserTenantIDs(req.user, "tenant-admin");
  const selectedTenantId = Number(selectedTenant) ?? undefined;

  if (selectedTenantId) {
    // If it's a super admin, or they have access to the tenant ID set in cookie
    const hasTenantAccess = adminTenantAccessIDs.some(
      (id) => id === selectedTenantId
    );
    if (superAdmin || hasTenantAccess) {
      return {
        "tenants.tenant": {
          equals: selectedTenantId,
        },
      };
    }
  }

  if (superAdmin) {
    return true;
  }

  return {
    or: [
      {
        id: {
          equals: req.user.id,
        },
      },
      {
        "tenants.tenant": {
          in: adminTenantAccessIDs,
        },
      },
    ],
  } as Where;
};
