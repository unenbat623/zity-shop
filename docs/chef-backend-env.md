# Zity Chef ↔ Zity Delguur интеграцийн заавар

Энэ баримт нь Delguur frontend болон Chef backend хоорондын холболтыг хэрхэн зөв тохируулахыг тайлбарлана.

## 0. Хурдан эхлүүлэх (локал)

Delguur нь Chef Complex-тэй **ижил Supabase төсөлд** холбогдоно. Ингэснээр нэг
бүртгэлээр хоёуланд нэвтэрч, хөргөгч/захиалгын өгөгдөл хуваалцагдана.

```bash
# 1) Chef backend (порт 3002)
cd ../zity-chef-complex
npm run dev:server

# 2) Delguur frontend
cd ../zity-delguur-app
npm run dev
```

`.env` дээр Chef төслийн `.env`-тэй ижил утгуудыг тавина:

| Delguur `.env` | Chef `.env` дэх эх сурвалж |
| --- | --- |
| `VITE_SUPABASE_URL` | `VITE_SUPABASE_URL` (яг ижил) |
| `VITE_SUPABASE_ANON_KEY` | `VITE_SUPABASE_ANON_KEY` (яг ижил) |
| `VITE_ZITY_CHEF_API_URL` | `http://localhost:${PORT}` (default 3002) |
| `VITE_ADMIN_EMAILS` | `CHEF_ADMIN_EMAILS` (ижил байлгах нь зүйтэй) |

> Supabase төсөл нь хоёр талд ижил байх ёстой — өөр байвал Delguur-ийн гаргасан
> access token-ыг Chef backend танихгүй тул хөргөгч, захиалга 401 өгнө.

## 0.1 Production тохиргоо (Vercel)

| Апп | URL |
| --- | --- |
| Zity Delguur | `https://zity-shop.vercel.app` |
| Zity Chef (UI + API) | `https://zity-chef.vercel.app` |

Гурван газар тохиргоо хийнэ:

**1) Delguur-ийн Vercel → Settings → Environment Variables**

```env
VITE_ZITY_CHEF_API_URL=https://zity-chef.vercel.app
VITE_SUPABASE_URL=<Chef-тэй ижил>
VITE_SUPABASE_ANON_KEY=<Chef-тэй ижил>
VITE_ADMIN_EMAILS=<Chef-ийн CHEF_ADMIN_EMAILS-тэй ижил>
# VITE_AUTH_REDIRECT_URL — production дээр тохируулахгүй (хоосон орхино)
```

> `VITE_AUTH_REDIRECT_URL`-ыг хоосон орхивол апп өөрийн бодит хаягийг ашиглана.
> Локал `.env` дэх `http://localhost:3005` утгыг санамсаргүй хуулбал апп үүнийг
> илрүүлж үл тоомсорлоно, гэхдээ огт бичихгүй байх нь цэвэр.

**2) Supabase → Authentication → URL Configuration → Redirect URLs**

```
http://localhost:3005/login
https://zity-shop.vercel.app/login
https://zity-shop.vercel.app/**
```

Site URL-ыг өөрчлөхгүй (Chef-ийнх хэвээр). Зөвхөн жагсаалтад нэмэхэд хоёулаа ажиллана.

**3) Chef-ийн Vercel → `ALLOWED_ORIGINS`**

Delguur нь production дээр Chef API руу шууд ханддаг (Vite proxy зөвхөн dev-д
ажиллана). Тиймээс CORS зөвшөөрөлд Delguur-ийн домэйныг нэмнэ:

```env
ALLOWED_ORIGINS=https://zity-shop.vercel.app,https://zity-chef.vercel.app,http://localhost:3005
```

Энэ мөрийг нэмэхгүй бол Delguur production дээр бараа/жор татаж чадахгүй,
"Локал каталог" горимд шилжинэ.

## 1. Аюулгүй байдлын үндсэн дүрэм

Browser bundle-д орсон `VITE_*` хувьсагчийг хэрэглэгч бүр DevTools-оор харах боломжтой. Тиймээс:

**Frontend-д зөвшөөрөгдөх (public):**

| Хувьсагч | Тайлбар |
| --- | --- |
| `VITE_ZITY_CHEF_API_URL` | Chef backend-ийн public base URL |
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase publishable (anon) key |
| `VITE_ADMIN_EMAILS` | Admin эрхтэй имэйлүүд |
| `VITE_ODOO_URL` / `VITE_ODOO_DB` / `VITE_ODOO_USERNAME` | Зөвхөн dashboard дээр харуулах мэдээлэл |

**Зөвхөн backend дээр байх (secret):**

- Postgres database URL / password
- Supabase `service_role` key, JWT secret
- Google OAuth **client secret**
- Odoo **API key** / нууц үг
- SMTP password (Gmail App Password)
- VAPID private key, AI provider API key

> Хэрэв эдгээрийн аль нэг нь commit, log, screenshot, chat зэрэгт ил болсон бол
> тухайн түлхүүрийг **нэн даруй rotate** хийнэ.

## 2. Chef backend талд хэрэгтэй endpoint-ууд

Delguur frontend дараах замуудыг дуудна (`VITE_ZITY_CHEF_API_URL` + зам):

| Method | Зам | Зориулалт | Заавал эсэх |
| --- | --- | --- | --- |
| GET | `/api/health` | Холболт шалгах | Chef дээр байгаа ✅ |
| GET | `/api/store/products` | Барааны каталог | Chef дээр байгаа ✅ |
| GET | `/api/recipes` | Жор / орц багц | Chef дээр байгаа ✅ |
| GET | `/api/inventory` | Хөргөгчийн нөөц (auth) | Chef дээр байгаа ✅ |
| POST | `/api/inventory` | Худалдаж авсан орц нэмэх (auth) | Chef дээр байгаа ✅ |
| POST | `/api/orders` | Захиалга бүртгэх (auth) | Chef дээр байгаа ✅ |
| GET | `/api/chef/dashboard` | Admin статистик + хэрэглэгчид (auth) | Chef дээр байгаа ✅ |
| GET | `/api/odoo/status` | Odoo bridge төлөв | Байхгүй — симуляц |
| GET | `/api/odoo/products` | Odoo-с бараа татах | Байхгүй — симуляц |
| POST | `/api/odoo/orders` | Odoo `sale.order` үүсгэх | Байхгүй — симуляц |

### Өгөгдлийн хөрвүүлэлтэд анхаарах зүйл

Chef-ийн `inventory_items` хүснэгт дээр **CHECK constraint** байдаг тул Delguur
захиалгын орцыг хөргөгчид нэмэхдээ дараах байдлаар хөрвүүлдэг
(`zityChefService.ts` доторх `toChefCategory` / `toChefUnit`):

- `category` — зөвхөн `🥦 Ногоо`, `🥩 Мах`, `🥛 Сүү, өндөг`, `🧂 Амтлагч`, `🍎 Жимс`
- `unit` — зөвхөн `гр`, `л`, `ш`, `g`, `l`, `pcs` (тиймээс `кг` → `гр` ×1000)

Мөн Chef-ийн `/api/store/products` нь **нөөцийн тоо буцаадаггүй** (зөвхөн
`in_stock = true` барааг буцаана). Delguur нь эдгээрийг бэлэн байгаад тооцдог —
0 гэж үзвэл бүх бараа "нөөц дууссан" болж харагдана.

Chef-ийн жор үнэ агуулдаггүй тул орц багцын үнийг каталогийн бодит үнээр тооцож,
багцаар авахад 10% хямдрал тооцно.

Эдгээрийн аль нэг нь байхгүй бол Delguur апп **унахгүй** — локал каталог руу шилжиж,
дэлгэц дээр "Локал каталог" гэж илэн далангүй харуулна.

### Хүлээгдэж буй хариуны бүтэц

```jsonc
// GET /api/store/products
{ "products": [{ "id", "name", "category", "pricePerUnit", "unit", "stock", "imageUrl", "sku" }] }

// GET /api/recipes
{ "recipes": [{ "id", "title", "servings", "price", "image", "ingredients": [...], "steps": [...] }] }

// GET /api/inventory
{ "inventory": [{ "id", "name", "category", "quantity", "unit", "expiryDays", "lastUpdated", "source" }] }

// GET /api/admin/users   (Authorization: Bearer <supabase access token>)
{ "users": [{ "id", "name", "email", "phone", "savedItems", "orderCount", "lastSeen" }] }
```

Талбарын нэр зөрсөн ч frontend нь өргөн хүрээний нэрсийг (`name`/`title`,
`price`/`pricePerUnit`, `stock`/`quantity` г.м.) хүлээн авдаг.

## 3. Нэвтрэлт (Supabase)

Delguur нь Supabase Auth-г REST-ээр шууд ашиглана:

- **Google OAuth** — implicit flow, буцах хаяг `/login`
- **Имэйл + нууц үг** — бүртгүүлэх, нэвтрэх, нууц үг сэргээх
- **Session** — `localStorage` (`zity_auth_session`), хугацаа дуусахад refresh token-оор автоматаар сунгана

Supabase dashboard дээр тохируулах:

1. **Authentication → URL Configuration → Redirect URLs**
   ```
   http://localhost:3000/login
   https://your-delguur-domain.example.com/login
   ```
2. **Authentication → Providers → Google** — идэвхжүүлж, Google Cloud Console дээр
   callback URL-ээр Supabase-ийн өөрийн callback-ийг бүртгэнэ:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```
3. Имэйл баталгаажуулалт асаалттай бол шинэ бүртгэл session шууд авахгүй —
   апп нь "имэйл рүү илгээсэн холбоосыг дарна уу" гэж мэдэгдэнэ.

Chef backend нь Delguur-аас ирсэн хүсэлтийн `Authorization: Bearer <token>`
header-ийг Supabase JWT secret-ээр шалгах боломжтой (secret нь backend дээр байна).

## 4. Odoo ERP холболт

Odoo руу browser-оос **шууд хандахгүй**:

- Odoo API key frontend bundle-д ил гарна
- Odoo нь CORS-г үндсэндээ зөвшөөрдөггүй

Тиймээс Chef backend дээр нимгэн proxy (bridge) хийнэ:

```
Delguur frontend → Chef backend /api/odoo/* → Odoo JSON-RPC
```

Bridge байхгүй үед Delguur нь **симуляц горимд** ажиллана — захиалга үүсэж,
`SIM-SO-...` reference олгогдоно. Admin dashboard дээр горим нь `BRIDGE` эсвэл
`СИМУЛЯЦ` гэж тодорхой харагдана.

Backend env жишээ:

```env
ODOO_URL=https://odoo.zity.mn
ODOO_DB=zity_delguur_db
ODOO_USERNAME=api_admin@zity.mn
ODOO_API_KEY=<Settings > Technical > API Keys дээрээс үүсгэнэ>
```

## 5. Имэйл (SMTP)

SMTP тохиргоо, ялангуяа Gmail App Password нь **зөвхөн backend дээр** байна.
Admin dashboard дээр энэ хэсэг нь зөвхөн заавар харуулах бөгөөд нууц үг оруулах
талбар байхгүй.

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=admin@zity.mn
SMTP_PASSWORD=<Google App Password>
SMTP_FROM_NAME=Zity Delguur
```

## 6. Admin dashboard-д харагдах зүйл

- Chef + Delguur хэрэглэгчдийн нэгдсэн жагсаалт (`/api/admin/users` + одоогийн хэрэглэгч)
- Барааны каталог, нөөцийн түвшин, бага нөөцийн анхааруулга
- Захиалгууд, Odoo reference, Odoo/Chef синкийн төлөв
- Odoo холболтын горим, модулийн байдал, синкийн түүх
- Chef API холболтын live/локал төлөв

Admin руу зөвхөн `VITE_ADMIN_EMAILS` жагсаалтад байгаа хэрэглэгч нэвтэрнэ.
Жагсаалт хоосон бол нэвтэрсэн дурын хэрэглэгч үзэх боломжтой болох ба dashboard
дээр анхааруулга харагдана.
