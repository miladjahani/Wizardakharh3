# CF Edge Relay — Cloudflare Workers & GitHub Pages Deployment

این پروژه برای دپلوی مستقیم از گیت‌هاب به کلودفلر ورکرز و گیت‌هاب پیجز بهینه شده است.

## راه‌اندازی سریع

### ۱. تنظیم Secrets در گیت‌هاب

به ریپازیتوری گیت‌هاب خود بروید و به مسیر **Settings → Secrets and variables → Actions** بروید.

دو secret زیر را اضافه کنید:

- `CF_API_TOKEN`: توکن API کلودفلر شما (با دسترسی Worker)
- `CF_ACCOUNT_ID`: شناسه اکانت کلودفلر شما

### ۲. دریافت Cloudflare API Token

1. به [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) بروید
2. روی **Create Token** کلیک کنید
3. قالب **Edit Cloudflare Workers** را انتخاب کنید
4. توکن را ایجاد و کپی کنید

### ۳. پیدا کردن Account ID

1. به [Cloudflare Dashboard](https://dash.cloudflare.com/) بروید
2. Account ID در سمت راست صفحه اصلی نمایش داده می‌شود

### ۴. فعال‌سازی GitHub Pages

1. به ریپازیتوری گیت‌هاب خود بروید
2. به مسیر **Settings → Pages** بروید
3. در بخش **Build and deployment**، منبع را روی **GitHub Actions** قرار دهید

### ۵. دپلوی خودکار

پس از تنظیم secrets، با هر بار push به شاخه‌های `main` یا `master`، پروژه به صورت خودکار به موارد زیر دپلوی می‌شود:

- ✅ **Cloudflare Workers** - برای اجرای کدهای سروری
- ✅ **GitHub Pages** - برای میزبانی صفحات استاتیک

همچنین می‌توانید از تب **Actions** در گیت‌هاب، workflow را به صورت دستی اجرا کنید.

## پیکربندی

### Cloudflare Workers

فایل `wrangler.toml` را برای تنظیمات ورکر ویرایش کنید:

```toml
name = "edge-relay"
main = "Source.js"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
u = "your-uuid-here"
d = ""
p = ""
# سایر تنظیمات...
```

### GitHub Pages

فایل‌های استاتیک خود را در پوشه `public/` قرار دهید. این فایل‌ها به صورت خودکار به GitHub Pages دپلوی می‌شوند.

## استفاده

### Cloudflare Workers

پس از دپلوی، ورکر شما در آدرس زیر قابل دسترسی است:

```
https://edge-relay.<your-subdomain>.workers.dev
```

### GitHub Pages

صفحات استاتیک شما در آدرس زیر قابل دسترسی خواهند بود:

```
https://<username>.github.io/<repository-name>/
```

## ساختار پروژه

```
├── .github/workflows/
│   └── deploy.yml          # Workflow دپلوی خودکار
├── public/                 # فایل‌های استاتیک برای GitHub Pages
│   └── index.html
├── Source.js              # کد اصلی ورکر
├── wrangler.toml          # تنظیمات Cloudflare Workers
└── README.md              # این فایل
```

## مجوزها

MIT
