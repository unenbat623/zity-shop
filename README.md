# 🛒 Zity Delguur (Zity Shop)

**Zity Chef Complex**-ийн албан ёсны цахим дэлгүүр. Zity Chef backend, Supabase Auth,
Odoo ERP-тэй нэгдсэн design system болон нэгдсэн хэрэглэгчийн бүртгэлээр ажиллана.

---

## ✨ Гол боломжууд

### 🔐 Бүртгэл & нэвтрэлт (Supabase)
- Google-ээр нэг товшилтоор нэвтрэх
- Имэйл + нууц үгээр бүртгүүлэх / нэвтрэх / нууц үг сэргээх
- Session автоматаар сунгагдана (refresh token) — 1 цаг тутам гарах шаардлагагүй
- Нэвтрээгүй хэрэглэгчид **хуурамч профайл харуулахгүй** — зочин төлөв тодорхой
- `/orders`, `/checkout`, `/profile`, `/zity-fridge` хуудсууд хамгаалагдсан
- `/odoo-admin` зөвхөн `VITE_ADMIN_EMAILS` жагсаалтад байгаа хэрэглэгчид

### ⚡ Гүйцэтгэл & PWA
- Route бүр тусад нь ачаалагдана (`React.lazy`) — эхний ачаалалт хөнгөн
- Vendor код (react / supabase / motion) тусдаа chunk — cache-д удаан үлдэнэ
- Service worker: суулгаж болдог, офлайн ажиллана. Chef API нь **NetworkFirst**
  тул хуучирсан нөөц/үнэ харуулахгүй

### 🍳 Zity Chef интеграц
- Барааны каталог, жорын орц багц, хөргөгчийн нөөц нь Chef backend-ээс live татагдана
- Бүх дэлгэц **нэг caталог store**-оос өгөгдөл авна — давхар fetch, зөрүүтэй өгөгдөл байхгүй
- Backend унтарсан үед апп ажиллахаа болихгүй: локал каталог руу шилжиж,
  "Локал каталог" гэж илэн далангүй харуулна
- Худалдан авсан орц Zity Chef хөргөгчид автоматаар нэмэгдэнэ

### 🛍 Дэлгүүр & сагс
- Ангиллаар шүүх (slug-аар — эх сурвалж хамаарахгүй зөв ажиллана), нэр/SKU/брэндээр хайх
- Нөөцөөс илүү тоо ширхэг нэмэхийг зөвшөөрөхгүй
- Сагс localStorage-д хадгалагдана — хуудас сэргээхэд алдагдахгүй
- Купон, үнэгүй хүргэлтийн босго, доод дүнгийн шалгалт

### 📦 Захиалга
- Захиалгын түүх **Chef DB-ээс** уншигдана — өөр төхөөрөмжөөс нэвтрэхэд ч
  алдагдахгүй, Chef аппаас хийсэн захиалга ч энд харагдана
- Odoo болон Chef рүү **зэрэг** синк — аль нэг нь унасан ч захиалга алдагдахгүй
- Синкийн төлөв захиалга тус бүрт харагдана, амжилтгүй бол **дахин илгээх** товч
- Бэлнээр төлөх захиалга хүргэгдэх үед л "төлөгдсөн" болно
- Захиалгын явц `createdAt`-аас тооцогддог тул хуудас сэргээхэд ч зөв үргэлжилнэ

### 🎨 Design system & UI
- Өөрийн лого (тогоочийн малгай + Z + навч), бүрэн PWA icon багц, OG зураг
- Бүх өнгө `--zity-*` token-оос ирнэ — light/dark горим бүрэн зөв
- Theme сонголт хадгалагдана, OS-ийн тохиргоог дагах "system" горимтой
- `AppShell` — бүх хуудас нэг бүрхүүлтэй: desktop дээр байнгын sidebar,
  мобайл дээр drawer + доод цэс; padding/өргөн хаана ч ижил
- Нэг `Modal` суурь — Esc, backdrop, focus trap, focus сэргээлт, зөв ARIA
- Toast мэдэгдэл, skeleton ачаалалт, хоосон төлөвийн ойлгомжтой заавар
- `prefers-reduced-motion` дэмжлэг, гарнаас удирдах focus ring, aria шошго

---

## 🛠 Технологи

| Давхарга | Хэрэгсэл |
| --- | --- |
| Frontend | React 19, TypeScript (strict), Vite 6 |
| State | Zustand 5 (+ persist) |
| Styling | Tailwind CSS 4 (CSS variable token) |
| Auth | Supabase Auth (`@supabase/supabase-js`, PKCE) |
| Тест | Vitest |
| PWA | vite-plugin-pwa (Workbox) |
| Icons | lucide-react |

---

## 🚀 Эхлүүлэх

```bash
npm install
cp .env.example .env      # утгуудаа бөглөнө
npm run dev               # http://localhost:3005
```

### Zity Chef-тэй хамт ажиллуулах

Delguur нь Chef Complex-тэй **ижил Supabase төсөлд** холбогдоно — нэг бүртгэлээр
хоёуланд нэвтэрч, хөргөгч/захиалгын өгөгдөл хуваалцагдана.

```bash
# 1) Chef backend (порт 3002)
cd ../zity-chef-complex && npm run dev:server

# 2) Delguur frontend
cd ../zity-delguur-app && npm run dev
```

`.env` дээрх `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` нь Chef төслийнхтэй
**яг ижил** байх ёстой. Дэлгэрэнгүйг [`docs/chef-backend-env.md`](docs/chef-backend-env.md).

### 🌐 Production

| Апп | URL |
| --- | --- |
| Zity Delguur | https://zity-shop.vercel.app |
| Zity Chef (UI + API) | https://zity-chef.vercel.app |

Deploy хийхийн өмнө гурван зүйлийг тохируулна:

1. **Delguur Vercel env** — `VITE_ZITY_CHEF_API_URL=https://zity-chef.vercel.app`
2. **Supabase Redirect URLs** — `https://zity-shop.vercel.app/login` нэмэх
3. **Chef `ALLOWED_ORIGINS`** — `https://zity-shop.vercel.app` нэмэх (CORS)

Алхам бүрийн дэлгэрэнгүйг [`docs/chef-backend-env.md`](docs/chef-backend-env.md)-ээс үзнэ үү.

### Тохиргоо

`.env` доторх утгуудын тайлбарыг [`.env.example`](.env.example)-ээс,
backend талын дэлгэрэнгүйг [`docs/chef-backend-env.md`](docs/chef-backend-env.md)-ээс үзнэ үү.

Хамгийн багадаа:

```env
VITE_ZITY_CHEF_API_URL=http://localhost:3002
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_ADMIN_EMAILS=admin@zity.mn
```

> Supabase тохируулаагүй ч апп ажиллана — дэлгүүр, сагс үзэгдэнэ, харин нэвтрэлт
> идэвхгүй болж дэлгэц дээр тохиргооны заавар харагдана.

### Скриптүүд

```bash
npm run dev        # dev сервер, порт 3005 (Chef API-г proxy-оор дамжуулна)
npm run test       # vitest — сагс, Chef хөрвүүлэлтийн тестүүд
npm run test:watch # тестийг watch горимд
npm run typecheck  # TypeScript strict шалгалт
npm run build      # typecheck + production build (PWA service worker үүснэ)
npm run preview    # build-ийг урьдчилан үзэх
```

> `npm run dev` нь порт 3005-ыг **хатуу** барина. Банд бол алдаа өгч зогсоно —
> порт чимээгүй шилжвэл OAuth-ийн буцах хаяг эвдэрдэг.

---

## 📁 Бүтэц

```
src/
├── lib/
│   ├── env.ts            # орчны хувьсагчийн нэг цэгийн хандалт + шалгалт
│   ├── format.ts         # mn-MN мөнгө/огноо форматлагч
│   └── utils.ts
├── services/
│   ├── apiClient.ts      # timeout + auth token + нэгдсэн алдаатай fetch
│   ├── zityChefService.ts
│   ├── supabaseAuthService.ts
│   └── odooService.ts    # bridge / симуляц горим
├── store/                # zustand: auth, catalog, cart, order, odoo, theme, toast, search
│   └── *.test.ts         # цэвэр логикийн тестүүд
├── components/           # Header, BottomNav, ProductCard, RequireAuth, ui/*
├── screens/              # хуудас бүр
└── types/                # нэгдсэн TypeScript интерфейс
```

---

## 🔒 Аюулгүй байдал

`VITE_*` хувьсагч browser-т **ил** орно. Тиймээс энэ repo-д дараах зүйлс байхгүй
бөгөөд байх ч ёсгүй:

- Odoo API key → backend env (`ODOO_API_KEY`)
- SMTP / Gmail App Password → backend env
- Supabase service role key, JWT secret → backend env
- Google OAuth client secret → Supabase dashboard дээр

Admin dashboard дээр эдгээрийг оруулах талбар байхгүй — зөвхөн тохиргооны заавар харагдана.

---

## 📝 Лиценз

MIT
