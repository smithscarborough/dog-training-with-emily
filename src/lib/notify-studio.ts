import { PLACEHOLDER_EMAIL } from "@/lib/catalog";

export type NotifyResult = "sent" | "confirm" | "failed";

/** Browser-side so FormSubmit isn’t blocked as a datacenter bot. */
export async function notifyStudioInbox(fields: {
  name: string;
  email: string;
  phone: string;
  dogName: string;
  message: string;
}): Promise<NotifyResult> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${PLACEHOLDER_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: fields.name,
        email: fields.email,
        _replyto: fields.email,
        phone: fields.phone || "(none)",
        dog: fields.dogName,
        message: fields.message,
        _subject: `Website note: ${fields.name} / ${fields.dogName}`,
        _template: "table",
        _captcha: "false",
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
    const text = `${json.success ?? ""} ${json.message ?? ""}`;
    if (/confirm|activation|check your email/i.test(text)) return "confirm";
    if (!res.ok) return "failed";
    return "sent";
  } catch {
    return "failed";
  }
}

/** A household note. The reply link posts Emily's answer into that client's portal. */
export async function notifyEmilyNote(fields: {
  ownerName: string;
  dogName: string;
  note: string;
  replyUrl: string;
}): Promise<NotifyResult> {
  try {
    const res = await fetch(`https://formsubmit.co/ajax/${PLACEHOLDER_EMAIL}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: fields.ownerName,
        dog: fields.dogName,
        message: `${fields.note}\n\nReply in their portal:\n${fields.replyUrl}`,
        _subject: `Note from ${fields.ownerName} about ${fields.dogName}`,
        _template: "table",
        _captcha: "false",
        reply: fields.replyUrl,
      }),
    });
    const json = (await res.json().catch(() => ({}))) as { success?: string | boolean; message?: string };
    const text = `${json.success ?? ""} ${json.message ?? ""}`;
    if (/confirm|activation|check your email/i.test(text)) return "confirm";
    if (!res.ok) return "failed";
    return "sent";
  } catch {
    return "failed";
  }
}
