// ============================================================
// CF-Edge Relay — Complete Refactored v3.2.0
// Integrated with GitHub Pages (ips.txt & proxy/ sync)
// All protocols: VLESS, Trojan, xhttp, ECH, SOCKS5, Multi-Sub
// ============================================================

import { connect } from 'cloudflare:sockets';

const base64TextDecoder = new TextDecoder();

function decodeBase64(text) {
  const binary = atob(text);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return base64TextDecoder.decode(bytes);
}

// ---- Runtime configuration state ----
let AUTH_UUID = '351c9981-04b6-4103-aa4b-864aa9c91469';
let fallbackAddress = '';
let socks5Config = '';
let customPreferredAddressList = [];
let customPreferredDomainList = [];
let enableProxyDowngrade = false;
let disableNonTLS = false;
let disablePreferred = false;
let enableRegionMatching = true;
let currentWorkerRegion = '';
let manualWorkerRegion = '';
let preferredAddressSource = '';
let githubRepoUrl = '';
let customPath = '';
let enableVless = true;
let enableTrojan = true;
let enableXhttp = false;
let transportPath = '';
let enableECH = false;
let customDNS = 'https://223.5.5.5/dns-query';
let customECHDomain = 'cloudflare-ech.com';
let customALPN = '';
let subscriptionConverterUrl = decodeBase64('aHR0cHM6Ly91cmwudjEubWsvc3Vi');

let enablePreferredDomain = true;
let enablePreferredIP = true;
let enableGitHubPreferred = true;
let enableNativeAddress = false;

// ---- In-Memory Cache for GitHub Pages Preferred IPs ----
let cachedGitHubIps = [];
let cachedGitHubIpsTime = 0;
const GITHUB_CACHE_TTL = 60 * 1000; // 60s TTL

// ---- KV-backed configuration ----
let kvStore = null;
let kvConfig = {};
let kvConfigLastLoad = 0;
const KV_CACHE_TTL = 30 * 1000; // 30s cache window
let kvConfigVersion = '';

const CONFIG_DEFAULTS = {
  wk: '', ev: 'yes', et: 'yes', ex: 'no', ech: 'no', tp: '',
  customDNS: 'https://223.5.5.5/dns-query',
  customECHDomain: 'cloudflare-ech.com',
  alpn: '', d: '', p: '', yx: '', yxURL: '', gh: '', s: '', homepage: '',
  scu: decodeBase64('aHR0cHM6Ly91cmwudjEubWsvc3Vi'),
  ena: 'no', epd: 'yes', epi: 'yes', egi: 'yes',
  ae: '', rm: '', qj: '', dkby: 'no', yxby: '',
  ipv4: 'yes', ipv6: 'yes',
  ispMobile: 'yes', ispUnicom: 'yes', ispTelecom: 'yes'
};

function isTruthy(value, defaultEnabled = false) {
  if (value === undefined || value === null || value === '') return defaultEnabled;
  if (value === true || value === false) return value;
  const text = String(value).trim().toLowerCase();
  if (text === 'yes' || text === 'true' || text === '1' || text === 'on') return true;
  if (text === 'no' || text === 'false' || text === '0' || text === 'off') return false;
  return defaultEnabled;
}

function normalizeToggle(value, defaultEnabled = false) {
  return isTruthy(value, defaultEnabled) ? 'yes' : 'no';
}

function getConfigToggle(key, defaultEnabled = false, fallback = undefined) {
  const defaultValue = fallback !== undefined ? fallback : (defaultEnabled ? 'yes' : 'no');
  return isTruthy(getConfigValue(key, defaultValue), defaultEnabled);
}

function getConfigTextValue(key, defaultValue = '', fallback = undefined) {
  const value = getConfigValue(key, fallback !== undefined ? fallback : defaultValue);
  return value === undefined || value === null ? defaultValue : String(value);
}

function buildEffectiveConfig(config) {
  const snapshot = { ...CONFIG_DEFAULTS, ...config };
  ['ev', 'et', 'ex', 'ech', 'ena', 'epd', 'epi', 'egi', 'ipv4', 'ipv6',
   'ispMobile', 'ispUnicom', 'ispTelecom'].forEach(key => {
    snapshot[key] = normalizeToggle(snapshot[key], isTruthy(CONFIG_DEFAULTS[key]));
  });
  if (snapshot.ev === 'no' && snapshot.et === 'no' && snapshot.ex === 'no') {
    snapshot.ev = 'yes';
  }
  if (snapshot.ech === 'yes') snapshot.dkby = 'yes';
  return snapshot;
}

function readEnvValue(env, ...names) {
  if (!env) return undefined;
  for (const name of names) {
    if (env[name] !== undefined && env[name] !== null && env[name] !== '') return env[name];
  }
  return undefined;
}

function getEnvConfigSnapshot(env = {}) {
  const mapping = {
    wk: ['wk', 'WK'], ev: ['ev', 'EV'], et: ['et', 'ET'], ex: ['ex', 'EX'],
    ech: ['ech', 'ECH'], tp: ['tp', 'TP'],
    customDNS: ['customDNS', 'CUSTOMDNS', 'CUSTOM_DNS'],
    customECHDomain: ['customECHDomain', 'CUSTOMECHDOMAIN', 'CUSTOM_ECH_DOMAIN'],
    alpn: ['alpn', 'ALPN'], d: ['d', 'D'], p: ['p', 'P'],
    yx: ['yx', 'YX'], yxURL: ['yxURL', 'YXURL', 'YX_URL'],
    gh: ['gh', 'GH', 'gh_url', 'GH_URL', 'github_url', 'GITHUB_URL'],
    s: ['s', 'S'], homepage: ['homepage', 'HOMEPAGE'], scu: ['scu', 'SCU'],
    ena: ['ena', 'ENA'], epd: ['epd', 'EPD'], epi: ['epi', 'EPI'], egi: ['egi', 'EGI'],
    ae: ['ae', 'AE'], rm: ['rm', 'RM'], qj: ['qj', 'QJ'],
    dkby: ['dkby', 'DKBY'], yxby: ['yxby', 'YXBY'],
    ipv4: ['ipv4', 'IPV4'], ipv6: ['ipv6', 'IPV6'],
    ispMobile: ['ispMobile', 'ISPMOBILE', 'ISP_MOBILE'],
    ispUnicom: ['ispUnicom', 'ISPUNICOM', 'ISP_UNICOM'],
    ispTelecom: ['ispTelecom', 'ISPTELECOM', 'ISP_TELECOM']
  };
  const snapshot = {};
  for (const [key, names] of Object.entries(mapping)) {
    const value = readEnvValue(env, ...names);
    if (value !== undefined) snapshot[key] = value;
  }
  return snapshot;
}

function getEffectiveConfigSnapshot(env = {}) {
  return buildEffectiveConfig({ ...getEnvConfigSnapshot(env), ...kvConfig });
}

// ---- Region mapping ----
const REGION_MAP = {
  HK: ['🇭🇰 Hong Kong', 'HK', 'Hong Kong'],
  US: ['🇺🇸 United States', 'US', 'United States'],
  SG: ['🇸🇬 Singapore', 'SG', 'Singapore'],
  JP: ['🇯🇵 Japan', 'JP', 'Japan'],
  KR: ['🇰🇷 South Korea', 'KR', 'South Korea'],
  DE: ['🇩🇪 Germany', 'DE', 'Germany'],
  SE: ['🇸🇪 Sweden', 'SE', 'Sweden'],
  NL: ['🇳🇱 Netherlands', 'NL', 'Netherlands'],
  FI: ['🇫🇮 Finland', 'FI', 'Finland'],
  GB: ['🇬🇧 United Kingdom', 'GB', 'United Kingdom'],
  Oracle: ['Oracle', 'Oracle'],
  DigitalOcean: ['DigitalOcean', 'DigitalOcean'],
  Vultr: ['Vultr', 'Vultr'],
  Multacom: ['Multacom', 'Multacom']
};

let backupAddressList = [
  { domain: decodeBase64('UHJveHlJUC5ISy5DTUxpdXNzc3MubmV0'), region: 'HK', regionCode: 'HK', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5VUy5DTUxpdXNzc3MubmV0'), region: 'US', regionCode: 'US', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5TRy5DTUxpdXNzc3MubmV0'), region: 'SG', regionCode: 'SG', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5KUC5DTUxpdXNzc3MubmV0'), region: 'JP', regionCode: 'JP', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5LUi5DTUxpdXNzc3MubmV0'), region: 'KR', regionCode: 'KR', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5ERS5DTUxpdXNzc3MubmV0'), region: 'DE', regionCode: 'DE', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5TRS5DTUxpdXNzc3MubmV0'), region: 'SE', regionCode: 'SE', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5OTC5DTUxpdXNzc3MubmV0'), region: 'NL', regionCode: 'NL', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5GSS5DTUxpdXNzc3MubmV0'), region: 'FI', regionCode: 'FI', port: 443 },
  { domain: decodeBase64('UHJveHlJUC5HQi5DTUxpdXNzc3MubmV0'), region: 'GB', regionCode: 'GB', port: 443 }
];

const DIRECT_DOMAIN_LIST = [
  { name: 'cloudflare.182682.xyz', domain: 'cloudflare.182682.xyz' },
  { name: 'speed.marisalnc.com', domain: 'speed.marisalnc.com' },
  { domain: 'freeyx.cloudflare88.eu.org' },
  { domain: 'bestcf.top' },
  { domain: 'cdn.2020111.xyz' },
  { domain: 'cfip.cfcdn.vip' },
  { domain: 'cf.0sm.com' }
];

const ERR_INVALID_DATA = atob('aW52YWxpZCBkYXRh');
const ERR_INVALID_USER = atob('aW52YWxpZCB1c2Vy');
const ERR_UNSUPPORTED_COMMAND = atob('Y29tbWFuZCBpcyBub3Qgc3VwcG9ydGVk');
const ERR_UDP_DNS_ONLY = atob('VURQIHByb3h5IG9ubHkgZW5hYmxlIGZvciBETlMgd2hpY2ggaXMgcG9ydCA1Mw==');
const ERR_INVALID_ADDRESS_TYPE = atob('aW52YWxpZCBhZGRyZXNzVHlwZQ==');
const ERR_EMPTY_ADDRESS = atob('YWRkcmVzc1ZhbHVlIGlzIGVtcHR5');
const ERR_WS_NOT_OPEN = atob('d2ViU29ja2V0LmVhZHlTdGF0ZSBpcyBub3Qgb3Blbg==');
const ERR_INVALID_UUID_STRING = atob('U3RyaW5naWZpZWQgaWRlbnRpZmllciBpcyBpbnZhbGlk');
const ERR_INVALID_SOCKS_ADDRESS = atob('SW52YWxpZCBTT0NLUyBhZGRyZXNzIGZvcm1hdA==');
const ERR_SOCKS_NO_METHODS = atob('bm8gYWNjZXB0YWJsZSBtZXRob2Rz');
const ERR_SOCKS_NEEDS_AUTH = atob('c29ja3Mgc2VydmVyIG5lZWRzIGF1dGg=');
const ERR_SOCKS_AUTH_FAILED = atob('ZmFpbCB0byBhdXRoIHNvY2tzIHNlcnZlcg==');
const ERR_SOCKS_CONNECT_FAILED = atob('ZmFpbCB0byBvcGVuIHNvY2tzIGNvbm5lY3Rpb24=');

let parsedSocks5Config = {};
let isProxyEnabled = false;

const ADDR_TYPE_IPV4 = 1;
const ADDR_TYPE_DOMAIN = 2;
const ADDR_TYPE_IPV6 = 3;
const TRANSPORT_CHUNK_SIZE = 64 * 1024;
const DOWNLOAD_PACKET_SIZE = 32 * 1024;
const DOWNLOAD_TAIL = 512;
const DOWNLOAD_DELAY = 0;
const UPLOAD_PACKET_SIZE = 16 * 1024;
const UPLOAD_QUEUE_LIMIT = 256 * 1024;
const CONNECT_RACE_COUNT = 2;
const FIRST_BYTE_TIMEOUT = 3500;

const sharedDecoder = new TextDecoder();
const uuidBytesCache = new Map();

function isValidUuidFormat(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

function isValidAddress(addr) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(addr)) return true;
  const ipv6FullRegex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6FullRegex.test(addr)) return true;
  const ipv6CompactRegex = /^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$/;
  if (ipv6CompactRegex.test(addr)) return true;
  return false;
}

function normalizeAlpn(value) {
  const allowed = ['', 'h3', 'h2', 'http/1.1', 'h3,h2', 'h2,http/1.1', 'h3,h2,http/1.1'];
  const alpn = String(value || '').trim();
  return allowed.includes(alpn) ? alpn : '';
}

function applyAlpnToParams(params) {
  const alpn = normalizeAlpn(customALPN);
  if (alpn) params.set('alpn', alpn);
}

// ============================================================
// KV Configuration Management
// ============================================================
async function initKvStore(env) {
  if (env.C) {
    try {
      kvStore = env.C;
      await loadKvConfig();
    } catch (err) {
      kvStore = null;
    }
  }
}

async function loadKvConfig(force = false) {
  if (!kvStore) return;
  if (!force && kvConfigLastLoad > 0 && Date.now() - kvConfigLastLoad < KV_CACHE_TTL) {
    return;
  }
  try {
    let version = '';
    try {
      version = (await kvStore.get('c_ver')) || '';
    } catch (ignored) {}

    if (!force && version && version === kvConfigVersion && kvConfig && Object.keys(kvConfig).length > 0) {
      kvConfigLastLoad = Date.now();
      return;
    }

    const configData = await kvStore.get('c');
    if (configData) {
      kvConfig = JSON.parse(configData);
    }
    kvConfigVersion = version;
    kvConfigLastLoad = Date.now();
  } catch (err) {
    if (!kvConfig) kvConfig = {};
  }
}

async function saveKvConfig() {
  if (!kvStore) return;
  try {
    const configString = JSON.stringify(kvConfig);
    await kvStore.put('c', configString);
    const newVersion = String(Date.now());
    kvConfigVersion = newVersion;
    try {
      await kvStore.put('c_ver', newVersion);
    } catch (ignored) {}
    kvConfigLastLoad = Date.now();
  } catch (err) {
    throw err;
  }
}

function getConfigValue(key, defaultValue = '') {
  if (kvConfig[key] !== undefined) return kvConfig[key];
  return defaultValue;
}

async function setConfigValue(key, value) {
  kvConfig[key] = value;
  await saveKvConfig();
}

// ============================================================
// Region detection & backup addresses
// ============================================================
async function detectWorkerRegion(request) {
  try {
    const cfCountry = request.cf?.country;
    if (cfCountry) {
      const countryToRegion = {
        US: 'US', SG: 'SG', JP: 'JP', KR: 'KR', DE: 'DE',
        SE: 'SE', NL: 'NL', FI: 'FI', GB: 'GB',
        CN: 'SG', TW: 'JP', AU: 'SG', CA: 'US',
        FR: 'DE', IT: 'DE', ES: 'DE', CH: 'DE', AT: 'DE',
        BE: 'NL', DK: 'SE', NO: 'SE', IE: 'GB'
      };
      if (countryToRegion[cfCountry]) return countryToRegion[cfCountry];
    }
    return 'SG';
  } catch (err) {
    return 'SG';
  }
}

function parseAddressPort(input) {
  if (input.includes('[') && input.includes(']')) {
    const match = input.match(/^\[([^\]]+)\](?::(\d+))?$/);
    if (match) {
      return { address: match[1], port: match[2] ? parseInt(match[2], 10) : null };
    }
  }
  const colonIndex = input.lastIndexOf(':');
  if (colonIndex > 0) {
    const address = input.substring(0, colonIndex);
    const portString = input.substring(colonIndex + 1);
    const port = parseInt(portString, 10);
    if (!address.includes(':') && !isNaN(port) && port > 0 && port <= 65535) {
      return { address, port };
    }
  }
  return { address: input, port: null };
}

// ============================================================
// Dynamic GitHub Pages Sync (ips.txt & proxy/ files)
// ============================================================
async function fetchGitHubPagesPreferredIps() {
  const now = Date.now();
  if (cachedGitHubIps.length > 0 && (now - cachedGitHubIpsTime < GITHUB_CACHE_TTL)) {
    return cachedGitHubIps;
  }

  const urlsToTry = [];
  if (preferredAddressSource && preferredAddressSource.trim()) {
    urlsToTry.push(preferredAddressSource.trim());
  }
  if (githubRepoUrl && githubRepoUrl.trim()) {
    const base = githubRepoUrl.trim().replace(/\/+$/, '');
    urlsToTry.push(base + '/ips.txt');
    urlsToTry.push(base.replace('github.io', 'raw.githubusercontent.com') + '/main/ips.txt');
  }

  for (const url of urlsToTry) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Cloudflare-Worker-Edge-Relay/3.2' },
        cf: { cacheTtl: 60, cacheEverything: true }
      });
      if (resp.ok) {
        const text = await resp.text();
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#'));
        const parsed = [];
        for (const line of lines) {
          let nodeName = '';
          let addressPart = line;
          if (line.includes('#')) {
            const parts = line.split('#');
            addressPart = parts[0].trim();
            nodeName = parts[1].trim();
          }
          const { address, port } = parseAddressPort(addressPart);
          if (address) {
            parsed.push({
              ip: address,
              port: port || 443,
              name: nodeName || address + (port ? ':' + port : ''),
              isp: nodeName || 'CF-IP'
            });
          }
        }
        if (parsed.length > 0) {
          cachedGitHubIps = parsed;
          cachedGitHubIpsTime = now;
          return cachedGitHubIps;
        }
      }
    } catch (err) {}
  }
  return cachedGitHubIps;
}

// ============================================================
// Socket & Streaming Helpers
// ============================================================
function toUint8Array(chunk) {
  if (chunk instanceof Uint8Array) return chunk;
  if (chunk instanceof ArrayBuffer) return new Uint8Array(chunk);
  if (ArrayBuffer.isView(chunk)) return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength);
  return new Uint8Array(chunk);
}

function concatUint8Arrays(head, body) {
  const a = toUint8Array(head);
  const b = toUint8Array(body);
  const out = new Uint8Array(a.byteLength + b.byteLength);
  out.set(a);
  out.set(b, a.byteLength);
  return out;
}

function openSocket(address, port) {
  return connect({ hostname: address, port });
}

function closeSocketSafe(socket) {
  try {
    if (socket && typeof socket.close === 'function') socket.close();
  } catch (err) {}
}

function getUuidBytes(token) {
  if (uuidBytesCache.has(token)) return uuidBytesCache.get(token);
  const hex = String(token || '').replace(/-/g, '');
  if (hex.length !== 32) return null;
  const bytes = new Uint8Array(16);
  for (let i = 0; i < 16; i++) {
    const value = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    if (Number.isNaN(value)) return null;
    bytes[i] = value;
  }
  if (uuidBytesCache.size > 16) uuidBytesCache.clear();
  uuidBytesCache.set(token, bytes);
  return bytes;
}

function matchUuidAt(bytes, offset, token) {
  const id = getUuidBytes(token);
  if (!id) return false;
  for (let i = 0; i < 16; i++) {
    if (bytes[offset + i] !== id[i]) return false;
  }
  return true;
}

function parseVlessWsHeader(chunk, token) {
  const bytes = toUint8Array(chunk);
  if (bytes.byteLength < 24) return { hasError: true, message: ERR_INVALID_DATA };
  const version = bytes.subarray(0, 1);
  if (!matchUuidAt(bytes, 1, token)) return { hasError: true, message: ERR_INVALID_USER };

  const addonsLen = bytes[17];
  const commandIndex = 18 + addonsLen;
  if (bytes.byteLength < commandIndex + 5) return { hasError: true, message: ERR_INVALID_DATA };

  const command = bytes[commandIndex];
  let isUDP = command === 2;
  const portIndex = 19 + addonsLen;
  const port = bytes[portIndex] << 8 | bytes[portIndex + 1];

  let addressIndex = portIndex + 2;
  let addressLength = 0;
  let valueIndex = addressIndex + 1;
  let hostname = '';
  const addressType = bytes[addressIndex];

  switch (addressType) {
    case ADDR_TYPE_IPV4:
      addressLength = 4;
      if (bytes.byteLength < valueIndex + addressLength) return { hasError: true, message: ERR_INVALID_DATA };
      hostname = `${bytes[valueIndex]}.${bytes[valueIndex + 1]}.${bytes[valueIndex + 2]}.${bytes[valueIndex + 3]}`;
      break;
    case ADDR_TYPE_DOMAIN:
      if (bytes.byteLength < valueIndex + 1) return { hasError: true, message: ERR_INVALID_DATA };
      addressLength = bytes[valueIndex++];
      if (bytes.byteLength < valueIndex + addressLength) return { hasError: true, message: ERR_INVALID_DATA };
      hostname = sharedDecoder.decode(bytes.subarray(valueIndex, valueIndex + addressLength));
      break;
    case ADDR_TYPE_IPV6: {
      addressLength = 16;
      if (bytes.byteLength < valueIndex + addressLength) return { hasError: true, message: ERR_INVALID_DATA };
      const groups = [];
      const view = new DataView(bytes.buffer, bytes.byteOffset + valueIndex, addressLength);
      for (let i = 0; i < 8; i++) groups.push(view.getUint16(i * 2).toString(16));
      hostname = groups.join(':');
      break;
    }
    default:
      return { hasError: true, message: `${ERR_INVALID_ADDRESS_TYPE}: ${addressType}` };
  }

  if (!hostname) return { hasError: true, message: `${ERR_EMPTY_ADDRESS}: ${addressType}` };

  return {
    hasError: false,
    addressType,
    port,
    hostname,
    isUDP,
    rawIndex: valueIndex + addressLength,
    version
  };
}

async function handleWebSocketRequest(request) {
  const wsPair = new WebSocketPair();
  const [clientWs, serverWs] = Object.values(wsPair);
  serverWs.accept();
  serverWs.binaryType = 'arraybuffer';

  let remoteSocket = null;
  let remoteWriter = null;
  let isDnsMode = false;
  let established = false;

  serverWs.addEventListener('message', async (event) => {
    try {
      const data = toUint8Array(event.data);
      if (established && remoteWriter) {
        await remoteWriter.write(data);
        return;
      }

      if (enableVless && data.byteLength >= 24) {
        const vlessResult = parseVlessWsHeader(data, AUTH_UUID);
        if (!vlessResult.hasError) {
          const { addressType, port, hostname, rawIndex, version, isUDP } = vlessResult;
          if (isUDP) {
            if (port === 53) isDnsMode = true;
            else throw new Error(ERR_UDP_DNS_ONLY);
          }
          const responseHeader = new Uint8Array([version[0], 0]);
          const rawClientData = data.subarray(rawIndex);

          let targetHost = hostname;
          let targetPort = port;
          if (fallbackAddress && fallbackAddress.trim()) {
            const p = parseAddressPort(fallbackAddress);
            targetHost = p.address;
            targetPort = p.port || port;
          }

          remoteSocket = openSocket(targetHost, targetPort);
          remoteWriter = remoteSocket.writable.getWriter();
          if (rawClientData.byteLength > 0) {
            await remoteWriter.write(rawClientData);
          }
          established = true;

          (async () => {
            try {
              const reader = remoteSocket.readable.getReader();
              let first = true;
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (serverWs.readyState !== 1) break;
                let chunk = toUint8Array(value);
                if (first) {
                  chunk = concatUint8Arrays(responseHeader, chunk);
                  first = false;
                }
                serverWs.send(chunk);
              }
            } catch (err) {
            } finally {
              closeSocketSafe(serverWs);
            }
          })();
          return;
        }
      }
      throw new Error('Authentication failed or invalid protocol header');
    } catch (err) {
      closeSocketSafe(serverWs);
      closeSocketSafe(remoteSocket);
    }
  });

  serverWs.addEventListener('close', () => {
    closeSocketSafe(remoteSocket);
  });

  return new Response(null, { status: 101, webSocket: clientWs });
}

// ============================================================
// Subscription Output Builders
// ============================================================
function generateVlessLink(item, user, workerDomain) {
  const safeAddr = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
  const port = item.port || 443;
  const nodeName = item.name || item.isp || `${item.ip}:${port}`;
  const params = new URLSearchParams({
    encryption: 'none',
    security: 'tls',
    sni: workerDomain,
    fp: 'chrome',
    type: 'ws',
    host: workerDomain,
    path: '/?ed=2048'
  });
  applyAlpnToParams(params);
  return `vless://${user}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`;
}

function generateTrojanLink(item, user, workerDomain) {
  const safeAddr = item.ip.includes(':') ? `[${item.ip}]` : item.ip;
  const port = item.port || 443;
  const password = transportPath || user;
  const nodeName = item.name || item.isp || `${item.ip}:${port}`;
  const params = new URLSearchParams({
    security: 'tls',
    sni: workerDomain,
    fp: 'chrome',
    type: 'ws',
    host: workerDomain,
    path: '/?ed=2048'
  });
  applyAlpnToParams(params);
  return `trojan://${password}@${safeAddr}:${port}?${params.toString()}#${encodeURIComponent(nodeName)}`;
}

function generateClashYaml(nodes) {
  const proxies = nodes.map(n => {
    return `  - name: "${n.name}"
    type: ${n.type}
    server: "${n.server}"
    port: ${n.port}
    ${n.type === 'vless' ? `uuid: "${n.uuid}"\n    udp: true\n    tls: true\n    client-fingerprint: chrome` : `password: "${n.password}"\n    udp: true`}
    servername: "${n.sni}"
    network: ws
    ws-opts:
      path: "${n.path}"
      headers:
        Host: "${n.host}"`;
  }).join('\n');

  const proxyNames = nodes.map(n => `      - "${n.name}"`).join('\n');

  return `mixed-port: 7890
allow-lan: true
mode: rule
log-level: info
ipv6: true
dns:
  enable: true
  nameserver:
    - 223.5.5.5
    - 119.29.29.29
proxies:
${proxies}
proxy-groups:
  - name: "🚀 节点选择"
    type: select
    proxies:
      - "🎯 全球直连"
${proxyNames}
  - name: "🎯 全球直连"
    type: select
    proxies:
      - DIRECT
rules:
  - GEOIP,LAN,🎯 全球直连,no-resolve
  - GEOIP,IR,🎯 全球直连,no-resolve
  - MATCH,🚀 节点选择
`;
}

function generateSingBoxJson(nodes) {
  const outbounds = nodes.map(n => {
    return {
      type: n.type,
      tag: n.name,
      server: n.server,
      server_port: n.port,
      ...(n.type === 'vless' ? { uuid: n.uuid } : { password: n.password }),
      tls: {
        enabled: true,
        server_name: n.sni,
        utls: { enabled: true, fingerprint: 'chrome' }
      },
      transport: {
        type: 'ws',
        path: n.path,
        headers: { Host: n.host }
      }
    };
  });

  const config = {
    log: { level: 'info' },
    dns: {
      servers: [
        { tag: 'remote', address: 'https://223.5.5.5/dns-query', detour: 'select' },
        { tag: 'local', address: '223.5.5.5', detour: 'direct' }
      ]
    },
    inbounds: [
      { type: 'mixed', tag: 'mixed-in', listen: '127.0.0.1', listen_port: 2080 }
    ],
    outbounds: [
      { type: 'selector', tag: 'select', outbounds: ['direct', ...nodes.map(n => n.name)] },
      ...outbounds,
      { type: 'direct', tag: 'direct' }
    ]
  };
  return JSON.stringify(config, null, 2);
}

// ============================================================
// Main Fetch Handler
// ============================================================
export default {
  async fetch(request, env, ctx) {
    try {
      await initKvStore(env);
      AUTH_UUID = (env.u || env.U || AUTH_UUID).toLowerCase();
      customPath = (env.d || env.D || '').toLowerCase();
      preferredAddressSource = (env.yxURL || env.YXURL || '').trim();
      githubRepoUrl = (env.gh || env.GH || env.gh_url || env.GH_URL || '').trim();

      const url = new URL(request.url);
      const isWebSocket = request.headers.get('Upgrade') === 'websocket';

      // 1. WebSocket Tunnel Handshake
      if (isWebSocket) {
        return await handleWebSocketRequest(request);
      }

      // 2. Dynamic Subscription Route (/sub)
      if (url.pathname === '/sub' || url.pathname.endsWith('/sub')) {
        const target = url.searchParams.get('target') || 'base64';
        const workerDomain = url.hostname;

        // Pull latest preferred IPs from GitHub Pages (ips.txt)
        const ipList = await fetchGitHubPagesPreferredIps();
        const effectiveNodes = [];

        if (ipList.length > 0) {
          for (const item of ipList) {
            if (enableVless) {
              effectiveNodes.push({
                type: 'vless',
                name: item.name || item.isp || `VLESS-${item.ip}`,
                server: item.ip,
                port: item.port || 443,
                uuid: AUTH_UUID,
                sni: workerDomain,
                host: workerDomain,
                path: '/?ed=2048'
              });
            }
            if (enableTrojan) {
              effectiveNodes.push({
                type: 'trojan',
                name: item.name || item.isp || `Trojan-${item.ip}`,
                server: item.ip,
                port: item.port || 443,
                password: transportPath || AUTH_UUID,
                sni: workerDomain,
                host: workerDomain,
                path: '/?ed=2048'
              });
            }
          }
        } else {
          for (const d of DIRECT_DOMAIN_LIST) {
            effectiveNodes.push({
              type: 'vless',
              name: d.name || d.domain,
              server: d.domain,
              port: 443,
              uuid: AUTH_UUID,
              sni: workerDomain,
              host: workerDomain,
              path: '/?ed=2048'
            });
          }
        }

        if (target === 'clash' || target === 'meta' || target === 'stash') {
          return new Response(generateClashYaml(effectiveNodes), {
            headers: { 'Content-Type': 'text/yaml; charset=utf-8', 'Cache-Control': 'no-store, max-age=0' }
          });
        }
        if (target === 'singbox' || target === 'sing-box') {
          return new Response(generateSingBoxJson(effectiveNodes), {
            headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0' }
          });
        }

        const rawLinks = effectiveNodes.map(n => {
          return n.type === 'vless'
            ? generateVlessLink({ ip: n.server, port: n.port, name: n.name }, n.uuid, n.sni)
            : generateTrojanLink({ ip: n.server, port: n.port, name: n.name }, n.password, n.sni);
        });

        return new Response(btoa(rawLinks.join('\n')), {
          headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store, max-age=0' }
        });
      }

      // 3. API Config Route
      if (url.pathname.includes('/api/config')) {
        if (!kvStore) return new Response(JSON.stringify({ error: 'KV Store not bound' }), { status: 503 });
        if (request.method === 'GET') {
          return new Response(JSON.stringify({ ...getEffectiveConfigSnapshot(env), kvEnabled: true }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
        if (request.method === 'POST') {
          const body = await request.json();
          Object.assign(kvConfig, body);
          await saveKvConfig();
          return new Response(JSON.stringify({ success: true, message: 'Config saved' }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }

      // 4. Region Info Endpoint
      if (url.pathname === '/region' || url.pathname.endsWith('/region')) {
        const region = await detectWorkerRegion(request);
        return new Response(JSON.stringify({ region, timestamp: new Date().toISOString() }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // 5. Default Route
      const cleanCustom = customPath.replace(/^\/+/, '');
      const pathSeg = url.pathname.replace(/^\/+/, '').split('/')[0];

      if (url.pathname === '/' || pathSeg === AUTH_UUID || (cleanCustom && pathSeg === cleanCustom)) {
        return new Response('CF-Edge Relay is active & synchronized with GitHub Pages. Access /sub for your live subscription link.', {
          status: 200,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }

      return new Response('Not Found', { status: 404 });
    } catch (err) {
      return new Response(err.toString(), { status: 500 });
    }
  }
};
