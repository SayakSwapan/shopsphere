import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Pencil, Star, Quote, User } from "lucide-react";
import DeleteTestimonialButton from "@/components/admin/testimonials/delete-testimonial-button";

export const dynamic = "force-dynamic";

export default async function TestimonialsPage() {
  const testimonials = await prisma.testimonial.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Testimonials</h1>
          <p className="text-sm text-slate-400 mt-1">Manage customer testimonials and reviews</p>
        </div>
        <Link
          href="/admin/testimonials/new"
          className="flex items-center gap-2 bg-amber-500 text-[#0A0F1E] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
        >
          <Plus size={16} />
          Add New
        </Link>
      </div>

      {testimonials.length === 0 ? (
        <div className="text-center py-20 bg-[#111827] rounded-xl border border-[#1E293B]">
          <Quote size={48} className="text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No testimonials yet</h3>
          <p className="text-sm text-slate-400 mb-4">Add customer testimonials to build trust.</p>
          <Link href="/admin/testimonials/new" className="text-sm text-amber-400 hover:text-amber-300 font-semibold">
            Add Testimonial →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {testimonials.map((t) => (
            <div
              key={t.id}
              className="bg-[#111827] border border-[#1E293B] rounded-xl p-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-[#0A0F1E] border border-[#1E293B] flex-shrink-0 flex items-center justify-center">
                  {t.avatarUrl ? (
                    <img src={t.avatarUrl} alt={t.name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={18} className="text-slate-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{t.name}</h3>
                    {t.role && <span className="text-xs text-slate-500">— {t.role}</span>}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${t.isActive ? "bg-emerald-500/15 text-emerald-400" : "bg-slate-500/15 text-slate-400"}`}>
                      {t.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-[10px] text-slate-600">#{t.sortOrder}</span>
                  </div>
                  <div className="flex items-center gap-0.5 mt-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} className={i < t.rating ? "text-amber-400 fill-amber-400" : "text-slate-600"} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-400 mt-2 italic line-clamp-2">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Link
                    href={`/admin/testimonials/${t.id}/edit`}
                    className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <Pencil size={16} />
                  </Link>
                  <DeleteTestimonialButton testimonialId={t.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
