import { useMemo, useState } from "react";
import { CardCvcElement, CardExpiryElement, CardNumberElement, Elements, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CreditCard, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

type BillingDetails = {
  name: string;
  email: string;
  phone: string;
};

type StripePaymentFormProps = {
  publishableKey: string;
  clientSecret: string;
  amountLabel: string;
  billingReady: boolean;
  billingDetails: BillingDetails;
  copy: {
    title: string;
    subtitle: string;
    secure: string;
    number: string;
    expiry: string;
    cvc: string;
    missingCustomer: string;
    missingCard: string;
    ready: string;
    payNow: string;
    processing: string;
  };
  onSuccess: (paymentIntentId: string) => Promise<void>;
};

function stripeFieldBaseStyle() {
  return {
    fontSize: "16px",
    color: "#0f172a",
    fontFamily: "ui-sans-serif, system-ui, sans-serif",
    "::placeholder": {
      color: "#94a3b8",
    },
  };
}

function StripePaymentFormInner({
  clientSecret,
  amountLabel,
  billingReady,
  billingDetails,
  copy,
  onSuccess,
}: Omit<StripePaymentFormProps, "publishableKey">) {
  const stripe = useStripe();
  const elements = useElements();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardState, setCardState] = useState({
    number: false,
    expiry: false,
    cvc: false,
  });

  const cardReady = cardState.number && cardState.expiry && cardState.cvc;
  const canSubmit = Boolean(stripe && elements && billingReady && cardReady && !busy);

  const helperText = error
    ? error
    : !billingReady
      ? copy.missingCustomer
      : !cardReady
        ? copy.missingCard
        : copy.ready;

  async function handleSubmit() {
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      setError("Card form is not ready.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardNumber,
          billing_details: {
            name: billingDetails.name,
            email: billingDetails.email,
            phone: billingDetails.phone,
          },
        },
      });

      if (result.error) {
        const recovered = await stripe.retrievePaymentIntent(clientSecret);
        const recoveredIntent = recovered.paymentIntent;
        if (recoveredIntent?.id && recoveredIntent.status === "succeeded") {
          await onSuccess(recoveredIntent.id);
          return;
        }

        throw new Error(result.error.message || "Payment failed.");
      }

      const paymentIntentId = result.paymentIntent?.id;
      if (!paymentIntentId) {
        throw new Error("Stripe did not return a payment reference.");
      }

      await onSuccess(paymentIntentId);
    } catch (caught: any) {
      setError(caught?.message || "Payment failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-[32px] border border-slate-200 bg-white/90 p-6 shadow-[0_24px_55px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <CreditCard className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold text-slate-950">{copy.title}</h2>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-600">{copy.subtitle}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
          <Lock className="h-4 w-4" />
          {copy.secure}
        </div>
      </div>

      <div className="mt-6 rounded-[24px] border border-slate-200 bg-slate-50/85 p-5">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">Order total</div>
          <div className="text-2xl font-bold text-slate-950">{amountLabel}</div>
        </div>

        <div className="mt-5 space-y-4">
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.number}</div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
              <CardNumberElement
                options={{
                  style: {
                    base: stripeFieldBaseStyle(),
                    invalid: { color: "#dc2626" },
                  },
                }}
                onChange={(event) => {
                  setCardState((current) => ({ ...current, number: event.complete }));
                  setError(event.error?.message || null);
                }}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.expiry}</div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <CardExpiryElement
                  options={{
                    style: {
                      base: stripeFieldBaseStyle(),
                      invalid: { color: "#dc2626" },
                    },
                  }}
                  onChange={(event) => {
                    setCardState((current) => ({ ...current, expiry: event.complete }));
                    setError(event.error?.message || null);
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{copy.cvc}</div>
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4">
                <CardCvcElement
                  options={{
                    style: {
                      base: stripeFieldBaseStyle(),
                      invalid: { color: "#dc2626" },
                    },
                  }}
                  onChange={(event) => {
                    setCardState((current) => ({ ...current, cvc: event.complete }));
                    setError(event.error?.message || null);
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`mt-4 text-sm ${error ? "text-rose-600" : "text-slate-500"}`}>{helperText}</div>

      <Button type="button" className="mt-5 w-full rounded-full bg-primary text-white hover:bg-primary/90" disabled={!canSubmit} onClick={handleSubmit}>
        {busy ? copy.processing : `${copy.payNow} • ${amountLabel}`}
      </Button>
    </div>
  );
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const stripePromise = useMemo(() => loadStripe(props.publishableKey), [props.publishableKey]);

  return (
    <Elements stripe={stripePromise}>
      <StripePaymentFormInner
        clientSecret={props.clientSecret}
        amountLabel={props.amountLabel}
        billingReady={props.billingReady}
        billingDetails={props.billingDetails}
        copy={props.copy}
        onSuccess={props.onSuccess}
      />
    </Elements>
  );
}
