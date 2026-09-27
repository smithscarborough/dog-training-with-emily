import { cn } from "@/lib/utils";

export function Wordmark({
  className,
  invert = false,
  signedIn = false,
  gleam = false,
}: {
  className?: string;
  compact?: boolean;
  invert?: boolean;
  signedIn?: boolean;
  gleam?: boolean;
}) {
  const img = (
    <img
      src={invert ? "/images/logo-on-dark.jpg?v=12" : "/images/logo.png?v=12"}
      alt="Dog Training with Emily — Houston, Texas"
      className={cn(
        invert
          ? "frame-none h-20 w-auto max-w-none rounded-md object-contain sm:h-24 lg:h-28"
          : signedIn
            ? "frame-none h-[7.5rem] w-auto max-w-[calc(100vw-7.5rem)] object-contain sm:h-24 sm:max-w-[26rem] lg:h-36 lg:max-w-none"
            : "frame-none h-[7.5rem] w-auto max-w-[calc(100vw-10.75rem)] object-contain sm:h-24 sm:max-w-[26rem] lg:h-36 lg:max-w-none",
        className,
      )}
    />
  );
  if (!gleam) return img;
  return <span className="logo-shine">{img}</span>;
}
