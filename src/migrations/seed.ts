import type { MigrateUpArgs } from "@payloadcms/db-postgres";

export async function up({ payload }: MigrateUpArgs): Promise<void> {
  console.log("huraa");
  const tenant1 = await payload.create({
    collection: "tenants",
    data: {
      name: "Tenant 1",
      slug: "gold",
      domain: "gold.test",
    },
  });
  console.log("tenant1", tenant1);
  const tenant2 = await payload.create({
    collection: "tenants",
    data: {
      name: "Tenant 2",
      slug: "silver",
      domain: "silver.test",
    },
  });
  console.log("tenant2", tenant2);
  const tenant3 = await payload.create({
    collection: "tenants",
    data: {
      name: "Tenant 3",
      slug: "bronze",
      domain: "bronze.test",
    },
  });
  console.log("tenant3", tenant3);
  await payload.create({
    collection: "users",
    data: {
      email: "demo@payloadcms.com",
      password: "demo",
      roles: ["super-admin"],
    },
  });
  await payload.create({
    collection: "users",
    data: {
      email: "tenant1@payloadcms.com",
      password: "demo",
      tenants: [
        {
          roles: ["tenant-admin"],
          tenant: tenant1.id,
        },
      ],
      username: "tenant1",
    },
  });
  await payload.create({
    collection: "users",
    data: {
      email: "tenant2@payloadcms.com",
      password: "demo",
      tenants: [
        {
          roles: ["tenant-admin"],
          tenant: tenant2.id,
        },
      ],
      username: "tenant2",
    },
  });
  await payload.create({
    collection: "users",
    data: {
      email: "tenant3@payloadcms.com",
      password: "demo",
      tenants: [
        {
          roles: ["tenant-admin"],
          tenant: tenant3.id,
        },
      ],
      username: "tenant3",
    },
  });
  await payload.create({
    collection: "users",
    data: {
      email: "multi-admin@payloadcms.com",
      password: "demo",
      tenants: [
        {
          roles: ["tenant-admin"],
          tenant: tenant1.id,
        },
        {
          roles: ["tenant-admin"],
          tenant: tenant2.id,
        },
        {
          roles: ["tenant-admin"],
          tenant: tenant3.id,
        },
      ],
      username: "multi-admin",
    },
  });
  await payload.create({
    collection: "pages",
    data: {
      slug: "home",
      tenant: tenant1.id,
      title: "Page for Tenant 1",
    },
  });
  await payload.create({
    collection: "pages",
    data: {
      slug: "home",
      tenant: tenant2.id,
      title: "Page for Tenant 2",
    },
  });
  await payload.create({
    collection: "pages",
    data: {
      slug: "home",
      tenant: tenant3.id,
      title: "Page for Tenant 3",
    },
  });
}
