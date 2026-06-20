import { db } from "@/db/client";
import { customers, addresses, orders } from "@/db/schema";
import { asc, count, desc, eq, ilike, or } from "drizzle-orm";

export async function getAllCustomers(
  search?: string,
  pagination?: { page: number; limit: number }
) {
  const where = search
    ? or(
        ilike(customers.name, `%${search}%`),
        ilike(customers.phone, `%${search}%`),
        ilike(customers.email, `%${search}%`)
      )
    : undefined;

  const limit = pagination?.limit ?? 1000;
  const offset = pagination ? (pagination.page - 1) * pagination.limit : 0;

  const [[countRow], rows] = await Promise.all([
    db.select({ total: count() }).from(customers).where(where),
    db
      .select()
      .from(customers)
      .where(where)
      .orderBy(asc(customers.name))
      .limit(limit)
      .offset(offset),
  ]);

  return { items: rows, total: countRow.total };
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
