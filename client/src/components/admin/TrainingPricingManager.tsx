import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { getAdminCatalog, updateAdminCatalogTrainingPricing, type CatalogTrainingPrices } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function centsToDollars(value: number) {
  return (value / 100).toFixed(2);
}

function dollarsToCents(value: string) {
  const normalized = Number(String(value || "0").replace(/[^\d.]/g, ""));
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : 0;
}

export default function TrainingPricingManager({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    bundle: "",
  });

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "أسعار التكوين",
        subtitle: "تحكم مباشر في أسعار مستويات التكوين التي تظهر للعميل بعد تسجيل الدخول.",
        level1: "المستوى 1 - Core Designer",
        level2: "المستوى 2 - Catalog Engineer",
        level3: "المستوى 3 - Production Specialist",
        level4: "المستوى 4 - CV Consultant",
        bundle: "المسار الكامل",
        save: "حفظ أسعار التكوين",
        loading: "تحميل أسعار التكوين...",
        saved: "تم تحديث أسعار التكوين.",
        failed: "تعذر حفظ أسعار التكوين.",
      };
    }
    if (locale === "fr") {
      return {
        title: "Tarifs des formations",
        subtitle: "Controle direct des prix des niveaux de formation affiches au client apres connexion.",
        level1: "Niveau 1 - Core Designer",
        level2: "Niveau 2 - Catalog Engineer",
        level3: "Niveau 3 - Production Specialist",
        level4: "Niveau 4 - CV Consultant",
        bundle: "Parcours complet",
        save: "Enregistrer les tarifs",
        loading: "Chargement des tarifs formation...",
        saved: "Tarifs formation mis a jour.",
        failed: "Impossible d'enregistrer les tarifs formation.",
      };
    }
    return {
      title: "Training prices",
      subtitle: "Direct control over the training level prices shown to customers after login.",
      level1: "Level 1 - Core Designer",
      level2: "Level 2 - Catalog Engineer",
      level3: "Level 3 - Production Specialist",
      level4: "Level 4 - CV Consultant",
      bundle: "Complete path",
      save: "Save training prices",
      loading: "Loading training prices...",
      saved: "Training prices updated.",
      failed: "Failed to save training prices.",
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminCatalog()
      .then((response) => {
        if (!active) return;
        setForm({
          level1: centsToDollars(response.trainingPrices.level1),
          level2: centsToDollars(response.trainingPrices.level2),
          level3: centsToDollars(response.trainingPrices.level3),
          level4: centsToDollars(response.trainingPrices.level4),
          bundle: centsToDollars(response.trainingPrices.bundle),
        });
      })
      .catch((error: any) => toast.error(error?.message || copy.failed))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [copy.failed]);

  async function handleSave() {
    try {
      setSaving(true);
      const payload: CatalogTrainingPrices = {
        level1: dollarsToCents(form.level1),
        level2: dollarsToCents(form.level2),
        level3: dollarsToCents(form.level3),
        level4: dollarsToCents(form.level4),
        bundle: dollarsToCents(form.bundle),
      };
      const response = await updateAdminCatalogTrainingPricing(payload);
      setForm({
        level1: centsToDollars(response.trainingPrices.level1),
        level2: centsToDollars(response.trainingPrices.level2),
        level3: centsToDollars(response.trainingPrices.level3),
        level4: centsToDollars(response.trainingPrices.level4),
        bundle: centsToDollars(response.trainingPrices.bundle),
      });
      toast.success(copy.saved);
    } catch (error: any) {
      toast.error(error?.message || copy.failed);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500">{copy.loading}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{copy.title}</CardTitle>
        <p className="text-sm text-slate-600">{copy.subtitle}</p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">
        {([
          ["level1", copy.level1],
          ["level2", copy.level2],
          ["level3", copy.level3],
          ["level4", copy.level4],
          ["bundle", copy.bundle],
        ] as const).map(([key, label]) => (
          <div key={key} className={key === "bundle" ? "space-y-2 sm:col-span-2" : "space-y-2"}>
            <Label>{label}</Label>
            <Input value={form[key]} onChange={(event) => setForm((current) => ({ ...current, [key]: event.target.value }))} />
          </div>
        ))}
        <div className="sm:col-span-2">
          <Button type="button" onClick={handleSave} disabled={saving}>{copy.save}</Button>
        </div>
      </CardContent>
    </Card>
  );
}
