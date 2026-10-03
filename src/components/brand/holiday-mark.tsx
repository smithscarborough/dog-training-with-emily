import type { HolidayId } from "@/lib/holidays";

export function HolidayMark({ id }: { id: HolidayId }) {
  if (id === "new-year") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 2.4 13.15 8.7 19.2 6.6 15.1 11.2 20.4 14.6 14.2 14.9 15.2 21.2 12 16.6 8.8 21.2 9.8 14.9 3.6 14.6 8.9 11.2 4.8 6.6 10.85 8.7Z" />
      </svg>
    );
  }
  if (id === "valentine") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 19.4c-4.8-3.1-7-5.6-7-8.5A3.4 3.4 0 0 1 12 8.4a3.4 3.4 0 0 1 7 2.5c0 2.9-2.2 5.4-7 8.5Z" />
      </svg>
    );
  }
  if (id === "patrick") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="7.6" r="3" fill="currentColor" />
        <circle cx="7.7" cy="12.1" r="3" fill="currentColor" />
        <circle cx="16.3" cy="12.1" r="3" fill="currentColor" />
        <rect x="11.15" y="13.2" width="1.7" height="6.2" rx="0.85" fill="currentColor" />
      </svg>
    );
  }
  if (id === "easter") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 3.6c2.8 0 5 3.4 5 7.8s-2.2 8.6-5 8.6-5-4.2-5-8.6 2.2-7.8 5-7.8Zm0 2.1c-1.4 0-2.6 2.4-2.6 5.7s1.2 6.3 2.6 6.3 2.6-3 2.6-6.3-1.2-5.7-2.6-5.7Z" />
      </svg>
    );
  }
  if (id === "mothers") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="2.15" fill="currentColor" />
        <ellipse cx="12" cy="6.3" rx="1.7" ry="2.7" fill="currentColor" />
        <ellipse cx="12" cy="17.7" rx="1.7" ry="2.7" fill="currentColor" />
        <ellipse cx="6.3" cy="12" rx="2.7" ry="1.7" fill="currentColor" />
        <ellipse cx="17.7" cy="12" rx="2.7" ry="1.7" fill="currentColor" />
      </svg>
    );
  }
  if (id === "memorial") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="m12 3.8 1.6 4.7h5l-4 3 1.5 4.8L12 13.4 7.9 16.3 9.4 11.5l-4-3h5Zm-4.6 14.6h9.2v1.7H7.4Z" />
      </svg>
    );
  }
  if (id === "fathers") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M7.4 4.2h9.2L19.2 9 12 20.4 4.8 9l2.6-4.8Z" />
      </svg>
    );
  }
  if (id === "july4") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="m12 3.2 2.1 5.6 6 .5-4.7 3.7 1.7 5.8L12 15.6 6.9 18.8l1.7-5.8L3.9 9.3l6-.5Z" />
      </svg>
    );
  }
  if (id === "halloween") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" fillRule="evenodd" d="M14.6 4.2a7.2 7.2 0 1 0 0 15.6 5.5 5.5 0 1 1 0-15.6Z" />
      </svg>
    );
  }
  if (id === "thanksgiving") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path fill="currentColor" d="M12 2.8c.6 3.2-.4 5.2-2.2 6.4 2.6.2 4.4-1 6-2.8-.4 3-1.8 4.8-4 5.6 2.2.8 3.6 2.4 4 4.6-2.2-.6-3.8-2-4.6-3.6.4 3.2-.4 5.4-2.2 6.8-1.6-1.6-2.2-4-1.8-6.8-.8 1.6-2.4 3-4.6 3.6.4-2.2 1.8-3.8 4-4.6-2.2-.8-3.6-2.6-4-5.6 1.6 1.8 3.4 3 6 2.8C11.6 8 10.6 6 12 2.8Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path fill="currentColor" d="m12 2.8 1.35 6.15L19.6 8.2 14.7 12l4.9 3.8-6.25-.7L14.6 21.2 12 16.4 9.4 21.2l1.25-6.1-6.25.7L9.3 12 4.4 8.2l6.25.75Z" />
    </svg>
  );
}
