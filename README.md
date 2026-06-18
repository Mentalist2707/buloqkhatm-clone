# BuloqKhatm 🌿

> **Global Qur'on Xatmi Platformasi** — Dunyo bo'ylab musulmonlarni birlashtirib, Qur'onni jamoaviy xatm qilish imkonini beruvchi platforma.

بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ

---

## 🚀 Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend | Next.js 15, TypeScript, TailwindCSS, ShadCN UI |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (Telegram + Google) |
| Hosting | Vercel + Railway/Supabase |

---

## 📋 Asosiy Imkoniyatlar

- ✅ **Jamoaviy Xatm** — 30 pora avtomatik taqsimlanadi
- ✅ **Telegram Mini App** — Bot orqali to'liq kirish
- ✅ **Ajr Ball Tizimi** — Har pora uchun +10 ball
- ✅ **Daraja Tizimi** — Beginner → Buloq Legend
- ✅ **Reyting** — TOP 10/100 leaderboard
- ✅ **Super Admin Panel** — Foydalanuvchi va xatm boshqaruvi
- ✅ **Telegram Broadcast** — Barcha foydalanuvchilarga xabar
- ✅ **Pora Limit** — 1 foydalanuvchi max 2 pora

---

## ⚙️ O'rnatish

### 1. Talablar

```bash
Node.js >= 18
PostgreSQL database
Telegram Bot Token (BotFather dan)
Google OAuth credentials (ixtiyoriy)
```

### 2. O'rnatish

```bash
# Klonlash
git clone https://github.com/Fedya-create/buloqkhatm
cd buloqkhatm

# Paketlarni o'rnatish
npm install

# Environment variables
cp .env.example .env
# .env faylini to'ldiring
```

### 3. Environment Variables

```env
DATABASE_URL="postgresql://..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret"
TELEGRAM_BOT_TOKEN="bot_token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="bot_username"
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Database

```bash
npx prisma generate
npx prisma db push
```

### 5. Ishga tushirish

```bash
npm run dev
```

---

## 🤖 Telegram Bot Sozlash

1. **BotFather** da bot yarating va tokenni `.env` ga qo'ying
2. **Webhook** o'rnating:
```bash
curl -X POST "https://api.telegram.org/bot{TOKEN}/setWebhook" \
  -d "url=https://your-domain.com/api/telegram/webhook"
```
3. **Mini App** URL ni BotFather da sozlang

---

## 📁 Loyiha Tuzilmasi

```
src/
├── app/
│   ├── (pages)/
│   │   ├── dashboard/          # Bosh sahifa
│   │   ├── khatms/             # Xatmlar
│   │   │   ├── [id]/           # Xatm detail + 30 pora
│   │   │   └── create/         # Yangi xatm
│   │   ├── profile/            # Profil, ballar, medallar
│   │   ├── leaderboard/        # Reyting
│   │   ├── notifications/      # Bildirishnomalar
│   │   ├── telegram/           # Telegram Mini App
│   │   └── admin/              # Super Admin Panel
│   │       ├── users/
│   │       ├── khatms/
│   │       ├── stats/
│   │       └── bot/
│   ├── api/
│   │   ├── auth/[...nextauth]/ # NextAuth
│   │   ├── khatms/             # Xatm CRUD
│   │   ├── juz/[id]/           # Pora olish/tasdiqlash
│   │   ├── notifications/      # Bildirishnomalar
│   │   ├── users/              # Profil
│   │   ├── admin/              # Admin APIs
│   │   └── telegram/webhook/  # Bot webhook
│   └── auth/signin/            # Login sahifasi
├── components/
│   ├── layout/                 # Navbar, Sidebar
│   ├── ui/                     # ShadCN komponentlari
│   └── providers/              # Session provider
├── lib/
│   ├── auth.ts                 # NextAuth konfiguratsiya
│   ├── prisma.ts               # Prisma client
│   ├── telegram.ts             # Bot API helper
│   └── utils.ts                # Yordamchi funksiyalar
├── hooks/
│   └── use-toast.ts
└── types/
    └── next-auth.d.ts
```

---

## 🎯 Ball Tizimi

| Amal | Ball |
|------|------|
| 1 pora o'qish | +10 Ajr Ball |
| Xatm yakunlash | +50 Ajr Ball |
| 7 kun streak | +20 Ajr Ball |
| Do'st taklif | +15 Ajr Ball |

## 📊 Darajalar

| Daraja | Kerakli Ball |
|--------|-------------|
| 🌱 Beginner | 0 |
| 📖 Reader | 100 |
| 📚 Hafiz Candidate | 500 |
| 🌟 Dedicated Reader | 1000 |
| 👑 Khatm Master | 5000 |
| 💎 Buloq Legend | 10000 |

---

## 🚀 Deploy (Vercel)

```bash
# Vercel CLI
npm i -g vercel
vercel --prod
```

Environment variables ni Vercel dashboard da sozlang.

---

## 📞 Aloqa

- Telegram: [@BuloqKhatm](https://t.me/BuloqKhatm)

---

*Alloh barcha o'quvchilarni mukofotlasin. Savob bo'lsin! 🤲*
