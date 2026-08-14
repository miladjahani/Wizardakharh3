/* ============================================================
   EDGE·FORGE — Deploy Wizard (GitHub Pages & Cloudflare Integrated)
   Deploys Source.js with auto-sync to GitHub Pages ips.txt & config
   ============================================================ */
(function () {
'use strict';

var API = 'https://api.cloudflare.com/client/v4';
var COMPAT = '2025-01-01';

// Auto-detect GitHub Pages repository URL
function getAutoRepoUrl() {
  if (window.location.hostname.endsWith('github.io')) {
    var parts = window.location.pathname.split('/').filter(Boolean);
    if (parts.length > 0) {
      return window.location.origin + '/' + parts[0];
    }
  }
  return window.location.origin;
}

var AUTO_REPO_URL = getAutoRepoUrl();

/* ---- i18n ---- */
var DICT = {
en: {
 brand_sub:'deploy wizard', sig_idle:'idle', sig_verify:'verifying', sig_online:'connected', sig_error:'error',
 rail_title:'deployment pipeline',
 step_token_t:'API token', step_token_d:'verify & scope check',
 step_account_t:'account', step_account_d:'target cloudflare account',
 step_method_t:'method', step_method_d:'workers or pages',
 step_config_t:'configure', step_config_d:'name, uuid, domain',
 step_deploy_t:'deploy', step_deploy_d:'build & ship to edge',
 ey_auth:'authorization', h_token:'Cloudflare Authentication',
 lede_token:'Paste your Cloudflare API token. It is used securely directly from your browser.',
 f_token_label:'Cloudflare API token', f_token_ph:'paste token…',
 f_remember:'Remember token on this device (localStorage)',
 f_remember_help:'Off by default. Stored in your browser only.',
 scopes_title:'required token permissions', copy_scopes:'copy list',
 open_dash:'Create a token in dashboard →',
 scopes_hint:'Use “Custom token” with Workers Scripts:Edit, KV:Edit, Account Settings:Read.',
 f_verify_btn:'Verify & continue →',
 ey_target:'target', h_account:'Target Account', lede_account:'The Worker and KV storage will be created under this account.',
 f_account_label:'Cloudflare account', btn_continue:'Continue →', btn_back:'← Back',
 ey_runtime:'runtime', h_method:'Deployment Runtime', lede_method:'Cloudflare Workers is the recommended native runtime.',
 method_workers:'Cloudflare Workers', method_workers_d:'Native KV and direct module deployment. Instant & robust.',
 method_pages:'Cloudflare Pages', method_pages_d:'Deployed as a Pages function.',
 ey_build:'build config', h_config:'Configuration & GitHub Sync', lede_config:'Configure your Worker name, UUID, and GitHub Pages sync URL.',
 f_name_label:'Worker / project name', f_name_help:'lowercase, digits, hyphens · 1–63 chars',
 f_uuid_label:'Access secret / UUID (variable u)', f_uuid_help:'Your private access secret',
 f_gh_label:'GitHub Pages sync URL (ips.txt & proxies source)', f_gh_help:'Changes to ips.txt on this GitHub Pages repo will dynamically update the Worker sublink in real time',
 f_path_label:'Custom path (variable d) — optional', f_path_ph:'e.g. mypath', f_path_help:'If set, sublink & panel are reached via /<path>',
 f_domain_label:'Custom domain — optional', f_domain_ph:'e.g. relay.example.com', f_domain_help:'Leave empty to use workers.dev',
 f_zone_label:'Zone for custom domain', adv_src:'advanced · source resolution',
 f_source_label:'Worker Source File Override', f_source_help:'Wizard reads ../Source.js by default',
 btn_deploy:'⚡ Deploy now', btn_retry:'↻ Retry',
 ey_ship:'shipping', h_deploy:'Deploying to Cloudflare Edge',
 res_title:'Live on the edge 🎉', res_lede:'Your Cloudflare Edge Relay is active and synchronized with GitHub Pages.',
 res_base:'worker base url', res_panel:'sublink / panel url', copy:'copy', open_panel:'open link',
 res_note:'Any update to ips.txt on GitHub Pages will automatically reflect in your subscription link within 60s without re-deploying!',
 foot_note:'EDGE·FORGE runs entirely in your browser. Token is sent directly to api.cloudflare.com.',
 err_token_empty:'Please enter a token', err_token_invalid:'Token rejected by Cloudflare', err_no_accounts:'No accounts found',
 err_name_invalid:'Invalid name (1-63 chars: a-z, 0-9, hyphen)', err_path_invalid:'Invalid path format',
 misc_copied:'Copied to clipboard', misc_stored:'Stored token loaded',
 l_verify:'Verifying API token', l_accounts:'Listing accounts', l_zones:'Listing zones',
 l_source:'Loading Source.js from repository', l_kv:'Setting up KV namespace', l_upload:'Uploading & deploying script',
 l_devroute:'Enabling workers.dev route', l_subdomain:'Fetching subdomain',
 l_proj:'Creating Pages project', l_bind:'Binding KV & GitHub sync variables', l_pages_dep:'Uploading deployment', l_cdom:'Attaching custom domain',
 l_done:'Deployment complete & synchronized with GitHub Pages', req:'required', opt:'optional'
},
fa: {
 brand_sub:'ویزارد استقرار و همگام‌سازی', sig_idle:'آماده', sig_verify:'در حال بررسی', sig_online:'متصل', sig_error:'خطا',
 rail_title:'خط لولهٔ استقرار',
 step_token_t:'توکن API', step_token_d:'بررسی و دسترسی‌ها',
 step_account_t:'حساب', step_account_d:'انتخاب اکانت کلودفلر',
 step_method_t:'روش', step_method_d:'ورکرز یا پیجز',
 step_config_t:'پیکربندی', step_config_d:'نام، UUID، همگام‌سازی گیت‌هاب',
 step_deploy_t:'استقرار', step_deploy_d:'ساخت و ارسال به لبه',
 ey_auth:'احراز هویت', h_token:'احراز هویت کلودفلر',
 lede_token:'توکن API کلودفلر خود را وارد کنید. این توکن مستقیماً در مرورگر شما استفاده می‌شود.',
 f_token_label:'توکن API کلودفلر', f_token_ph:'توکن را اینجا بچسبانید…',
 f_remember:'ذخیره توکن در مرورگر (localStorage)',
 f_remember_help:'پیش‌فرض خاموش. در صورت تمایل ذخیره می‌شود.',
 scopes_title:'دسترسی‌های مورد نیاز', copy_scopes:'کپی دسترسی‌ها',
 open_dash:'ساخت توکن در داشبورد کلودفلر →',
 scopes_hint:'از بخش Custom token با دسترسی‌های Workers Scripts, KV و Account Settings استفاده کنید.',
 f_verify_btn:'بررسی توکن و ادامه →',
 ey_target:'هدف', h_account:'انتخاب حساب کلودفلر', lede_account:'ورکر و فضای KV زیر این حساب ساخته می‌شوند.',
 f_account_label:'حساب کاربری', btn_continue:'ادامه →', btn_back:'← بازگشت',
 ey_runtime:'محیط اجرا', h_method:'انتخاب نوع استقرار', lede_method:'Cloudflare Workers مسیر پیشنهادی و پایدار است.',
 method_workers:'Cloudflare Workers', method_workers_d:'استقرار بومی با اتصال خودکار KV و متغیرها.',
 method_pages:'Cloudflare Pages', method_pages_d:'استقرار در قالب Pages.',
 ey_build:'پیکربندی ساخت', h_config:'تنظیمات ورکر و اتصال به GitHub Pages', lede_config:'مشخصات ورکر و آدرس مخزن گیت‌هاب را جهت همگام‌سازی خودکار بررسی کنید.',
 f_name_label:'نام ورکر / پروژه', f_name_help:'حروف کوچک، اعداد و خط‌تیره · ۱ تا ۶۳ کاراکتر',
 f_uuid_label:'رمز دسترسی / UUID (متغیر u)', f_uuid_help:'شناسه اختصاصی شما جهت اتصال به ورکر',
 f_gh_label:'آدرس مخزن GitHub Pages (منبع ips.txt و پروکسی‌ها)', f_gh_help:'با هر تغییری که در فایل ips.txt گیت‌هاب بدهید، سابلینک ورکر بدون نیاز به استقرار مجدد بروز می‌شود',
 f_path_label:'مسیر سفارشی (متغیر d) — اختیاری', f_path_ph:'مثلاً mypath', f_path_help:'در صورت تنظیم، سابلینک از /mypath/sub در دسترس خواهد بود',
 f_domain_label:'دامنه اختصاصی — اختیاری', f_domain_ph:'مثلاً relay.example.com', f_domain_help:'برای استفاده از workers.dev خالی بگذارید',
 f_zone_label:'Zone دامنه', adv_src:'پیشرفته · فایل سورس',
 f_source_label:'آدرس فایل Source.js', f_source_help:'ویزارد به‌طور خودکار فایل ../Source.js را بارگذاری می‌کند',
 btn_deploy:'⚡ استقرار و همگام‌سازی فوری', btn_retry:'↻ تلاش دوباره',
 ey_ship:'ارسال', h_deploy:'در حال ارسال به لبه کلودفلر',
 res_title:'روی لبه کلودفلر فعال شد 🎉', res_lede:'رله کلودفلر شما با موفقیت مستقر و به GitHub Pages متصل گردید.',
 res_base:'آدرس پایه ورکر', res_panel:'لینک ساب‌اسکریپشن (/sub)', copy:'کپی', open_panel:'باز کردن سابلینک',
 res_note:'از این پس هر تغییری در ips.txt روی گیت‌هاب پیجز بدهید، حداکثر ظرف ۶۰ ثانیه به صورت خودکار در سابلینک اعمال می‌شود!',
 foot_note:'EDGE·FORGE به صورت کلاینت-ساید در مرورگر اجرا می‌شود و با گیت‌هاب پیجز یکپارچه است.',
 err_token_empty:'لطفاً توکن را وارد کنید', err_token_invalid:'توکن توسط کلودفلر رد شد', err_no_accounts:'هیچ حسابی یافت نشد',
 err_name_invalid:'نام نامعتبر است', err_path_invalid:'مسیر نامعتبر است',
 misc_copied:'در کلیپ‌بورد کپی شد', misc_stored:'توکن ذخیره‌شده بارگذاری شد',
 l_verify:'بررسی اعتبار توکن', l_accounts:'دریافت لیست حساب‌ها', l_zones:'دریافت لیست زون‌ها',
 l_source:'بارگذاری Source.js از مخزن', l_kv:'ساخت و اتصال فضای KV', l_upload:'آپلود و استقرار ورکر',
 l_devroute:'فعال‌سازی ساب‌دامین workers.dev', l_subdomain:'استعلام ساب‌دامین',
 l_proj:'ساخت پروژه Pages', l_bind:'اتصال متغیرهای همگام‌سازی گیت‌هاب', l_pages_dep:'آپلود استقرار', l_cdom:'اتصال دامنه اختصاصی',
 l_done:'استقرار کامل شد و با گیت‌هاب پیجز همگام گردید', req:'الزامی', opt:'اختیاری'
}
};

var SCOPES = [
 {en:'Account · Workers Scripts · Edit', fa:'حساب · Workers Scripts · Edit', req:true},
 {en:'Account · Workers KV Storage · Edit', fa:'حساب · Workers KV Storage · Edit', req:true},
 {en:'Account · Account Settings · Read', fa:'حساب · Account Settings · Read', req:true},
 {en:'Zone · Zone · Read', fa:'زون · Zone · Read', req:false}
];

/* ---- state ---- */
var S = {
 lang: detectLang(), theme: localStorage.getItem('ef_theme') || 'dark',
 token: '', accountId: '', accountName: '', method: 'workers',
 scriptName: '', uuid: '', githubPagesUrl: AUTO_REPO_URL,
 customPath: '', customDomain: '', zoneId: '',
 sourceUrl: '../Source.js', accounts: [], zones: []
};

function detectLang(){
  var c = (document.cookie.match(/preferredLanguage=([^;]+)/)||[]);
  var ls = localStorage.getItem('preferredLanguage');
  var v = c || ls || (navigator.language||'').slice(0,2);
  return v === 'fa' ? 'fa' : 'en';
}
function T(k){ return (DICT[S.lang] && DICT[S.lang][k]) || DICT.en[k] || k; }
function $(s,r){ return (r||document).querySelector(s); }
function $all(s,r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }

function applyI18n(){
  document.documentElement.lang = S.lang === 'fa' ? 'fa' : 'en';
  document.documentElement.dir = S.lang === 'fa' ? 'rtl' : 'ltr';
  document.documentElement.classList.toggle('lang-fa', S.lang === 'fa');
  $all('[data-i18n]').forEach(function(el){ el.textContent = T(el.getAttribute('data-i18n')); });
  $all('[data-i18n-ph]').forEach(function(el){ el.setAttribute('placeholder', T(el.getAttribute('data-i18n-ph'))); });
  $('#langSel').value = S.lang;
  renderScopes();
}
function renderScopes(){
  var ul = $('#scopeList'); if (!ul) return;
  ul.innerHTML = '';
  SCOPES.forEach(function(s){
    var li = document.createElement('li');
    li.innerHTML = '<span class="tag '+(s.req?'req':'opt')+'">'+(s.req?T('req'):T('opt'))+'</span><span class="nm">'+(S.lang==='fa'?s.fa:s.en)+'</span>';
    ul.appendChild(li);
  });
}

function applyTheme(){
  document.documentElement.setAttribute('data-theme', S.theme);
  $('#themeBtn').textContent = S.theme === 'light' ? '☾' : '☀';
}

var toastT;
function toast(msg){ var t=$('#toast'); if(!t) return; t.textContent=msg; t.classList.add('on'); clearTimeout(toastT); toastT=setTimeout(function(){t.classList.remove('on');},2200); }

/* ---- API client with JSON & Form handling ---- */
function api(method, path, body, opts){
  opts = opts || {};
  var h = { 'Authorization': 'Bearer ' + S.token };
  var b = body;
  if (body && !opts.form) { h['Content-Type'] = 'application/json'; b = JSON.stringify(body); }
  return fetch(API + path, { method: method, headers: h, body: b }).then(function(r){
    var ct = r.headers.get('content-type') || '';
    return (ct.indexOf('json') > -1 ? r.json() : r.text()).then(function(data){
      if (!r.ok || (data && data.success === false)) {
        var msg = (data && data.errors && data.errors.map(function(e){return e.message;}).join('; ')) || (typeof data === 'string' ? data.slice(0,180) : ('HTTP ' + r.status));
        var err = new Error(msg || ('HTTP ' + r.status)); err.status = r.status; err.data = data; throw err;
      }
      return data;
    });
  });
}

function genUuid(){
  try { return crypto.randomUUID().toLowerCase(); }
  catch(e){ return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,function(c){var r=Math.random()*16|0;return (c==='x'?r:(r&0x3|0x8)).toString(16);}).toLowerCase(); }
}
function genName(){ return 'edge-relay-' + genUuid().slice(0,6); }
function validName(n){ return /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/.test(n||''); }
function validPath(p){ return !p || /^\/?[A-Za-z0-9_-]+$/.test(p); }
function validHost(h){ return !h || /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(h); }
function copy(text){ if(navigator.clipboard) navigator.clipboard.writeText(text).then(function(){toast(T('misc_copied'));}); }
function now(){ var d=new Date(); return ('0'+d.getHours()).slice(-2)+':'+('0'+d.getMinutes()).slice(-2)+':'+('0'+d.getSeconds()).slice(-2); }

var TOTAL = 5;
function gotoStep(n){
  $all('.sec').forEach(function(s){ s.classList.toggle('on', +s.getAttribute('data-sec') === n); });
  $all('.step').forEach(function(s){ var i=+s.getAttribute('data-step'); s.classList.toggle('active', i===n); s.classList.toggle('done', i<n); });
  $('#progBar').style.width = ((n-1)/(TOTAL-1)*100) + '%';
  var crumbKey = ['','step_token_t','step_account_t','step_method_t','step_config_t','step_deploy_t'][n];
  $('#crumbStep').textContent = T(crumbKey);
}
function setSig(s, txt){ $('#sig').setAttribute('data-s', s); if(txt) $('#sigTxt').textContent = txt; }
function showErr(id, msg){ var e=$('#'+id); if(!e) return; e.textContent=msg; e.classList.add('on'); }
function clearErr(id){ var e=$('#'+id); if(e) e.classList.remove('on'); }

function logClear(){ $('#log').innerHTML=''; }
function log(text, level){
  var box=$('#log'); if(!box) return; var ln=document.createElement('div'); ln.className='ln';
  ln.innerHTML='<span class="tm">'+now()+'</span><span class="'+(level||'step')+'">'+escapeHtml(text)+'</span>';
  box.appendChild(ln); box.scrollTop = box.scrollHeight; return ln;
}
function logCaret(){ var box=$('#log'); if(!box) return; var c=document.createElement('span'); c.className='caret'; c.id='liveCaret'; var last=box.lastElementChild; if(last) last.appendChild(c); box.scrollTop=box.scrollHeight; }
function removeCaret(){ var c=$('#liveCaret'); if(c) c.remove(); }
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function timed(labelKey){ log('› ' + T(labelKey) + '…', 'step'); var t0=Date.now(); logCaret();
  return function ok(){ removeCaret(); var last=$('#log').lastElementChild; if(last){ var sp=last.querySelector('.step'); if(sp){ sp.className='ok'; sp.textContent='✓ '+T(labelKey)+' ('+(Date.now()-t0)+'ms)'; } } };
}

/* ---- Step 1: Verify ---- */
function doVerify(){
  clearErr('tokenErr');
  S.token = $('#token').value.trim();
  if (!S.token) { $('#token').classList.add('bad'); showErr('tokenErr', T('err_token_empty')); return; }
  $('#token').classList.remove('bad');
  setSig('verify', T('sig_verify'));
  var btn=$('#act1'); btn.disabled=true;
  var d1 = timed('l_verify');

  api('GET', '/user/tokens/verify')
    .then(function(res){
      if (!res.result || res.result.status !== 'active') throw new Error(T('err_token_invalid'));
      d1();
    })
    .catch(function(){
      return api('GET', '/accounts?per_page=1').then(function(){ d1(); });
    })
    .then(function(){
      var d2 = timed('l_accounts');
      return api('GET', '/accounts?per_page=50').then(function(res){
        d2();
        S.accounts = (res.result || []);
        if (!S.accounts.length) throw new Error(T('err_no_accounts'));
        fillAccounts();
        if (S.accounts.length === 1) { S.accountId = S.accounts[0].id; S.accountName = S.accounts[0].name; }
        setSig('online', T('sig_online'));
        if ($('#remember').checked) localStorage.setItem('ef_token', S.token); else localStorage.removeItem('ef_token');
        saveCfg();
        setTimeout(function(){ gotoStep(2); }, 350);
      });
    })
    .catch(function(e){
      removeCaret(); log('✗ ' + e.message, 'err');
      setSig('error', T('sig_error')); $('#token').classList.add('bad'); showErr('tokenErr', e.message);
    })
    .finally(function(){ btn.disabled=false; });
}

function fillAccounts(){
  var sel=$('#account'); sel.innerHTML='';
  S.accounts.forEach(function(a){ var o=document.createElement('option'); o.value=a.id; o.textContent=a.name+' ('+a.id.slice(0,8)+'…)'; sel.appendChild(o); });
  if (S.accountId) sel.value = S.accountId;
  else if (S.accounts.length > 0) { S.accountId = S.accounts[0].id; S.accountName = S.accounts[0].name; }
}

/* ---- Step 4: Zones ---- */
function loadZones(){
  var zsel=$('#zone');
  var query = S.accountId ? ('/zones?account.id=' + S.accountId + '&per_page=50&status=active') : '/zones?per_page=50&status=active';
  api('GET', query).then(function(res){
    S.zones = res.result || [];
    zsel.innerHTML = '<option value="">— Auto Detect / Select Zone —</option>';
    S.zones.forEach(function(z){ var o=document.createElement('option'); o.value=z.id; o.textContent=z.name; zsel.appendChild(o); });
    autoMatchZone();
  }).catch(function(){ S.zones=[]; });
}

function autoMatchZone(){
  if (!S.customDomain || !S.zones.length) return;
  var domain = S.customDomain.toLowerCase();
  var matchedZone = S.zones.find(function(z){ return domain === z.name.toLowerCase() || domain.endsWith('.' + z.name.toLowerCase()); });
  if (matchedZone) {
    S.zoneId = matchedZone.id;
    var zsel = $('#zone');
    if (zsel) zsel.value = matchedZone.id;
  }
}

/* ---- Source fetcher (reads Source.js from repo) ---- */
function fetchSource(){
  var urls = [
    '../Source.js',
    './Source.js',
    '../worker-source.js',
    './worker-source.js',
    '../worker.js',
    './worker.js',
    '../_worker.js',
    './_worker.js',
    S.sourceUrl
  ].filter(Boolean);

  var i = 0;
  function tryNext(){
    if (i >= urls.length) throw new Error('Source.js not found in repository (' + urls.join(', ') + ')');
    var u = urls[i++];
    return fetch(u).then(function(r){
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.text();
    }).then(function(t){
      if (t && (t.indexOf('export default') > -1 || t.indexOf('addEventListener') > -1)) return t;
      throw new Error('Invalid worker structure');
    }).catch(function(){ return tryNext(); });
  }
  return tryNext();
}

/* ---- Build standard multipart FormData with GitHub Sync ---- */
function buildFormData(code, kvId){
  var cleanPath = (S.customPath || '').replace(/^\/+/, '').trim();
  var ghBase = (S.githubPagesUrl || AUTO_REPO_URL || '').replace(/\/+$/, '');
  var ipsUrl = ghBase ? (ghBase + '/ips.txt') : '';

  var meta = {
    main_module: 'worker.js',
    compatibility_date: COMPAT,
    compatibility_flags: ['nodejs_compat'],
    bindings: [
      { type:'kv_namespace', name:'C', namespace_id: kvId },
      { type:'plain_text', name:'u', text: S.uuid.toLowerCase().trim() },
      { type:'plain_text', name:'d', text: cleanPath },
      { type:'plain_text', name:'p', text: '' },
      { type:'plain_text', name:'yxURL', text: ipsUrl },
      { type:'plain_text', name:'gh', text: ghBase }
    ]
  };
  var fd = new FormData();
  fd.append('metadata', new Blob([JSON.stringify(meta)], { type:'application/json' }));
  fd.append('worker.js', new Blob([code], { type:'application/javascript+module' }), 'worker.js');
  return fd;
}

function getOrCreateKvNamespace(acc, name){
  var title = name + '-kv';
  return api('POST', '/accounts/' + acc + '/storage/kv/namespaces', { title: title })
    .then(function(r){ return r.result.id; })
    .catch(function(err){
      return api('GET', '/accounts/' + acc + '/storage/kv/namespaces?per_page=100')
        .then(function(res){
          var found = (res.result || []).find(function(kv){ return kv.title === title; });
          if (found) return found.id;
          throw err;
        });
    });
}

/* ---- Deploy Execution ---- */
function deploy(){
  logClear(); $('#resultSlot').innerHTML=''; $('#retryBtn').style.display='none';
  setSig('verify', T('sig_verify'));
  var name = S.scriptName.toLowerCase().trim();
  var acc = S.accountId;
  var code, kvId, baseUrl;
  var cleanPath = (S.customPath || '').replace(/^\/+/, '').trim();
  var panelKey = cleanPath || S.uuid;

  Promise.resolve().then(function(){
    var d = timed('l_source');
    return fetchSource().then(function(c){
      code = c;
      d();
      log('   ' + code.length + ' bytes · Source.js loaded', 'ok');
    });
  }).then(function(){
    var d = timed('l_kv');
    return getOrCreateKvNamespace(acc, name).then(function(id){
      kvId = id;
      d();
      log('   KV Namespace ID: ' + kvId, 'ok');
    });
  }).then(function(){
    if (S.method === 'workers') {
      return deployWorkers(code, kvId, name, acc).then(function(u){ baseUrl = u; });
    } else {
      return deployPages(code, kvId, name, acc).then(function(u){ baseUrl = u; });
    }
  }).then(function(){
    if (!S.customDomain) return;
    var d = timed('l_cdom');
    var targetZoneId = S.zoneId;
    if (!targetZoneId && S.zones && S.zones.length) {
      var match = S.zones.find(function(z){ return S.customDomain.toLowerCase().endsWith(z.name.toLowerCase()); });
      if (match) targetZoneId = match.id;
    }
    var p = S.method === 'workers'
      ? api('PUT', '/accounts/'+acc+'/workers/domains', { environment:'production', hostname:S.customDomain, service:name, zone_id:targetZoneId })
      : api('POST', '/accounts/'+acc+'/pages/projects/'+name+'/domains', { domain:S.customDomain });
    return p.then(function(){ d(); log('   Custom domain attached: ' + S.customDomain, 'ok'); })
            .catch(function(e){ removeCaret(); log('⚠ custom domain: ' + e.message, 'warn'); });
  }).then(function(){
    log('✓ ' + T('l_done'), 'ok');
    setSig('online', T('sig_online'));
    var finalBase = S.customDomain ? ('https://' + S.customDomain) : baseUrl;
    finalBase = finalBase.replace(/\/+$/, '');
    var finalSubUrl = finalBase + '/sub';
    showResult(finalBase, finalSubUrl, kvId);
    $all('.step').forEach(function(s){ if(+s.getAttribute('data-step')<=5) s.classList.add('done'); });
    $('#progBar').style.width='100%';
  }).catch(function(e){
    removeCaret(); log('✗ ' + e.message, 'err');
    setSig('error', T('sig_error')); $('#retryBtn').style.display='inline-flex';
  });
}

function deployWorkers(code, kvId, name, acc){
  var d = timed('l_upload');
  return api('PUT', '/accounts/'+acc+'/workers/scripts/'+name, buildFormData(code, kvId), { form:true })
    .then(function(){ d(); })
    .then(function(){
      var d2 = timed('l_devroute');
      return api('POST', '/accounts/'+acc+'/workers/scripts/'+name+'/subdomain', { enabled:true })
        .then(function(){ d2(); })
        .catch(function(){
          return api('PUT', '/accounts/'+acc+'/workers/scripts/'+name+'/subdomain', { enabled:true })
            .then(function(){ d2(); })
            .catch(function(){ removeCaret(); log('⚠ workers.dev route enabled', 'warn'); });
        });
    })
    .then(function(){
      var d3 = timed('l_subdomain');
      return api('GET', '/accounts/'+acc+'/workers/subdomain')
        .then(function(r){
          d3();
          var sub = r.result && r.result.subdomain;
          return sub ? ('https://' + name + '.' + sub + '.workers.dev') : ('https://' + name + '.workers.dev');
        })
        .catch(function(){
          removeCaret();
          return 'https://' + name + '.workers.dev';
        });
    });
}

function deployPages(code, kvId, name, acc){
  var d = timed('l_proj');
  return api('POST', '/accounts/'+acc+'/pages/projects', { name:name, production_branch:'main' })
    .then(function(){ d(); })
    .catch(function(){ removeCaret(); log('· project exists, reusing', 'warn'); })
  .then(function(){
    var d2 = timed('l_bind');
    var cleanPath = (S.customPath || '').replace(/^\/+/, '').trim();
    var ghBase = (S.githubPagesUrl || AUTO_REPO_URL || '').replace(/\/+$/, '');
    var cfg = { deployment_configs:{ production:{
      compatibility_date: COMPAT,
      compatibility_flags: ['nodejs_compat'],
      kv_namespaces:{ C:{ namespace_id: kvId } },
      environment_variables:{
        u:{ value:S.uuid.toLowerCase().trim(), type:'plain_text' },
        d:{ value:cleanPath, type:'plain_text' },
        p:{ value:'', type:'plain_text' },
        yxURL:{ value:ghBase ? (ghBase + '/ips.txt') : '', type:'plain_text' },
        gh:{ value:ghBase, type:'plain_text' }
      }
    }}};
    return api('PATCH', '/accounts/'+acc+'/pages/projects/'+name, cfg)
      .then(function(){ d2(); })
      .catch(function(e){ removeCaret(); log('⚠ bindings: ' + e.message, 'warn'); });
  })
  .then(function(){
    var d3 = timed('l_pages_dep');
    var fd = new FormData();
    fd.append('_worker.js', new Blob([code], { type:'application/javascript' }), '_worker.js');
    fd.append('branch', 'main');
    return api('POST', '/accounts/'+acc+'/pages/projects/'+name+'/deployments', fd, { form:true })
      .then(function(r){ d3(); return (r.result && r.result.url) || ('https://'+name+'.pages.dev'); })
      .catch(function(){
        removeCaret();
        return 'https://' + name + '.pages.dev';
      });
  });
}

function showResult(base, subUrl, kvId){
  var slot=$('#resultSlot');
  slot.innerHTML =
   '<div class="result"><span class="ring"></span>'+
     '<div class="chk">✓</div>'+
     '<h3>'+T('res_title')+'</h3><p>'+T('res_lede')+'</p>'+
     '<div class="linkbox"><div class="k">'+T('res_panel')+'</div>'+
       '<div class="linkrow"><div class="v" id="panelUrl">'+escapeHtml(subUrl)+'</div><button class="btn" id="cpPanel">'+T('copy')+'</button><a class="btn btn-primary" id="openPanel" href="'+escapeHtml(subUrl)+'" target="_blank" rel="noopener">'+T('open_panel')+'</a></div>'+
     '</div>'+
     '<div class="linkbox"><div class="k">'+T('res_base')+'</div>'+
       '<div class="linkrow"><div class="v">'+escapeHtml(base)+'</div><button class="btn" id="cpBase">'+T('copy')+'</button></div>'+
     '</div>'+
     '<div class="meta"><span>'+S.method+'</span><span>'+escapeHtml(S.scriptName)+'</span><span>KV '+escapeHtml(kvId.slice(0,8))+'…</span><span>Synced with GitHub</span></div>'+
     '<div class="note"><span>🔄</span><span>'+T('res_note')+'</span></div>'+
   '</div>';
  $('#cpPanel').onclick=function(){ copy(subUrl); };
  $('#cpBase').onclick=function(){ copy(base); };
}

function saveCfg(){
  localStorage.setItem('ef_cfg', JSON.stringify({ scriptName:S.scriptName, uuid:S.uuid, githubPagesUrl:S.githubPagesUrl, customPath:S.customPath, customDomain:S.customDomain, sourceUrl:S.sourceUrl, method:S.method }));
}
function loadCfg(){
  try { var c=JSON.parse(localStorage.getItem('ef_cfg')||'{}'); Object.keys(c).forEach(function(k){ if(c[k]) S[k]=c[k]; }); } catch(e){}
}

function init(){
  applyTheme(); loadCfg();
  if (!S.scriptName) S.scriptName = genName();
  if (!S.uuid) S.uuid = genUuid();
  if (!S.githubPagesUrl) S.githubPagesUrl = AUTO_REPO_URL;
  $('#scriptName').value = S.scriptName;
  $('#uuid').value = S.uuid;
  $('#ghUrl').value = S.githubPagesUrl || AUTO_REPO_URL;
  $('#customPath').value = S.customPath || '';
  $('#customDomain').value = S.customDomain || '';
  $('#sourceUrl').value = S.sourceUrl || '../Source.js';

  var stored = localStorage.getItem('ef_token');
  if (stored) { $('#token').value = stored; S.token = stored; $('#remember').checked = true; toast(T('misc_stored')); }

  applyI18n(); gotoStep(1);

  $('#langSel').onchange = function(){
    S.lang=this.value;
    localStorage.setItem('preferredLanguage', S.lang);
    var d=new Date(); d.setFullYear(d.getFullYear()+1);
    document.cookie='preferredLanguage='+S.lang+'; path=/; expires='+d.toUTCString()+'; SameSite=Lax';
    applyI18n();
  };
  $('#themeBtn').onclick = function(){ S.theme = S.theme==='light'?'dark':'light'; localStorage.setItem('ef_theme', S.theme); applyTheme(); };
  $('#eyeBtn').onclick = function(){ var i=$('#token'); i.type = i.type==='password'?'text':'password'; };
  $('#copyScopes').onclick = function(){ copy(SCOPES.map(function(s){return s.en;}).join('
')); };

  $('#act1').onclick = doVerify;
  $('#token').addEventListener('keydown', function(e){ if(e.key==='Enter') doVerify(); });
  $('#token').addEventListener('input', function(){ this.classList.remove('bad'); clearErr('tokenErr'); });

  $('#act2').onclick = function(){
    S.accountId = $('#account').value;
    var a = S.accounts.find(function(x){ return x.id === S.accountId; });
    S.accountName = a ? a.name : '';
    if (!S.accountId) return;
    gotoStep(3);
  };

  $all('#methodSeg button').forEach(function(b){
    b.onclick=function(){
      $all('#methodSeg button').forEach(function(x){x.setAttribute('aria-checked','false');});
      b.setAttribute('aria-checked','true');
      S.method=b.getAttribute('data-method');
    };
  });
  $('#act3').onclick = function(){ gotoStep(4); loadZones(); };

  $('#rerollName').onclick=function(){ S.scriptName=genName(); $('#scriptName').value=S.scriptName; };
  $('#rerollUuid').onclick=function(){ S.uuid=genUuid(); $('#uuid').value=S.uuid; };
  $('#scriptName').oninput=function(){ S.scriptName=this.value.trim().toLowerCase(); clearErr('nameErr'); };
  $('#uuid').oninput=function(){ S.uuid=this.value.trim(); };
  $('#ghUrl').oninput=function(){ S.githubPagesUrl=this.value.trim(); };
  $('#customPath').oninput=function(){ S.customPath=this.value.trim(); clearErr('pathErr'); };
  $('#customDomain').oninput=function(){
    S.customDomain=this.value.trim();
    $('#zoneField').style.display=this.value?'block':'none';
    clearErr('domainErr');
    autoMatchZone();
  };
  $('#zone').onchange=function(){ S.zoneId=this.value; };
  $('#sourceUrl').oninput=function(){ S.sourceUrl=this.value.trim(); };

  $('#act4').onclick = function(){
    clearErr('nameErr'); clearErr('pathErr'); clearErr('domainErr');
    if (!validName(S.scriptName)) { showErr('nameErr', T('err_name_invalid')); return; }
    if (!validPath(S.customPath)) { showErr('pathErr', T('err_path_invalid')); return; }
    if (S.customDomain) {
      if(!validHost(S.customDomain)){ showErr('domainErr', T('err_path_invalid')); return; }
      S.zoneId=$('#zone').value;
      if(!S.zoneId && S.zones.length > 0){ autoMatchZone(); }
    }
    saveCfg(); gotoStep(5); deploy();
  };

  $('#retryBtn').onclick = function(){ deploy(); };
  $all('[data-back]').forEach(function(b){
    b.onclick=function(){
      var on=$('.sec.on');
      var n=+on.getAttribute('data-sec');
      if(n>1) gotoStep(n-1);
    };
  });

  window.addEventListener('pointermove', function(e){
    var x=(e.clientX/window.innerWidth-.5), y=(e.clientY/window.innerHeight-.5);
    var ga = $('.glow.a'), gb = $('.glow.b');
    if (ga) ga.style.transform='translate('+(x*22)+'px,'+(y*22)+'px)';
    if (gb) gb.style.transform='translate('+(x*-26)+'px,'+(y*-26)+'px)';
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
