from flask import Flask, request, jsonify, Response, stream_with_context, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
from google import genai
from google.genai import types
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
from dotenv import load_dotenv
import json
import os
import re
import time
import hashlib
import requests
from concurrent.futures import ThreadPoolExecutor
import jwt
import datetime
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

load_dotenv()

# Import database helpers
from db import init_db, get_db_connection

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# ── Shop image uploads ──
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads", "shops")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
_ALLOWED_IMG_EXT = {"jpg", "jpeg", "png", "gif", "webp"}
_MAX_IMAGE_BYTES = 2 * 1024 * 1024  # 2 MB

def _allowed_image(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in _ALLOWED_IMG_EXT

# ── In-memory recommendation cache (TTL = 30 min) ──
_rec_cache: dict = {}
_CACHE_TTL = 1800

# ── IP-based rate limiter for /recommend/stream ──
_rate_limits: dict = {}
_RATE_WINDOW = 60   # 1-minute rolling window
_RATE_MAX    = 5    # max requests per window per IP

def _check_rate_limit(ip: str) -> bool:
    now  = time.time()
    hits = _rate_limits.get(ip, [])
    hits = [t for t in hits if now - t < _RATE_WINDOW]
    if len(hits) >= _RATE_MAX:
        return False
    hits.append(now)
    _rate_limits[ip] = hits
    return True

# ── Live exchange rate cache (TTL = 6 hours) ──
# LAK is an illiquid currency — many free APIs have stale or wrong data for it.
# We fetch live rates but validate them against known-good ranges before accepting.
_FALLBACK_USD_LAK = 22000
_FALLBACK_THB_LAK = 700
_rate_cache = {"usd_lak": _FALLBACK_USD_LAK, "thb_lak": _FALLBACK_THB_LAK, "fetched_at": 0.0}
_RATE_TTL = 21600  # 6 hours

def _get_exchange_rates() -> tuple[int, int]:
    """Return (usd_to_lak, thb_to_lak).
    Fetches live rate from open.er-api.com and caches for 6 h.
    Falls back to hardcoded values if the API is unreachable or returns
    a suspiciously low/high figure for LAK (common for illiquid currencies)."""
    global _rate_cache
    now = time.time()
    if now - _rate_cache["fetched_at"] < _RATE_TTL:
        return _rate_cache["usd_lak"], _rate_cache["thb_lak"]
    try:
        res = requests.get("https://open.er-api.com/v6/latest/USD", timeout=5)
        data = res.json()
        if data.get("result") == "success":
            rates   = data["rates"]
            usd_lak = int(rates.get("LAK", _FALLBACK_USD_LAK))
            thb_usd = rates.get("THB", 0)
            thb_lak = int(usd_lak / thb_usd) if thb_usd else _FALLBACK_THB_LAK

            # Sanity check: accept only if within ±40 % of known-good fallback.
            # open.er-api.com sometimes returns stale official rates for LAK that
            # are far below the real market rate (e.g. 8,000 instead of 22,000).
            usd_ok = 0.60 * _FALLBACK_USD_LAK <= usd_lak <= 1.40 * _FALLBACK_USD_LAK
            thb_ok = 0.60 * _FALLBACK_THB_LAK <= thb_lak <= 1.40 * _FALLBACK_THB_LAK
            if usd_ok and thb_ok:
                _rate_cache = {"usd_lak": usd_lak, "thb_lak": thb_lak, "fetched_at": now}
                print(f"[Rate] 1 USD = {usd_lak:,} LAK | 1 THB = {thb_lak:,} LAK (live)")
            else:
                _rate_cache["fetched_at"] = now  # don't hammer the API on every request
                print(f"[Rate] API returned suspect rates "
                      f"(usd_lak={usd_lak}, thb_lak={thb_lak}) — "
                      f"keeping fallback {_FALLBACK_USD_LAK}/{_FALLBACK_THB_LAK}")
    except Exception as e:
        print(f"[Rate] Fetch failed — using fallback: {e}")
    return _rate_cache["usd_lak"], _rate_cache["thb_lak"]

def _cache_key(data: dict) -> str:
    relevant = {k: data.get(k, "") for k in [
        "device", "budget", "purpose", "purposes", "brand", "city",
        "lang", "currency", "drilldown", "painPoints",
        "screenSize", "storage", "ram", "batteryLife", "brandTier",
        "lifecycle", "weightPriority", "specialFeatures", "stylusNeeded",
    ]}
    return hashlib.md5(json.dumps(relevant, sort_keys=True).encode()).hexdigest()

def _cache_get(key: str):
    entry = _rec_cache.get(key)
    if entry and (time.time() - entry[0]) < _CACHE_TTL:
        return entry[1]
    _rec_cache.pop(key, None)
    return None

def _cache_set(key: str, value):
    _rec_cache[key] = (time.time(), value)

# Initialize DB on startup
init_db()

# Configure JWT Secrets
JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-101-thesis")

# ── Gemini API key pool ──
# Auto-detects GEMINI_API_KEY plus GEMINI_API_KEY_2 … GEMINI_API_KEY_20 from .env.
# To add more keys: just add GEMINI_API_KEY_6=... etc. — no code change needed.
_GEMINI_KEYS = [k for k in (
    [os.getenv("GEMINI_API_KEY", "")] +
    [os.getenv(f"GEMINI_API_KEY_{i}", "") for i in range(2, 21)]
) if k.strip()]
if not _GEMINI_KEYS:
    raise RuntimeError("No Gemini API keys found — set GEMINI_API_KEY in .env")

# Model preference order — if a model hits quota, next one is tried
_GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]

def _gemini_generate(prompt: str, grounding: bool = False) -> str:
    """Call Gemini, rotating API keys and model fallbacks on 429 / quota errors.
    grounding=True enables Google Search so the model can fetch real-time prices."""
    last_err = None
    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())]
    ) if grounding else None

    for model in _GEMINI_MODELS:
        for key in _GEMINI_KEYS:
            try:
                c = genai.Client(api_key=key)
                kwargs = {"model": model, "contents": prompt}
                if config:
                    kwargs["config"] = config
                resp = c.models.generate_content(**kwargs)
                print(f"[Gemini] OK — model={model} key=...{key[-6:]} grounding={grounding}")
                return resp.text
            except Exception as e:
                msg = str(e)
                if any(code in msg for code in ("429", "503", "RESOURCE_EXHAUSTED", "UNAVAILABLE", "overloaded")):
                    print(f"[Gemini] {model} key=...{key[-6:]} unavailable, trying next")
                    last_err = e
                    continue
                raise
    raise last_err or Exception("All Gemini API keys and models exhausted")

# ── Google Custom Search API key+CX pool ──
# Each slot is a (api_key, cx) pair. Add more pairs via .env:
#   GOOGLE_SEARCH_API_KEY_3=... GOOGLE_SEARCH_CX_3=...
# The quota (100 req/day free) belongs to the API key — a new CX alone doesn't add quota.
# For real quota increase: create a new Google Cloud project → get a new API key → add here.
_CSE_FALLBACK_KEY = "AIzaSyBs08LcNePFNXnUFONB-BIKJI7WJFvJRD0"
_CSE_FALLBACK_CX  = "b23942747d7e3452e"
_CSE_POOL: list[tuple[str, str]] = []
for _i in range(1, 11):
    _suffix = "" if _i == 1 else f"_{_i}"
    _k = os.getenv(f"GOOGLE_SEARCH_API_KEY{_suffix}", _CSE_FALLBACK_KEY if _i == 1 else "")
    _c = os.getenv(f"GOOGLE_SEARCH_CX{_suffix}",      _CSE_FALLBACK_CX  if _i == 1 else "")
    if _k.strip() and _c.strip():
        _CSE_POOL.append((_k.strip(), _c.strip()))

# Keep legacy names working for the health check and guards below
GOOGLE_SEARCH_API_KEY = _CSE_POOL[0][0] if _CSE_POOL else ""
GOOGLE_SEARCH_CX      = _CSE_POOL[0][1] if _CSE_POOL else ""

def _cse_get(params: dict, timeout: int = 10) -> dict:
    """Call Google CSE, rotating key+CX pairs on 429 quota errors."""
    base_url = "https://www.googleapis.com/customsearch/v1"
    for key, cx in _CSE_POOL:
        try:
            p = {**params, "key": key, "cx": cx}
            res = requests.get(base_url, params=p, timeout=timeout)
            if res.status_code == 429:
                print(f"[CSE] key=...{key[-6:]} cx=...{cx[-6:]} quota exceeded, trying next pair")
                continue
            res.raise_for_status()
            return res.json()
        except requests.HTTPError:
            continue
        except Exception as e:
            print(f"[CSE] Request failed: {e}")
            continue
    return {}

# City alias map — every key normalises to a canonical English name.
# Values list every known spelling (Lao script, typos, short forms).
CITY_ALIASES = {
    "luang prabang": [
        "ຫຼວງພະບາງ", "ຫລວງພະບາງ", "luangprabang", "luang-prabang",
        "luang phrabang", "louangphabang", "louang prabang",
    ],
    "vientiane": [
        "ວຽງຈັນ", "viangchan", "viang chan", "vientianne",
        "vientiane capital", "ນະຄອນຫຼວງວຽງຈັນ",
    ],
    "pakse": ["ປາກເຊ", "pak se", "pakxe"],
    "savannakhet": ["ສະຫວັນນະເຂດ", "savanaket", "savan"],
    "champasak": ["ຈຳປາສັກ", "champassak"],
    "luang namtha": ["ຫຼວງນໍ້າທາ", "luangnamtha"],
    "xam neua": ["ສາມເໜືອ", "sam neua", "xamneua"],
    "phonsavanh": ["ຜົ້ງສາລີ", "phongsali"],
    "thakhek": ["ທ່າແຂກ", "tha khaek"],
}

def _city_variants(city_input: str) -> list:
    """Return all DB spellings that should match the user's city input."""
    low = city_input.strip().lower()
    # Direct hit — return as-is
    variants = [low]
    # Check if input IS one of the alias values → map back to canonical + all aliases
    for canonical, aliases in CITY_ALIASES.items():
        all_forms = [canonical] + [a.lower() for a in aliases]
        if low in all_forms:
            variants = all_forms
            break
    return variants


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({"success": False, "message": "Token is missing"}), 401
        
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = {
                "id": data["user_id"],
                "username": data["username"],
                "role": data["role"]
            }
        except jwt.ExpiredSignatureError:
            return jsonify({"success": False, "message": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"success": False, "message": "Invalid token"}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated




def _image_text(item: dict) -> str:
    """Searchable text for a CSE image result: its title + the page it came from.
    Far more reliable for matching than the raw image URL, which is usually an
    opaque CDN path with no model name in it."""
    return (item.get("title", "") + " " +
            item.get("image", {}).get("contextLink", "")).lower()


def _image_relevant(item: dict, model_tokens: list, name_words: set) -> bool:
    """True if a CSE image result actually depicts the queried product.
    Requires every product token (brand, series, model number) to appear in the
    title/source, and rejects wrong tiers (e.g. a 'Pro'/'Ultra' image when the base
    model was searched)."""
    text = _image_text(item)
    if not text.strip():
        return False
    if not all(tok in text for tok in model_tokens):
        return False
    text_words = {w for w in re.split(r"[^a-z0-9]+", text) if w}
    if any(tq in text_words and tq not in name_words for tq in _TIER_QUALIFIERS):
        return False
    return True


# Tier qualifiers shared across all brands — if a result title contains one of these
# but the searched product name does not, it's a different model tier and must be skipped.
# Works for any brand: iPhone 16 vs 16 Pro, Vivo V40 vs V40 Pro, S25 vs S25 Ultra, etc.
_TIER_QUALIFIERS = frozenset({
    "pro", "max", "ultra", "plus", "mini", "lite", "fe", "fold", "flip", "air",
})

def search_thai_price(product_name: str, device_type: str = "Smartphone") -> int | None:
    """Search Google CSE for Thai retail price, return LAK int or None."""
    if not GOOGLE_SEARCH_API_KEY or not GOOGLE_SEARCH_CX:
        return None

    # Extract storage variant (128GB, 256GB, 512GB, 1TB, 2TB) before stripping parens.
    # Including it in the query prevents fetching the cheaper base-storage price instead.
    # e.g. "iPhone 17 (256GB)" → search "iPhone 17 256GB", not just "iPhone 17".
    storage_m = re.search(r'\b(\d{1,4})\s*(GB|TB)\b', product_name, re.IGNORECASE)
    storage_str = storage_m.group(0).replace(" ", "").upper() if storage_m else None  # "256GB"

    clean = re.sub(r"\s*\(.*?\)\s*", " ", product_name).strip()
    if storage_str and storage_str.lower() not in clean.lower():
        clean = f"{clean} {storage_str}"

    year = datetime.datetime.now().year
    _is_laptop_tablet = device_type.lower() in ("laptop", "tablet")
    if _is_laptop_tablet:
        site_queries = [
            f'"{clean}" ราคา site:banana.co.th',
            f'"{clean}" ราคา site:powerbuy.co.th',
            f'"{clean}" ราคา site:bnn.in.th',
        ]
    else:
        site_queries = [
            f'"{clean}" ราคา site:advice.co.th',
            f'"{clean}" ราคา site:jib.co.th',
            f'"{clean}" ราคา site:itcity.co.th',
        ]
    queries = site_queries + [
        f'"{clean}" ราคา Thailand {year}',
    ]
    # Three anchored patterns — at least one anchor is always required:
    #   A) ราคา 35,900          — price after Thai word for "price" (no suffix needed)
    #   B) ฿35,900              — baht symbol before the number
    #   C) 35,900 บาท/THB       — unit label after the number
    thb_pattern = re.compile(
        r"ราคา\s*([\d]{2,6}(?:,\d{3})*)"           # A: ราคา 35,900
        r"|฿\s*([\d]{2,6}(?:,\d{3})*)"              # B: ฿35,900
        r"|([\d]{2,6}(?:,\d{3})*)\s*(?:บาท|THB)",  # C: 35,900 บาท / THB
        re.IGNORECASE
    )

    clean_lower  = clean.lower()
    clean_tokens = [tok for tok in clean_lower.split() if len(tok) >= 2]
    clean_words  = set(clean_lower.split())

    for cse_query in queries:
        try:
            data  = _cse_get({"q": cse_query, "num": 5}, timeout=8)
            items = data.get("items", [])
            for item in items:
                title       = item.get("title", "")
                snippet     = item.get("snippet", "")
                title_lower = title.lower()
                title_words = set(title_lower.split())

                # 1. Every keyword in the product name must appear in the result title
                if not all(tok in title_lower for tok in clean_tokens):
                    continue

                # 2. Storage variant must match — prevents using 128GB price for 256GB search
                if storage_str and storage_str.lower() not in title_lower:
                    continue

                # 3. Title must not have tier qualifiers absent from the product name.
                #    Applies to all brands: rejects "Pro/Ultra/Plus/Fold/etc." results
                #    when the base model was searched.
                if any(tq in title_words and tq not in clean_words for tq in _TIER_QUALIFIERS):
                    continue

                text = title + " " + snippet
                for m in thb_pattern.finditer(text):
                    # One of three capture groups will be set; take the first non-empty
                    thb_str = (m.group(1) or m.group(2) or m.group(3) or "").replace(",", "")
                    if not thb_str:
                        continue
                    thb = int(thb_str)
                    if 3000 < thb < 300000:
                        _, thb_lak = _get_exchange_rates()
                        lak = round(thb * thb_lak / 100000) * 100000
                        print(f"[Price] {product_name}: {thb} THB × {thb_lak} = ₭{lak:,}")
                        return lak
        except Exception as e:
            print(f"[Price] Search failed: {e}")
            continue
    return None


def search_product_image(product_name, brand=None):
    """Search for product image using Google Custom Search API."""
    if not GOOGLE_SEARCH_API_KEY or not GOOGLE_SEARCH_CX:
        print("[Error] Missing API key or Search Engine ID")
        return None

    # Strip specs in parentheses and connectivity noise from product name
    clean_name = re.sub(r"\s*\(.*?\)\s*", " ", product_name).strip()
    clean_name = re.sub(r"\b(with 5g|lte|wifi only)\b", "", clean_name, flags=re.IGNORECASE).strip()

    # Only prepend brand if it isn't already in the product name
    base  = f"{brand} {clean_name}" if brand and brand.lower() not in clean_name.lower() else clean_name
    exact = f'"{base}"'
    neg   = '-case -cover -"screen protector" -accessory -accessories -charger -cable -box -unboxing'

    query_chain = [
        f"{exact} white background official image {neg}",
        f"{exact} official product render {neg}",
        f"{exact} png transparent {neg}",
        f"{exact} review {neg}",
        f"{base} official product image {neg}",   # unquoted fallback
        f"{base} specs",                           # last resort
    ]

    # Tokens the matching image must contain (brand + model, storage variant stripped).
    name_words   = {w for w in re.split(r"[^a-z0-9]+", base.lower()) if w}
    model_tokens = [w for w in name_words if len(w) >= 2]
    model_nums   = [w for w in model_tokens if any(c.isdigit() for c in w)]  # e.g. s25, a36, 17

    all_items = []
    for q in query_chain:
        print(f"[Search] Image query: {q}")
        try:
            data = _cse_get({"q": q, "searchType": "image", "num": 10, "safe": "active"}, timeout=10)
        except Exception as e:
            print(f"[Error] Image search query failed: {e}")
            continue
        items = data.get("items", [])
        if not items:
            continue
        all_items.extend(items)
        # Strict: title/source contains every product token and the correct tier.
        for item in items:
            if _image_relevant(item, model_tokens, name_words):
                url = item.get("image", {}).get("thumbnailLink") or item.get("link")
                if url:
                    print(f"[Image] strict match for '{product_name}'")
                    return url

    # Relaxed fallback: require the brand, every model-number token, and correct tier,
    # but don't insist on the series words (handles titles like "Galaxy S25 Ultra").
    for item in all_items:
        text = _image_text(item)
        if brand and brand.lower() not in text:
            continue
        if model_nums and not all(mn in text for mn in model_nums):
            continue
        text_words = {w for w in re.split(r"[^a-z0-9]+", text) if w}
        if any(tq in text_words and tq not in name_words for tq in _TIER_QUALIFIERS):
            continue
        url = item.get("image", {}).get("thumbnailLink") or item.get("link")
        if url:
            print(f"[Image] relaxed match for '{product_name}'")
            return url

    # Last resort: first thumbnail seen — better than a broken/empty image.
    for item in all_items:
        thumb = item.get("image", {}).get("thumbnailLink")
        if thumb:
            print(f"[Image] fallback thumbnail for '{product_name}'")
            return thumb
    return None


# ==========================================
# AUTHENTICATION ENDPOINTS
# ==========================================

@app.route("/api/auth/register", methods=["POST"])
def register():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "user") # user, shop, admin
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400

    if len(username) > 30 or len(password) > 100:
        return jsonify({"success": False, "message": "Username max 30 characters, password max 100"}), 400

    if role not in ["user", "shop", "admin"]:
        return jsonify({"success": False, "message": "Invalid role"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if user exists
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    if cursor.fetchone():
        conn.close()
        return jsonify({"success": False, "message": "Username already exists"}), 409
        
    # Hash password
    password_hash = generate_password_hash(password)
    
    try:
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       (username, password_hash, role))
        user_id = cursor.lastrowid
        
        # If user is a shop, create the corresponding shop profile (initially unverified)
        if role == "shop":
            shop_name = data.get("shopName", f"{username}'s Shop")
            address_text = data.get("addressText", "")
            google_map_url = data.get("googleMapUrl", "")
            phone = data.get("phone", "")
            city = data.get("city", "")
            social_links = data.get("socialMediaLinks", "{}") # JSON string

            if len(shop_name) > 100 or len(address_text) > 200 or len(city) > 50 or len(phone) > 20:
                conn.close()
                return jsonify({"success": False, "message": "ຊື່ຮ້ານ max 100, ທີ່ຢູ່ max 200, ເມືອງ max 50, ເບີໂທ max 20 ຕົວອັກສອນ"}), 400

            cursor.execute("""
                INSERT INTO shops (user_id, name, google_map_url, address_text, city, phone, social_media_links, is_verified)
                VALUES (?, ?, ?, ?, ?, ?, ?, 0)
            """, (user_id, shop_name, google_map_url, address_text, city, phone, social_links))
            
        conn.commit()
        
        # Generate token
        token = jwt.encode({
            "user_id": user_id,
            "username": username,
            "role": role,
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
        }, JWT_SECRET, algorithm="HS256")
        
        conn.close()
        return jsonify({
            "success": True,
            "message": "User registered successfully",
            "token": token,
            "user": {
                "id": user_id,
                "username": username,
                "role": role
            }
        }), 201
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({"success": False, "message": f"Registration failed: {str(e)}"}), 500


@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    
    if not username or not password:
        return jsonify({"success": False, "message": "Username and password required"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()
    
    if not user or not check_password_hash(user["password_hash"], password):
        conn.close()
        return jsonify({"success": False, "message": "Invalid username or password"}), 401
        
    # Get shop_id if shop role
    shop_data = None
    if user["role"] == "shop":
        cursor.execute("SELECT id, name, is_verified FROM shops WHERE user_id = ?", (user["id"],))
        shop = cursor.fetchone()
        if shop:
            shop_data = {
                "id": shop["id"],
                "name": shop["name"],
                "is_verified": shop["is_verified"]
            }
            
    conn.close()
    
    # Generate token
    token = jwt.encode({
        "user_id": user["id"],
        "username": user["username"],
        "role": user["role"],
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7)
    }, JWT_SECRET, algorithm="HS256")
    
    return jsonify({
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "shop": shop_data
        }
    }), 200


@app.route("/api/auth/me", methods=["GET"])
@token_required
def get_me(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Refresh user/shop data
    shop_data = None
    if current_user["role"] == "shop":
        cursor.execute("SELECT id, name, is_verified FROM shops WHERE user_id = ?", (current_user["id"],))
        shop = cursor.fetchone()
        if shop:
            shop_data = {
                "id": shop["id"],
                "name": shop["name"],
                "is_verified": shop["is_verified"]
            }
            
    conn.close()
    
    return jsonify({
        "success": True,
        "user": {
            "id": current_user["id"],
            "username": current_user["username"],
            "role": current_user["role"],
            "shop": shop_data
        }
    }), 200


@app.route("/api/auth/google", methods=["POST"])
def google_auth():
    data = request.json
    credential = data.get("credential")
    if not credential:
        return jsonify({"success": False, "message": "Missing credential"}), 400

    google_client_id = os.getenv("GOOGLE_CLIENT_ID", "")
    if not google_client_id:
        return jsonify({"success": False, "message": "Google login not configured"}), 500

    try:
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            google_client_id,
        )
    except ValueError as e:
        return jsonify({"success": False, "message": f"Invalid Google token: {e}"}), 401

    google_id  = id_info["sub"]
    email      = id_info.get("email", "")
    name       = id_info.get("name", email.split("@")[0])
    username   = f"g_{google_id[:12]}"

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
    user = cursor.fetchone()

    if not user:
        # Auto-register as a regular user
        cursor.execute(
            "INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
            (username, generate_password_hash(google_id), "user"),
        )
        conn.commit()
        cursor.execute("SELECT * FROM users WHERE username = ?", (username,))
        user = cursor.fetchone()

    conn.close()

    token = jwt.encode(
        {
            "user_id": user["id"],
            "username": user["username"],
            "role": user["role"],
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        },
        JWT_SECRET,
        algorithm="HS256",
    )

    return jsonify({
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": name,
            "role": user["role"],
        },
    }), 200


# ==========================================
# PUBLIC ENDPOINTS
# ==========================================

@app.route("/api/shops/public", methods=["GET"])
def public_shops():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, name, address_text, city, phone, google_map_url, social_media_links, is_verified
        FROM shops
        ORDER BY is_verified DESC, name ASC
    """)
    shops = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "data": shops}), 200


@app.route("/api/history", methods=["GET"])
@token_required
def user_history(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, device, budget, purpose, brand, city, raw_query, recommended_product, response_json, created_at
        FROM recommendation_logs
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 50
    """, (current_user["id"],))
    rows = cursor.fetchall()
    logs = []
    for row in rows:
        entry = dict(row)
        if entry.get("response_json"):
            try:
                entry["products"] = json.loads(entry["response_json"])
            except Exception:
                entry["products"] = []
        else:
            entry["products"] = []
        del entry["response_json"]
        logs.append(entry)
    conn.close()
    return jsonify({"success": True, "data": logs}), 200


# ==========================================
# SHOP OWNER ENDPOINTS
# ==========================================

@app.route("/api/shop/profile", methods=["GET", "PUT"])
@token_required
def shop_profile(current_user):
    if current_user["role"] != "shop":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if request.method == "GET":
        cursor.execute("SELECT * FROM shops WHERE user_id = ?", (current_user["id"],))
        shop = cursor.fetchone()
        conn.close()
        
        if not shop:
            return jsonify({"success": False, "message": "Shop profile not found"}), 404
            
        return jsonify({
            "success": True,
            "data": dict(shop)
        }), 200
        
    elif request.method == "PUT":
        data = request.json
        name = data.get("name")
        google_map_url = data.get("google_map_url")
        address_text = data.get("address_text")
        city = data.get("city")
        phone = data.get("phone")
        social_links = data.get("social_media_links", "{}")
        
        if not name or not address_text or not city or not phone:
            conn.close()
            return jsonify({"success": False, "message": "Required fields missing"}), 400

        if len(name) > 100 or len(address_text) > 200 or len(city) > 50 or len(phone) > 20:
            conn.close()
            return jsonify({"success": False, "message": "ຊື່ຮ້ານ max 100, ທີ່ຢູ່ max 200, ເມືອງ max 50, ເບີໂທ max 20 ຕົວອັກສອນ"}), 400
            
        try:
            cursor.execute("""
                UPDATE shops 
                SET name = ?, google_map_url = ?, address_text = ?, city = ?, phone = ?, social_media_links = ?
                WHERE user_id = ?
            """, (name, google_map_url, address_text, city, phone, social_links, current_user["id"]))
            conn.commit()
            conn.close()
            return jsonify({"success": True, "message": "Profile updated successfully"}), 200
        except Exception as e:
            conn.close()
            return jsonify({"success": False, "message": f"Update failed: {str(e)}"}), 500


@app.route("/api/shop/upload-image", methods=["POST"])
@token_required
def shop_upload_image(current_user):
    if current_user["role"] != "shop":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    if "image" not in request.files:
        return jsonify({"success": False, "message": "No image file provided"}), 400

    file = request.files["image"]
    if not file or file.filename == "":
        return jsonify({"success": False, "message": "No file selected"}), 400

    if not _allowed_image(file.filename):
        return jsonify({"success": False, "message": "Only JPG, PNG, GIF, WebP allowed"}), 400

    file.seek(0, 2)
    size = file.tell()
    file.seek(0)
    if size > _MAX_IMAGE_BYTES:
        return jsonify({"success": False, "message": "Image must be under 2 MB"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM shops WHERE user_id = ?", (current_user["id"],))
    shop = cursor.fetchone()
    if not shop:
        conn.close()
        return jsonify({"success": False, "message": "Shop not found"}), 404

    ext = secure_filename(file.filename).rsplit(".", 1)[1].lower()
    filename = f"shop_{shop['id']}.{ext}"
    file.save(os.path.join(UPLOAD_FOLDER, filename))

    image_path = f"/uploads/shops/{filename}"
    cursor.execute("UPDATE shops SET image_path = ? WHERE id = ?", (image_path, shop["id"]))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "image_path": image_path}), 200


@app.route("/uploads/shops/<path:filename>")
def serve_shop_image(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)


@app.route("/api/shop/analytics", methods=["GET"])
@token_required
def shop_analytics(current_user):
    if current_user["role"] != "shop":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get shop_id
    cursor.execute("SELECT id FROM shops WHERE user_id = ?", (current_user["id"],))
    shop = cursor.fetchone()
    if not shop:
        conn.close()
        return jsonify({"success": False, "message": "Shop not found"}), 404
        
    shop_id = shop["id"]
    
    # 1. Total Impressions
    cursor.execute("SELECT COUNT(*) FROM shop_impressions WHERE shop_id = ?", (shop_id,))
    total_views = cursor.fetchone()[0]
    
    # 2. Daily Views Chart Data (last 14 days)
    cursor.execute("""
        SELECT date(viewed_at) as view_date, COUNT(*) as count 
        FROM shop_impressions 
        WHERE shop_id = ? AND viewed_at >= date('now', '-14 days')
        GROUP BY view_date
        ORDER BY view_date ASC
    """, (shop_id,))
    daily_views = [dict(row) for row in cursor.fetchall()]
    
    # 3. Product triggers (which recommended devices trigger this shop)
    cursor.execute("""
        SELECT rl.recommended_product, COUNT(*) as count 
        FROM shop_impressions si 
        JOIN recommendation_logs rl ON si.recommendation_log_id = rl.id 
        WHERE si.shop_id = ?
        GROUP BY rl.recommended_product
        ORDER BY count DESC
        LIMIT 5
    """, (shop_id,))
    top_devices = [dict(row) for row in cursor.fetchall()]
    
    # 4. Click breakdown & conversion funnel
    cursor.execute("""
        SELECT click_type, COUNT(*) as count
        FROM shop_clicks WHERE shop_id = ?
        GROUP BY click_type
    """, (shop_id,))
    click_breakdown = {row["click_type"]: row["count"] for row in cursor.fetchall()}
    total_clicks = sum(click_breakdown.values())
    conversion_rate = round((total_clicks / total_views * 100) if total_views > 0 else 0, 1)

    conn.close()

    return jsonify({
        "success": True,
        "data": {
            "totalImpressions": total_views,
            "totalClicks": total_clicks,
            "conversionRate": conversion_rate,
            "clickBreakdown": click_breakdown,
            "dailyViews": daily_views,
            "topDevices": top_devices,
        }
    }), 200


# ==========================================
# ADMIN ENDPOINTS
# ==========================================

@app.route("/api/admin/shops", methods=["GET"])
@token_required
def admin_list_shops(current_user):
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("""
        SELECT s.*, u.username 
        FROM shops s 
        JOIN users u ON s.user_id = u.id
        ORDER BY s.created_at DESC
    """)
    shops = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify({
        "success": True,
        "data": shops
    }), 200


@app.route("/api/admin/shops/<int:shop_id>/verify", methods=["PUT"])
@token_required
def admin_verify_shop(current_user, shop_id):
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403
        
    data = request.json
    is_verified = data.get("is_verified")
    
    if is_verified is None or is_verified not in [0, 1]:
        return jsonify({"success": False, "message": "Invalid verify status"}), 400
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    cursor.execute("UPDATE shops SET is_verified = ? WHERE id = ?", (is_verified, shop_id))
    if cursor.rowcount == 0:
        conn.close()
        return jsonify({"success": False, "message": "Shop not found"}), 404
        
    conn.commit()
    conn.close()
    
    return jsonify({
        "success": True,
        "message": f"Shop {'verified' if is_verified == 1 else 'unverified'} successfully"
    }), 200


@app.route("/api/admin/analytics", methods=["GET"])
@token_required
def admin_analytics(current_user):
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403
        
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Total Recommendations generated
    cursor.execute("SELECT COUNT(*) FROM recommendation_logs")
    total_recommendations = cursor.fetchone()[0]
    
    # 2. Total registered shops (verified / pending)
    cursor.execute("SELECT COUNT(*) FROM shops")
    total_shops = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM shops WHERE is_verified = 1")
    verified_shops = cursor.fetchone()[0]
    
    # 3. Top recommended products
    cursor.execute("""
        SELECT recommended_product, COUNT(*) as count 
        FROM recommendation_logs 
        WHERE recommended_product IS NOT NULL AND recommended_product != ''
        GROUP BY recommended_product 
        ORDER BY count DESC 
        LIMIT 5
    """)
    top_products = [dict(row) for row in cursor.fetchall()]
    
    # 4. Top searched devices
    cursor.execute("""
        SELECT device, COUNT(*) as count 
        FROM recommendation_logs 
        GROUP BY device 
        ORDER BY count DESC 
        LIMIT 5
    """)
    top_devices = [dict(row) for row in cursor.fetchall()]
    
    # 5. Top performing shops (most impressions)
    cursor.execute("""
        SELECT s.name, COUNT(si.id) as impressions 
        FROM shops s 
        LEFT JOIN shop_impressions si ON s.id = si.shop_id 
        GROUP BY s.id 
        ORDER BY impressions DESC 
        LIMIT 5
    """)
    top_shops = [dict(row) for row in cursor.fetchall()]
    
    # 6. City demand distribution
    cursor.execute("""
        SELECT city, COUNT(*) as count FROM recommendation_logs
        WHERE city IS NOT NULL AND city != ''
        GROUP BY LOWER(city) ORDER BY count DESC LIMIT 8
    """)
    city_distribution = [dict(row) for row in cursor.fetchall()]

    # 7. Platform-wide conversion (impressions → clicks)
    cursor.execute("SELECT COUNT(*) FROM shop_impressions")
    total_impressions = cursor.fetchone()[0]
    cursor.execute("SELECT COUNT(*) FROM shop_clicks")
    total_platform_clicks = cursor.fetchone()[0]
    platform_conversion = round(
        (total_platform_clicks / total_impressions * 100) if total_impressions > 0 else 0, 1
    )

    # 8. Budget / price-range stats
    cursor.execute("SELECT budget FROM recommendation_logs WHERE budget IS NOT NULL AND budget != ''")
    all_budgets = [r[0] for r in cursor.fetchall()]

    lak_vals, usd_vals = [], []
    for b in all_budgets:
        if "₭" in b:
            n = re.sub(r"[^\d]", "", b)
            if n:
                lak_vals.append(int(n))
        else:
            nums = re.findall(r"\d+", b)
            if nums:
                usd_vals.append(int(nums[-1]))

    def _bucket_lak(vals):
        buckets = [
            {"range": "< ₭5M",        "count": 0},
            {"range": "₭5M – ₭10M",   "count": 0},
            {"range": "₭10M – ₭20M",  "count": 0},
            {"range": "₭20M+",         "count": 0},
        ]
        for v in vals:
            if   v < 5_000_000:  buckets[0]["count"] += 1
            elif v < 10_000_000: buckets[1]["count"] += 1
            elif v < 20_000_000: buckets[2]["count"] += 1
            else:                buckets[3]["count"] += 1
        return buckets

    def _bucket_usd(vals):
        buckets = [
            {"range": "< $300",      "count": 0},
            {"range": "$300 – $600", "count": 0},
            {"range": "$600+",       "count": 0},
        ]
        for v in vals:
            if   v < 300: buckets[0]["count"] += 1
            elif v < 600: buckets[1]["count"] += 1
            else:         buckets[2]["count"] += 1
        return buckets

    budget_stats = {
        "lak": {
            "count":   len(lak_vals),
            "min":     min(lak_vals) if lak_vals else 0,
            "max":     max(lak_vals) if lak_vals else 0,
            "avg":     int(sum(lak_vals) / len(lak_vals)) if lak_vals else 0,
            "buckets": _bucket_lak(lak_vals),
        },
        "usd": {
            "count":   len(usd_vals),
            "min":     min(usd_vals) if usd_vals else 0,
            "max":     max(usd_vals) if usd_vals else 0,
            "avg":     int(sum(usd_vals) / len(usd_vals)) if usd_vals else 0,
            "buckets": _bucket_usd(usd_vals),
        },
    }

    conn.close()

    return jsonify({
        "success": True,
        "data": {
            "totalRecommendations": total_recommendations,
            "totalShops": total_shops,
            "verifiedShops": verified_shops,
            "pendingShops": total_shops - verified_shops,
            "topProducts": top_products,
            "topDevices": top_devices,
            "topShops": top_shops,
            "cityDistribution": city_distribution,
            "platformConversionRate": platform_conversion,
            "totalPlatformImpressions": total_impressions,
            "totalPlatformClicks": total_platform_clicks,
            "budgetStats": budget_stats,
        }
    }), 200


# ==========================================
# ADMIN USER MANAGEMENT ENDPOINTS
# ==========================================

@app.route("/api/admin/users", methods=["GET"])
@token_required
def admin_list_users(current_user):
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT u.id, u.username, u.role, u.created_at,
               s.id AS shop_id, s.name AS shop_name, s.city AS shop_city,
               s.is_verified AS shop_verified
        FROM users u
        LEFT JOIN shops s ON u.id = s.user_id
        WHERE u.role != 'admin'
        ORDER BY u.created_at DESC
    """)
    users = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "data": users}), 200


@app.route("/api/admin/users/<int:user_id>", methods=["PUT"])
@token_required
def admin_edit_user(current_user, user_id):
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403

    data = request.json or {}
    username = data.get("username", "").strip()
    new_password = data.get("password", "").strip()

    if not username:
        return jsonify({"success": False, "message": "Username is required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Prevent editing admin accounts
    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "User not found"}), 404
    if row["role"] == "admin":
        conn.close()
        return jsonify({"success": False, "message": "Cannot modify admin accounts"}), 403

    if new_password:
        cursor.execute(
            "UPDATE users SET username = ?, password_hash = ? WHERE id = ?",
            (username, generate_password_hash(new_password), user_id)
        )
    else:
        cursor.execute(
            "UPDATE users SET username = ? WHERE id = ?",
            (username, user_id)
        )

    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "User updated successfully"}), 200


@app.route("/api/admin/users/<int:user_id>", methods=["DELETE"])
@token_required
def admin_delete_user(current_user, user_id):
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized role"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT role FROM users WHERE id = ?", (user_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return jsonify({"success": False, "message": "User not found"}), 404
    if row["role"] == "admin":
        conn.close()
        return jsonify({"success": False, "message": "Cannot delete admin accounts"}), 403

    cursor.execute("DELETE FROM users WHERE id = ?", (user_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "User deleted successfully"}), 200


# ==========================================
# CITIES ENDPOINT
# ==========================================

@app.route("/api/cities", methods=["GET"])
def get_cities():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT city FROM shops WHERE is_verified = 1 ORDER BY city")
    raw_cities = [row["city"] for row in cursor.fetchall()]
    conn.close()

    # For each stored city, also expose the canonical English name so the
    # datalist shows both "ຫຼວງພະບາງ" and "Luang Prabang" as options.
    seen = set()
    result = []
    for city in raw_cities:
        if city not in seen:
            seen.add(city)
            result.append(city)
        low = city.strip().lower()
        for canonical, aliases in CITY_ALIASES.items():
            if low in [a.lower() for a in aliases] or low == canonical:
                eng = canonical.title()
                if eng not in seen:
                    seen.add(eng)
                    result.append(eng)
                break

    return jsonify({"success": True, "data": sorted(result)})


# ==========================================
# SAVED PRODUCTS ENDPOINTS
# ==========================================

@app.route("/api/user/profile", methods=["PUT"])
@token_required
def edit_user_profile(current_user):
    data = request.json or {}
    new_username    = data.get("new_username", "").strip()
    current_password = data.get("current_password", "").strip()
    new_password    = data.get("new_password", "").strip()

    if not current_password:
        return jsonify({"success": False, "message": "ກະລຸນາໃສ່ລະຫັດຜ່ານປັດຈຸບັນ"}), 400
    if not new_username and not new_password:
        return jsonify({"success": False, "message": "ກະລຸນາໃສ່ຂໍ້ມູນທີ່ຕ້ອງການປ່ຽນ"}), 400
    if new_username and len(new_username) > 30:
        return jsonify({"success": False, "message": "Username max 30 ຕົວອັກສອນ"}), 400
    if new_password and len(new_password) > 100:
        return jsonify({"success": False, "message": "Password max 100 ຕົວອັກສອນ"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT username, password_hash FROM users WHERE id = ?", (current_user["id"],))
    row = cursor.fetchone()
    if not row or not check_password_hash(row["password_hash"], current_password):
        conn.close()
        return jsonify({"success": False, "message": "ລະຫັດຜ່ານປັດຈຸບັນບໍ່ຖືກຕ້ອງ"}), 401

    final_username = new_username if new_username else row["username"]

    if new_username and new_username != row["username"]:
        cursor.execute("SELECT id FROM users WHERE username = ? AND id != ?", (new_username, current_user["id"]))
        if cursor.fetchone():
            conn.close()
            return jsonify({"success": False, "message": "Username ນີ້ຖືກໃຊ້ງານແລ້ວ"}), 409

    if new_password:
        cursor.execute(
            "UPDATE users SET username = ?, password_hash = ? WHERE id = ?",
            (final_username, generate_password_hash(new_password), current_user["id"])
        )
    else:
        cursor.execute("UPDATE users SET username = ? WHERE id = ?", (final_username, current_user["id"]))

    conn.commit()
    conn.close()

    new_token = jwt.encode(
        {
            "user_id": current_user["id"],
            "username": final_username,
            "role": current_user["role"],
            "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=7),
        },
        JWT_SECRET, algorithm="HS256"
    )
    return jsonify({
        "success": True,
        "message": "ອັບເດດສຳເລັດ",
        "token": new_token,
        "user": {"id": current_user["id"], "username": final_username, "role": current_user["role"]}
    }), 200


@app.route("/api/user/saved", methods=["GET"])
@token_required
def get_saved_products(current_user):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT id, product_name, product_data, saved_at FROM saved_products WHERE user_id = ? ORDER BY saved_at DESC",
        (current_user["id"],)
    )
    rows = cursor.fetchall()
    conn.close()
    result = []
    for row in rows:
        item = dict(row)
        try:
            item["product_data"] = json.loads(item["product_data"])
        except Exception:
            pass
        result.append(item)
    return jsonify({"success": True, "data": result})


@app.route("/api/user/saved", methods=["POST"])
@token_required
def save_product(current_user):
    data = request.json or {}
    product = data.get("product")
    if not product or not product.get("productName"):
        return jsonify({"success": False, "message": "Product data required"}), 400

    product_name = product["productName"]
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT OR REPLACE INTO saved_products (user_id, product_name, product_data)
        VALUES (?, ?, ?)
    """, (current_user["id"], product_name, json.dumps(product)))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Product saved"})


@app.route("/api/user/saved/<path:product_name>", methods=["DELETE"])
@token_required
def remove_saved_product(current_user, product_name):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM saved_products WHERE user_id = ? AND product_name = ?",
        (current_user["id"], product_name)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True, "message": "Product removed"})


# ==========================================
# RECOMMENDATION ENDPOINT
# ==========================================

def _extract_user_id():
    """Pull user_id from Authorization header, or return None."""
    try:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            decoded = jwt.decode(auth.split(" ")[1], JWT_SECRET, algorithms=["HS256"])
            return decoded.get("user_id")
    except Exception:
        pass
    return None


def _build_prompt(data: dict, local_shops_prompt_str: str) -> str:
    """Construct the Gemini prompt from request data."""
    lang     = data.get("lang", "en")
    currency = data.get("currency", "USD")
    device   = data.get("device", "Smartphone")
    budget   = data.get("budget", "Under $300")
    purpose  = data.get("purpose", "General")
    purposes = data.get("purposes", [purpose])
    brand    = data.get("brand", "No preference")
    lifecycle = data.get("lifecycle", "")
    city      = data.get("city", "").strip()
    drilldown   = data.get("drilldown", "")
    pain_points = data.get("painPoints", [])
    brand_tier  = data.get("brandTier", "")
    screen_size = data.get("screenSize", "No preference")
    storage     = data.get("storage", "No preference")
    ram         = data.get("ram", "No preference")
    battery_life     = data.get("batteryLife", "No preference")
    weight_priority  = data.get("weightPriority", "No preference")
    special_features = data.get("specialFeatures", [])
    raw_query = data.get("rawQuery", "")
    features_str = ", ".join(special_features) if special_features else "None specified"

    currency_instruction = ""
    budget_for_prompt = budget
    if currency == "LAK":
        usd_lak, thb_lak = _get_exchange_rates()
        try:
            raw_num = float(re.sub(r"[^\d.]", "", str(budget)))
            budget_usd = int(raw_num / usd_lak)
            budget_for_prompt = f"₭{int(raw_num):,} LAK (≈ ${budget_usd} USD)"
        except Exception:
            pass
        currency_instruction = f"""
    **PRICING INSTRUCTION (LAK):**
    Search for the actual retail price in Thailand using these trusted sites:
      - advice.co.th, jib.co.th, itcity.co.th, istudio.co.th (Apple), shopee.co.th
    Search: "[product name] ราคา site:advice.co.th" or "[product name] ราคา Thailand 2026"

    Current exchange rates (live):
      1 THB = {thb_lak:,} LAK
      1 USD = {usd_lak:,} LAK

    Case A — Thai price found:
      Convert directly: THB × {thb_lak:,} = LAK. Do NOT add any markup.

    Case B — NOT found on any Thai site:
      Use global USD price × {usd_lak:,} = LAK. Do NOT add any markup.

    Return the final LAK price as a plain number in the priceLocal field.
    Return launchPriceUSD as the original global launch price in USD (plain number).
    """
    else:
        currency_instruction = """
    **PRICING INSTRUCTION (USD):**
    Return all prices as plain USD numbers in the priceLocal and launchPriceUSD fields.
    Use accurate current global retail prices from your search results.
    """

    lang_instruction = ""
    if lang == "lo":
        lang_instruction = """
    **LANGUAGE INSTRUCTION (CRITICAL):**
    You MUST write all descriptive text fields in Lao script (ພາສາລາວ). This includes:
    - "reasoning" field
    - all items in "pros" and "cons" arrays
    Keep product names, brand names, prices, spec values, shop names, addresses, and phone numbers in English/numbers.
    """

    prompt = f"""
    You are a tech product recommendation expert. Your goal is to give the most accurate,
    up-to-date recommendation possible. Use your Google Search tool actively.
    {lang_instruction}
    {currency_instruction}
    {f"**User's original request:** {raw_query}" if raw_query else ""}

    **BRAND SERIES GUIDE — always match the correct series to the user's budget:**

    Apple iPhone (LAK price, 2025/2026):
      iPhone 17 Pro Max ₭38M+ | iPhone 17 Pro ₭30M+ | iPhone 17 ₭24M | iPhone 16e ₭14M
      RULE: ₭28M+ → Pro/Pro Max | ₭20M–₭28M → base iPhone | ₭12M–₭18M → iPhone 16e/SE

    Samsung Galaxy (LAK price, 2025/2026):
      S25 Ultra ₭38M+ | S25+ ₭26M | S25 ₭20M | A56 ₭9M | A36 ₭6M | A26 ₭5M
      RULE: ₭18M+ → S-series | ₭6M–₭14M → A5x/A3x series | <₭6M → A0x/A1x

    Xiaomi (LAK price, 2025/2026):
      15 Ultra ₭26M | 15 Pro ₭21M | 15 ₭16M | 15T Pro ₭15M | 15T ₭12M | Redmi Note 14 ₭5M–₭7M
      RULE: ₭20M+ → Ultra/Pro | ₭10M–₭20M → numbered base or T/T Pro | <₭8M → Redmi Note

    Vivo (LAK price, 2025/2026):
      X300 Ultra ₭34M+ | X300 Pro (2025) ₭26M–₭28M | X200 Pro (2024) ₭20M–₭24M
      X300 (2025) ₭18M–₭22M | X200 (2024) ₭15M–₭18M
      V40 Pro ₭13M–₭15M | V40 ₭10M–₭12M | Y-series <₭7M
      RULE: For camera/photography → ALWAYS X-series first. NEVER V-series when budget ≥ ₭10M and X-series fits.

    Oppo (LAK price, 2025/2026):
      Find X8 Ultra ₭28M+ | Find X8 Pro ₭22M | Find X8 ₭17M | Reno 13 Pro ₭12M | Reno 13 ₭9M | A-series <₭7M
      RULE: ₭15M+ → Find series | ₭8M–₭15M → Reno series | <₭7M → A-series

    Honor (LAK price, 2025/2026):
      Magic 7 Pro ₭20M | Magic 7 ₭15M | 200 Pro ₭12M | 200 ₭9M | X-series <₭6M
      RULE: ₭14M+ → Magic series | ₭7M–₭14M → 200/100 series | <₭6M → X-series

    OnePlus (LAK price, 2025/2026):
      13 / 13R: ₭18M–₭22M | Nord 4 ₭9M–₭12M | Nord CE ₭5M–₭8M

    Realme (LAK price, 2025/2026):
      GT 7 Pro ₭16M | GT 7 ₭12M | Realme 14 Pro ₭8M | C-series ₭3M–₭5M
      RULE: ₭10M+ → GT series | ₭6M–₭10M → numbered Pro | <₭5M → C-series

    General rule: NEVER recommend a lower series (V/A/Reno/C) when the budget fits the flagship series (X/S/Find/GT/Magic).
    Always verify current prices — series pricing shifts every 6–12 months.

    **STEP 1 — FIND NEWEST MODEL FIRST:**
    Search: "{brand if brand and brand != 'No preference' else ''} {device} latest model 2026 price Thailand"
    Get the newest released model and its current retail price BEFORE deciding what to recommend.
    Only recommend products whose specs and prices you have verified from search results.

    **STEP 2 — RECENCY + PRICE RANGE RULE (CRITICAL):**
    Current year is 2026. Find the NEWEST model whose price falls within the user's budget range.

    Step A — Define the acceptable price range:
      Lower bound = budget × 0.70  (30% below budget)
      Upper bound = budget × 1.25  (25% above budget)
      Example: budget ₭20,000,000 → acceptable range is ₭14,000,000 – ₭25,000,000

    Step B — Search ALL model variants within that price range:
      Search: "[brand] [device] price 2025 2026 Thailand" — look at ALL variants:
      base model, T, T Pro, Pro, Plus, Ultra, S, Note, Edge, etc.
      Include EVERY sub-model that falls within the price range — do not ignore T or Pro variants.
      Example for ₭20M Xiaomi budget: Xiaomi 15T, 15T Pro, 15 Pro may all fall in range — check all of them.

    Step C — Pick 3 products, ordered newest → oldest (highest price → lowest):
      Fill 2025/2026 models first; only use 2024 if fewer than 3 fit the range; only use 2023 if fewer than 3 from 2024–2026.
      Example (₭35M Samsung): S25 Ultra + S25+ + S25 are all 2025 and in range → use all 3.
      Example (₭10M Samsung): only A56 (2025) fits → A56 (2025), A55 (2024), A35 (2024).

    PRICE ORDER RULE: priceLocal must STRICTLY DECREASE from product 1 → 2 → 3.
    A newer model must NEVER be cheaper than the older model it replaced at the same tier.
    Set "newerModel" to null for the most recent generation; fill it in for any older model.

    **BRAND RULE (CRITICAL):**
    If the user specified a brand, you MUST recommend only products from that brand — ALL 3 products.
    NEVER switch to a different brand even if the budget is too low.
    If the budget cannot cover a new model from that brand, recommend the most affordable current model
    from that brand and clearly explain in "reasoning" that the device slightly exceeds the budget
    or that it is the entry option for this brand.

    **STEP 3 — PRICING (IMPORTANT):**
    Use the verified CURRENT 2026 market retail price — NOT the original launch price.
    Price rules (all brands):
    - Older generation is always cheaper than the newer one at the same tier.
    - Higher tier (Pro, Ultra, Plus, Max) is always more expensive than the base model of the same generation.
    - Use today's discounted/market price for older models, not their launch price.
    Return the current market price as a plain number in priceLocal (LAK if LAK mode, USD if USD mode).
    Return the original global USD launch price as a plain number in launchPriceUSD.
    Target budget is: {budget_for_prompt}
    Recommend products AT or BELOW this budget first. Only go above budget if there is truly
    no suitable product at or under the budget, and explain why in the reasoning.
    Do NOT recommend a more expensive older model when a cheaper newer model fits the budget.

    **Basic Requirements:**
    - Primary Purpose(s): {", ".join(purposes) if purposes else purpose}
    - Preferred Brand: {brand}
    - Expected Usage Duration: {lifecycle if lifecycle else "Not specified"}

    **Technical Specifications:**
    - Screen Size: {screen_size} | Storage: {storage} | RAM: {ram}
    - Battery Life: {battery_life} | Weight: {weight_priority}
    - Special Features: {features_str}

    **Location for Shops:** {city}
    """

    if local_shops_prompt_str:
        prompt += f"""
    **Verified Local Shops in our Database:**
    {local_shops_prompt_str}
    You MUST use these shops in the 'nearbyShops' array. Do not invent shops.
    """
    else:
        prompt += f"\n    List real physical shops in '{city}' or popular national retailers if no city given.\n"

    drilldown_map = {
        # Smartphone — camera
        "photo_nighttravel":  "- REQUIRES excellent low-light photography, optical zoom (3x+), large sensor.\n",
        "photo_vlog":         "- REQUIRES OIS, high-quality front 4K camera. Flip screen is a bonus.\n",
        # Smartphone / Laptop — gaming
        "gaming_competitive": "- REQUIRES 90Hz+ display, low touch latency, strong sustained CPU/GPU.\n",
        "gaming_heavy3d":     "- REQUIRES flagship processor, vapor chamber cooling, 5000mAh+.\n",
        # Shared — work
        "work_power":         "- REQUIRES 8GB+ RAM (phone: 6.5\"+ screen or foldable; laptop: 16GB+ RAM preferred).\n",
        # Tablet — art
        "art_pro":            "- REQUIRES first-party stylus support (Apple Pencil 2nd gen or Samsung S Pen), high color-accuracy display.\n",
        # Laptop — programming
        "prog_webdev":        "- REQUIRES 16GB+ RAM, fast NVMe SSD, 14\"+ display for multi-window coding.\n",
        "prog_datascience":   "- REQUIRES dedicated GPU (NVIDIA RTX), 16GB+ RAM, fast SSD (512GB+), good cooling.\n",
        "prog_general":       "- REQUIRES fast SSD, 8GB+ RAM, comfortable keyboard for long coding sessions.\n",
        # Laptop — content creation
        "content_video":      "- REQUIRES dedicated GPU, large color-accurate display (15\"+), fast NVMe SSD (512GB+).\n",
        "content_photo":      "- REQUIRES color-accurate display (100% sRGB+), 16GB+ RAM, fast SSD.\n",
        "content_music":      "- REQUIRES good audio output, fast CPU for audio processing, 16GB+ RAM, low-latency performance.\n",
    }
    for key, line in drilldown_map.items():
        if key in drilldown:
            prompt += f"\n    **Deep-Dive Requirement (MANDATORY):**\n    {line}\n"
            break

    # Stylus requirement from tablet specs step
    stylus_needed = data.get("stylusNeeded", "")
    if "Stylus required" in stylus_needed:
        prompt += "\n    **Stylus REQUIRED:** Recommend only tablets with first-party stylus support.\n"

    pain_map = {
        "battery":  "- PRIORITY: Large battery (5000mAh+ phones / 15h+ laptops).",
        "lag":      "- PRIORITY: Fast performance — avoid weak budget chips.",
        "cracking": "- PRIORITY: Durable build — Gorilla Glass 5/Victus or MIL-SPEC.",
        "storage":  "- PRIORITY: 256GB+ internal or microSD support.",
        "camera":   "- NOTE: Camera matters — include camera notes in reasoning.",
        "heat":     "- PRIORITY: Good thermal management — avoid devices known for overheating under load.",
        "display":  "- PRIORITY: High-quality display — good brightness, color accuracy, and resolution.",
        "stylus":   "- PRIORITY: Device MUST have reliable first-party stylus/pen support.",
        "build":    "- PRIORITY: Sturdy build quality — solid keyboard, durable hinges, MIL-SPEC if possible.",
        "weight":   "- PRIORITY: Lightweight and portable — user needs to carry this device daily.",
    }
    pain_lines = [pain_map[k] for k in pain_map if k in pain_points]
    if pain_lines:
        prompt += "\n    **Must-Fix Priorities:**\n    " + "\n    ".join(pain_lines) + "\n"

    if brand_tier == "best_value":
        prompt += "\n    **Brand Strategy:** Best specs per dollar — prefer Xiaomi, Realme, POCO, OnePlus, Oppo.\n"
    elif brand_tier == "value":
        prompt += "\n    **Brand Strategy:** Value/mid-range brands preferred.\n"

    prompt += """
    Return ONLY valid JSON (no markdown) with exactly 3 products.
    IMPORTANT RULES FOR JSON:
    - priceLocal and launchPriceUSD must NEVER be 0 — always a real number from your search.
    - priceLocal = CURRENT retail market price in 2026 (LAK if LAK mode, USD if USD mode). Required.
    - launchPriceUSD = original global launch price in USD. Required.
    - releaseYear = actual release year. Required. Prefer 2025 > 2024 > 2023 as explained in STEP 2.
    - productName MUST always include the storage size for ALL brands:
      e.g. "Samsung Galaxy S25 (256GB)", "Vivo V40 (128GB)", "Xiaomi 15 (256GB)".
      NEVER write a product name without the storage — this is required for accurate price lookup.
    {"products":[
      {"productName":"[Brand ModelName (StorageGB)]","brand":"...","priceLocal":25000000,"launchPriceUSD":899,"releaseYear":2025,"newerModel":null,"imageUrl":"placeholder",
       "specs":{"display":"...","processor":"...","ram":"...","storage":"256GB","battery":"...","weight":"...","specialFeatures":[]},
       "reasoning":"2-3 sentences why this fits","prosAndCons":{"pros":["..."],"cons":["..."]},"nearbyShops":[{"name":"...","address":"...","phone":"..."}]},
      {"productName":"[Brand ModelName (StorageGB)]","brand":"...","priceLocal":21000000,"launchPriceUSD":799,"releaseYear":2025,"newerModel":null,"imageUrl":"placeholder",
       "specs":{"display":"...","processor":"...","ram":"...","storage":"128GB","battery":"...","weight":"...","specialFeatures":[]},
       "reasoning":"...","prosAndCons":{"pros":["..."],"cons":["..."]},"nearbyShops":[]},
      {"productName":"[Brand ModelName (StorageGB)]","brand":"...","priceLocal":18000000,"launchPriceUSD":699,"releaseYear":2024,"newerModel":"[newer model]","imageUrl":"placeholder",
       "specs":{"display":"...","processor":"...","ram":"...","storage":"128GB","battery":"...","weight":"...","specialFeatures":[]},
       "reasoning":"...","prosAndCons":{"pros":["..."],"cons":["..."]},"nearbyShops":[]}
    ]}
    First = best/newest match. Others = alternatives at lower price points.
    nearbyShops only on first product. Use real currently-available products from 2026.
    """
    return prompt


def _run_recommendation(data: dict, user_id):
    """Generator: yields SSE-style dicts, ending with {type:'result'} or {type:'error'}."""
    lang    = data.get("lang", "en")
    device  = data.get("device", "Smartphone")
    budget  = data.get("budget", "")
    purpose = data.get("purpose", "")
    brand   = data.get("brand", "")
    city    = data.get("city", "").strip()
    drilldown   = data.get("drilldown", "")
    pain_points = data.get("painPoints", [])
    raw_query   = data.get("rawQuery", "")

    # Step 1 — fetch local shops filtered by city + inventory match
    # Only show a shop when it has tagged the searched device category in shop_inventory.
    # Shops with NO inventory entries at all are included as a fallback (they haven't
    # set up tags yet, so we don't want to hide them entirely).
    local_verified_shops = []
    local_shops_prompt_str = ""
    if city:
        variants = _city_variants(city)
        placeholders = ",".join("?" * len(variants))
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute(f"""
            SELECT id, name, address_text, phone, google_map_url, social_media_links, image_path
            FROM shops
            WHERE LOWER(city) IN ({placeholders})
              AND is_verified = 1
              AND (
                -- shop has tagged this device category
                id IN (SELECT shop_id FROM shop_inventory WHERE device_category = ?)
                OR
                -- shop has no inventory tags yet (don't penalise new shops)
                id NOT IN (SELECT DISTINCT shop_id FROM shop_inventory)
              )
        """, variants + [device])
        local_verified_shops = [dict(r) for r in cur.fetchall()]
        conn.close()
        if local_verified_shops:
            local_shops_prompt_str = "\n".join(
                f"Name: {s['name']}, Address: {s['address_text']}, Phone: {s['phone']}"
                for s in local_verified_shops
            )
            print(f"[DB] {len(local_verified_shops)} verified shops in {city} carrying {device}")

    yield {"type": "status", "step": 1, "msg": "AI is searching for the best products…"}

    prompt = _build_prompt(data, local_shops_prompt_str)

    # Step 2 — call Gemini (longest wait)
    try:
        text = _gemini_generate(prompt, grounding=True).strip()
        # Strip markdown fences
        for fence in ("```json", "```"):
            if text.startswith(fence):
                text = text[len(fence):]
        if text.endswith("```"):
            text = text[:-3]
        text = text.strip()
        # Extract the JSON object even if Gemini added thinking/grounding text around it
        m = re.search(r'\{[\s\S]*\}', text)
        if m:
            text = m.group(0)
        parsed = json.loads(text)
        products_list = parsed["products"] if "products" in parsed else [parsed]

        # Convert priceUSD → formatted price string
        currency = data.get("currency", "USD")
        LAK_RATE, _ = _get_exchange_rates()
        for p in products_list:
            raw_price = p.pop("priceLocal", None) or p.pop("priceUSD", None)
            launch_usd = p.pop("launchPriceUSD", None)
            if currency == "LAK":
                if raw_price:
                    # Gemini returns local LAK price directly — just round & format
                    lak = round(raw_price / 100000) * 100000
                    p["price"] = f"₭{int(lak):,} (ປະມານ)"
                if launch_usd:
                    lak_l = round(launch_usd * LAK_RATE / 100000) * 100000
                    p["launchPrice"] = f"₭{int(lak_l):,}"
            else:
                if raw_price:
                    p["price"] = f"${raw_price:,.0f} (est.)"
                if launch_usd:
                    p["launchPrice"] = f"${launch_usd:,.0f}"

    except json.JSONDecodeError as e:
        print(f"[Error] JSON parse failed. Raw text:\n{text[:500]}")
        yield {"type": "error", "msg": "Could not parse AI response as JSON"}
        return
    except Exception as e:
        yield {"type": "error", "msg": str(e)}
        return

    yield {"type": "status", "step": 2, "msg": "Fetching product images…"}

    # Step 3 — parallel image + price fetch
    currency = data.get("currency", "USD")

    def _fetch_img_and_price(p):
        name = p.get("productName")
        if not name:
            return
        img = search_product_image(name, brand=p.get("brand"))
        if img:
            p["imageUrl"] = img
        # Override Gemini's price with Thai CSE price only if plausible.
        # If CSE result differs from Gemini's estimate by >35%, the CSE likely
        # matched a wrong/promotional page — keep Gemini's price in that case.
        if currency == "LAK":
            lak = search_thai_price(name, device_type=data.get("device", "Smartphone"))
            if lak:
                gemini_lak = int(re.sub(r"[^\d]", "", p.get("price", "0")) or 0)
                if gemini_lak == 0 or (0.65 * gemini_lak <= lak <= 1.35 * gemini_lak):
                    p["price"] = f"₭{lak:,} (ປະມານ)"
                else:
                    print(f"[Price] CSE ₭{lak:,} rejected for {name} (Gemini ₭{gemini_lak:,}, gap >{abs(lak-gemini_lak)/gemini_lak*100:.0f}%)")

    with ThreadPoolExecutor(max_workers=3) as ex:
        list(ex.map(_fetch_img_and_price, [p for p in products_list if p.get("productName")]))

    # Post-process: fix price inversions — newer product must never be cheaper than the one it replaced.
    # Extract LAK value from formatted price string for comparison.
    def _parse_lak(price_str: str) -> int:
        m = re.search(r'₭([\d,]+)', price_str or "")
        return int(m.group(1).replace(",", "")) if m else 0

    if currency == "LAK" and len(products_list) > 1:
        for i in range(len(products_list) - 1):
            p_newer = products_list[i]
            p_older = products_list[i + 1]
            year_newer = p_newer.get("releaseYear", 0)
            year_older = p_older.get("releaseYear", 0)
            price_newer = _parse_lak(p_newer.get("price", ""))
            price_older = _parse_lak(p_older.get("price", ""))
            # If newer model is cheaper than the older one and years differ, the older price is likely wrong
            if year_newer >= year_older and price_newer < price_older and price_newer > 0 and price_older > 0:
                # Cap older model at 90% of the newer model's price
                corrected = round(price_newer * 0.90 / 100000) * 100000
                print(f"[PriceOrder] {p_older.get('productName')} ({year_older}) ₭{price_older:,} "
                      f"> {p_newer.get('productName')} ({year_newer}) ₭{price_newer:,} — correcting to ₭{corrected:,}")
                p_older["price"] = f"₭{corrected:,} (ປະມານ)"

    # Suppress newerModel banners that point to unaffordable upgrades.
    # If product[i] (the "newer" option) costs more than budget×1.40, the product
    # below it (products_list[i+1]) shouldn't advertise it as a reachable upgrade.
    if currency == "LAK" and len(products_list) > 1:
        try:
            budget_lak = int(re.sub(r"[^\d]", "", str(data.get("budget", "0"))))
            if budget_lak > 0:
                for idx in range(len(products_list) - 1):
                    newer_price = _parse_lak(products_list[idx].get("price", ""))
                    if newer_price > budget_lak * 1.40:
                        products_list[idx + 1]["newerModel"] = None
        except Exception:
            pass

    # Step 4 — DB logging + shop enrichment (fast, isolated)
    first  = products_list[0] if products_list else {}
    log_id = None
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute("""
            INSERT INTO recommendation_logs
              (user_id, device, budget, purpose, brand, city, raw_query,
               recommended_product, response_json, drilldown, pain_points)
            VALUES (?,?,?,?,?,?,?,?,?,?,?)
        """, (user_id, device, budget, purpose, brand, city, raw_query,
              first.get("productName"), json.dumps(products_list),
              drilldown, json.dumps(pain_points)))
        log_id = cur.lastrowid
        conn.commit()

        if local_verified_shops and first.get("nearbyShops"):
            for r_shop in first["nearbyShops"]:
                r_name = r_shop.get("name", "").lower()
                for db_shop in local_verified_shops:
                    if db_shop["name"].lower() in r_name or r_name in db_shop["name"].lower():
                        cur.execute(
                            "INSERT INTO shop_impressions (shop_id, recommendation_log_id) VALUES (?,?)",
                            (db_shop["id"], log_id)
                        )
                        r_shop.update({
                            "is_verified":        True,
                            "shop_id":            db_shop["id"],
                            "google_map_url":     db_shop["google_map_url"],
                            "social_media_links": db_shop["social_media_links"],
                            "phone":              db_shop["phone"],
                            "address":            db_shop["address_text"],
                            "image_path":         db_shop["image_path"],
                        })
        conn.commit()
        conn.close()
    except Exception as db_err:
        print(f"[Warning] DB log failed: {db_err}")
        try: conn.close()
        except Exception: pass

    yield {"type": "result", "products": products_list}


@app.route("/recommend", methods=["POST"])
def recommend():
    data    = request.json
    user_id = _extract_user_id()
    key     = _cache_key(data)
    cached  = _cache_get(key)
    if cached:
        return jsonify(cached)

    result = None
    for event in _run_recommendation(data, user_id):
        if event["type"] == "result":
            result = {"products": event["products"]}
        elif event["type"] == "error":
            return jsonify({"error": event["msg"]})

    if result:
        _cache_set(key, result)
    return jsonify(result or {"error": "No result produced"})


@app.route("/recommend/stream", methods=["POST"])
def recommend_stream():
    """SSE endpoint: yields status steps then the final result so the UI can show progress."""
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr or "").split(",")[0].strip()
    if not _check_rate_limit(client_ip):
        return Response(
            f"data: {json.dumps({'type':'error','msg':'Too many requests. Please wait a moment before trying again.'})}\n\n",
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache"},
        )

    data    = request.json
    user_id = _extract_user_id()

    def generate():
        key    = _cache_key(data)
        cached = _cache_get(key)
        if cached:
            # Cache hit — skip steps, return result instantly
            yield f"data: {json.dumps({'type':'cached','products':cached['products']})}\n\n"
            return

        result = None
        for event in _run_recommendation(data, user_id):
            yield f"data: {json.dumps(event)}\n\n"
            if event["type"] == "result":
                result = {"products": event["products"]}

        if result:
            _cache_set(key, result)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "device-recommender"})


# ==========================================
# CHATBOT — intent routing + scoped Q&A
# ==========================================
# What the assistant is allowed to talk about. Anything outside this → declined.
_CHAT_SCOPE = (
    "consumer electronics and technology only: smartphones, tablets, laptops, "
    "desktop/gaming PCs, smartwatches, earbuds/headphones and their accessories; "
    "the components and concepts inside them (RAM, storage/ROM, CPU/chipset, GPU, "
    "battery/mAh, display type & refresh rate, cameras, charging, 5G, OS); "
    "brand and model information, spec comparisons, buying advice, and the local "
    "phone/computer shops in Laos."
)


def _build_chat_prompt(message: str, lang: str, shops_str: str, history=None) -> str:
    """Prompt that BOTH classifies intent and writes the answer for info/out_of_scope."""
    today = datetime.date.today().isoformat()
    year  = datetime.datetime.now().year
    usd_lak, thb_lak = _get_exchange_rates()
    lang_line  = "Answer in Lao (ພາສາລາວ)." if lang == "lo" else "Answer in English."
    price_unit = "Lao Kip (LAK, ₭)" if lang == "lo" else "USD"
    shop_block = (
        f"\nVerified local shops you may reference (use ONLY these, never invent a shop):\n{shops_str}\n"
        if shops_str else ""
    )

    history_block = ""
    if history:
        lines = []
        for h in history[-8:]:
            role = "User" if h.get("role") == "user" else "Aiycom"
            txt  = (h.get("text") or "").strip().replace("\n", " ")[:400]
            if txt:
                lines.append(f"{role}: {txt}")
        if lines:
            history_block = "Conversation so far (use it to resolve what the user means):\n" + \
                            "\n".join(lines) + "\n\n"

    return f"""You are Aiycom, a friendly tech shopping assistant for users in Laos.
Today's date is {today}. You ONLY discuss {_CHAT_SCOPE}

Classify the LATEST user message into exactly one intent, using the conversation so far:
- "recommend": the user wants you to DISCOVER / find devices to buy by budget or use-case,
  WITHOUT naming the exact models — e.g. "recommend a phone", "best phone for gaming under
  5 million kip", "I want a big-screen phone around $500". A budget or open "find me
  something" request → recommend (another system will build product cards).
- "info": an in-scope question needing an explanation, a current price, a spec, a
  comparison, OR a DECISION between SPECIFIC named models — including follow-ups that rely
  on context ("S24 Ultra vs S25 Ultra", "which of these should I buy?", "is the S25 Ultra
  worth it?", "what is RAM", which local shop sells a device).
- "out_of_scope": anything NOT about consumer electronics / technology.

Accuracy rules for "info" (IMPORTANT — your training data is outdated):
- Use the Google Search tool to verify current facts before answering.
- NEVER claim a device "is not launched yet" / "is only rumored" from memory. Check with
  search; if today's date {today} is on or after its release, it is already available.
- PRICE questions: search the current {year} retail price (prefer Thai retailers, then
  convert) and state it clearly in {price_unit}. A small range is fine. Reference rates:
  1 USD ≈ {usd_lak:,} LAK, 1 THB ≈ {thb_lak:,} LAK.
  ALWAYS end every price you mention with a clear estimate disclaimer — write
  "{'(ລາຄາໂດຍປະມານ, ອາດປ່ຽນແປງຕາມຮ້ານ)' if lang == 'lo' else '(estimated price, may vary by shop)'}".
  Never present a price as exact or final.
- COMPARISON of two or more named models: give a short factual comparison — the key
  spec/price differences and who each suits — in 3-6 sentences.
- DECISION questions ("which should I buy?", "which is better for me?"): if the
  conversation or the message refers to specific models, recommend BETWEEN THOSE models —
  e.g. suggest the higher/newer model if budget allows, and the cheaper one for a tighter
  budget — in 3-6 sentences. Do NOT switch to unrelated phones. If no specific models are
  in context and no budget is given, ask ONE short clarifying question (which models, or
  what budget) instead of guessing.
- Other info questions: a clear, beginner-friendly answer in 2-5 sentences.
- Shop questions: use ONLY the verified shop list below (name, address, phone).
- Always write the "answer" in the user's language. {lang_line}

For "recommend": leave "answer" as an empty string — another system builds the product cards.
For "out_of_scope": set "answer" to ONE polite sentence saying you only help with phones,
tablets, laptops and other tech, and invite a tech question. {lang_line}
{shop_block}
{history_block}Latest user message: "{message}"

Return ONLY valid JSON, no markdown:
{{"intent":"recommend|info|out_of_scope","answer":"..."}}"""


# Keywords that signal a question needs live data (price / availability / comparison).
# When present we enable Google Search grounding so the answer reflects 2026 reality
# instead of the model's stale training knowledge.
_CHAT_FRESH_KEYWORDS = (
    "price", "cost", "how much", "how many", "baht", "thb", "usd", "dollar", "kip",
    "ราคา", "ກີບ", "ລາຄາ", "ລາຄາ", "ເທົ່າໃດ", "ຣາຄາ",
    "launch", "release", "released", "newest", "latest", "available", "out yet",
    "vs", "versus", "compare", "comparison", "difference", "better than",
    "ໃໝ່", "ລ່າສຸດ", "ຫຼ້າສຸດ", "ປຽບທຽບ", "ດີກວ່າ", "ອອກໃໝ່",
)


def _chat_needs_search(message: str) -> bool:
    msg_l = message.lower()
    return "$" in message or any(k in msg_l for k in _CHAT_FRESH_KEYWORDS)


@app.route("/chat", methods=["POST"])
def chat():
    """Route a free-text message: recommendation, in-scope Q&A, or polite decline."""
    data    = request.json or {}
    message = (data.get("message") or "").strip()
    lang    = data.get("lang", "en")
    if not message:
        return jsonify({"success": False, "intent": "info",
                        "answer": "Please type a question."}), 400
    if len(message) > 500:
        message = message[:500]

    # Recent conversation so follow-ups like "which one should I buy?" keep context.
    raw_history = data.get("history") or []
    history = []
    if isinstance(raw_history, list):
        for h in raw_history[-8:]:
            if isinstance(h, dict) and h.get("text"):
                history.append({
                    "role": "user" if h.get("role") == "user" else "assistant",
                    "text": str(h["text"])[:400],
                })

    # Pull verified shops so in-scope shop questions get REAL answers (killer feature).
    shops_str = ""
    try:
        conn = get_db_connection()
        cur  = conn.cursor()
        cur.execute(
            "SELECT name, city, address_text, phone FROM shops "
            "WHERE is_verified = 1 ORDER BY city, name LIMIT 40"
        )
        rows = cur.fetchall()
        conn.close()
        if rows:
            shops_str = "\n".join(
                f"- {r['name']} ({r['city']}) — {r['address_text']}, phone {r['phone']}"
                for r in rows
            )
    except Exception as e:
        print(f"[Chat] shop fetch failed: {e}")

    prompt = _build_chat_prompt(message, lang, shops_str, history)
    # Ground price / availability / comparison questions in live search; keep simple
    # questions (greetings, "what is RAM") fast and quota-cheap with no grounding.
    # Also ground a context-dependent follow-up ("which should I buy?") when the recent
    # conversation was about prices/models, so the advice uses current data.
    last_bot = next((h["text"] for h in reversed(history) if h["role"] == "assistant"), "")
    needs_search = _chat_needs_search(message) or (
        len(message) < 40 and _chat_needs_search(last_bot)
    )
    try:
        raw = _gemini_generate(prompt, grounding=needs_search).strip()
        for fence in ("```json", "```"):
            if raw.startswith(fence):
                raw = raw[len(fence):]
        if raw.endswith("```"):
            raw = raw[:-3]
        m = re.search(r'\{[\s\S]*\}', raw)
        parsed = json.loads(m.group(0) if m else raw)
        intent = parsed.get("intent", "info")
        answer = (parsed.get("answer") or "").strip()
    except Exception as e:
        # Fail safe: if the classifier breaks, fall back to a recommendation so the
        # user still gets a useful result instead of an error.
        print(f"[Chat] classify failed, defaulting to recommend: {e}")
        intent, answer = "recommend", ""

    if intent not in ("recommend", "info", "out_of_scope"):
        intent = "info"

    return jsonify({"success": True, "intent": intent, "answer": answer})


@app.route("/api/admin/trends", methods=["GET"])
@token_required
def admin_trends(current_user):
    """Return recommendation counts over a selectable window for the admin chart.
    ?range=day   → last 24 hours, hourly buckets
    ?range=week  → last 7 days,   daily buckets (default)
    ?range=month → last 30 days,  daily buckets
    ?range=year  → last 12 months, monthly buckets
    """
    if current_user["role"] != "admin":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    from datetime import datetime, date, timedelta, timezone
    rng = (request.args.get("range") or "week").lower()
    if rng not in ("day", "week", "month", "year"):
        rng = "week"

    conn = get_db_connection()
    cur  = conn.cursor()

    if rng == "day":
        # Hourly over the last 24 h. SQLite 'now' is UTC, so bucket in UTC too.
        cur.execute("""
            SELECT strftime('%Y-%m-%d %H', created_at) AS bucket, COUNT(*) AS count
            FROM recommendation_logs
            WHERE created_at >= datetime('now', '-23 hours')
            GROUP BY bucket
        """)
        rows = {r["bucket"]: r["count"] for r in cur.fetchall()}
        now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        points = []
        for i in range(23, -1, -1):
            t   = now - timedelta(hours=i)
            key = t.strftime("%Y-%m-%d %H")
            points.append({"date": key, "label": t.strftime("%H:00"), "count": rows.get(key, 0)})

    elif rng == "year":
        # Monthly over the last 12 months.
        cur.execute("""
            SELECT strftime('%Y-%m', created_at) AS bucket, COUNT(*) AS count
            FROM recommendation_logs
            WHERE created_at >= date('now', 'start of month', '-11 months')
            GROUP BY bucket
        """)
        rows = {r["bucket"]: r["count"] for r in cur.fetchall()}
        today = date.today()
        points = []
        for i in range(11, -1, -1):
            mm, yy = today.month - i, today.year
            while mm <= 0:
                mm += 12
                yy -= 1
            key = f"{yy:04d}-{mm:02d}"
            points.append({"date": key, "label": date(yy, mm, 1).strftime("%b %y"),
                           "count": rows.get(key, 0)})

    else:
        # Daily buckets: week = last 7 days, month = last 30 days.
        days = 7 if rng == "week" else 30
        cur.execute(
            "SELECT DATE(created_at) AS day, COUNT(*) AS count FROM recommendation_logs "
            "WHERE created_at >= DATE('now', ?) GROUP BY DATE(created_at)",
            (f"-{days - 1} days",)
        )
        rows  = {r["day"]: r["count"] for r in cur.fetchall()}
        today = date.today()
        points = [
            {
                "date":  (today - timedelta(days=i)).isoformat(),
                "label": (today - timedelta(days=i)).strftime("%d %b"),
                "count": rows.get((today - timedelta(days=i)).isoformat(), 0),
            }
            for i in range(days - 1, -1, -1)
        ]

    conn.close()
    return jsonify({"success": True, "range": rng, "daily": points})


# ==========================================
# TRADE-OFF SUMMARY ENDPOINT
# ==========================================

@app.route("/recommend/tradeoff", methods=["POST"])
def recommend_tradeoff():
    data = request.json
    products = data.get("products", [])
    lang = data.get("lang", "en")

    if len(products) < 2:
        return jsonify({"success": False, "error": "Need at least 2 products to compare"}), 400

    summaries = []
    for p in products[:3]:
        pros = p.get("prosAndCons", {}).get("pros", [])[:2]
        cons = p.get("prosAndCons", {}).get("cons", [])[:1]
        summaries.append(
            f"• {p.get('productName', 'Unknown')} ({p.get('price', '?')}): "
            f"Pros: {', '.join(pros) or 'N/A'}. Con: {', '.join(cons) or 'N/A'}"
        )

    lang_note = "Respond entirely in Lao (ພາສາລາວ)." if lang == "lo" else "Respond in English."

    prompt = f"""You are a device expert. Give a direct, practical 2-3 sentence trade-off summary comparing these devices.
Tell me clearly who should pick which device and why. Be specific and actionable. {lang_note}
Return only the comparison text — no headers, no bullet points, no formatting.

{chr(10).join(summaries)}
"""
    try:
        summary = _gemini_generate(prompt)
        return jsonify({"success": True, "summary": summary.strip()})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ==========================================
# SHOP CLICK TRACKING
# ==========================================

@app.route("/api/shop/click", methods=["POST"])
def track_shop_click():
    data = request.json
    shop_id = data.get("shopId")
    click_type = data.get("clickType")
    recommendation_log_id = data.get("recommendationLogId")

    if not shop_id or not click_type:
        return jsonify({"success": False, "message": "shopId and clickType required"}), 400

    valid_types = ["facebook", "instagram", "line", "google_maps", "phone"]
    if click_type not in valid_types:
        return jsonify({"success": False, "message": "Invalid click type"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO shop_clicks (shop_id, click_type, recommendation_log_id) VALUES (?, ?, ?)",
        (shop_id, click_type, recommendation_log_id)
    )
    conn.commit()
    conn.close()
    return jsonify({"success": True}), 200


# ==========================================
# SHOP MARKET DEMAND
# ==========================================

@app.route("/api/shop/market-demand", methods=["GET"])
@token_required
def shop_market_demand(current_user):
    if current_user["role"] != "shop":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT city FROM shops WHERE user_id = ?", (current_user["id"],))
    shop = cursor.fetchone()
    if not shop:
        conn.close()
        return jsonify({"success": False, "message": "Shop not found"}), 404

    city = shop["city"]

    cursor.execute("""
        SELECT device, COUNT(*) as count FROM recommendation_logs
        WHERE LOWER(city) = LOWER(?) AND created_at >= date('now', '-30 days')
        GROUP BY device ORDER BY count DESC LIMIT 5
    """, (city,))
    top_devices = [dict(row) for row in cursor.fetchall()]

    cursor.execute("""
        SELECT purpose, COUNT(*) as count FROM recommendation_logs
        WHERE LOWER(city) = LOWER(?) AND created_at >= date('now', '-30 days')
        GROUP BY purpose ORDER BY count DESC LIMIT 5
    """, (city,))
    top_purposes = [dict(row) for row in cursor.fetchall()]

    cursor.execute("""
        SELECT budget, COUNT(*) as count FROM recommendation_logs
        WHERE LOWER(city) = LOWER(?) AND created_at >= date('now', '-30 days')
        GROUP BY budget ORDER BY count DESC LIMIT 5
    """, (city,))
    budget_dist = [dict(row) for row in cursor.fetchall()]

    cursor.execute("""
        SELECT COUNT(*) FROM recommendation_logs
        WHERE LOWER(city) = LOWER(?) AND created_at >= date('now', '-30 days')
    """, (city,))
    total_searches = cursor.fetchone()[0]

    conn.close()
    return jsonify({
        "success": True,
        "data": {
            "city": city,
            "totalSearches30Days": total_searches,
            "topDevices": top_devices,
            "topPurposes": top_purposes,
            "budgetDistribution": budget_dist,
        }
    }), 200


# ==========================================
# SHOP MISSED OPPORTUNITIES
# ==========================================

@app.route("/api/shop/missed-opportunities", methods=["GET"])
@token_required
def shop_missed_opportunities(current_user):
    if current_user["role"] != "shop":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id, city FROM shops WHERE user_id = ?", (current_user["id"],))
    shop = cursor.fetchone()
    if not shop:
        conn.close()
        return jsonify({"success": False, "message": "Shop not found"}), 404

    shop_id = shop["id"]
    city = shop["city"]

    cursor.execute("""
        SELECT COUNT(*) FROM recommendation_logs
        WHERE LOWER(city) = LOWER(?) AND created_at >= date('now', '-7 days')
    """, (city,))
    total_city = cursor.fetchone()[0]

    cursor.execute("""
        SELECT COUNT(DISTINCT si.recommendation_log_id)
        FROM shop_impressions si
        JOIN recommendation_logs rl ON si.recommendation_log_id = rl.id
        WHERE si.shop_id = ? AND rl.created_at >= date('now', '-7 days')
    """, (shop_id,))
    captured = cursor.fetchone()[0]

    cursor.execute("""
        SELECT rl.device, COUNT(*) as count
        FROM recommendation_logs rl
        WHERE LOWER(rl.city) = LOWER(?)
          AND rl.created_at >= date('now', '-7 days')
          AND rl.id NOT IN (
              SELECT recommendation_log_id FROM shop_impressions WHERE shop_id = ?
          )
        GROUP BY rl.device ORDER BY count DESC LIMIT 5
    """, (city, shop_id))
    missed_by_device = [dict(row) for row in cursor.fetchall()]

    conn.close()
    return jsonify({
        "success": True,
        "data": {
            "city": city,
            "week": {"total": total_city, "captured": captured, "missed": max(0, total_city - captured)},
            "missedByDevice": missed_by_device,
        }
    }), 200


# ==========================================
# SHOP INVENTORY MANAGEMENT
# ==========================================

@app.route("/api/shop/inventory", methods=["GET", "POST", "DELETE"])
@token_required
def shop_inventory(current_user):
    if current_user["role"] != "shop":
        return jsonify({"success": False, "message": "Unauthorized"}), 403

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM shops WHERE user_id = ?", (current_user["id"],))
    shop = cursor.fetchone()
    if not shop:
        conn.close()
        return jsonify({"success": False, "message": "Shop not found"}), 404
    shop_id = shop["id"]

    if request.method == "GET":
        cursor.execute("SELECT id, device_category FROM shop_inventory WHERE shop_id = ?", (shop_id,))
        items = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify({"success": True, "data": items}), 200

    elif request.method == "POST":
        category = request.json.get("deviceCategory", "").strip()
        if not category:
            conn.close()
            return jsonify({"success": False, "message": "deviceCategory required"}), 400
        try:
            cursor.execute(
                "INSERT OR IGNORE INTO shop_inventory (shop_id, device_category) VALUES (?, ?)",
                (shop_id, category)
            )
            conn.commit()
            conn.close()
            return jsonify({"success": True}), 201
        except Exception as e:
            conn.close()
            return jsonify({"success": False, "message": str(e)}), 500

    elif request.method == "DELETE":
        category = request.json.get("deviceCategory", "").strip()
        cursor.execute(
            "DELETE FROM shop_inventory WHERE shop_id = ? AND device_category = ?",
            (shop_id, category)
        )
        conn.commit()
        conn.close()
        return jsonify({"success": True}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)
