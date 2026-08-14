# ⚡ CF Edge Relay — Cloudflare Workers + GitHub Pages

## 📋 توضیحات

این پروژه به‌طور خودکار از گیت‌هاب به **Cloudflare Workers** و **GitHub Pages** دپلوی می‌شود. فقط کافیست API Token کلودفلر را وارد کنید تا همه چیز به‌صورت خودکار تنظیم و دپلوی شود.

---

## 🚀 راه‌اندازی سریع

### مرحله ۱: اضافه کردن API Token به GitHub Secrets

1. به ریپازیتوری گیت‌هاب خود بروید
2. به **Settings → Secrets and variables → Actions** بروید
3. روی **New repository secret** کلیک کنید
4. Secret زیر را اضافه کنید:

   - **Name:** `CF_API_TOKEN`
   - **Value:** API Token کلودفلر خود را وارد کنید

### نحوه ساخت API Token در کلودفلر:

1. به آدرس [https://dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) بروید
2. روی **Create Token** کلیک کنید
3. قالب **Edit Cloudflare Workers** را انتخاب کنید (یا توکن سفارشی با دسترسی `workers.edit` بسازید)
4. توکن ساخته شده را کپی کنید

> ✅ **نیازی به وارد کردن Account ID نیست!** سیستم به‌طور خودکار Account ID را از روی توکن استخراج می‌کند.

---

### مرحله ۲: فعال‌سازی GitHub Pages

1. به **Settings → Pages** بروید
2. در بخش **Build and deployment**:
   - **Source:** GitHub Actions
3. تغییرات را ذخیره کنید

---

### مرحله ۳: دپلوی خودکار

با هر بار push به شاخه‌های `main` یا `master`:

✅ کد ورکر به **Cloudflare Workers** دپلوی می‌شود  
✅ فایل‌های استاتیک از پوشه `public/` به **GitHub Pages** دپلوی می‌شوند  
✅ تنظیمات GitHub repo به‌طور خودکار در `wrangler.toml` اعمال می‌شود

---

## 🌐 آدرس‌های دسترسی

- **Cloudflare Workers:** `https://edge-relay.<your-subdomain>.workers.dev`
- **GitHub Pages:** `https://<username>.github.io/<repository-name>/`
- **Wizard (تنظیمات):** `https://<username>.github.io/<repository-name>/index.html`

---

## 📁 ساختار پروژه

```
/workspace/
├── .github/workflows/deploy.yml    # GitHub Actions workflow
├── Source.js                       # کد اصلی ورکر
├── wrangler.toml                   # تنظیمات Wrangler (auto-updated)
├── public/
│   └── index.html                  # صفحه Wizard برای دپلوی
├── wizard/
│   ├── index.html                  # صفحه تنظیمات پیشرفته
│   └── wizard.js                   # اسکریپت Wizard
├── ips.txt                         # لیست IPهای ترجیحی
└── proxy/                          # فایل‌های پروکسی بر اساس کشور
```

---

## 🔧 تنظیمات دستی (اختیاری)

اگر می‌خواهید تنظیمات خاصی را اعمال کنید، می‌توانید از طریق KV Store یا Environment Variables در Cloudflare Dashboard اقدام کنید:

### Environment Variables موجود:

| Variable | توضیحات | پیش‌فرض |
|----------|---------|---------|
| `u` | UUID برای احراز هویت | auto-generated |
| `d` | مسیر سفارشی | empty |
| `ev` | فعال‌سازی VLESS | yes |
| `et` | فعال‌سازی Trojan | yes |
| `ex` | فعال‌سازی xhttp | no |
| `ech` | فعال‌سازی ECH | no |
| `gh` | آدرس GitHub repo | auto-set |
| `yxURL` | آدرس ips.txt در GitHub Pages | auto-set |

---

## 🛠 عیب‌یابی

### خطای 404 در GitHub Pages:
- مطمئن شوید GitHub Pages در Settings → Pages فعال باشد
- منبع را روی **GitHub Actions** قرار دهید
- یک commit جدید push کنید تا workflow اجرا شود

### خطای Deployment در Workers:
- بررسی کنید API Token معتبر باشد
- دسترسی `workers.edit` به توکن داده شده باشد
- لاگ‌های GitHub Actions را بررسی کنید

### ورکر دپلوی می‌شود اما Wizard نمایش داده نمی‌شود:
- آدرس Worker را مستقیماً در مرورگر باز کنید
- مسیر `/sub` را برای دریافت subscription امتحان کنید
- کش مرورگر را پاک کنید

---

## 📝 نکات مهم

1. **امنیت:** API Token شما فقط در GitHub Secrets ذخیره می‌شود و هرگز در کد قرار نمی‌گیرد
2. **به‌روزرسانی خودکار:** با هر push جدید، دپلوی خودکار انجام می‌شود
3. **هماهنگی Workers و Pages:** ابتدا Workers دپلوی می‌شود، سپس Pages
4. **تنظیمات خودکار:** آدرس‌های GitHub repo به‌طور خودکار در wrangler.toml اعمال می‌شوند

---

## 📄 لایسنس

این پروژه تحت لایسنس MIT منتشر شده است.

---

ساخته شده با ❤️ برای کلودفلر ورکرز
