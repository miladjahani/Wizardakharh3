#!/usr/bin/env python3
"""
HTTP Proxy Relay for Google Apps Script DomainFront
------------------------------------------------------
این پروکسی روی پورت 8080 گوش می‌کند و تمام درخواست‌های
HTTP / HTTPS را از طریق اسکریپت Google Apps Script
به اینترنت می‌فرستد.  
برای اتصال v2rayNG به 127.0.0.1:8080 تنظیم شود.

نیازمندی: فقط Python 3 (بدون کتابخانه اضافی)
"""

import json
import base64
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler

# ⚠️ مقادیر زیر را دقیقاً مطابق تنظیمات اسکریپت گوگل تغییر دهید
AUTH_KEY = "09130134990"  # ← کلید احراز هویت (باید با AUTH_KEY در اسکریپت گوگل یکسان باشد)
GAS_URL = "https://script.google.com/macros/s/AKfycbzqiyRDDEXYBAjmxI-unO_W25L0_YawdsZsaobVD8N1QGw5zREUp9rs4KE8pIN3S4Je/exec"
PROXY_PORT = 8080

class RelayHandler(BaseHTTPRequestHandler):
    # فعال کردن لاگ (اختیاری، خطایابی راحت‌تر)
    def log_message(self, format, *args):
        print(f"[{self.address_string()}] {format % args}")

    def do_GET(self):
        self._relay("GET")

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length else b""
        self._relay("POST", body)

    def do_PUT(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length) if content_length else b""
        self._relay("PUT", body)

    def do_DELETE(self):
        self._relay("DELETE")

    def do_HEAD(self):
        self._relay("HEAD")

    def do_OPTIONS(self):
        self._relay("OPTIONS")

    def do_CONNECT(self):
        # درخواست‌های HTTPS تونل (CONNECT) توسط این پروکسی ساده پشتیبانی نمی‌شود.
        # اما v2ray معمولاً کل ترافیک را به صورت HTTP معمولی می‌فرستد و نیاز به CONNECT ندارد.
        self.send_response(405)
        self.end_headers()

    def _relay(self, method, body=None):
        try:
            # ۱. استخراج هدرهای درخواست اصلی و حذف هدرهای غیرضروری
            headers = {}
            for key in self.headers.keys():
                low = key.lower()
                # حذف هدرهای hop-by-hop و هدرهای امنیتی لو‌دهنده
                if low in ("host", "connection", "proxy-connection",
                           "transfer-encoding", "x-forwarded-for",
                           "x-real-ip", "via", "forwarded"):
                    continue
                headers[key] = self.headers[key]

            # ۲. تبدیل body به Base64 (اگر وجود داشته باشد)
            b64body = base64.b64encode(body).decode() if body else ""

            # ۳. ساختن payload برای اسکریپت گوگل (حالت socks)
            payload = {
                "k": AUTH_KEY,
                "socks": [
                    {
                        "id": 0,
                        "method": method,
                        "url": self.path,
                        "headers": headers,
                        "body": b64body,
                        # contentType در صورت نیاز خود اسکریپت مدیریت می‌کند
                    }
                ]
            }

            # ۴. ارسال درخواست به Google Apps Script
            req = urllib.request.Request(
                GAS_URL,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result_json = json.loads(resp.read().decode("utf-8"))

            # ۵. پردازش پاسخ
            if "results" not in result_json or len(result_json["results"]) == 0:
                self.send_response(502)
                self.end_headers()
                self.wfile.write(b"Invalid relay response")
                return

            res = result_json["results"][0]
            if "error" in res:
                print(f"Relay error: {res['error']}")
                self.send_response(502)
                self.end_headers()
                self.wfile.write(f"Relay error: {res['error']}".encode())
                return

            # ۶. بازگرداندن پاسخ به کلاینت
            response_status = res.get("status", 200)
            response_headers = res.get("headers", {})
            response_body_b64 = res.get("body", "")
            response_body = base64.b64decode(response_body_b64)

            self.send_response(response_status)

            # انتقال هدرهای پاسخ (به جز hop-by-hop)
            for h, v in response_headers.items():
                if h.lower() in ("transfer-encoding", "connection",
                                 "keep-alive", "proxy-authenticate"):
                    continue
                self.send_header(h, v)

            self.end_headers()
            self.wfile.write(response_body)

        except urllib.error.HTTPError as e:
            print(f"HTTP error from GAS: {e.code}")
            self.send_response(502)
            self.end_headers()
            self.wfile.write(f"Upstream HTTP error: {e.code}".encode())

        except Exception as e:
            print(f"Proxy internal error: {e}")
            self.send_response(502)
            self.end_headers()
            self.wfile.write(b"Proxy error occurred")

def main():
    server = HTTPServer(("127.0.0.1", PROXY_PORT), RelayHandler)
    print(f"✓ پروکسی رله روی http://127.0.0.1:{PROXY_PORT} اجرا شد.")
    print("  v2rayNG را به آدرس 127.0.0.1:" + str(PROXY_PORT) + " (پروکسی HTTP) متصل کنید.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nخروج از پروکسی.")
        server.shutdown()

if __name__ == "__main__":
    main()