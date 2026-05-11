import { db } from "@/db/client";
import { services, serviceSteps } from "@/db/schema";
import { asc, eq } from "drizzle-orm";

export async function getActiveServices() {
  return db
    .select()
    .from(services)
    .where(eq(services.active, true))
    .orderBy(asc(services.sortOrder));
}

export async function getServiceBySlug(slug: string) {
  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.slug, slug));

  if (!service) return null;

  const steps = await db
    .select()
    .from(serviceSteps)
    .where(eq(serviceSteps.serviceSlug, slug))
    .orderBy(asc(serviceSteps.sortOrder));

  return { ...service, steps };
}
