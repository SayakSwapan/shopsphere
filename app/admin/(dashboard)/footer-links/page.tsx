import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Link2 } from "lucide-react";
import DeleteFooterLinkButton from "@/components/admin/footer-links/delete-footer-link-button";

export const dynamic = "force-dynamic";

export default async function FooterLinksPage() {
  const links = await prisma.footerLink.findMany({
    orderBy: [{ group: "asc" }, { sortOrder: "asc" }],
  });

  const grouped = links.reduce<Record<string, typeof links>>((acc, link) => {
    if (!acc[link.group]) acc[link.group] = [];
    acc[link.group].push(link);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Footer Links</h1>
          <p className="text-sm text-slate-400 mt-1">Manage footer navigation links grouped by category</p>
        </div>
        <Link
          href="/admin/footer-links/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {links.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <Link2 size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No footer links yet</h3>
          <p className="text-sm text-slate-400 mb-4">Add links to display in the footer sections.</p>
          <Link href="/admin/footer-links/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Add Footer Link →
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([group, groupLinks]) => (
            <div key={group}>
              <h2 className="text-sm font-semibold text-amber-400 mb-3 uppercase tracking-wider">{group}</h2>
              <div className="space-y-2">
                {groupLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center gap-4 bg-[#111827] border border-[#1E293B] rounded-xl p-3 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-white">{link.label}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${link.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                          {link.isActive ? "Active" : "Inactive"}
                        </span>
                        <span className="text-[10px] text-slate-600">#{link.sortOrder}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">{link.url}</p>
                    </div>
                    <Link
                      href={`/admin/footer-links/${link.id}/edit`}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil size={16} />
                    </Link>
                    <DeleteFooterLinkButton linkId={link.id} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
