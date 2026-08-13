# Zity Chef Backend Env холболтын тэмдэглэл

Энэ frontend app-д Chef backend-ийн нууц тохиргоонуудыг шууд хийхгүй. Browser bundle-д орсон `VITE_*` хувьсагч хэрэглэгчийн талд ил харагддаг тул дараах зүйлс зөвхөн backend/server орчинд байх ёстой.

## Frontend-д зөвшөөрөх public утга

```env
VITE_ZITY_CHEF_API_URL=https://your-chef-api.example.com
```

Local development үед:

```env
VITE_ZITY_CHEF_API_URL=http://localhost:3002
```

Chef backend repo дээр энэ URL ихэвчлэн `VITE_API_URL=http://localhost:3002` гэж нэрлэгдсэн байдаг. Delguur frontend дээр түүнтэй дүйцэх нэр нь `VITE_ZITY_CHEF_API_URL`.

Supabase Auth-г Delguur frontend-ээс шууд ашиглах шаардлага гарвал зөвхөн public утгуудыг ашиглаж болно:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_anon_key
```

Google бүртгэл/нэвтрэлт ажиллуулах бол Supabase dashboard дээр дараах redirect URL-уудыг нэмнэ:

- Local: `http://localhost:3000/login`
- Production: `https://your-delguur-domain.example.com/login`

Supabase Google provider дээр Google Console callback нь Supabase-ийн өөрийн callback байна:

```text
https://your-project.supabase.co/auth/v1/callback
```

## Backend-only secret-үүд

Дараах төрлийн утгуудыг frontend repo, `VITE_*`, admin UI local state, эсвэл browser storage-д хийхгүй:

- Postgres database URL/password
- Supabase service role key
- Supabase JWT secret
- Google OAuth client secret
- VAPID private key
- Gemini/AI provider API key
- Ollama/internal service URL production network detail
- SMTP password/App Password

## Admin dashboard дээр харагдах зүйл

Admin dashboard нь одоогоор frontend store болон Chef API fallback ашиглаж:

- Chef + Delguur хэрэглэгчдийн нэгдсэн жагсаалт
- хадгалагдаж байгаа бараа/нөөц
- захиалга/Odoo reference/status
- Odoo connection болон module status
- Google SMTP тохиргооны UI

гэж харуулна.

Production дээр SMTP тест, invite email, Odoo/ERP sync, DB-backed users/products/orders зэрэг үйлдлийг backend endpoint-оор дамжуулж ажиллуулах ёстой. Frontend нь зөвхөн тухайн backend endpoint руу request илгээнэ.

## Чухал security note

Хэрэв production secret chat, commit, log, screenshot, ticket зэрэгт ил болсон бол тухайн түлхүүрүүдийг rotate хийх хэрэгтэй. Ялангуяа DB password, client secret, JWT secret, AI API key, SMTP password зэрэг нь ил болсон даруйд хүчингүй болгож шинэчилнэ.
