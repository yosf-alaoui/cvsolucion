import { CalendarDays, CreditCard, ShoppingCart } from "lucide-react";

type BookingFlowStepsProps = {
  locale: string;
  current: "select" | "cart" | "checkout";
};

function getLabels(locale: string) {
  if (locale === "ar") {
    return {
      select: "اختيار المواعيد",
      cart: "السلة",
      checkout: "الدفع",
    };
  }

  if (locale === "fr") {
    return {
      select: "Choix des horaires",
      cart: "Panier",
      checkout: "Paiement",
    };
  }

  return {
    select: "Select times",
    cart: "Cart",
    checkout: "Checkout",
  };
}

export default function BookingFlowSteps({ locale, current }: BookingFlowStepsProps) {
  const labels = getLabels(locale);
  const steps = [
    { id: "select" as const, label: labels.select, icon: CalendarDays },
    { id: "cart" as const, label: labels.cart, icon: ShoppingCart },
    { id: "checkout" as const, label: labels.checkout, icon: CreditCard },
  ];

  return (
    <div className="mx-auto mt-8 max-w-5xl">
      <div className="grid gap-3 sm:grid-cols-3">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = step.id === current;
          const isPast = steps.findIndex((candidate) => candidate.id === current) > index;

          return (
            <div
              key={step.id}
              className={`rounded-[24px] border px-4 py-4 transition ${
                isActive
                  ? "border-primary/40 bg-primary/10 shadow-[0_18px_40px_rgba(37,64,143,0.12)]"
                  : isPast
                    ? "border-emerald-200 bg-emerald-50/90"
                    : "border-slate-200 bg-white/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`inline-flex h-11 w-11 items-center justify-center rounded-full ${
                    isActive ? "bg-primary text-white" : isPast ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500">Step {index + 1}</div>
                  <div className="text-base font-semibold text-slate-950">{step.label}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
