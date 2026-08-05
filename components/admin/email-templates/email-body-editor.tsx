"use client";

import { useState, useRef, useCallback } from "react";
import { Eye, Code, Type, Heading1, Heading2, Minus, MousePointerClick } from "lucide-react";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

const STYLE = {
  heading1: "color:#ffffff;font-size:24px;font-weight:bold;margin:0 0 12px 0;",
  heading2: "color:#F5A623;font-size:18px;font-weight:bold;margin:0 0 8px 0;",
  paragraph: "color:#8892A4;font-size:14px;line-height:1.7;margin:0 0 16px 0;",
  button: "display:inline-block;background:#F5A623;color:#0A0F1E;font-weight:bold;font-size:14px;padding:14px 40px;border-radius:12px;text-decoration:none;",
  divider: "border:none;border-top:1px solid rgba(255,255,255,0.06);margin:24px 0;",
  spacer: "height:24px;",
  link: "color:#F5A623;text-decoration:underline;",
  bold: "color:#ffffff;font-weight:bold;",
  muted: "color:#8892A4;font-size:13px;",
};

const BLOCKS: { label: string; icon: typeof Type; html: string }[] = [
  { label: "Heading 1", icon: Heading1, html: `<h2 style="${STYLE.heading1}">Your Heading Here</h2>` },
  { label: "Heading 2", icon: Heading2, html: `<h3 style="${STYLE.heading2}">Sub Heading</h3>` },
  { label: "Paragraph", icon: Type, html: `<p style="${STYLE.paragraph}">Your text goes here. Edit this to write your content.</p>` },
  { label: "Button", icon: MousePointerClick, html: `<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px 0;"><a href="#" style="${STYLE.button}">Click Here</a></td></tr></table>` },
  { label: "Divider", icon: Minus, html: `<hr style="${STYLE.divider}" />` },
  { label: "Spacer", icon: Minus, html: `<div style="${STYLE.spacer}"></div>` },
];

export default function EmailBodyEditor({ value, onChange }: Props) {
  const [mode, setMode] = useState<"visual" | "source" | "preview">("visual");
  const [source, setSource] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);

  const syncFromVisual = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  }, [onChange]);

  function insertBlock(html: string) {
    if (mode === "source") {
      const newSource = source + "\n" + html;
      setSource(newSource);
      onChange(newSource);
      return;
    }
    if (editorRef.current) {
      editorRef.current.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        const range = sel.getRangeAt(0);
        const temp = document.createElement("div");
        temp.innerHTML = html;
        const frag = document.createDocumentFragment();
        while (temp.firstChild) frag.appendChild(temp.firstChild);
        range.deleteContents();
        range.insertNode(frag);
        range.collapse(false);
      } else {
        editorRef.current.innerHTML += html;
      }
      syncFromVisual();
    }
  }

  function execCmd(cmd: string, val?: string) {
    document.execCommand(cmd, false, val);
    syncFromVisual();
  }

  function switchToSource() {
    setSource(editorRef.current?.innerHTML || value);
    setMode("source");
  }

  function switchToVisual() {
    onChange(source);
    setMode("visual");
  }

  return (
    <div className="rounded-xl border border-slate-700 bg-[#0F172A] overflow-hidden">
      {/* Mode Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-700 bg-[#111827] px-3 py-2">
        <button
          type="button"
          onClick={() => mode !== "visual" ? switchToVisual() : undefined}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "visual" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Type size={13} /> Visual
        </button>
        <button
          type="button"
          onClick={() => mode !== "source" ? switchToSource() : undefined}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "source" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Code size={13} /> Source
        </button>
        <button
          type="button"
          onClick={() => { if (editorRef.current) setSource(editorRef.current.innerHTML); setMode("preview"); }}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            mode === "preview" ? "bg-amber-500/20 text-amber-400" : "text-slate-400 hover:text-white"
          }`}
        >
          <Eye size={13} /> Preview
        </button>
      </div>

      {/* Toolbar (visual mode only) */}
      {mode === "visual" && (
        <div className="flex flex-wrap items-center gap-1 border-b border-slate-700 px-3 py-2">
          <select
            onChange={(e) => { if (e.target.value) { execCmd("formatBlock", e.target.value); e.target.value = ""; } }}
            defaultValue=""
            className="rounded-lg border border-slate-600 bg-[#0A0F1E] px-2 py-1.5 text-xs text-slate-300 outline-none"
          >
            <option value="" disabled>Style</option>
            <option value="h2">Heading 1</option>
            <option value="h3">Heading 2</option>
            <option value="p">Paragraph</option>
          </select>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button type="button" onClick={() => execCmd("bold")} className="rounded-lg px-2 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/5" title="Bold">B</button>
          <button type="button" onClick={() => execCmd("italic")} className="rounded-lg px-2 py-1.5 text-xs italic text-slate-300 hover:bg-white/5" title="Italic">I</button>
          <button type="button" onClick={() => execCmd("underline")} className="rounded-lg px-2 py-1.5 text-xs underline text-slate-300 hover:bg-white/5" title="Underline">U</button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button type="button" onClick={() => execCmd("justifyLeft")} className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5" title="Align Left">⬅</button>
          <button type="button" onClick={() => execCmd("justifyCenter")} className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5" title="Align Center">⬛</button>
          <button type="button" onClick={() => execCmd("justifyRight")} className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5" title="Align Right">➡</button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button type="button" onClick={() => execCmd("insertUnorderedList")} className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5" title="Bullet List">• List</button>

          <div className="w-px h-5 bg-slate-600 mx-1" />

          {/* Insert blocks */}
          {BLOCKS.map((b) => (
            <button
              key={b.label}
              type="button"
              onClick={() => insertBlock(b.html)}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-amber-500/10 hover:text-amber-400 transition"
              title={`Insert ${b.label}`}
            >
              <b.icon size={12} /> {b.label}
            </button>
          ))}

          <div className="w-px h-5 bg-slate-600 mx-1" />

          <button
            type="button"
            onClick={() => {
              const url = prompt("Enter link URL:");
              if (url) execCmd("createLink", url);
            }}
            className="rounded-lg px-2 py-1.5 text-xs text-slate-300 hover:bg-white/5"
            title="Insert Link"
          >
            🔗 Link
          </button>
        </div>
      )}

      {/* Content Area */}
      {mode === "visual" && (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncFromVisual}
          onBlur={syncFromVisual}
          className="min-h-[400px] max-h-[600px] overflow-y-auto px-4 py-3 text-sm text-slate-200 outline-none prose prose-invert max-w-none"
          style={{ lineHeight: "1.7" }}
          dangerouslySetInnerHTML={{ __html: value }}
        />
      )}

      {mode === "source" && (
        <textarea
          value={source}
          onChange={(e) => { setSource(e.target.value); onChange(e.target.value); }}
          className="w-full min-h-[400px] max-h-[600px] bg-transparent px-4 py-3 text-sm font-mono text-slate-200 outline-none resize-y"
          spellCheck={false}
        />
      )}

      {mode === "preview" && (
        <div className="min-h-[400px] max-h-[600px] overflow-y-auto bg-white p-6">
          <div dangerouslySetInnerHTML={{ __html: value }} />
        </div>
      )}
    </div>
  );
}
