"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Save, BookOpen, Upload, X, Target, Calendar, ImageIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function CreateBookForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle]           = useState("");
  const [author, setAuthor]         = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl]     = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [targetDays, setTargetDays] = useState("");
  const [startDate, setStartDate]   = useState(() => new Date().toISOString().slice(0, 10));

  const [uploading, setUploading]   = useState(false);
  const [loading, setLoading]       = useState(false);

  const pages = parseInt(totalPages) || 0;
  const days  = parseInt(targetDays) || 0;
  const perDay = pages > 0 && days > 0 ? Math.ceil(pages / days) : 0;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Yuklashda xatolik");
      setCoverUrl(data.url);
      toast({ title: "✅ Rasm yuklandi" });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast({ title: "Kitob nomini kiriting", variant: "destructive" });
      return;
    }
    if (pages < 1 || days < 1) {
      toast({ title: "Betlar va kunlar sonini to'g'ri kiriting", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/books", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:       title.trim(),
          author:      author.trim() || null,
          description: description.trim() || null,
          coverUrl:    coverUrl || null,
          totalPages:  pages,
          targetDays:  days,
          startDate,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Xatolik");
      toast({ title: "📚 Kitob rejasi yaratildi!" });
      router.push(`/books/${data.id}`);
      router.refresh();
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="border-0 shadow-sm">
        <CardContent className="p-5 space-y-5">
          {/* Cover + title row */}
          <div className="flex gap-4">
            {/* Cover upload */}
            <div className="shrink-0">
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="relative h-32 w-24 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-400 bg-gray-50 flex flex-col items-center justify-center gap-1 transition-colors overflow-hidden"
              >
                {coverUrl ? (
                  <>
                    <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <span
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-black/50 text-white flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); setCoverUrl(""); }}
                    >
                      <X className="h-3 w-3" />
                    </span>
                  </>
                ) : uploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                ) : (
                  <>
                    <ImageIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-[10px] text-gray-400 font-medium">Muqova</span>
                  </>
                )}
              </button>
            </div>

            {/* Title + author */}
            <div className="flex-1 space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="title">Kitob nomi *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Ihyou Ulumiddin"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="author">Muallif / Egasi</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Masalan: Imom G'azzoliy"
                />
              </div>
              {/* Cover URL alternative */}
              <div className="space-y-1.5">
                <Label htmlFor="coverUrl" className="text-xs text-muted-foreground">
                  yoki rasm havolasi (URL)
                </Label>
                <Input
                  id="coverUrl"
                  value={coverUrl.startsWith("/uploads") ? "" : coverUrl}
                  onChange={(e) => setCoverUrl(e.target.value)}
                  placeholder="https://..."
                  className="text-xs"
                />
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Izoh (ixtiyoriy)</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Kitob haqida qisqacha..."
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
            />
          </div>

          {/* Pages + days + start */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="totalPages">Betlar soni *</Label>
              <Input
                id="totalPages"
                type="number"
                min={1}
                value={totalPages}
                onChange={(e) => setTotalPages(e.target.value)}
                placeholder="320"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="targetDays">Necha kunda *</Label>
              <Input
                id="targetDays"
                type="number"
                min={1}
                value={targetDays}
                onChange={(e) => setTargetDays(e.target.value)}
                placeholder="30"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Boshlash sanasi</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan preview */}
      {perDay > 0 && (
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-emerald-500 flex items-center justify-center shrink-0">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-800">
                Kuniga {perDay} bet o'qishingiz kerak
              </p>
              <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {pages} bet ÷ {days} kun — rejaga rioya qilsangiz o'z vaqtida tugatasiz
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex gap-3">
        <Button type="submit" variant="emerald" disabled={loading || uploading} className="flex-1 sm:flex-none">
          {loading ? (
            <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Yaratilmoqda...</>
          ) : (
            <><Save className="h-4 w-4 mr-2" /> Kitobni saqlash</>
          )}
        </Button>
      </div>
    </form>
  );
}
