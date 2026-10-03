import { createServerFn } from "@tanstack/react-start";
import { loadStudio } from "./helpers";

export const getPublicStudio = createServerFn({ method: "GET" }).handler(async () => {
  const studio = await loadStudio();
  return {
    name: studio.name,
    email: studio.email,
    phone: studio.phone,
    instagram: studio.instagram,
    facebook: studio.facebook,
    x_url: studio.x_url,
    banner_text: studio.banner_text ?? "",
    hours_json: studio.hours_json ?? "",
    holiday_mode: studio.holiday_mode === "off" ? "off" : "auto",
    holiday_skip: studio.holiday_skip ?? "",
    claimed: Boolean(studio.owner_user_id),
  };
});
