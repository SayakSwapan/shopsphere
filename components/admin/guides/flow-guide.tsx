import { Check, Circle, ShieldAlert, ShieldCheck, X } from "lucide-react";
import type { FlowStep } from "@/lib/flow-guides";

interface Props {
  steps: FlowStep[];
  currentStatus: string;
}

export default function FlowGuide({ steps, currentStatus }: Props) {
  const currentIdx = steps.findIndex((s) => s.status === currentStatus);
  const closed = currentStatus === "CLOSED";
  const terminal = currentStatus === "REJECTED" || currentStatus === "CANCELLED";

  const doneUpTo = closed ? steps.length : currentIdx >= 0 ? currentIdx : -1;

  return (
    <div className="rounded-2xl border border-slate-700 bg-[#111827] p-6">
      <div className="mb-5 flex items-center gap-3">
        <ShieldCheck size={18} className="text-amber-400" />
        <h2 className="text-lg font-bold text-white">Process Guide</h2>
      </div>

      {terminal && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
          <ShieldAlert size={18} className="text-red-400" />
          <div>
            <p className="text-sm font-bold text-red-400">
              This request/order ended with{" "}
              {currentStatus === "CANCELLED" ? "Cancelled" : "Rejected"}.
            </p>
            <p className="text-xs text-slate-300">
              No further steps apply. The full flow is shown below for reference.
            </p>
          </div>
        </div>
      )}

      {closed && (
        <div className="mb-5 flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
          <ShieldCheck size={18} className="text-emerald-400" />
          <p className="text-sm font-bold text-emerald-400">
            This request is fully completed and closed.
          </p>
        </div>
      )}

      <ol className="space-y-0">
        {steps.map((step, idx) => {
          const done = idx < doneUpTo;
          const current = idx === currentIdx;

          let stateCls = "border-slate-600 bg-[#0F172A] text-slate-500";
          if (done) {
            stateCls = "border-emerald-500/50 bg-emerald-500 text-[#0B1220]";
          } else if (current) {
            stateCls =
              "border-amber-400 bg-amber-400 text-[#0B1220] shadow-[0_0_0_4px_rgba(245,158,11,0.15)]";
          }

          return (
            <li key={step.status} className="relative flex gap-4 pb-6 last:pb-0">
              {idx < steps.length - 1 && (
                <span
                  className="absolute left-[15px] top-8 h-full w-0.5"
                  style={{ background: done ? "#10B981" : "rgba(100,116,139,0.25)" }}
                  aria-hidden
                />
              )}

              <span
                className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${stateCls}`}
              >
                {done ? (
                  <Check size={15} strokeWidth={3} />
                ) : current ? (
                  <Circle size={12} fill="currentColor" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </span>

              <div className="min-w-0 pt-0.5">
                {step.phase && (
                  <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                    {step.phase}
                  </p>
                )}
                <p
                  className={`text-sm font-bold ${
                    done || current ? "text-white" : "text-slate-400"
                  }`}
                >
                  {step.title}
                  {current && (
                    <span className="ml-2 rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Current
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
                  {step.description}
                </p>
              </div>
            </li>
          );
        })}
      </ol>

      {terminal && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2">
          <X size={15} className="text-red-400" />
          <span className="text-xs font-bold text-red-400">
            {currentStatus === "CANCELLED" ? "Order Cancelled" : "Request Rejected"}
          </span>
        </div>
      )}
    </div>
  );
}
