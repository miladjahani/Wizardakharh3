# راهنمای کامل دپلوی به Cloudflare Workers

## مراحل راه‌اندازی

### مرحله ۱: ساخت Cloudflare API Token

1. وارد [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) شوید
2. روی دکمه **Create Token** کلیک کنید
3. در بخش **API Tokens**، قالب **Edit Cloudflare Workers** را انتخاب کنید
4. روی **Use template** کلیک کنید
5. توکن را کپی کرده و در جای امنی ذخیره کنید

### مرحله ۲: پیدا کردن Account ID

1. وارد [Cloudflare Dashboard](https://dash.cloudflare.com/) شوید
2. Account ID در سمت راست صفحه اصلی (در بخش Account Details) نمایش داده می‌شود
3. آن را کپی کنید

### مرحله ۳: تنظیم Secrets در GitHub

1. به ریپازیتوری گیت‌هاب خود بروید
2. به تب **Settings** بروید
3. از منوی سمت چپ، **Secrets and variables** → **Actions** را انتخاب کنید
4. روی **New repository secret** کلیک کنید
5. دو secret زیر را اضافه کنید:

   - **Name**: `CF_API_TOKEN`  
     **Value**: توکن API که در مرحله ۱ ساختید

   - **Name**: `CF_ACCOUNT_ID`  
     **Value**: Account ID که در مرحله ۲ پیدا کردید

### مرحله ۴: دپلوی خودکار

پس از تکمیل مراحل بالا:

- با هر بار push به شاخه‌های `main` یا `master`، پروژه به صورت خودکار به Cloudflare Workers دپلوی می‌شود
- برای دپلوی دستی، به تب **Actions** بروید و workflow **Deploy to Cloudflare Workers** را اجرا کنید

### مرحله ۵: پیکربندی ورکر

فایل `wrangler.toml` را در ریپازیتوری ویرایش کنید:

```toml
name = "edge-relay"          # نام ورکر شما
main = "Source.js"           # فایل اصلی ورکر
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[vars]
u = "uuid-shoma-inja"        # UUID برای احراز هویت
d = ""                       # آدرس fallback (اختیاری)
p = ""                       # پسورد (اختیاری)
ev = "yes"                   # فعال‌سازی VLESS
et = "yes"                   # فعال‌سازی Trojan
# سایر تنظیمات...
```

### مرحله ۶: دسترسی به ورکر

پس از دپلوی موفق، ورکر شما در آدرس زیر قابل دسترسی است:

```
https://edge-relay.<your-subdomain>.workers.dev
```

## عیب‌یابی

### خطای Authentication Failed

- مطمئن شوید CF_API_TOKEN و CF_ACCOUNT_ID را درست وارد کرده‌اید
- توکن API باید دسترسی **Workers:Write** داشته باشد

### خطای Worker Not Found

- بررسی کنید فایل `Source.js` در ریپازیتوری وجود دارد
- نام فایل در `wrangler.toml` باید با فایل اصلی یکسان باشد

### خطای Build Failed

- لاگ‌های GitHub Actions را بررسی کنید
- مطمئن شوید کد JavaScript با محیط Cloudflare Workers سازگار است

## لینک‌های مفید

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI Documentation](https://developers.cloudflare.com/workers/wrangler/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
