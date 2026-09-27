import { useEffect, useState } from "react";
import type { DogRow } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

function canShowPhoto(url: string) {
  return (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("/") ||
    /^data:image\/(jpeg|jpg|png|webp|gif);/i.test(url)
  );
}

export function DogAvatar({
  dog,
  size = "md",
}: {
  dog: Pick<DogRow, "name" | "photo_url">;
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-9 text-xs" : size === "lg" ? "size-20 text-xl" : "size-12 text-sm";
  const [broken, setBroken] = useState(false);
  useEffect(() => setBroken(false), [dog.photo_url]);
  if (dog.photo_url && !broken && canShowPhoto(dog.photo_url)) {
    return (
      <img
        src={dog.photo_url}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", dim)}
        onError={() => setBroken(true)}
      />
    );
  }
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-accent/60 font-display text-ink",
        dim,
      )}
    >
      {initials(dog.name)}
    </span>
  );
}
