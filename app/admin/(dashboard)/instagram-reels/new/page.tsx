import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import InstagramReelForm from "@/components/admin/instagram-reels/instagram-reel-form";

export const dynamic = "force-dynamic";

export default function NewInstagramReelPage() {
  return (
    <div className="p-6 max-w-2xl">
      <Link
        href="/admin/instagram-reels"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition-colors"
      >
        <ArrowLeft size={16} />
        Back to Instagram Reels
      </Link>

      <h1 className="text-2xl font-bold text-white mb-6">Add Instagram Reel</h1>

      <InstagramReelForm />
    </div>
  );
}