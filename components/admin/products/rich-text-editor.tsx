"use client";

import { useEffect, useRef } from "react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function RichTextEditor({
  value,
  onChange,
}: Props) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  function handleCommand(command: string, value?: string) {
    if (!editorRef.current) return;

    document.execCommand(command, false, value || undefined);
    syncValue();
    editorRef.current.focus();
  }

  function syncValue() {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-700 bg-[#0F172A] p-3">
        <button
          type="button"
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
          onClick={() => handleCommand("bold")}
        >
          Bold
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
          onClick={() => handleCommand("italic")}
        >
          Italic
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
          onClick={() => handleCommand("underline")}
        >
          Underline
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
          onClick={() => handleCommand("insertUnorderedList")}
        >
          Bullets
        </button>
        <button
          type="button"
          className="rounded-xl bg-slate-800 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
          onClick={() => handleCommand("insertOrderedList")}
        >
          Numbers
        </button>
        <input
          type="color"
          className="h-10 w-10 rounded-xl border border-slate-600 bg-slate-900 p-1"
          onChange={(event) =>
            handleCommand(
              "foreColor",
              event.target.value
            )
          }
          aria-label="Text color"
        />
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={syncValue}
        className="min-h-[220px] rounded-2xl border border-slate-700 bg-[#0F172A] p-4 text-white outline-none focus:border-amber-500"
        style={{ whiteSpace: "pre-wrap" }}
      />
    </div>
  );
}
