"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface Props {
  requestId: string;
  currentStatus: string;
  currentNote: string | null;
}

export default function CallbackRowActions({
  requestId,
  currentStatus,
  currentNote,
}: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);
  const [editingNote, setEditingNote] = useState(false);
  const [noteDraft, setNoteDraft] = useState(currentNote ?? "");

  async function update(body: Record<string, unknown>) {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/callbacks/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || "Updated");
        setEditingNote(false);
        router.refresh();
      } else {
        toast.error(data.message || "Failed to update");
      }
    } catch {
      toast.error("Failed to update callback request");
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        {currentStatus === "PENDING" && (
          <>
            <button
              onClick={() => update({ status: "CALLED" })}
              disabled={updating}
              className="rounded-lg bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-400 hover:bg-blue-500/25 disabled:opacity-50"
            >
              Mark Called
            </button>
            <button
              onClick={() => update({ status: "CLOSED" })}
              disabled={updating}
              className="rounded-lg bg-red-500/15 px-3 py-1 text-xs font-bold text-red-400 hover:bg-red-500/25 disabled:opacity-50"
            >
              Close
            </button>
          </>
        )}
        {currentStatus === "CALLED" && (
          <button
            onClick={() => update({ status: "CLOSED" })}
            disabled={updating}
            className="rounded-lg bg-green-500/15 px-3 py-1 text-xs font-bold text-green-400 hover:bg-green-500/25 disabled:opacity-50"
          >
            Close Request
          </button>
        )}
        {currentStatus !== "PENDING" && (
          <button
            onClick={() => update({ status: "PENDING" })}
            disabled={updating}
            className="rounded-lg bg-slate-500/15 px-3 py-1 text-xs font-bold text-slate-400 hover:bg-slate-500/25 disabled:opacity-50"
          >
            Reopen
          </button>
        )}
      </div>

      {!editingNote ? (
        <button
          onClick={() => {
            setNoteDraft(currentNote ?? "");
            setEditingNote(true);
          }}
          className="text-xs font-bold text-slate-500 hover:text-white"
        >
          {currentNote ? "Edit note" : "Add note"}
        </button>
      ) : (
        <div className="flex w-full flex-col gap-1.5">
          <textarea
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            rows={2}
            placeholder="Internal note..."
            className="w-full resize-none rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setEditingNote(false)}
              className="text-xs text-slate-500 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={() => update({ note: noteDraft })}
              disabled={updating}
              className="rounded-lg bg-amber-500/15 px-3 py-1 text-xs font-bold text-amber-400 hover:bg-amber-500/25 disabled:opacity-50"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
