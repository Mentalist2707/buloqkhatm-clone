# Kamchiliklar va Tavsiyalar

> Ushbu hujjat BuloqKhatm loyihasini (web Next.js + mobile Expo) ko'rib chiqish natijasida
> topilgan kamchiliklar, bug'lar va texnik qarzlarni o'z ichiga oladi.
> Tuzatilgan sanoq yoniga ✅ belgisi qo'yiladi.

---

## 1. Funksional Bug'lar

- [ ] **Juz progress hisobi ikki barobar oshishi**
  `src/app/api/juz/[id]/progress/route.ts` — `pagesRead` "bugungi jami o'qilgan betlar" deb
  qabul qilinadi, lekin har bir chaqiruvda `dailyActivity.pagesRead` va `user.totalPagesRead`
  ga to'liq qiymat `increment` qilinadi. Kunning ikkinchi (yoki uchinchi) yangilanishida hisob
  ortiqcha ko'payadi. Oldingi qiymatga nisbatan **delta** hisoblab qo'shish kerak.

- [ ] **Pora muddati (deadline) tizimi ishlamaydi**
  `src/app/api/juz/[id]/take/route.ts` — `Juz.deadline` 3 kunga o'rnatiladi, lekin bu maydon
  hech qayerda ishlatilmaydi: muddati o'tgan pora avtomatik bo'shatilmaydi, UI'da ogohlantirish
  yo'q, `NotificationType.JUZ_DEADLINE` / `BOOK_DEADLINE` bildirishnomalari hech qachon yaratilmaydi.

- [ ] **Kunlik +5 coin faoliyatsiz beriladi**
  `src/app/api/users/me/route.ts` — GET so'rovning o'zi (sahifa ochilganda) kunlik +5 BuloqCoin
  beradi. Foydalanuvchi hech narsa o'qimagan bo'lsa ham bonus oladi. Kunlik bonus faqat haqiqiy
  o'qish amali (log/progress) bilan bog'lanishi kerak.

- [ ] **`daysBetween` dagi `Math.abs` xavfi**
  `src/lib/utils.ts` (161-qator) — `Math.abs` ishlatilganligi uchun `lastDailyAt` kelajakda
  bo'lsa (soat siljishi, vaqt zonasi) farq ijobiy ko'rinib, kunlik bonus ikki marta berilishi mumkin.

## 2. Kitob Moduli (Books)

- [x] **PAUSED holati to'liq qo'llab-quvvatlanmaydi** ✅
  `BookStatus.PAUSED` enum'da bor va filtrlarda ko'rsatiladi, lekin:
  - To'xtatish / davom ettirish **tugmalari yo'q** (web va mobile) → qo'shildi;
  - PAUSED kitobga log yozish mumkin → endi rad etiladi;
  - PAUSED bo'lsa ham reja soati hisoblanishda davom etadi → endi Reja/O'qishni belgilash yashiriladi;
  - `pausedAt` maydoni yo'q → qo'shildi; davom ettirilganda reja pauza davomiyligiga uzaytiriladi.

- [ ] **`targetDays` o'zgartirilganda reja buziladi**
  `src/app/api/books/[id]/route.ts` — PATCH'da `targetDays` berilsa, `targetDate` `startDate`
  dan qayta hisoblanadi. PAUSED vaqt va allaqachon o'tgan kunlar hisobga olinmaydi.

- [ ] **O'tgan sana bilan kitob yaratish mumkin**
  `src/app/books/create/create-book-form.tsx` — `startDate` validatsiyasiz; kelajakda bo'lmagan
  sana tanlansa reja darhol "orqada" ko'rinadi.

- [ ] **O'qishni belgilash input tozalanmaydi**
  `src/app/books/[id]/book-detail-client.tsx` — log yozilgach `toPage` input eski qiymatini
  saqlab qoladi.

- [ ] **`computeBookPlan` dublikati**
  Web (`src/lib/books.ts`) va mobile (`mobile/src/lib/plan.ts`) bir xil funksiyani takrorlaydi,
  lekin tiplar farqlanib qolgan (mobile'da `completedAt` yo'q). Bitta manbadan ishlatilsa drift
  kamayadi.

## 3. Texnik Qarz / Kod Sifati

- [ ] **`npm run lint` buzilgan**
  `package.json` — `next lint` skripti ishlatiladi, lekin Next.js 16 `next lint`ni olib tashlagan.
  Bundan tashqari `eslint-config-next` 15.3.3 ga pin qilingan, `next` esa 16.2.9.

- [ ] **`typescript.ignoreBuildErrors: true`**
  `next.config.ts` — build vaqtida tip xatolari e'tiborsiz qoldiriladi. `tsconfig` `mobile`ni
  allaqachon exclude qilgan, bu workaround olib tashlansa yaxshiroq.

- [ ] **`any` tiplarining ko'pligi**
  API route'larda `status as any`, `badge.type as any`, komponentlarda `book: any` kabi
  cast'lar. Type safety zaif.

- [ ] **README eskirgan**
  README Telegram auth, admin panel, broadcast, TOP-100 leaderboard, `src/app/(pages)/`,
  `auth/signin`, `admin/`, `telegram/` kabi mavjud bo'lmagan tuzilmani tasvirlaydi. Amaldagi
  kod — single-user, auth'siz. `mobile/` loyihasi ham hujjatlashtirilmagan.

- [ ] **Mobile hujjatlari SDK versiyasiga mos emas**
  `mobile/AGENTS.md` / `CLAUDE.md` Expo SDK v57 haqida, lekin ilova SDK 54'ga tushirilgan.

- [ ] **Izohlarda arab harfi aralashgan**
  `src/lib/coins.ts` (33, 91-qatorlar) — "yangila" so'ziga `ش` belgisi aralashib qolgan.

- [ ] **`COIN_RULES` to'liq emas**
  `ADMIN_DEDUCT`, `PAGE_READ`, `REFERRAL` qiymatlari yo'q. Admin orqali coin qo'shish/ayirish
  uchun API ham mavjud emas (UI/profile esa `ADMIN_BONUS`/`ADMIN_DEDUCT`ni ko'rsatadi).

- [ ] **`Badge.requirement` dublikati**
  Qiymat `prisma/seed.mjs` va `src/lib/utils.ts` `BADGE_CONFIG` da takrorlanadi.

- [ ] **`prisma/seed.mjs` Node versiya talabi**
  `node --env-file` Node 20.17+ talab qiladi, lekin README Node >= 18 deydi.

- [ ] **`juz/[id]/progress` schema qat'iy max 20**
  `pagesRead` 1–20 gacha chegaralangan, lekin `Juz.totalPages` boshqa bo'lishi mumkin.

---

## 4. Tavsiyalar

- [ ] Kunlik faollik/coin logikasini bitta `coins.ts` funksiyasiga jamlash (endpoint'lar mustaqil
  takrorlamasligi uchun).
- [ ] Pora deadline'ini tekshiruvchi cron/at-job qo'shish (muddati o'tgan porani avtomatik
  bo'shatish + bildirishnoma).
- [ ] API javoblarini tipifikatsiya qilish (DTO'lar) — `any` o'rniga.
- [ ] Test qo'shish (kamida `computeBookPlan` uchun unit testlar).
- [ ] README va mobile hujjatlarini amaldagi holatga moslash.
