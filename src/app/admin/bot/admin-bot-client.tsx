"use client";

import { useState } from "react";
import { Send, Bot, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export function AdminBotClient() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState<number | null>(null);

  const handleBroadcast = async () => {
    if (!message.trim()) {
      toast({ title: "Xabar matnini kiriting", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setSent(data.sent);
      setTitle("");
      setMessage("");
      toast({ title: `✅ ${data.sent} ta foydalanuvchiga yuborildi!` });
    } catch (err: any) {
      toast({ title: "Xato", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const botUsername = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;
  const botToken = typeof window !== "undefined" ? "***" : "";

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-600" />
          Telegram Bot Boshqaruvi
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Broadcast xabarlar yuborish va bot sozlamalari
        </p>
      </div>

      {/* Bot status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bot Holati</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <span className="text-sm font-medium">Bot ishlayapti</span>
            </div>
            <Badge variant="success">Online</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg border">
              <p className="text-muted-foreground text-xs">Bot Username</p>
              <p className="font-mono font-medium mt-0.5">
                @{botUsername ?? "sozlanmagan"}
              </p>
            </div>
            <div className="p-3 rounded-lg border">
              <p className="text-muted-foreground text-xs">Webhook</p>
              <p className="font-medium mt-0.5 text-emerald-600">
                /api/telegram/webhook
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Broadcast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-blue-600" />
            Broadcast Xabar
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Sarlavha (ixtiyoriy)</Label>
            <Input
              placeholder="Xabar sarlavhasi..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Xabar matni *</Label>
            <textarea
              rows={4}
              placeholder="Barcha foydalanuvchilarga yuboriladigan xabar..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
            />
          </div>

          {sent !== null && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Oxirgi yuborish: {sent} ta foydalanuvchiga
            </div>
          )}

          <Button
            onClick={handleBroadcast}
            disabled={loading || !message.trim()}
            className="w-full"
            variant="telegram"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Yuborilmoqda...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Barcha Foydalanuvchilarga Yuborish
              </>
            )}
          </Button>

          <p className="text-xs text-muted-foreground">
            ⚠️ Bu xabar Telegram akkauntlari bog'langan barcha
            foydalanuvchilarga yuboriladi. Ehtiyot bo'ling.
          </p>
        </CardContent>
      </Card>

      {/* Bot commands */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Bot Buyruqlari</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {[
              { cmd: "/start", desc: "Botni ishga tushirish va hush kelibsiz xabari" },
              { cmd: "/my_juz", desc: "Mening faol poralarimni ko'rish" },
            ].map((c) => (
              <div key={c.cmd} className="flex items-center gap-3 p-2 rounded-lg border">
                <code className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                  {c.cmd}
                </code>
                <span className="text-muted-foreground">{c.desc}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
