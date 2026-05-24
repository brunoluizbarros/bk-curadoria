import { db } from "@/db/client";
import { customers, addresses, orders } from "@/db/schema";
import { asc, desc, eq, ilike, or } from "drizzle-orm";

export async function getAllCustomers(search?: string) {
  const rows = await db
    .select()
    .from(customers)
    .where(
      search
        ? or(
            ilike(customers.name, `%${search}%`),
            ilike(customers.phone, `%${search}%`),
            ilike(customers.email, `%${search}%`)
          )
        : undefined
    )
    .orderBy(asc(customers.name));

  return rows;
}

export async function searchCustomers(q: string) {
  if (!q || q.length < 2) return [];
  return db
    .select({ id: customers.id, name: customers.name, phone: customers.phone })
    .from(customers)
    .where(or(ilike(customers.name, `%${q}%`), ilike(customers.phone, `%${q}%`)))
    .orderBy(asc(customers.name))
    .limit(10);
}

export async function getCustomerById(id: string) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(eq(customers.id, id));

  if (!customer) return null;

  const customerAddresses = await db
    .select()
    .from(addresses)
    .where(eq(addresses.customerId, id))
    .orderBy(desc(addresses.isDefault), asc(addresses.createdAt));

  const recentOrders = await db
    .select({ id: orders.id, soldAt: orders.soldAt, status: orders.status, createdAt: orders.createdAt })
    .from(orders)
    .where(eq(orders.customerId, id))
    .orderBy(desc(orders.soldAt))
    .limit(10);

  return { ...customer, addresses: customerAddresses, recentOrders };
}
