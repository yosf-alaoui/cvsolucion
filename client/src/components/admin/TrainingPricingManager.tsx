import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createAdminCatalogTrainingProgram,
  deleteAdminCatalogTrainingProgram,
  getAdminCatalog,
  updateAdminCatalogTrainingProgram,
  type CatalogLocale,
  type CatalogTrainingProgramRecord,
  type CatalogTrainingTranslation,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

function centsToDollars(value: number) {
  return (value / 100).toFixed(2);
}

function dollarsToCents(value: string) {
  const normalized = Number(String(value || "0").replace(/[^\d.]/g, ""));
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : 0;
}

function emptyTranslation(): CatalogTrainingTranslation {
  return {
    badge: "",
    title: "",
    hours: "",
    duration: "",
    prerequisite: "",
    certification: "",
    project: "",
    modules: [],
  };
}

function emptyTranslations() {
  return {
    en: emptyTranslation(),
    fr: emptyTranslation(),
    ar: emptyTranslation(),
  } satisfies Record<CatalogLocale, CatalogTrainingTranslation>;
}

function normalizeKey(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ProgramForm = {
  key: string;
  active: boolean;
  featured: boolean;
  order: number;
  price: string;
  translations: Record<CatalogLocale, CatalogTrainingTranslation>;
};

function formFromProgram(program: CatalogTrainingProgramRecord): ProgramForm {
  return {
    key: program.key,
    active: program.active,
    featured: program.featured,
    order: program.order,
    price: centsToDollars(program.priceCents),
    translations: {
      en: { ...program.translations.en, modules: [...program.translations.en.modules] },
      fr: { ...program.translations.fr, modules: [...program.translations.fr.modules] },
      ar: { ...program.translations.ar, modules: [...program.translations.ar.modules] },
    },
  };
}

export default function TrainingPricingManager({ locale }: { locale: string }) {
  const [programs, setPrograms] = useState<CatalogTrainingProgramRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>({
    key: "training-program",
    active: true,
    featured: false,
    order: 1,
    price: "0.00",
    translations: emptyTranslations(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const copy = useMemo(() => {
    if (locale === "fr") {
      return {
        title: "Programmes de formation",
        subtitle: "Ajoutez, masquez, supprimez et modifiez les formations, les prix, les heures, les durees et les textes publics.",
        add: "Ajouter un programme",
        save: "Enregistrer",
        delete: "Supprimer",
        active: "Actif",
        featured: "Programme complet / mis en avant",
        key: "Cle technique",
        order: "Ordre",
        price: "Prix USD",
        badge: "Badge / niveau",
        programTitle: "Titre",
        hours: "Nombre d'heures",
        duration: "Duree / semaines",
        prerequisite: "Prerequis",
        certification: "Certification",
        project: "Projet / description courte",
        modules: "Modules",
        modulesHint: "Une ligne = un module",
        saved: "Programme de formation mis a jour.",
        deleted: "Programme supprime.",
        created: "Programme ajoute.",
        empty: "Aucun programme.",
      };
    }
    if (locale === "ar") {
      return {
        title: "برامج التكوين",
        subtitle: "تحكم في إضافة وحذف وتعديل برامج التكوين، السعر، الساعات، الأسابيع/المدة، والنصوص التي تظهر في الموقع.",
        add: "إضافة برنامج",
        save: "حفظ",
        delete: "حذف",
        active: "مفعل",
        featured: "برنامج كامل / مميز",
        key: "المفتاح التقني",
        order: "الترتيب",
        price: "السعر بالدولار",
        badge: "الشارة / المستوى",
        programTitle: "العنوان",
        hours: "عدد الساعات",
        duration: "المدة / الأسابيع",
        prerequisite: "الشروط",
        certification: "الشهادة",
        project: "المشروع / الوصف القصير",
        modules: "الوحدات",
        modulesHint: "كل سطر = وحدة",
        saved: "تم تحديث برنامج التكوين.",
        deleted: "تم حذف البرنامج.",
        created: "تم إضافة برنامج.",
        empty: "لا توجد برامج.",
      };
    }
    return {
      title: "Training programs",
      subtitle: "Add, remove, hide, reorder, and edit program price, hours, weeks/duration, and public text.",
      add: "Add program",
      save: "Save",
      delete: "Delete",
      active: "Active",
      featured: "Complete path / featured",
      key: "Technical key",
      order: "Order",
      price: "Price USD",
      badge: "Badge / level",
      programTitle: "Title",
      hours: "Hours",
      duration: "Duration / weeks",
      prerequisite: "Prerequisite",
      certification: "Certification",
      project: "Project / short description",
      modules: "Modules",
      modulesHint: "One line = one module",
      saved: "Training program updated.",
      deleted: "Training program deleted.",
      created: "Training program added.",
      empty: "No programs.",
    };
  }, [locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    getAdminCatalog()
      .then((response) => {
        if (!active) return;
        const nextPrograms = [...(response.trainingPrograms || [])].sort((a, b) => a.order - b.order);
        setPrograms(nextPrograms);
        if (nextPrograms[0]) {
          setSelectedId(nextPrograms[0].id);
          setForm(formFromProgram(nextPrograms[0]));
        }
      })
      .catch((error: Error) => toast.error(error.message))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  function selectProgram(program: CatalogTrainingProgramRecord) {
    setSelectedId(program.id);
    setForm(formFromProgram(program));
  }

  function patchTranslation(tabLocale: CatalogLocale, patch: Partial<CatalogTrainingTranslation>) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [tabLocale]: {
          ...current.translations[tabLocale],
          ...patch,
        },
      },
    }));
  }

  async function handleCreate() {
    try {
      setSaving(true);
      const order = (programs.at(-1)?.order || 0) + 1;
      const translations = emptyTranslations();
      translations.en.title = "New training program";
      translations.en.badge = "New program";
      translations.en.hours = "0 hours";
      translations.en.duration = "Set duration";
      const response = await createAdminCatalogTrainingProgram({
        key: `program-${order}`,
        active: false,
        featured: false,
        order,
        priceCents: 0,
        translations,
      });
      setPrograms(response.trainingPrograms.sort((a, b) => a.order - b.order));
      setSelectedId(response.trainingProgram.id);
      setForm(formFromProgram(response.trainingProgram));
      toast.success(copy.created);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create training program.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    if (!selectedId) return;
    try {
      setSaving(true);
      const response = await updateAdminCatalogTrainingProgram(selectedId, {
        key: normalizeKey(form.key),
        active: form.active,
        featured: form.featured,
        order: Number(form.order) || 1,
        priceCents: dollarsToCents(form.price),
        translations: form.translations,
      });
      setPrograms(response.trainingPrograms.sort((a, b) => a.order - b.order));
      setSelectedId(response.trainingProgram.id);
      setForm(formFromProgram(response.trainingProgram));
      toast.success(copy.saved);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save training program.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      setSaving(true);
      const response = await deleteAdminCatalogTrainingProgram(selectedId);
      const nextPrograms = response.trainingPrograms.sort((a, b) => a.order - b.order);
      setPrograms(nextPrograms);
      if (nextPrograms[0]) {
        setSelectedId(nextPrograms[0].id);
        setForm(formFromProgram(nextPrograms[0]));
      } else {
        setSelectedId(null);
        setForm({
          key: "training-program",
          active: true,
          featured: false,
          order: 1,
          price: "0.00",
          translations: emptyTranslations(),
        });
      }
      toast.success(copy.deleted);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete training program.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6 text-sm text-slate-500">Loading training programs...</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>{copy.title}</CardTitle>
          <p className="mt-2 text-sm text-slate-600">{copy.subtitle}</p>
        </div>
        <Button type="button" variant="outline" onClick={handleCreate} disabled={saving}>{copy.add}</Button>
      </CardHeader>
      <CardContent className="grid gap-6 xl:grid-cols-[320px_1fr]">
        <ScrollArea className="h-[680px] rounded-2xl border border-slate-200 p-3">
          <div className="space-y-3">
            {programs.length ? programs.map((program) => (
              <button
                key={program.id}
                type="button"
                onClick={() => selectProgram(program)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                  selectedId === program.id ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-primary/25"
                }`}
              >
                <div className="font-semibold text-slate-900">{program.translations.en.title || program.key}</div>
                <div className="mt-1 text-xs text-slate-500">
                  #{program.order} - {program.key} - {program.active ? copy.active : "Inactive"}
                </div>
                <div className="mt-2 text-sm font-bold text-primary">${centsToDollars(program.priceCents)}</div>
              </button>
            )) : (
              <p className="p-4 text-sm text-slate-500">{copy.empty}</p>
            )}
          </div>
        </ScrollArea>

        <div className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>{copy.key}</Label>
              <Input value={form.key} onChange={(event) => setForm((current) => ({ ...current, key: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{copy.order}</Label>
              <Input type="number" value={form.order} onChange={(event) => setForm((current) => ({ ...current, order: Number(event.target.value) || 1 }))} />
            </div>
            <div className="space-y-2">
              <Label>{copy.price}</Label>
              <Input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} />
            </div>
          </div>

          <div className="flex flex-wrap gap-5 rounded-2xl border border-slate-200 bg-white/70 p-4">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.active} onChange={(event) => setForm((current) => ({ ...current, active: event.target.checked }))} />
              {copy.active}
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} />
              {copy.featured}
            </label>
          </div>

          <Tabs defaultValue="en" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="en">EN</TabsTrigger>
              <TabsTrigger value="fr">FR</TabsTrigger>
              <TabsTrigger value="ar">AR</TabsTrigger>
            </TabsList>

            {(["en", "fr", "ar"] as CatalogLocale[]).map((tabLocale) => (
              <TabsContent key={tabLocale} value={tabLocale} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{copy.badge}</Label>
                    <Input value={form.translations[tabLocale].badge} onChange={(event) => patchTranslation(tabLocale, { badge: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.programTitle}</Label>
                    <Input value={form.translations[tabLocale].title} onChange={(event) => patchTranslation(tabLocale, { title: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.hours}</Label>
                    <Input value={form.translations[tabLocale].hours} onChange={(event) => patchTranslation(tabLocale, { hours: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.duration}</Label>
                    <Input value={form.translations[tabLocale].duration} onChange={(event) => patchTranslation(tabLocale, { duration: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.prerequisite}</Label>
                    <Input value={form.translations[tabLocale].prerequisite} onChange={(event) => patchTranslation(tabLocale, { prerequisite: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>{copy.certification}</Label>
                    <Input value={form.translations[tabLocale].certification} onChange={(event) => patchTranslation(tabLocale, { certification: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>{copy.project}</Label>
                  <textarea
                    className="min-h-[110px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    value={form.translations[tabLocale].project}
                    onChange={(event) => patchTranslation(tabLocale, { project: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{copy.modules}</Label>
                  <textarea
                    className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                    value={form.translations[tabLocale].modules.join("\n")}
                    onChange={(event) =>
                      patchTranslation(tabLocale, {
                        modules: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                      })
                    }
                  />
                  <p className="text-xs text-slate-500">{copy.modulesHint}</p>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <div className="flex flex-wrap gap-3">
            <Button type="button" onClick={handleSave} disabled={!selectedId || saving}>{copy.save}</Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={!selectedId || saving}>{copy.delete}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
