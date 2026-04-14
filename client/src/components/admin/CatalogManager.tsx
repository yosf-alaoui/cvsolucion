import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  createAdminCatalogPackage,
  deleteAdminCatalogPackage,
  deleteAdminCatalogCountryPricing,
  getAdminCatalog,
  updateAdminCatalogPackage,
  updateAdminCatalogPricing,
  updateAdminCatalogTrainingPricing,
  upsertAdminCatalogCountryPricing,
  type AdminCatalogResponse,
  type CatalogBookingPrices,
  type CatalogCountryPriceOverride,
  type CatalogLocale,
  type CatalogPackageRecord,
  type CatalogPackageTranslation,
  type CatalogTrainingPrices,
} from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getBookingCountryLabel, getBookingCountryOptions, type BookingCountryOption } from "@/lib/bookingTime";

function centsToDollars(value: number) {
  return (value / 100).toFixed(2);
}

function dollarsToCents(value: string) {
  const normalized = Number(String(value || "0").replace(/[^\d.]/g, ""));
  return Number.isFinite(normalized) ? Math.round(normalized * 100) : 0;
}

function optionalDollarsToCents(value: string) {
  if (!String(value || "").trim()) return undefined;
  return dollarsToCents(value);
}

function emptyTranslation(): CatalogPackageTranslation {
  return {
    title: "",
    subtitle: "",
    duration: "",
    priceLabel: "",
    bullets: [],
  };
}

function emptyPackageTranslations() {
  return {
    en: emptyTranslation(),
    fr: emptyTranslation(),
    ar: emptyTranslation(),
  } satisfies Record<CatalogLocale, CatalogPackageTranslation>;
}

export default function CatalogManager({ locale }: { locale: string }) {
  const [data, setData] = useState<AdminCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingPricing, setSavingPricing] = useState(false);
  const [savingTrainingPricing, setSavingTrainingPricing] = useState(false);
  const [savingCountryPricing, setSavingCountryPricing] = useState(false);
  const [savingPackage, setSavingPackage] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState("US");
  const [priceForm, setPriceForm] = useState({
    standardConsultation: "",
    standardSupport: "",
    expressConsultation: "",
    expressSupport: "",
  });
  const [trainingPriceForm, setTrainingPriceForm] = useState({
    level1: "",
    level2: "",
    level3: "",
    level4: "",
    bundle: "",
  });
  const [countryPricingForm, setCountryPricingForm] = useState<{
    active: boolean;
    bookingPrices: Record<keyof CatalogBookingPrices, string>;
    trainingProgramPrices: Record<string, string>;
  }>({
    active: true,
    bookingPrices: {
      standardConsultation: "",
      standardSupport: "",
      expressConsultation: "",
      expressSupport: "",
    },
    trainingProgramPrices: {},
  });
  const [packageForm, setPackageForm] = useState<{
    active: boolean;
    highlight: boolean;
    order: number;
    translations: Record<CatalogLocale, CatalogPackageTranslation>;
  }>({
    active: true,
    highlight: false,
    order: 1,
    translations: emptyPackageTranslations(),
  });

  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "الكتالوج التجاري",
        subtitle: "تحكم في أسعار الحجز وباقات الخدمات العامة من مكان واحد.",
        bookingPrices: "أسعار الحجز",
        standardConsultation: "استشارة عادية",
        standardSupport: "دعم عادي",
        expressConsultation: "استشارة إكسبريس",
        expressSupport: "دعم إكسبريس",
        savePrices: "حفظ الأسعار",
        packages: "باقات الخدمات",
        newPackage: "باقة جديدة",
        active: "مفعلة",
        highlight: "مميزة",
        order: "الترتيب",
        savePackage: "حفظ الباقة",
        deletePackage: "حذف الباقة",
        localeTabs: { en: "EN", fr: "FR", ar: "AR" },
        titleField: "العنوان",
        subtitleField: "العنوان الفرعي",
        durationField: "المدة",
        priceField: "السعر الظاهر",
        bulletsField: "النقاط",
        bulletsHint: "كل سطر نقطة مستقلة",
        priceSaved: "تم تحديث الأسعار.",
        packageSaved: "تم حفظ الباقة.",
        packageDeleted: "تم حذف الباقة.",
        countryPricing: "تسعير حسب الدولة",
        countryPricingHint: "اترك أي خانة فارغة لاستعمال السعر الرئيسي.",
        country: "الدولة",
        saveCountryPrices: "حفظ تسعير الدولة",
        deleteCountryPrices: "حذف تسعير الدولة",
        countryPricesSaved: "تم تحديث تسعير الدولة.",
        countryPricesDeleted: "تم حذف تسعير الدولة.",
        noCountryOverrides: "لا يوجد تسعير خاص بالدول بعد.",
        inactiveCountry: "غير مفعلة",
      };
    }
    if (locale === "fr") {
      return {
        title: "Catalogue commercial",
        subtitle: "Gérez les tarifs de booking et les packages publics depuis un seul endroit.",
        bookingPrices: "Tarifs de booking",
        standardConsultation: "Consultation standard",
        standardSupport: "Support standard",
        expressConsultation: "Consultation express",
        expressSupport: "Support express",
        savePrices: "Enregistrer les tarifs",
        packages: "Packages service",
        newPackage: "Nouveau package",
        active: "Actif",
        highlight: "Mis en avant",
        order: "Ordre",
        savePackage: "Enregistrer le package",
        deletePackage: "Supprimer le package",
        localeTabs: { en: "EN", fr: "FR", ar: "AR" },
        titleField: "Titre",
        subtitleField: "Sous-titre",
        durationField: "Duree",
        priceField: "Prix affiche",
        bulletsField: "Points",
        bulletsHint: "Une ligne = un point",
        priceSaved: "Tarifs mis a jour.",
        packageSaved: "Package enregistre.",
        packageDeleted: "Package supprime.",
        countryPricing: "Tarifs par pays",
        countryPricingHint: "Laissez un champ vide pour utiliser le tarif principal.",
        country: "Pays",
        saveCountryPrices: "Enregistrer le pays",
        deleteCountryPrices: "Supprimer le pays",
        countryPricesSaved: "Tarifs pays mis a jour.",
        countryPricesDeleted: "Tarifs pays supprimes.",
        noCountryOverrides: "Aucun tarif par pays pour l'instant.",
        inactiveCountry: "inactif",
      };
    }
    return {
      title: "Commercial catalog",
      subtitle: "Control booking prices and public service packages from one place.",
      bookingPrices: "Booking prices",
      standardConsultation: "Standard consultation",
      standardSupport: "Standard support",
      expressConsultation: "Express consultation",
      expressSupport: "Express support",
      savePrices: "Save prices",
      packages: "Service packages",
      newPackage: "New package",
      active: "Active",
      highlight: "Highlighted",
      order: "Order",
      savePackage: "Save package",
      deletePackage: "Delete package",
      localeTabs: { en: "EN", fr: "FR", ar: "AR" },
      titleField: "Title",
      subtitleField: "Subtitle",
      durationField: "Duration",
      priceField: "Displayed price",
      bulletsField: "Bullets",
      bulletsHint: "One line per bullet",
      priceSaved: "Prices updated.",
      packageSaved: "Package saved.",
      packageDeleted: "Package deleted.",
      countryPricing: "Country pricing",
      countryPricingHint: "Leave a field blank to use the main price.",
      country: "Country",
      saveCountryPrices: "Save country prices",
      deleteCountryPrices: "Delete country pricing",
      countryPricesSaved: "Country pricing updated.",
      countryPricesDeleted: "Country pricing deleted.",
      noCountryOverrides: "No country overrides yet.",
      inactiveCountry: "off",
    };
  }, [locale]);

  const trainingCopy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "أسعار التدريب",
        level1: "المستوى 1 - Core Designer",
        level2: "المستوى 2 - Catalog Engineer",
        level3: "المستوى 3 - Production Specialist",
        level4: "المستوى 4 - CV Consultant",
        bundle: "المسار الكامل",
        save: "حفظ أسعار التدريب",
        saved: "تم تحديث أسعار التدريب.",
      };
    }
    if (locale === "fr") {
      return {
        title: "Tarifs des formations",
        level1: "Niveau 1 - Core Designer",
        level2: "Niveau 2 - Catalog Engineer",
        level3: "Niveau 3 - Production Specialist",
        level4: "Niveau 4 - CV Consultant",
        bundle: "Parcours complet",
        save: "Enregistrer les tarifs formation",
        saved: "Tarifs formation mis a jour.",
      };
    }
    return {
      title: "Training prices",
      level1: "Level 1 - Core Designer",
      level2: "Level 2 - Catalog Engineer",
      level3: "Level 3 - Production Specialist",
      level4: "Level 4 - CV Consultant",
      bundle: "Complete path",
      save: "Save training prices",
      saved: "Training prices updated.",
    };
  }, [locale]);

  async function loadCatalog() {
    const response = await getAdminCatalog();
    setData(response);
    setPriceForm({
      standardConsultation: centsToDollars(response.bookingPrices.standardConsultation),
      standardSupport: centsToDollars(response.bookingPrices.standardSupport),
      expressConsultation: centsToDollars(response.bookingPrices.expressConsultation),
      expressSupport: centsToDollars(response.bookingPrices.expressSupport),
    });
    setTrainingPriceForm({
      level1: centsToDollars(response.trainingPrices.level1),
      level2: centsToDollars(response.trainingPrices.level2),
      level3: centsToDollars(response.trainingPrices.level3),
      level4: centsToDollars(response.trainingPrices.level4),
      bundle: centsToDollars(response.trainingPrices.bundle),
    });

    const first = response.servicePackages[0] ?? null;
    setSelectedId(first?.id ?? null);
    if (first) {
      setPackageForm({
        active: first.active,
        highlight: first.highlight,
        order: first.order,
        translations: {
          en: { ...first.translations.en },
          fr: { ...first.translations.fr },
          ar: { ...first.translations.ar },
        },
      });
    }

    const firstCountryOverride = response.countryPriceOverrides?.[0];
    const nextCountryCode = firstCountryOverride?.countryCode || selectedCountryCode;
    syncCountryPricingForm(nextCountryCode, response.countryPriceOverrides || [], response.trainingPrograms || []);
  }

  useEffect(() => {
    loadCatalog()
      .catch((error: Error) => toast.error(error.message))
      .finally(() => setLoading(false));
  }, []);

  const packages = data?.servicePackages ?? [];
  const countryOptions = useMemo(() => getBookingCountryOptions(locale), [locale]);
  const countryOverrides = data?.countryPriceOverrides ?? [];
  const selectedCountryOverride = countryOverrides.find((item) => item.countryCode === selectedCountryCode) ?? null;
  const trainingPrograms = data?.trainingPrograms ?? [];

  function syncCountryPricingForm(
    countryCode: string,
    overrides: CatalogCountryPriceOverride[] = countryOverrides,
    programs = trainingPrograms
  ) {
    const override = overrides.find((item) => item.countryCode === countryCode) ?? null;
    setSelectedCountryCode(countryCode);
    setCountryPricingForm({
      active: override?.active ?? true,
      bookingPrices: {
        standardConsultation: typeof override?.bookingPrices.standardConsultation === "number" ? centsToDollars(override.bookingPrices.standardConsultation) : "",
        standardSupport: typeof override?.bookingPrices.standardSupport === "number" ? centsToDollars(override.bookingPrices.standardSupport) : "",
        expressConsultation: typeof override?.bookingPrices.expressConsultation === "number" ? centsToDollars(override.bookingPrices.expressConsultation) : "",
        expressSupport: typeof override?.bookingPrices.expressSupport === "number" ? centsToDollars(override.bookingPrices.expressSupport) : "",
      },
      trainingProgramPrices: Object.fromEntries(
        programs.map((program) => [
          program.key,
          typeof override?.trainingProgramPrices[program.key] === "number" ? centsToDollars(override.trainingProgramPrices[program.key]) : "",
        ])
      ),
    });
  }

  function syncPackageForm(record: CatalogPackageRecord) {
    setSelectedId(record.id);
    setPackageForm({
      active: record.active,
      highlight: record.highlight,
      order: record.order,
      translations: {
        en: { ...record.translations.en },
        fr: { ...record.translations.fr },
        ar: { ...record.translations.ar },
      },
    });
  }

  async function handleSavePrices() {
    try {
      setSavingPricing(true);
      const payload: CatalogBookingPrices = {
        standardConsultation: dollarsToCents(priceForm.standardConsultation),
        standardSupport: dollarsToCents(priceForm.standardSupport),
        expressConsultation: dollarsToCents(priceForm.expressConsultation),
        expressSupport: dollarsToCents(priceForm.expressSupport),
      };
      const response = await updateAdminCatalogPricing(payload);
      setData((current) => (current ? { ...current, bookingPrices: response.bookingPrices } : current));
      toast.success(copy.priceSaved);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save prices.");
    } finally {
      setSavingPricing(false);
    }
  }

  async function handleSaveTrainingPrices() {
    try {
      setSavingTrainingPricing(true);
      const payload: CatalogTrainingPrices = {
        level1: dollarsToCents(trainingPriceForm.level1),
        level2: dollarsToCents(trainingPriceForm.level2),
        level3: dollarsToCents(trainingPriceForm.level3),
        level4: dollarsToCents(trainingPriceForm.level4),
        bundle: dollarsToCents(trainingPriceForm.bundle),
      };
      const response = await updateAdminCatalogTrainingPricing(payload);
      setData((current) => (current ? { ...current, trainingPrices: response.trainingPrices } : current));
      toast.success(trainingCopy.saved);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save training prices.");
    } finally {
      setSavingTrainingPricing(false);
    }
  }

  async function handleSaveCountryPrices() {
    try {
      setSavingCountryPricing(true);
      const bookingPrices: Partial<CatalogBookingPrices> = {};
      for (const key of ["standardConsultation", "standardSupport", "expressConsultation", "expressSupport"] as const) {
        const cents = optionalDollarsToCents(countryPricingForm.bookingPrices[key]);
        if (typeof cents === "number") bookingPrices[key] = cents;
      }

      const trainingProgramPrices: Record<string, number> = {};
      for (const program of trainingPrograms) {
        const cents = optionalDollarsToCents(countryPricingForm.trainingProgramPrices[program.key]);
        if (typeof cents === "number") trainingProgramPrices[program.key] = cents;
      }

      const response = await upsertAdminCatalogCountryPricing(selectedCountryCode, {
        active: countryPricingForm.active,
        bookingPrices,
        trainingProgramPrices,
      });
      setData((current) => (current ? { ...current, countryPriceOverrides: response.countryPriceOverrides } : current));
      syncCountryPricingForm(selectedCountryCode, response.countryPriceOverrides, trainingPrograms);
      toast.success(copy.countryPricesSaved);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save country pricing.");
    } finally {
      setSavingCountryPricing(false);
    }
  }

  async function handleDeleteCountryPrices() {
    try {
      setSavingCountryPricing(true);
      const response = await deleteAdminCatalogCountryPricing(selectedCountryCode);
      setData((current) => (current ? { ...current, countryPriceOverrides: response.countryPriceOverrides } : current));
      syncCountryPricingForm(selectedCountryCode, response.countryPriceOverrides, trainingPrograms);
      toast.success(copy.countryPricesDeleted);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete country pricing.");
    } finally {
      setSavingCountryPricing(false);
    }
  }

  async function handleCreatePackage() {
    try {
      const response = await createAdminCatalogPackage({
        active: true,
        highlight: false,
        order: (packages.at(-1)?.order || 0) + 1,
        translations: emptyPackageTranslations(),
      });
      setData((current) =>
        current
          ? { ...current, servicePackages: [...current.servicePackages, response.package].sort((a, b) => a.order - b.order) }
          : current
      );
      syncPackageForm(response.package);
    } catch (error: any) {
      toast.error(error?.message || "Failed to create package.");
    }
  }

  async function handleSavePackage() {
    if (!selectedId) return;
    try {
      setSavingPackage(true);
      const response = await updateAdminCatalogPackage(selectedId, {
        active: packageForm.active,
        highlight: packageForm.highlight,
        order: packageForm.order,
        translations: packageForm.translations,
      });
      setData((current) =>
        current
          ? {
              ...current,
              servicePackages: current.servicePackages
                .map((item) => (item.id === selectedId ? response.package : item))
                .sort((a, b) => a.order - b.order),
            }
          : current
      );
      syncPackageForm(response.package);
      toast.success(copy.packageSaved);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save package.");
    } finally {
      setSavingPackage(false);
    }
  }

  async function handleDeletePackage() {
    if (!selectedId) return;
    try {
      await deleteAdminCatalogPackage(selectedId);
      const nextPackages = packages.filter((item) => item.id !== selectedId);
      setData((current) => (current ? { ...current, servicePackages: nextPackages } : current));
      if (nextPackages[0]) {
        syncPackageForm(nextPackages[0]);
      } else {
        setSelectedId(null);
        setPackageForm({
          active: true,
          highlight: false,
          order: 1,
          translations: emptyPackageTranslations(),
        });
      }
      toast.success(copy.packageDeleted);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete package.");
    }
  }

  if (loading) {
    return <Card><CardContent className="p-6 text-sm text-slate-500">Loading catalog...</CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{copy.title}</CardTitle>
          <p className="text-sm text-slate-600">{copy.subtitle}</p>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card>
          <CardHeader>
            <CardTitle>{copy.bookingPrices}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{copy.standardConsultation}</Label>
              <Input value={priceForm.standardConsultation} onChange={(event) => setPriceForm((current) => ({ ...current, standardConsultation: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{copy.standardSupport}</Label>
              <Input value={priceForm.standardSupport} onChange={(event) => setPriceForm((current) => ({ ...current, standardSupport: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{copy.expressConsultation}</Label>
              <Input value={priceForm.expressConsultation} onChange={(event) => setPriceForm((current) => ({ ...current, expressConsultation: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{copy.expressSupport}</Label>
              <Input value={priceForm.expressSupport} onChange={(event) => setPriceForm((current) => ({ ...current, expressSupport: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Button type="button" onClick={handleSavePrices} disabled={savingPricing}>{copy.savePrices}</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{trainingCopy.title}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>{trainingCopy.level1}</Label>
              <Input value={trainingPriceForm.level1} onChange={(event) => setTrainingPriceForm((current) => ({ ...current, level1: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{trainingCopy.level2}</Label>
              <Input value={trainingPriceForm.level2} onChange={(event) => setTrainingPriceForm((current) => ({ ...current, level2: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{trainingCopy.level3}</Label>
              <Input value={trainingPriceForm.level3} onChange={(event) => setTrainingPriceForm((current) => ({ ...current, level3: event.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>{trainingCopy.level4}</Label>
              <Input value={trainingPriceForm.level4} onChange={(event) => setTrainingPriceForm((current) => ({ ...current, level4: event.target.value }))} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>{trainingCopy.bundle}</Label>
              <Input value={trainingPriceForm.bundle} onChange={(event) => setTrainingPriceForm((current) => ({ ...current, bundle: event.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <Button type="button" onClick={handleSaveTrainingPrices} disabled={savingTrainingPricing}>{trainingCopy.save}</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>{copy.countryPricing}</CardTitle>
            <p className="text-sm text-slate-600">{copy.countryPricingHint}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{copy.country}</Label>
                  <Select
                    value={selectedCountryCode}
                    onValueChange={(countryCode) => syncCountryPricingForm(countryCode)}
                  >
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder={copy.country} />
                    </SelectTrigger>
                    <SelectContent>
                      {countryOptions.map((option: BookingCountryOption) => (
                        <SelectItem key={option.code} value={option.code}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={countryPricingForm.active}
                    onChange={(event) => setCountryPricingForm((current) => ({ ...current, active: event.target.checked }))}
                  />
                  {copy.active}
                </label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  {countryOverrides.length ? (
                    <div className="flex flex-wrap gap-2">
                      {countryOverrides.map((override) => (
                        <button
                          key={override.countryCode}
                          type="button"
                          onClick={() => syncCountryPricingForm(override.countryCode)}
                          className={`rounded-full border px-3 py-1 font-semibold ${
                            selectedCountryCode === override.countryCode ? "border-primary bg-primary text-white" : "border-slate-200 bg-white text-slate-700"
                          }`}
                        >
                          {getBookingCountryLabel(override.countryCode, locale)} {override.active ? "" : `(${copy.inactiveCountry})`}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <span>{copy.noCountryOverrides}</span>
                  )}
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-4 text-sm font-bold text-slate-900">{copy.bookingPrices}</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {(["standardConsultation", "standardSupport", "expressConsultation", "expressSupport"] as const).map((key) => (
                      <div key={key} className="space-y-2">
                        <Label>
                          {{
                            standardConsultation: copy.standardConsultation,
                            standardSupport: copy.standardSupport,
                            expressConsultation: copy.expressConsultation,
                            expressSupport: copy.expressSupport,
                          }[key]}
                        </Label>
                        <Input
                          value={countryPricingForm.bookingPrices[key]}
                          placeholder={centsToDollars(data?.bookingPrices[key] || 0)}
                          onChange={(event) =>
                            setCountryPricingForm((current) => ({
                              ...current,
                              bookingPrices: { ...current.bookingPrices, [key]: event.target.value },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 p-4">
                  <div className="mb-4 text-sm font-bold text-slate-900">{trainingCopy.title}</div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {trainingPrograms.map((program) => (
                      <div key={program.key} className="space-y-2">
                        <Label>{program.translations.en.title || program.key}</Label>
                        <Input
                          value={countryPricingForm.trainingProgramPrices[program.key] || ""}
                          placeholder={centsToDollars(program.priceCents)}
                          onChange={(event) =>
                            setCountryPricingForm((current) => ({
                              ...current,
                              trainingProgramPrices: { ...current.trainingProgramPrices, [program.key]: event.target.value },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="button" onClick={handleSaveCountryPrices} disabled={savingCountryPricing}>
                {copy.saveCountryPrices}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDeleteCountryPrices}
                disabled={savingCountryPricing || !selectedCountryOverride}
              >
                {copy.deleteCountryPrices}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{copy.packages}</CardTitle>
            <Button type="button" variant="outline" onClick={handleCreatePackage}>{copy.newPackage}</Button>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[280px_1fr]">
            <ScrollArea className="h-[560px] rounded-2xl border border-slate-200 p-3">
              <div className="space-y-3">
                {packages.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => syncPackageForm(item)}
                    className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                      selectedId === item.id ? "border-primary bg-primary/5" : "border-slate-200 bg-white hover:border-primary/25"
                    }`}
                  >
                    <div className="font-semibold text-slate-900">{item.translations.en.title || "Untitled package"}</div>
                    <div className="mt-1 text-xs text-slate-500">#{item.order} · {item.active ? copy.active : "Inactive"}</div>
                  </button>
                ))}
              </div>
            </ScrollArea>

            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={packageForm.active} onChange={(event) => setPackageForm((current) => ({ ...current, active: event.target.checked }))} />
                  {copy.active}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={packageForm.highlight} onChange={(event) => setPackageForm((current) => ({ ...current, highlight: event.target.checked }))} />
                  {copy.highlight}
                </label>
                <div className="space-y-2">
                  <Label>{copy.order}</Label>
                  <Input type="number" value={packageForm.order} onChange={(event) => setPackageForm((current) => ({ ...current, order: Number(event.target.value) || 1 }))} />
                </div>
              </div>

              <Tabs defaultValue="en" className="space-y-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="en">{copy.localeTabs.en}</TabsTrigger>
                  <TabsTrigger value="fr">{copy.localeTabs.fr}</TabsTrigger>
                  <TabsTrigger value="ar">{copy.localeTabs.ar}</TabsTrigger>
                </TabsList>

                {(["en", "fr", "ar"] as CatalogLocale[]).map((tabLocale) => (
                  <TabsContent key={tabLocale} value={tabLocale} className="space-y-4">
                    <div className="space-y-2">
                      <Label>{copy.titleField}</Label>
                      <Input
                        value={packageForm.translations[tabLocale].title}
                        onChange={(event) =>
                          setPackageForm((current) => ({
                            ...current,
                            translations: {
                              ...current.translations,
                              [tabLocale]: { ...current.translations[tabLocale], title: event.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.subtitleField}</Label>
                      <Input
                        value={packageForm.translations[tabLocale].subtitle}
                        onChange={(event) =>
                          setPackageForm((current) => ({
                            ...current,
                            translations: {
                              ...current.translations,
                              [tabLocale]: { ...current.translations[tabLocale], subtitle: event.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label>{copy.durationField}</Label>
                        <Input
                          value={packageForm.translations[tabLocale].duration}
                          onChange={(event) =>
                            setPackageForm((current) => ({
                              ...current,
                              translations: {
                                ...current.translations,
                                [tabLocale]: { ...current.translations[tabLocale], duration: event.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{copy.priceField}</Label>
                        <Input
                          value={packageForm.translations[tabLocale].priceLabel}
                          onChange={(event) =>
                            setPackageForm((current) => ({
                              ...current,
                              translations: {
                                ...current.translations,
                                [tabLocale]: { ...current.translations[tabLocale], priceLabel: event.target.value },
                              },
                            }))
                          }
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>{copy.bulletsField}</Label>
                      <textarea
                        className="min-h-[180px] w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm"
                        value={packageForm.translations[tabLocale].bullets.join("\n")}
                        onChange={(event) =>
                          setPackageForm((current) => ({
                            ...current,
                            translations: {
                              ...current.translations,
                              [tabLocale]: {
                                ...current.translations[tabLocale],
                                bullets: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean),
                              },
                            },
                          }))
                        }
                      />
                      <p className="text-xs text-slate-500">{copy.bulletsHint}</p>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>

              <div className="flex flex-wrap gap-3">
                <Button type="button" onClick={handleSavePackage} disabled={!selectedId || savingPackage}>{copy.savePackage}</Button>
                <Button type="button" variant="destructive" onClick={handleDeletePackage} disabled={!selectedId || savingPackage}>{copy.deletePackage}</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
