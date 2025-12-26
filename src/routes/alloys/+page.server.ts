import { db } from "$lib/server/db";
import { AlloyDB } from "$lib/server/db/schema";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const alloys = await db.select().from(AlloyDB);

  return { alloys: alloys };
};
