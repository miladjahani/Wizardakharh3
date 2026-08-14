# ⚡ EDGE·FORGE — Cloudflare Worker & GitHub Pages

پروژه‌ای کامل برای دپلوی خودکار ورکر کلودفلر و سایت استاتیک گیت‌هاب پیجز مستقیماً از گیت‌هاب.

## 🚀 ویژگی‌ها

- ✅ **دپلوی خودکار** به Cloudflare Workers با هر بار push
- ✅ **دپلوی خودکار** به GitHub Pages با هر بار push
- ✅ **فقط API Token** لازم است (بدون نیاز به Account ID)
- ✅ **Wizard یکپارچه** برای مدیریت آسان دپلوی
- ✅ **همگام‌سازی خودکار** فایل‌های ips.txt و proxy/
- ✅ **پشتیبانی کامل** از VLESS, Trojan, xhttp, ECH, SOCKS5

## 📦 ساختار پروژه

```
├── .github/workflows/deploy.yml    # GitHub Actions Workflow
├── Source.js                       # کد اصلی ورکر
├── wrangler.toml                   # تنظیمات Wrangler
├── public/                         # فایل‌های GitHub Pages
│   └── index.html                  # صفحه Wizard
├── wizard/                         # فایل‌های پیشرفته Wizard
│   ├── index.html
│   └── wizard.js
├── ips.txt                         # لیست IPهای ترجیحی
└── proxy/                          # فایل‌های منطقه‌ای
```

## 🔧 راه‌اندازی

### مرحله ۱: تنظیم Secrets در GitHub

1. به ریپازیتوری گیت‌هاب بروید
2. **Settings → Secrets and variables → Actions** را باز کنید
3. روی **New repository secret** کلیک کنید
4. Secret زیر را اضافه کنید:

| Name | Value |
|------|-------|
| `CF_API_TOKEN` | توکن API کلودفلر شما |

### نحوه ساخت Cloudflare API Token:

1. به آدرس [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) بروید
2. روی **Create Token** کلیک کنید
3. قالب **Edit Cloudflare Workers** را انتخاب کنید
4. یا توکن سفارشی با دسترسی‌های زیر بسازید:
   - `Account.Cloudflare Workers:Edit`
   - `Account.Cloudflare KV Storage:Edit` (اختیاری)
5. توکن را کپی و در GitHub Secrets ذخیره کنید

### مرحله ۲: فعال‌سازی GitHub Pages

1. به **Settings → Pages** بروید
2. در بخش **Build and deployment**:
   - **Source** را روی **GitHub Actions** قرار دهید
3. تنظیمات ذخیره می‌شود

### مرحله ۳: دپلوی خودکار

با هر بار push به شاخه‌های `main` یا `master`:
- ✅ کد ورکر به Cloudflare Workers دپلوی می‌شود
- ✅ فایل‌های پوشه `public/` به GitHub Pages دپلوی می‌شوند

## 🌐 آدرس‌های دسترسی

پس از دپلوی موفق:

| سرویس | آدرس |
|-------|------|
| **Cloudflare Workers** | `https://edge-relay.<username>.workers.dev` |
| **GitHub Pages** | `https://<username>.github.io/<repo-name>/` |

## 🎯 Wizard دپلوی

صفحه `index.html` در GitHub Pages یک Wizard تعاملی ارائه می‌دهد که:
- اعتبارسنجی خودکار API Token
- نمایش وضعیت دپلوی به صورت زنده
- لینک مستقیم به ورکر دپلوی شده

## ⚙️ تنظیمات پیشرفته

### متغیرهای محیطی در wrangler.toml:

```toml
[vars]
u = "uuid-shoma"          # UUID برای احراز هویت
d = ""                     # مسیر سفارشی
p = ""                     # پورت سفارشی
ev = "yes"                 # فعال‌سازی VLESS
et = "yes"                 # فعال‌سازی Trojan
ex = "no"                  # غیرفعال‌سازی xhttp
ech = "no"                 # فعال‌سازی ECH
gh = "https://github.com/USERNAME/REPO"  # آدرس ریپو
yxURL = "https://USERNAME.github.io/REPO/ips.txt"  # آدرس ips.txt
```

### Subscription Endpoints:

- **Base64**: `https://your-worker.workers.dev/sub?target=base64`
- **Clash Meta**: `https://your-worker.workers.dev/sub?target=clash`
- **Sing-Box**: `https://your-worker.workers.dev/sub?target=singbox`

## 🔒 امنیت

- ✅ هیچ Secretی در کد ذخیره نمی‌شود
- ✅ API Token فقط در GitHub Secrets نگهداری می‌شود
- ✅ دسترسی‌های توکن به حداقل لازم محدود است
- ✅ عدم نیاز به Account ID

## 🛠 عیب‌یابی

### خطای 404 در GitHub Pages:
- مطمئن شوید Pages روی **GitHub Actions** تنظیم شده است
- بررسی کنید workflow با موفقیت اجرا شده باشد

### خطای دپلوی Workers:
- توکن API را بررسی کنید
- دسترسی‌های توکن را تأیید کنید
- لاگ‌های GitHub Actions را بررسی کنید

## 📝 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

---

**ساخته شده با ❤️ برای Cloudflare Workers**
