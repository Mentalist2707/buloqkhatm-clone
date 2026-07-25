# BuloqKhatm — Mobil ilova

Shaxsiy Qur'on xatmi va kitob o'qish rejasi uchun **native mobil ilova** (Expo / React Native).
Login yo'q — veb ilova bilan **bir xil ma'lumotlar bazasini** ishlatadi (bitta shaxsiy foydalanuvchi).

Ilova veb loyihadagi Next.js API (`/api/...`) orqali ishlaydi. Shu sababli mobil ilova
ishlashi uchun veb backend ishlab turishi va telefon unga ulanishi kerak.

## Talablar

- Node.js 18+
- Telefoningizda **Expo Go** ilovasi (App Store / Play Store) — yoki Android/iOS emulator
- Telefon va kompyuter **bir xil Wi-Fi** tarmog'ida

## 1. Backend (veb) ni ishga tushiring

Asosiy loyiha papkasida (`buloqkhatm-clone`):

```bash
npm run dev
```

Terminalda `Network: http://192.168.x.x:3000` ko'rinadigan manzilni eslab qoling —
bu kompyuteringizning LAN IP manzili.

## 2. API manzilini sozlang

`mobile/app.json` faylida `expo.extra.apiBaseUrl` ni yuqoridagi LAN IP ga o'zgartiring:

```json
"extra": { "apiBaseUrl": "http://192.168.x.x:3000" }
```

(yoki `mobile/src/lib/config.ts` dagi `DEFAULT_API` ni.)

> `localhost` ISHLAMAYDI — telefon uchun `localhost` bu telefonning o'zi. LAN IP kerak.

## 3. Mobil ilovani ishga tushiring

```bash
cd mobile
npx expo start
```

Telefon kamerasi (iOS) yoki **Expo Go** (Android) bilan QR kodni skanerlang.

Agar bir xil Wi-Fi bo'lsa ham ulanmasa (firewall), tunnel rejimini sinang:

```bash
npx expo start --tunnel
```

## Imkoniyatlar

- **Bosh sahifa** — statistika, o'qilayotgan kitoblar, faol xatmlar
- **Kitoblar** — kitob qo'shish (nom, muallif, muqova URL, betlar, necha kun), kunlik reja,
  o'qishni belgilash va o'qish tarixi
- **Xatmlar** — 30 porani ko'rish, pora olish va "o'qib bo'ldim"
- **Statistika** — kunlik faollik grafigi, daraja, ball tarixi
- **Sozlamalar** — ism, hisob ma'lumotlari, server ulanishi, ma'lumotlarni tozalash

## Eslatma

Bu ilova alohida native mobil ilova. Telefonga o'rnatiladigan APK/AAB (Android) yoki IPA (iOS)
build qilish uchun EAS Build ishlatiladi:

```bash
npm install -g eas-cli
eas build -p android --profile preview
```

(EAS uchun bepul Expo akkaunti kerak.)

---

## APK build qilish

Ilova Expo asosida, shuning uchun APK ni ikki yo'l bilan olish mumkin. `eas.json` va
`app.json` (android.package = `com.buloqkhatm.app`) allaqachon sozlangan.

> MUHIM: APK o'rnatilgandan keyin ham backend (Next.js API) ga ulanadi. `app.json` →
> `extra.apiBaseUrl` build paytida APK ichiga "muhrlanadi". Shuning uchun build qilishdan
> OLDIN to'g'ri manzilni qo'ying:
> - Faqat uy Wi-Fi'da ishlatsangiz: PC LAN IP (masalan `http://192.168.1.5:3000`) + `npm run dev`
> - Hamma joyda ishlashi uchun: backendni internetga joylang (masalan Vercel) va o'sha
>   public `https://...` manzilni yozing. Manzil o'zgarsa — APK ni qayta build qiling.

### A yo'li — EAS Build (bulutli, tavsiya etiladi, Android SDK shart emas)

1. EAS CLI o'rnating:
   ```bash
   npm install -g eas-cli
   ```
2. Expo akkauntga kiring (bepul — expo.dev da ro'yxatdan o'ting):
   ```bash
   eas login
   ```
3. `mobile/` papkada loyihani ulang (birinchi marta projectId yaratadi):
   ```bash
   eas init
   ```
4. APK build (preview profili — to'g'ridan-to'g'ri o'rnatiladigan APK beradi):
   ```bash
   eas build -p android --profile preview
   ```
5. Build tugagach (odatda 10–20 daqiqa) terminalda yuklab olish havolasi chiqadi.
   APK ni telefonga yuklab, "Noma'lum manbalardan o'rnatish" ni yoqib o'rnating.

### B yo'li — Lokal build (Android Studio / SDK + JDK 17 kerak)

1. Native loyihani generatsiya qiling:
   ```bash
   npx expo prebuild -p android
   ```
2. APK ni Gradle bilan yig'ing:
   ```bash
   cd android
   .\gradlew assembleRelease      # Windows
   # ./gradlew assembleRelease    # macOS/Linux
   ```
3. Tayyor APK:
   ```
   android/app/build/outputs/apk/release/app-release.apk
   ```

Bu yo'l uchun `ANDROID_HOME`, Android SDK va JDK 17 o'rnatilgan bo'lishi kerak.

---

## Tezkor deploy (npm skriptlar)

`mobile/` papkada quyidagi skriptlar qo'shildi (bir marta `npm install -g eas-cli` va `npm run login`):

```bash
npm run login        # eas login — Expo akkauntga kirish (bir marta)
npm run deploy:apk   # APK build (preview profili) — o'rnatiladigan .apk
npm run deploy:store # AAB build (production) — Play Store uchun
npm run update       # EAS Update (OTA) — JS o'zgarishlarni tez tarqatish
```

### Deploy turlari

- **APK (o'rnatish uchun):** `npm run deploy:apk` — build tugagach yuklab olish havolasi
  chiqadi, APK ni telefonga o'rnatasiz. Birinchi marta EAS loyihasi avtomatik yaratiladi.
- **OTA (EAS Update):** kodni qayta build qilmasdan yangilash. Faqat JS/dizayn o'zgarsa
  ishlaydi (native paketlar o'zgarmasa). Birinchi marta: `npx eas-cli update:configure`
  (bu `expo-updates` ni o'rnatadi), keyin `npm run update`.

> `apiBaseUrl` allaqachon `https://buloqkhatm-clone.vercel.app` ga sozlangan, shuning uchun
> build qilingan APK **istalgan joyda** (Wi-Fi shart emas) ishlaydi. Backend Vercel'da.
>
> Rasm yuklash to'liq ishlashi uchun Vercel'da **Blob store** yarating (Storage → Blob →
> loyihaga ulang) — `BLOB_READ_WRITE_TOKEN` avtomatik qo'shiladi va qayta deploy qiling.
