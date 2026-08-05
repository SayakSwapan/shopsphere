import { getSiteSettings, getSiteName } from "@/lib/site-settings";

export default async function Footer() {
  const settings = await getSiteSettings();
  const siteName = getSiteName(settings);

  return (
    <footer className="bg-slate-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h3 className="text-2xl font-black">
          {siteName}
        </h3>

        <p className="text-slate-400 mt-2">
          Modern Ecommerce Platform
        </p>
      </div>
    </footer>
  );
}
