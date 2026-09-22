import { getSql } from "@/lib/db";
import { CATALOG } from "@/lib/catalog";

export async function seedProgressForDog(dogId: number) {
  const sql = await getSql();
  for (const item of CATALOG) {
    await sql`
      insert into progress (dog_id, skill_key, rating, comment)
      values (${dogId}, ${item.key}, 0, '')
      on conflict (dog_id, skill_key) do nothing
    `;
  }
}
