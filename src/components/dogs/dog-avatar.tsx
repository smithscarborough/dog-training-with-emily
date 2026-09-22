import type { DogRow } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

export function DogAvatar({
  dog,
  size = "md",
}: {
  dog: Pick<DogRow, "name" | "photo_url">;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-9 text-xs" : size === "lg" ? "size-20 text-xl" : "size-12 text-sm";
  if (dog.photo_url) {
    return (
      <img
        src={dog.photo_url}
        alt=""
        className={cn("rounded-full object-cover", dim)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid place-items-center rounded-full bg-accent/60 font-display text-ink",
        dim,
      )}
    >
      {initials(dog.name)}
    </span>
  );
}
