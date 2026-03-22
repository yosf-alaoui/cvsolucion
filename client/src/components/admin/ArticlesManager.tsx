import { useEffect, useMemo, useState } from "react";
import { Loader2, Pencil, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  createAdminArticle,
  deleteAdminArticle,
  getAdminArticles,
  type ArticleSummary,
  updateAdminArticle,
  uploadArticleImage,
} from "@/lib/articles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatDateInput(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

function toIsoFromInput(value: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : locale === "fr" ? "fr-CA" : "en-CA", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function ArticlesManager({ locale }: { locale: string }) {
  const copy = useMemo(() => {
    if (locale === "ar") {
      return {
        title: "المقالات",
        subtitle: "أنشئ المقالات وانشرها مع صورة وتاريخ من نفس لوحة التحكم.",
        newArticle: "مقال جديد",
        editArticle: "تعديل المقال",
        articleTitle: "عنوان المقال",
        publishDate: "تاريخ النشر",
        imageUrl: "رابط الصورة",
        uploadImage: "رفع صورة",
        body: "نص المقال",
        save: "حفظ المقال",
        create: "نشر المقال",
        delete: "حذف",
        edit: "تعديل",
        empty: "لا توجد مقالات بعد.",
        imageHint: "يمكنك رفع صورة أو إدخال رابط مباشر.",
        bodyHint: "اكتب المقال هنا. اترك سطراً فارغاً بين الفقرات لعرض منظم.",
        saved: "تم حفظ المقال.",
        deleted: "تم حذف المقال.",
        uploadFailed: "تعذر رفع الصورة.",
      };
    }
    if (locale === "fr") {
      return {
        title: "Articles",
        subtitle: "Creez et publiez vos articles avec image et date depuis le tableau de bord.",
        newArticle: "Nouvel article",
        editArticle: "Modifier l'article",
        articleTitle: "Titre de l'article",
        publishDate: "Date de publication",
        imageUrl: "URL de l'image",
        uploadImage: "Televerser une image",
        body: "Contenu",
        save: "Enregistrer",
        create: "Publier",
        delete: "Supprimer",
        edit: "Modifier",
        empty: "Aucun article pour le moment.",
        imageHint: "Vous pouvez televerser une image ou coller une URL directe.",
        bodyHint: "Ecrivez l'article ici. Laissez une ligne vide entre les paragraphes.",
        saved: "Article enregistre.",
        deleted: "Article supprime.",
        uploadFailed: "Impossible de televerser l'image.",
      };
    }
    return {
      title: "Articles",
      subtitle: "Create and publish articles with an image and date from the dashboard.",
      newArticle: "New article",
      editArticle: "Edit article",
      articleTitle: "Article title",
      publishDate: "Publish date",
      imageUrl: "Image URL",
      uploadImage: "Upload image",
      body: "Article body",
      save: "Save article",
      create: "Publish article",
      delete: "Delete",
      edit: "Edit",
      empty: "No articles yet.",
      imageHint: "Upload an image or paste a direct image URL.",
      bodyHint: "Write the article here. Leave a blank line between paragraphs for clean reading.",
      saved: "Article saved.",
      deleted: "Article deleted.",
      uploadFailed: "Failed to upload image.",
    };
  }, [locale]);

  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [publishedAt, setPublishedAt] = useState("");

  const selectedArticle = articles.find((item) => item.id === selectedId) ?? null;

  const resetForm = () => {
    setSelectedId(null);
    setTitle("");
    setBody("");
    setImageUrl("");
    setPublishedAt("");
  };

  const load = async () => {
    setBusy(true);
    try {
      const response = await getAdminArticles();
      const nextArticles = Array.isArray(response.articles) ? response.articles : [];
      setArticles(nextArticles);
      if (nextArticles.length && !selectedId) {
        const first = nextArticles[0];
        setSelectedId(first.id);
        setTitle(first.title);
        setBody(first.body);
        setImageUrl(first.imageUrl || "");
        setPublishedAt(formatDateInput(first.publishedAt));
      }
    } catch (error: any) {
      toast.error(error?.message || "Failed to load articles.");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSelect = (article: ArticleSummary) => {
    setSelectedId(article.id);
    setTitle(article.title);
    setBody(article.body);
    setImageUrl(article.imageUrl || "");
    setPublishedAt(formatDateInput(article.publishedAt));
  };

  const handleUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const response = await uploadArticleImage(file);
      setImageUrl(response.image.url);
      toast.success(response.image.fileName);
    } catch (error: any) {
      toast.error(error?.message || copy.uploadFailed);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        title,
        body,
        imageUrl: imageUrl || null,
        publishedAt: toIsoFromInput(publishedAt),
      };

      if (selectedArticle) {
        const response = await updateAdminArticle(selectedArticle.id, payload);
        setArticles((current) => current.map((item) => (item.id === response.article.id ? response.article : item)));
        handleSelect(response.article);
      } else {
        const response = await createAdminArticle(payload);
        setArticles((current) => [response.article, ...current]);
        handleSelect(response.article);
      }

      toast.success(copy.saved);
    } catch (error: any) {
      toast.error(error?.message || "Failed to save article.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedArticle) return;
    setSaving(true);
    try {
      await deleteAdminArticle(selectedArticle.id);
      const next = articles.filter((item) => item.id !== selectedArticle.id);
      setArticles(next);
      resetForm();
      if (next[0]) {
        handleSelect(next[0]);
      }
      toast.success(copy.deleted);
    } catch (error: any) {
      toast.error(error?.message || "Failed to delete article.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>{copy.title}</CardTitle>
              <p className="mt-2 text-sm text-slate-500">{copy.subtitle}</p>
            </div>
            <Button type="button" variant="outline" onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              {copy.newArticle}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[620px] pr-3">
            <div className="space-y-3">
              {busy ? (
                <div className="text-sm text-slate-500">Loading...</div>
              ) : articles.length ? (
                articles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => handleSelect(article)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      article.id === selectedId
                        ? "border-primary/40 bg-primary/5"
                        : "border-slate-200 bg-white hover:border-primary/30 hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-base font-semibold text-slate-900">{article.title}</div>
                        <div className="mt-1 text-xs text-slate-500">{formatDate(article.publishedAt, locale)}</div>
                      </div>
                      <Pencil className="h-4 w-4 text-slate-400" />
                    </div>
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">{article.excerpt}</p>
                  </button>
                ))
              ) : (
                <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                  {copy.empty}
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{selectedArticle ? copy.editArticle : copy.newArticle}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="article-title">{copy.articleTitle}</Label>
            <Input id="article-title" value={title} onChange={(event) => setTitle(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-date">{copy.publishDate}</Label>
            <Input id="article-date" type="datetime-local" value={publishedAt} onChange={(event) => setPublishedAt(event.target.value)} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-image">{copy.imageUrl}</Label>
            <Input id="article-image" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
            <p className="text-xs text-slate-500">{copy.imageHint}</p>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {copy.uploadImage}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(event) => {
                  handleUpload(event.target.files?.[0] || null);
                  event.currentTarget.value = "";
                }}
              />
            </label>
            {imageUrl ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <img src={imageUrl} alt={title || "Article preview"} className="h-52 w-full object-cover" />
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="article-body">{copy.body}</Label>
            <Textarea
              id="article-body"
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="min-h-[320px] resize-y"
            />
            <p className="text-xs text-slate-500">{copy.bodyHint}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={handleSave} disabled={saving || uploading}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {selectedArticle ? copy.save : copy.create}
            </Button>
            {selectedArticle ? (
              <Button type="button" variant="outline" onClick={handleDelete} disabled={saving}>
                <Trash2 className="mr-2 h-4 w-4" />
                {copy.delete}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
