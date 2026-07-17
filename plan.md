# BuildScience — Tuzatish rejasi (plan.md)

Loyiha auditi natijasida topilgan kamchiliklar. Ustuvorlik: P1 (bug/xavfsizlik) → P2 (spec talabi bajarilmagan) → P3 (kod sifati). Har bir band mustaqil bajarilishi mumkin. Har bir tuzatishdan keyin: `npm run typecheck && npm run lint && npm run test && npm run build`.

---

## P1 — Buglar va xavfsizlik

### 1.1 Testlar dev bazani o'chirib yuboradi
- **Fayl:** `apps/api/tests/setup.ts`, `apps/api/vitest.config.ts`
- **Muammo:** testlar `apps/api/.env` dagi `DATABASE_URL` ni ishlatadi va `beforeEach`da `deleteMany` bilan BARCHA jadval ma'lumotlarini o'chiradi. `npm test` seed qilingan dev ma'lumotlarni yo'q qiladi.
- **Yechim:** testlar uchun alohida baza/sxema. Vitest config'da `env: { DATABASE_URL: ...?schema=test }` yoki `.env.test` + setup'da override. `prisma migrate deploy`ni test sxemaga qo'llash uchun setup'da `execSync` yoki README'ga test-db yaratish buyrug'i. Testlar oxirida seed'ni qayta ishga tushirish SHART EMAS — faqat izolyatsiya.

### 1.2 Zod xabarlari inglizcha — spec §23 buzilgan
- **Fayl:** `packages/shared/src/schemas.ts`
- **Muammo:** faqat telefon regexda custom xabar bor. `min/max/email/int/positive` defaultlari inglizcha ("String must contain at least...") va ular UI'da foydalanuvchiga ko'rinadi (frontend zodResolver + backend 422 errors).
- **Yechim:** barcha schema qoidalariga o'zbekcha `message` qo'shish. Masalan: `title: z.string().trim().min(10, "Sarlavha kamida 10 ta belgidan iborat bo'lishi kerak.")`. Spec §23 dagi namuna matnlarni aynan ishlatish. `estimatedDays` NaN holati uchun ham (`invalid_type_error`).

### 1.3 Kompaniya dashboard statistikasi faqat 1-sahifadan hisoblanadi
- **Fayl:** `apps/web/src/pages/company/CompanyDashboardPage.tsx`, `apps/api/src/modules/problems/problems.routes.ts`
- **Muammo:** stats `useCompanyProblems("ALL", 1)` (pageSize 20) items'idan `filter/reduce` bilan hisoblanadi — muammolar 20 tadan ko'p bo'lsa noto'g'ri.
- **Yechim:** backend'ga `GET /api/company/stats` endpoint qo'shish (openProblems, totalProposals, matched, closed — `prisma.count` bilan), frontend shu endpointdan o'qisin.

### 1.4 ProblemDetailPage kompaniya/mehmon uchun 403 so'rov yuboradi
- **Fayl:** `apps/web/src/pages/ProblemDetailPage.tsx:22`, `apps/web/src/features/proposals/hooks.ts`
- **Muammo:** `useMyProposals()` har qanday foydalanuvchi (COMPANY, mehmon) uchun ham `/api/proposals/mine`ni chaqiradi → 403/401 network noise.
- **Yechim:** `useMyProposals(enabled?: boolean)` param qo'shib, sahifada `user?.role === "SCIENTIST"` bilan chaqirish.

### 1.5 Multer 1.x — ma'lum zaifliklar
- **Fayl:** `apps/api/package.json`
- **Muammo:** `multer@1.4.5-lts.1` deprecated, zaifliklar 2.x da tuzatilgan.
- **Yechim:** `multer@^2`ga ko'tarish, `apps/api/src/middleware/upload.ts` API mosligini tekshirish (diskStorage/fileFilter API bir xil), testlarni ishga tushirish.

### 1.6 Auth rate-limiter test muhitida yashirin xavf
- **Fayl:** `apps/api/src/middleware/rateLimit.ts`
- **Muammo:** `authLimiter` 20 req/15min — testlar hozir vitest worker-per-file izolyatsiyasi tufayligina o'tadi; bitta worker'da >20 registratsiya bo'lsa sinadi.
- **Yechim:** `skip: () => process.env.NODE_ENV === "test"` qo'shish.

### 1.7 Logout cookie nomi env moduldan olinmaydi
- **Fayl:** `apps/api/src/modules/auth/auth.routes.ts` (logout handler)
- **Muammo:** `process.env.SESSION_COOKIE_NAME ?? "bs_session"` to'g'ridan-to'g'ri o'qiladi — `config/env.ts` bilan nomuvofiqlik xavfi.
- **Yechim:** `import { env }` va `env.sessionCookieName` ishlatish.

### 1.8 Seed skript destruktiv
- **Fayl:** `apps/api/prisma/seed.ts`
- **Muammo:** `proposal.deleteMany({}); problem.deleteMany({})` — production'da tasodifiy ishga tushirilsa hamma e'lonlar o'chadi.
- **Yechim:** `NODE_ENV === "production"` bo'lsa deleteMany'ni o'tkazib yuborish (faqat admin upsert qilish) yoki aniq `SEED_FORCE=1` flag talab qilish.

---

## P2 — Spec talablari bajarilmagan

### 2.1 Frontend testlar yo'q (spec §30.2)
- **Yechim:** `apps/web`ga vitest + @testing-library/react qo'shish. Minimal to'plam:
  - rol tanlash (RegisterPage: COMPANY/SCIENTIST toggle, ADMIN yo'qligi);
  - route guard (RequireRole noto'g'ri rol → /forbidden redirect);
  - login forma validatsiyasi (bo'sh email → xato);
  - muammo formasi (title < 10 → xato; NEGOTIABLE → budgetAmount yashirin);
  - taklif formasi (priceNegotiable → narx input yo'q);
  - EmptyState/ErrorState render.
- `package.json` web'ga `"test": "vitest run"` va root `test` skriptga qo'shish.

### 2.2 Modal focus trap yo'q (spec §25)
- **Fayl:** `apps/web/src/components/ui/Modal.tsx`
- **Muammo:** Escape va boshlang'ich fokus bor, lekin Tab bilan fokus modal tashqarisiga chiqib ketadi.
- **Yechim:** oddiy focus trap (Tab/Shift+Tab keydown'da birinchi/oxirgi fokuslanuvchi elementga o'tkazish). Kutubxona qo'shmasdan ~20 qator. Yopilganda fokusni trigger elementga qaytarish.

### 2.3 Motion reduced-motion'ni hurmat qilmaydi (spec §21)
- **Fayl:** `apps/web/src/App.tsx`
- **Muammo:** CSS `prefers-reduced-motion` override JS (motion) inline animatsiyalarga ta'sir qilmaydi.
- **Yechim:** `<MotionConfig reducedMotion="user">` bilan App'ni o'rash (`motion/react` dan import).

### 2.4 Admin ro'yxatlarida saralash yo'q (spec §11.7)
- **Fayl:** `apps/api/src/modules/admin/admin.routes.ts`, admin sahifalar
- **Yechim:** `sort` query param (`newest|oldest`) qabul qilish, frontend'da Select qo'shish. Minimal — faqat sana bo'yicha.

### 2.5 Admin sahifalarida "Ko'rish" amali yo'q (spec §18.2, §18.4)
- **Fayl:** `apps/web/src/pages/admin/AdminUsersPage.tsx`, `AdminProposalsPage.tsx`
- **Yechim:** Users: "Ko'rish" — modal'da to'liq ma'lumot (bio, org, spec). Proposals: "Ko'rish" — modal'da to'liq solutionText.

### 2.6 Profil sahifasi admin uchun olim maydonlarini ko'rsatadi (spec §19)
- **Fayl:** `apps/web/src/pages/ProfilePage.tsx`
- **Muammo:** `isCompany` false bo'lgani uchun ADMIN ham mutaxassislik/OTM/bio maydonlarini ko'radi.
- **Yechim:** `isScientist = user.role === "SCIENTIST"` bilan shartlash; admin faqat name/email/phone/parol.

### 2.7 Docker build tekshirilmagan (acceptance #29)
- **Fayl:** `apps/api/Dockerfile`, `apps/web/Dockerfile`, `docker-compose.yml`
- **Yechim:** `docker compose build` ishga tushirish, xatolarni tuzatish (`npm install --workspace ... --include-workspace-root` flaglar kombinatsiyasi shubhali — `npm ci` yoki to'liq `npm install` + prune afzal bo'lishi mumkin). `docker compose up` bilan health tekshirish.

### 2.8 Telefon input formatlash yo'q (spec §15.1)
- **Fayl:** `apps/web/src/components/ui/Input.tsx` (PhoneInput)
- **Yechim:** minimal masking — foydalanuvchi kiritganda `+998` prefiksni avtomatik qo'yish, faqat raqam qabul qilish, 13 belgi limit. Kutubxonasiz.

---

## P3 — Kod sifati / arxitektura

### 3.1 `toQueryString` ikki joyda takrorlangan
- **Fayllar:** `apps/web/src/features/problems/hooks.ts`, `apps/web/src/features/admin/hooks.ts`
- **Yechim:** `apps/web/src/lib/query.ts`ga ko'chirish, ikkala joydan import.

### 3.2 `req.query as unknown as {...}` cast'lar
- **Fayl:** `apps/api/src/modules/problems/problems.routes.ts`, `admin.routes.ts`
- **Yechim:** `validateQuery` o'rniga handler ichida `schema.parse(req.query)` natijasini typed o'zgaruvchiga olish — cast yo'qoladi. Yoki `res.locals.query` orqali typed uzatish. Eng kam diff variantini tanlash.

### 3.3 O'lik kod: `Drawer` komponenti ishlatilmaydi
- **Fayl:** `apps/web/src/components/ui/Modal.tsx`
- **Yechim:** `Drawer`ni o'chirish YOKI `AppShellLayout`/`Header`dagi inline drawer'larni shu komponentga ko'chirish (ikkalasida deyarli bir xil markup takrorlangan — ko'chirish afzal).

### 3.4 `paginationQuerySchema.extend({})` — ma'nosiz chaqiruv
- **Fayllar:** `problems.routes.ts`, `admin.routes.ts`
- **Yechim:** `.extend({})`ni olib tashlash.

### 3.5 `useUpdateProposal(existing?.id ?? "")` — bo'sh string ID
- **Fayl:** `apps/web/src/components/proposals/ProposalFormModal.tsx`
- **Yechim:** mutationFn ichida ID'ni argument sifatida olish (`mutate({ proposalId, formData })`) — hook chaqiruvida hack yo'qoladi.

### 3.6 Header anchor linklar to'liq sahifa reload qiladi
- **Fayl:** `apps/web/src/components/layout/Header.tsx`, `Footer.tsx`
- **Muammo:** `<a href="/#how-it-works">` SPA'da full reload.
- **Yechim:** bosh sahifada bo'lsa smooth-scroll, aks holda `Link to="/" + scroll state`. Minimal: `Link to={{ pathname: "/", hash: "#how-it-works" }}` + LandingPage'da hash'ga scroll effect.

### 3.7 npm audit qoldiqlari
- **Yechim:** `npm audit fix` (breaking'siz) ishga tushirish; bcrypt→`bcryptjs`ga o'tish SHART EMAS (native bcrypt qoladi), faqat tar/vite transitive'larni yangilash. Qolgan moderate'larni README troubleshooting'ga qayd etish.

---

## Bajarish tartibi

1. P1.1 (test izolyatsiya) — birinchi, chunki qolgan tuzatishlar testga tayanadi.
2. P1.2 → P1.8 ketma-ket, har biridan keyin `npm run test`.
3. P2.1 (frontend test infra) → keyin P2.2–P2.8.
4. P3 bandlari oxirida, har biri alohida kichik diff.
5. Yakunda: `npm run typecheck && npm run lint && npm run test && npm run build` + `docker compose build`.

## Tekshiruv mezonlari

- [ ] `npm test` dev bazadagi seed ma'lumotlarni o'chirmaydi
- [ ] Barcha validatsiya xabarlari UI'da o'zbekcha
- [ ] Kompaniya dashboard stats 20+ muammoda ham to'g'ri
- [ ] Web testlar mavjud va o'tadi
- [ ] Modal ichida Tab fokus aylanadi, tashqariga chiqmaydi
- [ ] `docker compose build` xatosiz
- [ ] typecheck/lint/test/build — hammasi toza
