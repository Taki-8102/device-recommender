# Aiycom — System Explanation & Documentation

> A full-stack AI-powered device recommender chatbot built as a thesis project targeting the Lao PDR / Southeast Asia market.

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Tech Stack](#2-tech-stack)
3. [User Roles](#3-user-roles)
4. [Database Schema](#4-database-schema)
5. [How a Recommendation Works (Step by Step)](#5-how-a-recommendation-works-step-by-step)
6. [How Impressions Are Tracked](#6-how-impressions-are-tracked)
7. [How Clicks Are Tracked](#7-how-clicks-are-tracked)
8. [How Conversion Rate Is Calculated](#8-how-conversion-rate-is-calculated)
9. [Shop Dashboard — Every Metric Explained](#9-shop-dashboard--every-metric-explained)
10. [Admin Dashboard — Every Metric Explained](#10-admin-dashboard--every-metric-explained)
11. [Admin Management Pages](#11-admin-management-pages)
12. [All API Endpoints](#12-all-api-endpoints)
13. [How to Test the System](#13-how-to-test-the-system)

---

## 1. System Overview

Aiycom is a chatbot that helps users in Laos and Southeast Asia find the right smartphone, tablet, or laptop. The user describes what they need (through text chat or a guided wizard), the AI returns 3 ranked product recommendations with specs, pros/cons, and nearby shop information.

The system also tracks **which shops appear in recommendations** (impressions) and **when users click shop contact links** (clicks), giving shop owners real analytics about how many leads they are receiving.

```
[User] → Chatbot/Wizard → POST /recommend → Gemini 2.5 Flash AI
                                                  ↓
                                          3 Products + Shops
                                                  ↓
                                    Log to DB (recommendation_logs)
                                    Log impressions (shop_impressions)
                                                  ↓
                                    [User sees results in UI]
                                                  ↓
                              User clicks shop link → POST /api/shop/click
                                    Log click (shop_clicks)
```

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 (Vite), CSS |
| Backend | Python Flask |
| Database | SQLite (file: `backend/recommender.db`) |
| AI Engine | Google Gemini 2.5 Flash (via `google-genai` SDK) |
| Image Search | Google Custom Search API |
| Auth | JWT (JSON Web Tokens) |
| Languages | English + Lao (ພາສາລາວ) |
| Currencies | USD ($) and LAK (₭) |

**Running the project:**
```bash
# Backend (Flask)
cd backend
python app.py        # runs on http://localhost:5000

# Frontend (React)
cd frontend
npm run dev          # runs on http://localhost:3000
```

---

## 3. User Roles

There are 3 roles in the system. Each role sees different pages in the sidebar.

| Role | Default Login | Access |
|---|---|---|
| `user` | Register from the app | Chatbot, History, Shops |
| `shop` | `banana_it` / `shop123` | + Seller Portal (analytics) |
| `admin` | `admin` / `admin123` | + Admin Panel, User Management, Shop Verification |

Other test shop accounts: `jib_shop` / `shop123`, `lao_digital` / `shop123`

---

## 4. Database Schema

There are 6 tables. Here is what each stores:

### `users`
Stores all accounts.
```
id | username | password_hash | role (admin/shop/user) | created_at
```

### `shops`
One shop profile per shop account. Linked to `users` by `user_id`.
```
id | user_id | name | google_map_url | address_text | city | phone
   | social_media_links (JSON) | is_verified (0=pending, 1=verified) | created_at
```

### `recommendation_logs`
Every AI recommendation is logged here (one row per search).
```
id | user_id | device | budget | purpose | brand | city | raw_query
   | recommended_product (first product name only) | response_json (full JSON)
   | drilldown | pain_points | created_at
```

### `shop_impressions`
**Created when a verified shop appears in a recommendation result.**
One row = one time a shop was shown to a user.
```
id | shop_id | recommendation_log_id | viewed_at
```

### `shop_clicks`
**Created when a user clicks a shop's contact link** (Facebook, Maps, Phone, Line, Instagram).
```
id | shop_id | click_type (facebook/instagram/line/google_maps/phone)
   | recommendation_log_id | clicked_at
```

### `shop_inventory`
Shops tag which device categories they sell.
```
id | shop_id | device_category | created_at
```

---

## 5. How a Recommendation Works (Step by Step)

This is the full flow from the moment a user submits a search to the moment they see results.

### Step 1 — User Submits Request
The user either:
- Types a message in the chatbot (e.g. "I need a gaming phone under $400 in Bangkok")
- Completes the **Wizard** (7-step guided quiz)

The wizard collects: `device`, `purposes`, `drilldown`, `brand`, `brandTier`, `lifecycle`, `painPoints`, `budget`, `currency`, `city`

### Step 2 — Frontend sends `POST /recommend`
The frontend sends all collected data to the Flask backend.

```json
{
  "device": "Smartphone",
  "purposes": ["Gaming"],
  "drilldown": "gaming_competitive",
  "brand": "No preference",
  "brandTier": "best_value",
  "lifecycle": "2 years",
  "painPoints": ["battery", "lag"],
  "budget": "Under $400",
  "rawBudgetAmount": 400,
  "currency": "USD",
  "city": "Bangkok",
  "lang": "en"
}
```

### Step 3 — Backend looks up verified shops in that city
```sql
SELECT id, name, address_text, phone, google_map_url, social_media_links
FROM shops
WHERE LOWER(city) = LOWER('Bangkok') AND is_verified = 1
```
These shops are injected into the AI prompt so Gemini can recommend them as "Where to Buy".

### Step 4 — Backend builds the Gemini prompt
The prompt includes:
- Basic requirements (device, budget, purpose, brand)
- **Drill-down block** — if `gaming_competitive`, adds: *"REQUIRES 90Hz+ display, low touch latency, strong CPU"*
- **Pain-point block** — if `battery` in pain_points, adds: *"PRIORITY: Large battery (5000mAh+)"*
- **Brand strategy** — if `best_value`, adds: *"Prioritize Xiaomi, Realme, POCO"*
- **Verified shops list** — exact shop names, addresses, phone numbers
- **Language instruction** — if `lang=lo`, tells Gemini to write reasoning/pros/cons in Lao script
- **Currency instruction** — if `currency=LAK`, tells Gemini to convert all prices to ₭ LAK

### Step 5 — Gemini generates 3 product recommendations
Gemini 2.5 Flash uses Google Search (grounding) to find real, current products and returns structured JSON:

```json
{
  "products": [
    {
      "productName": "Asus ROG Phone 8",
      "brand": "Asus",
      "price": "$399",
      "specs": { "display": "6.78\" 165Hz AMOLED", "processor": "Snapdragon 8 Gen 3", ... },
      "reasoning": "Best match for competitive gaming with 165Hz display...",
      "prosAndCons": { "pros": ["...", "..."], "cons": ["..."] },
      "nearbyShops": [{ "name": "Banana IT (Central World Branch)", ... }]
    },
    { ... },
    { ... }
  ]
}
```

### Step 6 — Backend fetches product images
For each product, it calls **Google Custom Search API** to find a product photo URL and attaches it to the product object.

### Step 7 — Backend logs to database
```sql
INSERT INTO recommendation_logs
(user_id, device, budget, purpose, brand, city, raw_query,
 recommended_product, response_json, drilldown, pain_points)
VALUES (...)
```
The `recommended_product` column stores only the first product name (used for analytics). `response_json` stores the full 3-product JSON.

> **Important:** The DB logging is wrapped in its own `try/except` so even if the database write fails, the user still gets their recommendation. DB errors never break the response.

### Step 8 — Backend records shop impressions
After logging, the backend checks if any shop in the AI's `nearbyShops` array matches a verified shop in the database (by name matching):

```python
for r_shop in first["nearbyShops"]:
    r_name = r_shop.get("name", "").lower()
    for db_shop in local_verified_shops:
        if db_shop["name"].lower() in r_name or r_name in db_shop["name"].lower():
            # Match found — record impression
            INSERT INTO shop_impressions (shop_id, recommendation_log_id)
            
            # Also enrich the shop card with verified data
            r_shop["is_verified"] = True
            r_shop["google_map_url"] = db_shop["google_map_url"]
            r_shop["social_media_links"] = db_shop["social_media_links"]
```

This means: **every time Gemini recommends a verified partner shop, that shop gets +1 impression**.

### Step 9 — Frontend displays results
The response returns to the frontend. The chat renders 3 product cards (via `ProductCarousel`) each showing specs, pros/cons, and the verified "Where to Buy" section with the shop's phone, map link, and social media.

Post-recommendation action chips appear:
- **Compare All** — opens a side-by-side table
- **Trade-off Summary** — calls `POST /recommend/tradeoff` to get an AI analysis
- **Find Cheaper** — re-submits the search with 72% of the original budget

---

## 6. How Impressions Are Tracked

An **impression** = a verified partner shop was shown to a user inside a recommendation result.

**When it happens:**
1. User does a search in a city (e.g., "Bangkok")
2. Gemini recommends products with `nearbyShops` in the response
3. The backend name-matches those shops against verified shops in the DB
4. A match → `INSERT INTO shop_impressions (shop_id, recommendation_log_id)`

**Key rules:**
- Only **verified** shops (`is_verified = 1`) can receive impressions
- Only shops in the **same city** as the user's search can appear
- Impressions are counted on the **first product only** (the best match)
- If Gemini doesn't name a shop or the name doesn't match, no impression is recorded

**Where to see it:**
- Shop Dashboard → "Total Impressions" stat
- Admin Dashboard → "Total Impressions" KPI card

---

## 7. How Clicks Are Tracked

A **click** = a user actively clicked a shop's contact link (Facebook, Google Maps, Phone, Line, or Instagram).

**When it happens:**
The frontend calls `POST /api/shop/click` when a user clicks any contact link in:
- The **Seller Portal** (Shop Dashboard) — shop owner's own profile links
- The **product card** "Where to Buy" section (if click tracking is wired to those buttons)

**API call:**
```json
POST /api/shop/click
{
  "shopId": 1,
  "clickType": "facebook"   // facebook | instagram | line | google_maps | phone
}
```

**Backend records:**
```sql
INSERT INTO shop_clicks (shop_id, click_type, recommendation_log_id)
VALUES (1, 'facebook', NULL)
```

**Where to see it:**
- Shop Dashboard → "Total Clicks" + breakdown by type (FB / Maps / Phone / Line / IG)
- Admin Dashboard → "Total Clicks" KPI card

---

## 8. How Conversion Rate Is Calculated

```
Conversion Rate = (Total Clicks / Total Impressions) × 100
```

**Example:**
- A shop appeared in 24 recommendations → 24 impressions
- Users clicked their Facebook link 4 times → 4 clicks
- Conversion Rate = (4 / 24) × 100 = **16.7%**

**Meaning:** 16.7% of the people who saw this shop in a recommendation actually took action and clicked a contact link.

**Platform-wide Conversion** (Admin Dashboard):
```sql
SELECT COUNT(*) FROM shop_impressions  -- total impressions across ALL shops
SELECT COUNT(*) FROM shop_clicks       -- total clicks across ALL shops
-- conversion = clicks / impressions × 100
```

**Per-shop Conversion** (Shop Dashboard):
```sql
SELECT COUNT(*) FROM shop_impressions WHERE shop_id = ?
SELECT COUNT(*) FROM shop_clicks WHERE shop_id = ?
```

---

## 9. Shop Dashboard — Every Metric Explained

Login: `banana_it` / `shop123` → Seller Portal

### Conversion Funnel
| Metric | Source Table | What it means |
|---|---|---|
| Impressions | `shop_impressions` | How many times this shop appeared in a recommendation |
| Clicks | `shop_clicks` | How many times users clicked this shop's contact links |
| Conversion % | Clicks ÷ Impressions × 100 | What % of shown users took action |

### Click Breakdown
Shows how many times each contact type was clicked:
- Facebook clicks (`click_type = 'facebook'`)
- Google Maps clicks (`click_type = 'google_maps'`)
- Phone clicks (`click_type = 'phone'`)
- Line clicks (`click_type = 'line'`)
- Instagram clicks (`click_type = 'instagram'`)

### Market Demand Insights (Last 30 Days)
Answers: *"What are users in my city searching for?"*

Queries `recommendation_logs` filtered by `city = shop's city AND created_at > 30 days ago`:
- **Top searched device types** (Smartphone / Tablet / Laptop)
- **Top purposes** (Gaming, Photography, Work, etc.)
- **Most common budgets**

This tells shop owners what inventory to stock.

### Missed Opportunities
Answers: *"How many leads did I miss this week?"*

- **Total searches** = all recommendation searches in the shop's city this week
- **Captured** = searches where this shop appeared in results (had an impression)
- **Missed** = Total - Captured

Broken down by device type so shop owners know if they are missing smartphone searches vs laptop searches.

### Inventory Tags
Shop owners tag which device categories they sell (Smartphone, Tablet, Laptop, Gaming PC). This is stored in `shop_inventory` and is used to cross-reference against demand data.

---

## 10. Admin Dashboard — Every Metric Explained

Login: `admin` / `admin123` → Admin Panel

### Platform Activity KPIs

| KPI Card | Source | What it counts |
|---|---|---|
| Total Recommendations | `COUNT(*) FROM recommendation_logs` | Every AI search ever done on the platform |
| Registered Shops | `COUNT(*) FROM shops` | All shop accounts (verified + pending) |
| Verified Shops | `COUNT(*) WHERE is_verified = 1` | Shops approved as partner shops |
| Pending Verification | `totalShops - verifiedShops` | Shops waiting for admin approval |

### Conversion Funnel KPIs

| KPI Card | Source | What it counts |
|---|---|---|
| Total Impressions | `COUNT(*) FROM shop_impressions` | All shop showings across all recommendations |
| Total Clicks | `COUNT(*) FROM shop_clicks` | All contact clicks across all shops |
| Platform Conversion | Clicks ÷ Impressions × 100 | Platform-wide lead-to-action rate |

### System Usage Reports

**Top Recommended by Gemini:**
```sql
SELECT recommended_product, COUNT(*) as count
FROM recommendation_logs
WHERE recommended_product IS NOT NULL
GROUP BY recommended_product
ORDER BY count DESC LIMIT 5
```
Shows which specific products the AI recommends most often.

**Most Searched Devices:**
```sql
SELECT device, COUNT(*) as count
FROM recommendation_logs
GROUP BY device
ORDER BY count DESC LIMIT 5
```
Shows whether users mostly search for Smartphones, Tablets, or Laptops.

**Top Ad-Performing Shops:**
```sql
SELECT s.name, COUNT(si.id) as impressions
FROM shops s
LEFT JOIN shop_impressions si ON s.id = si.shop_id
GROUP BY s.id
ORDER BY impressions DESC LIMIT 5
```
Shows which partner shops appear in the most recommendations.

### Geographic Demand Distribution

```sql
SELECT city, COUNT(*) as count
FROM recommendation_logs
WHERE city IS NOT NULL AND city != ''
GROUP BY LOWER(city)
ORDER BY count DESC LIMIT 8
```
Shows which cities generate the most device searches on the platform. Useful for deciding where to expand shop partnerships.

---

## 11. Admin Management Pages

### User Management (`/users` tab)
Admins can:
- View all `shop` and `user` role accounts (admins are excluded)
- **Edit** a user's username or reset their password
- **Delete** a user account (cascades — also deletes their shop profile, impressions, clicks, inventory)

Protection: Admin accounts cannot be edited or deleted through this interface.

### Shop Verification (`/shopverify` tab)
Admins can:
- See all shops split into **Awaiting Verification** (pending) and **Verified Partner Shops**
- **Approve** a pending shop → sets `is_verified = 1`
- **Revoke** a verified shop → sets `is_verified = 0`

Only `is_verified = 1` shops can:
- Receive impressions in recommendations
- Appear in the product card "Where to Buy" section with the ✓ Verified badge
- Show up in the Shops directory page

---

## 12. All API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login, returns JWT token |
| GET | `/api/auth/me` | Get current user info from token |
| POST | `/api/auth/google` | Google OAuth login |

### Recommendation
| Method | Endpoint | Description |
|---|---|---|
| POST | `/recommend` | Main AI recommendation (device + shops) |
| POST | `/recommend/tradeoff` | AI trade-off summary between products |
| GET | `/health` | Health check |

### Shop (requires shop role token)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/shop/profile` | Get own shop profile |
| PUT | `/api/shop/profile` | Update own shop profile |
| GET | `/api/shop/analytics` | Impressions, clicks, conversion funnel |
| POST | `/api/shop/click` | Record a contact link click |
| GET | `/api/shop/market-demand` | City-level demand in last 30 days |
| GET | `/api/shop/missed-opportunities` | Leads captured vs missed this week |
| GET/POST/DELETE | `/api/shop/inventory` | Manage device category tags |

### Admin (requires admin role token)
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/admin/shops` | List all shops |
| PUT | `/api/admin/shops/:id/verify` | Approve or revoke shop verification |
| GET | `/api/admin/analytics` | Platform-wide analytics |
| GET | `/api/admin/users` | List all non-admin users |
| PUT | `/api/admin/users/:id` | Edit username / reset password |
| DELETE | `/api/admin/users/:id` | Delete a user account |

### Public
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/shops` | List all verified shops (public shop directory) |

---

## 13. How to Test the System

### Test a full recommendation flow
1. Open `http://localhost:3000`
2. Click **Help Me Choose** to open the Wizard
3. Select: Smartphone → Gaming → Competitive → No brand preference → 2 Years → Battery (pain point) → Budget: $400 USD → City: Bangkok
4. Click Search → 3 product cards appear
5. Check `recommendation_logs` table — 1 new row added
6. Check `shop_impressions` table — rows added if a Bangkok verified shop was matched

### Test impressions manually
Any search with `city = "Bangkok"` will match `Banana IT (Central World Branch)` (verified).
Any search with `city = "Luang Prabang"` will match `Lao Digital Store` (verified).

### Test clicks manually
```bash
# PowerShell
$token = (Invoke-WebRequest -Uri http://localhost:5000/api/auth/login `
  -Method POST -ContentType "application/json" `
  -Body '{"username":"banana_it","password":"shop123"}' `
  -UseBasicParsing | ConvertFrom-Json).token

Invoke-WebRequest -Uri http://localhost:5000/api/shop/click `
  -Method POST -ContentType "application/json" `
  -Headers @{Authorization="Bearer $token"} `
  -Body '{"shopId":1,"clickType":"facebook"}' -UseBasicParsing
```

### Test trade-off summary
1. Get a recommendation with 2+ products
2. Click the **Trade-off Summary** chip below the results
3. A new bot message appears with an AI comparison

### Test Find Cheaper
1. Get a recommendation
2. Click **Find Cheaper**
3. The system re-searches at 72% of the original budget

### Verify admin numbers update
1. Log in as `admin` / `admin123`
2. Go to **Admin Panel**
3. Do a recommendation search in another browser tab
4. Refresh Admin Panel — Total Recommendations +1, Impressions may increase

---

## Summary — How Each Number Gets to the Dashboard

```
User searches → POST /recommend
    ↓
Gemini returns products with nearbyShops
    ↓
Backend logs: recommendation_logs ← drives "Total Recommendations",
                                        "Most Searched Devices",
                                        "Top Products by Gemini",
                                        "Geographic Demand",
                                        "Market Demand" (shop page)
    ↓
Backend matches nearbyShops to verified DB shops
    ↓
If match: INSERT shop_impressions ← drives "Impressions",
                                           "Conversion Rate",
                                           "Missed Opportunities"
    ↓
User clicks FB/Maps/Phone link in product card or seller portal
    ↓
POST /api/shop/click → INSERT shop_clicks ← drives "Total Clicks",
                                                    "Click Breakdown",
                                                    "Conversion Rate"
```

All dashboard numbers are computed **live from the database on every page load**. There is no pre-aggregated cache — every chart and KPI card runs a fresh SQL query when the page opens.
