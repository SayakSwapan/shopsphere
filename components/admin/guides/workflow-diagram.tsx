import { ArrowRight, Check, CircleDot, GitFork, Play, ShieldCheck } from "lucide-react";

export interface DiagramBranch {
  label: string;
  outcome: string;
  tone: "green" | "red" | "amber" | "slate";
}

export interface DiagramNode {
  title: string;
  detail: string;
  phase?: string;
  type?: "start" | "action" | "decision" | "end";
  branches?: DiagramBranch[];
}

export interface WorkflowDiagramData {
  title?: string;
  nodes: DiagramNode[];
}

const BRANCH_CONTAINER: Record<DiagramBranch["tone"], string> = {
  green: "border-emerald-500/40 bg-emerald-500/10",
  red: "border-red-500/40 bg-red-500/10",
  amber: "border-amber-500/40 bg-amber-500/10",
  slate: "border-slate-600 bg-slate-500/10",
};

const BRANCH_TEXT: Record<DiagramBranch["tone"], string> = {
  green: "text-emerald-400 border-emerald-500/40",
  red: "text-red-400 border-red-500/40",
  amber: "text-amber-400 border-amber-500/40",
  slate: "text-slate-300 border-slate-600",
};

function NodeIcon({ type }: { type: NonNullable<DiagramNode["type"]> }) {
  if (type === "start") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-emerald-400 bg-emerald-500 text-[#0B1220]">
        <Play size={16} fill="currentColor" />
      </span>
    );
  }
  if (type === "decision") {
    return (
      <span className="flex h-10 w-10 shrink-0 rotate-45 items-center justify-center rounded-lg border-2 border-amber-400 bg-amber-400 text-[#0B1220]">
        <GitFork size={15} className="-rotate-45" />
      </span>
    );
  }
  if (type === "end") {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-slate-600 bg-[#0F172A] text-slate-400">
        <Check size={16} />
      </span>
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-amber-500/40 bg-amber-500/15 text-amber-400">
      <CircleDot size={15} />
    </span>
  );
}

export default function WorkflowDiagram({ diagrams }: { diagrams: WorkflowDiagramData[] }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-x-4 gap-y-2 rounded-xl border border-slate-700 bg-[#0F172A] px-4 py-3 text-[11px] font-semibold text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" /> Start
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-md bg-amber-500/60" /> Action
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rotate-45 rounded-sm bg-amber-400" /> Decision
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-600" /> End / Terminal
        </span>
        <span className="ml-auto hidden sm:inline">Read top to bottom · arrows connect each step</span>
      </div>

      {diagrams.map((diagram, di) => (
        <div key={di} className="rounded-2xl border border-slate-700 bg-[#111827] p-5 sm:p-6">
          {diagram.title && (
            <div className="mb-5 flex items-center gap-3">
              <ShieldCheck size={18} className="text-amber-400" />
              <h4 className="text-base font-bold text-white">{diagram.title}</h4>
            </div>
          )}

          <ol className="space-y-0">
            {diagram.nodes.map((node, idx) => (
              <li key={idx} className="relative flex gap-4 pb-6 last:pb-0">
                {idx < diagram.nodes.length - 1 && (
                  <span
                    className="absolute left-[19px] top-11 h-[calc(100%-2.5rem)] w-0.5"
                    style={{ background: "rgba(100,116,139,0.35)" }}
                    aria-hidden
                  />
                )}

                <NodeIcon type={node.type ?? "action"} />

                <div className="min-w-0 flex-1 pt-0.5">
                  {node.phase && (
                    <p className="mb-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                      {node.phase}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-white">{node.title}</p>
                    {node.type === "decision" && (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-400">
                        Decision
                      </span>
                    )}
                    {node.type === "start" && (
                      <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Start
                      </span>
                    )}
                    {node.type === "end" && (
                      <span className="rounded-full bg-slate-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        End
                      </span>
                    )}
                  </div>

                  <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{node.detail}</p>

                  {node.branches && node.branches.length > 0 && (
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {node.branches.map((b, bi) => (
                        <div
                          key={bi}
                          className={`rounded-xl border p-3 ${BRANCH_CONTAINER[b.tone]}`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`rounded-full border bg-black/30 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${BRANCH_TEXT[b.tone]}`}
                            >
                              {b.label}
                            </span>
                            <ArrowRight size={13} className={BRANCH_TEXT[b.tone].split(" ")[0]} />
                          </div>
                          <p className="mt-1.5 text-xs leading-relaxed text-slate-300">{b.outcome}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
