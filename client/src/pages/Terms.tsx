import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Seo from "@/components/Seo";
import { TermsContent } from "@/content/legal";

export default function Terms() {
  return (
    <div className="site-page min-h-screen flex flex-col bg-transparent">
      <Seo
        title="Terms of Service | CVsolucion"
        description="Review the terms and conditions that govern use of CVsolucion services, articles, booking, and support."
        type="website"
      />
      <Header />
      <main className="flex-1 mx-auto max-w-7xl px-6 sm:px-8 lg:px-12 xl:px-16 py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-sm text-slate-500 uppercase tracking-wide">Legal</p>
            <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-slate-600">
              The terms and conditions that govern how you use CVsolucion services.
            </p>
          </header>

          <section className="glass-card-strong card-static rounded-2xl p-8">
            <div className="prose max-w-none prose-slate prose-headings:mt-8 prose-headings:font-semibold">
              <TermsContent />
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
