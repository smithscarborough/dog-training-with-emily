import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import type { InquiryRow } from "@/lib/types";
import { requireTrainer } from "./helpers";
import { normalizeUsPhone } from "@/lib/phone";

export const createInquiry = createServerFn({ method: "POST" })
  .validator((data: { name: string; email: string; phone: string; dogName: string; message: string }) => data)
  .handler(async ({ data }) => {
    const name = data.name.trim();
    const email = data.email.trim();
    const dogName = data.dogName.trim();
    const message = data.message.trim();
    if (!name || !email || !dogName || !message) throw new Error("Name, dog’s name, email, and a message are required.");
    const sql = await getSql();
    await sql`
      insert into inquiries (name, email, phone, dog_name, message)
      values (${name}, ${email}, ${normalizeUsPhone(data.phone, false)}, ${dogName}, ${message})
    `;
    return { ok: true };
  });

export const listInquiries = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireTrainer(context.userId);
    const sql = await getSql();
    return sql<InquiryRow>`select * from inquiries order by created_at desc limit 50`;
  });
