# Modifications made

## Postgres setup

`.env` file

```bash
DATABASE_URI=postgres://127.0.0.1/payload-example-multi-tenant
PAYLOAD_SECRET=PAYLOAD_MULTI_TENANT_EXAMPLE_SECRET_KEY
PAYLOAD_PUBLIC_SERVER_URL=http://localhost:3000
```

`payload.config.ts`

```ts
import { postgresAdapter } from "@payloadcms/db-postgres";

// eslint-disable-next-line no-restricted-exports
export default buildConfig({
  admin: {
    user: "users",
  },
  collections: [Pages, Users, Tenants],
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  })
  ...
})
```

## Fixing missing args

`collections/Users.ts`

```ts
const defaultTenantArrayField = tenantsArrayField({
  arrayFieldAccess: {},
  tenantFieldAccess: {},
  
  // added following 3 lines
  tenantsArrayFieldName: "tenants",
  tenantsArrayTenantFieldName: "tenant",
  tenantsCollectionSlug: "tenants",

  rowFields: [
    {
      name: "roles",
      type: "select",
      defaultValue: ["tenant-viewer"],
      hasMany: true,
      options: ["tenant-admin", "tenant-viewer"],
      required: true,
    },
  ],
});
```

## Fixing initial run

When running `pnpm run dev` initially, following error pops up:

```bash
ERROR: Error running migration seed. Rolling back relation "tenants" does not exist.
    err: {
      "type": "DatabaseError",
      "message": "relation \"tenants\" does not exist",
      "stack":
          error: relation "tenants" does not exist
```

This is because the seed is being run before the tables are created. To fix this, we need to create an initial migration which will create the tables first.

`pnpm run payload migration:create`

## INITIALY RUNNING APP SHOULD WORK

At this point, you should be able to run `pnpm run dev` and log in to the admin panel.

## Fixing users collection

Both of following fixes will fix `[ Server ] Error: invalid input syntax for type integer: "NaN"` and show your users.

### read access

When using postgres, you can't pass a string to `equals`, if it expects a number. In `collections/Users/access/read.ts`, the `selectedTenant` read from the cookies is a string.

I updated it by converting the string to a number.

`collections/Users/access/read.ts`

```ts
export const readAccess: Access<User> = ({ req, id }) => {
    ...
  const selectedTenant = cookies.get("payload-tenant");
  const adminTenantAccessIDs = getUserTenantIDs(req.user, "tenant-admin");
  const selectedTenantId = Number(selectedTenant) ?? undefined; // Use this variable!

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
  ...
}
```

## unique username hook

The tenants is an array of tenant objects when using postgres. In ensureUniqueUsername, it is treated as a single tenant.

This results in following error: `[ Server ] Error: invalid input syntax for type integer: "NaN"`

`collections/Users/hooks/ensureUniqueUsername.ts`

While testing it, I found a bug. The current implementation is a FieldHook on the username field. When a tenant is added to an existing user, the hook is not triggered and the username could be duplicated.

I updated it by using a CollectionHook instead of a FieldHook and handled the multiple tenant ids in `collections/Users/hooks/ensureUniqueUsername.ts`
