import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { TermsContent } from "@/content/legal";

export default function Terms() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-sm text-slate-500 uppercase tracking-wide">Legal</p>
            <h1 className="text-4xl font-bold text-slate-900">Terms of Service</h1>
            <p className="text-slate-600">
              The terms and conditions that govern how you use CVsolucion services.
            </p>
          </header>

          <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-8">
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
