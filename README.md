# CF-Edge Relay — Cloudflare Workers Deployment

این پروژه برای دپلوی مستقیم از گیت‌هاب به کلودفلر ورکرز بهینه شده است.

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

### ۴. دپلوی خودکار

پس از تنظیم secrets، با هر بار push به شاخه‌های `main` یا `master`، پروژه به صورت خودکار به کلودفلر ورکرز دپلوی می‌شود.

همچنین می‌توانید از تب **Actions** در گیت‌هاب، workflow را به صورت دستی اجرا کنید.

## پیکربندی

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

## استفاده

پس از دپلوی، ورکر شما در آدرس زیر قابل دسترسی است:

```
https://edge-relay.<your-subdomain>.workers.dev
```

## مجوزها

MIT
