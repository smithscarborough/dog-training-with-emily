import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

function escapeHtml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function inlineHtml(value: string) {
  return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

export function markdownToHtml(source: string) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index] ?? "";
    if (!line.trim()) {
      index += 1;
      continue;
    }
    if (/^[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index] ?? "")) {
        items.push(`<li>${inlineHtml((lines[index] ?? "").replace(/^[-*]\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\.\s+/.test(lines[index] ?? "")) {
        items.push(`<li>${inlineHtml((lines[index] ?? "").replace(/^\d+\.\s+/, ""))}</li>`);
        index += 1;
      }
      blocks.push(`<ol>${items.join("")}</ol>`);
      continue;
    }
    const paragraph: string[] = [];
    while (
      index < lines.length &&
      (lines[index] ?? "").trim() &&
      !/^[-*]\s+/.test(lines[index] ?? "") &&
      !/^\d+\.\s+/.test(lines[index] ?? "")
    ) {
      paragraph.push(inlineHtml(lines[index] ?? ""));
      index += 1;
    }
    blocks.push(`<p>${paragraph.join("<br>")}</p>`);
  }
  return blocks.join("");
}

function inlineMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\u00a0/g, " ");
  if (!(node instanceof HTMLElement)) return "";
  if (node.tagName === "BR") return "\n";
  const inner = [...node.childNodes].map(inlineMarkdown).join("");
  const bold =
    node.tagName === "STRONG" ||
    node.tagName === "B" ||
    (node.tagName === "SPAN" && /bold|[7-9]00/.test(node.style.fontWeight));
  if (!bold) return inner;
  const text = inner.trim();
  return text ? `**${inner}**` : inner;
}

function blockMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return (node.textContent ?? "").replace(/\u00a0/g, " ").trim();
  if (!(node instanceof HTMLElement)) return "";
  if (node.tagName === "UL" || node.tagName === "OL") {
    return [...node.children]
      .filter((child) => child.tagName === "LI")
      .map((item, itemIndex) => {
        const text = [...item.childNodes]
          .map(inlineMarkdown)
          .join("")
          .replace(/\n+/g, " ")
          .trim();
        return node.tagName === "OL" ? `${itemIndex + 1}. ${text}` : `- ${text}`;
      })
      .join("\n");
  }
  if (node.tagName === "DIV" || node.tagName === "P") {
    const lists = [...node.children].filter((child) => child.tagName === "UL" || child.tagName === "OL");
    if (lists.length && lists.length === node.children.length) {
      return lists.map(blockMarkdown).filter(Boolean).join("\n\n");
    }
  }
  return [...node.childNodes]
    .map(inlineMarkdown)
    .join("")
    .replace(/\n+/g, " ")
    .trim();
}

export function htmlToMarkdown(root: HTMLElement) {
  return [...root.childNodes]
    .map(blockMarkdown)
    .map((block) => block.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n");
}

export function FormattedText({ text, className }: { text: string; className?: string }) {
  if (!text.trim()) return null;
  return (
    <div
      className={cn(
        "text-sm leading-relaxed text-ink",
        "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-ink",
        "[&_p+p]:mt-2 [&_strong]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-ink",
        "[&_li]:my-0.5",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: markdownToHtml(text) }}
    />
  );
}

function ToolButton({
  label,
  pressed,
  onPress,
  children,
}: {
  label: string;
  pressed: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-ink transition-colors duration-150",
        "hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40",
        pressed && "bg-white text-ink shadow-[0_0_0_1px_rgba(44,24,16,0.12)]",
      )}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onPress}
    >
      {children}
    </button>
  );
}

export function RichTextField({
  value,
  onChange,
  placeholder,
  label,
  fieldClassName = "min-h-28",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  fieldClassName?: string;
}) {
  const field = useRef<HTMLDivElement>(null);
  const applied = useRef<string | null>(null);
  const [marks, setMarks] = useState({ bold: false, bullets: false, numbers: false });

  useEffect(() => {
    const el = field.current;
    if (!el || applied.current === value) return;
    if (document.activeElement === el) return;
    el.innerHTML = markdownToHtml(value);
    applied.current = value;
  }, [value]);

  useEffect(() => {
    function readMarks() {
      const el = field.current;
      const selection = document.getSelection();
      if (!el || !selection?.anchorNode || !el.contains(selection.anchorNode)) {
        setMarks({ bold: false, bullets: false, numbers: false });
        return;
      }
      try {
        setMarks({
          bold: document.queryCommandState("bold"),
          bullets: document.queryCommandState("insertUnorderedList"),
          numbers: document.queryCommandState("insertOrderedList"),
        });
      } catch {
        setMarks({ bold: false, bullets: false, numbers: false });
      }
    }
    document.addEventListener("selectionchange", readMarks);
    return () => document.removeEventListener("selectionchange", readMarks);
  }, []);

  function sync() {
    const el = field.current;
    if (!el) return;
    const next = htmlToMarkdown(el);
    applied.current = next;
    onChange(next);
  }

  function format(command: "bold" | "insertUnorderedList" | "insertOrderedList") {
    field.current?.focus();
    document.execCommand(command);
    sync();
  }

  return (
    <div
      className={cn(
        "overflow-hidden rounded-lg border border-line bg-surface shadow-[inset_0_1px_0_rgba(47,28,18,0.04)]",
        "transition-[border-color,box-shadow] duration-150 ease-out",
        "focus-within:border-accent",
        "focus-within:[box-shadow:0_0_0_3px_color-mix(in_oklab,var(--color-accent)_35%,transparent)]",
      )}
    >
      <div className="flex items-center gap-0.5 border-b border-line bg-bg px-1.5 py-1">
        <ToolButton label="Bold" pressed={marks.bold} onPress={() => format("bold")}>
          <span className="font-display text-[15px] font-extrabold leading-none">B</span>
        </ToolButton>
        <span className="mx-1 h-4 w-px bg-line" aria-hidden="true" />
        <ToolButton label="Bulleted list" pressed={marks.bullets} onPress={() => format("insertUnorderedList")}>
          <svg viewBox="0 0 16 16" className="size-4" aria-hidden="true">
            <circle cx="2.5" cy="4" r="1.15" fill="currentColor" />
            <circle cx="2.5" cy="8" r="1.15" fill="currentColor" />
            <circle cx="2.5" cy="12" r="1.15" fill="currentColor" />
            <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </ToolButton>
        <ToolButton label="Numbered list" pressed={marks.numbers} onPress={() => format("insertOrderedList")}>
          <span className="font-display text-[13px] font-extrabold leading-none tracking-tight">1.</span>
        </ToolButton>
      </div>
      <div className="relative">
        {value.trim() ? null : (
          <p className="pointer-events-none absolute left-3 top-2.5 text-base text-[#a39284] sm:text-sm">
            {placeholder}
          </p>
        )}
        <div
          ref={field}
          role="textbox"
          aria-label={label}
          aria-multiline="true"
          contentEditable
          suppressContentEditableWarning
          className={cn(
            "w-full px-3 py-2.5 text-base leading-relaxed text-ink outline-none sm:text-sm",
            "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:marker:text-ink",
            "[&_p+p]:mt-2 [&_strong]:font-bold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:marker:text-ink",
            "[&_li]:my-0.5",
            fieldClassName,
          )}
          onInput={sync}
          onBlur={sync}
          onPaste={(event) => {
            event.preventDefault();
            const text = event.clipboardData.getData("text/plain");
            document.execCommand("insertText", false, text);
            sync();
          }}
          onKeyDown={(event) => {
            const mod = event.metaKey || event.ctrlKey;
            if (!mod) return;
            const key = event.key.toLowerCase();
            if (key === "b") {
              event.preventDefault();
              format("bold");
            } else if (key === "8" && event.shiftKey) {
              event.preventDefault();
              format("insertUnorderedList");
            } else if (key === "7" && event.shiftKey) {
              event.preventDefault();
              format("insertOrderedList");
            }
          }}
        />
      </div>
    </div>
  );
}

export function PrivateNoteEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RichTextField
      value={value}
      onChange={onChange}
      placeholder="What to remember before the next visit."
      label="Private note"
    />
  );
}
