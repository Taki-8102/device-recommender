# Aiycom — System Explanation (DFD Format)

> ລະບົບ: **ລະບົບແຊັດບອດແນະນຳອຸປະກອນອີເລັກໂຕນິກທີ່ຂັບເຄື່ອນໂດຍປັນຍາປະດິດ**
> (AI-powered Electronic Device Recommendation Chatbot)
> Built with React (frontend) + Flask (backend) + SQLite (database) + Gemini AI.

---

## List of Boundaries (External Entities)

| # | Actor (ລາວ) | Actor (English) | Role in the System |
|---|---|---|---|
| 1 | ຜູ້ໃຊ້ງານ | **User** | Searches for device recommendations, views results, saves products, views history |
| 2 | ເຈົ້າຂອງຮ້ານ | **Shop Owner** | Manages shop profile, uploads logo, sets inventory, views analytics |
| 3 | ຜູ້ດູແລລະບົບ | **Admin** | Verifies shops, manages all user accounts, views platform-wide reports |

---

## List of Data Stores (Database Tables)

| # | Data Store (ລາວ) | Data Store (English) | Table in DB | What It Stores |
|---|---|---|---|---|
| D1 | ຂໍ້ມູນຜູ້ໃຊ້ | **User Data** | `users` | id, username, password_hash, role (user / shop / admin), created_at |
| D2 | ຂໍ້ມູນຮ້ານຄ້າ | **Shop Data** | `shops` | shop name, address, city, phone, Google Maps URL, social media links, logo image path, verification status (0 = pending / 1 = verified) |
| D3 | ບັນທຶກການແນະນຳ | **Recommendation Log** | `recommendation_logs` | Every AI search record: device type, budget, purpose, brand, city, raw query, recommended product name, full AI response JSON, drilldown, pain points |
| D4 | ການເບິ່ງເຫັນໂຄສະນາ | **Shop Ad Impression Data** | `shop_impressions` | One row per time a shop was shown to a user in recommendation results — linked to shop_id and recommendation_log_id |
| D5 | ການຄລິກໂຄສະນາ | **Shop Ad Click Data** | `shop_clicks` | One row per contact click: click type (facebook / instagram / line / google_maps / phone), linked to shop_id |
| D6 | ປະເພດສິນຄ້າຂອງຮ້ານ | **Shop Inventory Data** | `shop_inventory` | Device categories each shop carries (Smartphone / Tablet / Laptop / Gaming PC) — controls which shops appear for each device search |
| D7 | ສິນຄ້າທີ່ບັນທຶກ | **Saved Products Data** | `saved_products` | Products a user saved to their wishlist: product name + full product JSON (price, specs, pros/cons, image) |

---

## List of Processes

---

### 1.0 ຈັດການຂໍ້ມູນ — Data Management

> Admin, Shop Owner, and User manage all master data in the system.

| Process | → Admin | → Shop | → User |
|---|---|---|---|
| 1.1 ຈັດການຂໍ້ມູນຜູ້ໃຊ້ | ✅ | | ✅ |
| 1.2 ຈັດການຂໍ້ມູນການແນະນຳ | | | ✅ |
| 1.3 ຈັດການຂໍ້ມູນປະເພດສິນຄ້າ | | ✅ | |
| 1.4 ຈັດການຂໍ້ມູນກຳນົດສິດ | ✅ | | |
| 1.5 ຈັດການຂໍ້ມູນຮ້ານຄ້າ | | ✅ | |

#### 1.1 ຈັດການຂໍ້ມູນຜູ້ໃຊ້ — Manage User Data

- **Who:** Admin
- **What happens:** Admin can view all registered accounts (users, shops), edit usernames/roles, delete accounts
- **Endpoints:** `GET /api/admin/users`, `PUT /api/admin/users/<id>`, `DELETE /api/admin/users/<id>`
- **Data Store used:** D1 `users`
- **Input:** User ID, new role or username
- **Output:** Updated user record

#### 1.2 ຈັດການຂໍ້ມູນການແນະນຳ — Manage Recommendation Data

- **Who:** User
- **What happens:** User views and deletes their own past recommendation search history and saved product wishlist.
- **Endpoints:** `GET /api/user/history`, `DELETE /api/user/history/<id>`, `GET /api/user/saved`, `POST /api/user/saved`, `DELETE /api/user/saved/<id>`
- **Data Stores used:** D3 `recommendation_logs`, D7 `saved_products`
- **Input:** User ID, record ID to delete (optional)
- **Output:** List of past searches and saved products; confirmation of deletion

#### 1.3 ຈັດການຂໍ້ມູນປະເພດສິນຄ້າ — Manage Product Category Data

- **Who:** Shop Owner
- **What happens:** Shop owner selects which device categories their shop carries (Smartphone / Tablet / Laptop / Gaming PC). These category tags directly control which AI recommendation searches the shop will appear in.
- **Endpoints:** `GET/POST/DELETE /api/shop/inventory`
- **Data Store used:** D6 `shop_inventory`
- **Input:** device_category (e.g. "Smartphone")
- **Output:** Shop appears in recommendation results only when user searches for a matching device type

#### 1.4 ຈັດການຂໍ້ມູນກຳນົດສິດ — Manage Access Rights Data

- **Who:** Admin
- **What happens:** Admin verifies or rejects shop registration requests. Verified shops (is_verified = 1) appear in recommendation results; unverified shops are hidden.
- **Endpoints:** `GET /api/admin/shops`, `PUT /api/admin/shops/<id>/verify`
- **Data Stores used:** D2 `shops`, D1 `users`
- **Input:** shop_id, verified = true/false
- **Output:** Shop becomes visible (or hidden) in AI recommendation results

#### 1.5 ຈັດການຂໍ້ມູນຮ້ານຄ້າ — Manage Shop Data

- **Who:** Shop Owner
- **What happens:** Shop owner fills in their advertisement profile: shop name, address, phone, Google Maps link, Facebook/Line/Instagram links, and uploads a logo. This is what users see in the "Where to Buy" section of each recommendation card.
- **Endpoints:** `GET/PUT /api/shop/profile`, `POST /api/shop/upload-image`
- **Data Store used:** D2 `shops`
- **Input:** name, address, city, phone, social_media_links, image file
- **Output:** Shop profile card shown to users in recommendation results

---

### 2.0 ປະມວນຜົນ — Processing (Core AI Engine)

> Core AI recommendation engine triggered by user queries.

#### 2.1 ຮັບ ແລະ ວິເຄາະຄຳຖາມ — Receive & Analyze Query

- **Who:** User (triggers via chat or guided wizard)
- **What happens:** User submits a search request. The backend parses and validates all input fields: device type, budget (LAK or USD), purpose, brand preference, city, language, and currency mode.
- **Endpoints:** `POST /recommend/stream`, `POST /recommend`
- **Input from User:** device type, budget, purpose, brand, city, language (Lao/English), currency (LAK/USD)
- **Output:** Validated and structured query passed to process 2.2

#### 2.2 ດຶງຂໍ້ມູນຮ້ານທີ່ກ່ຽວຂ້ອງ — Fetch Verified Shops

- **What happens:** Backend queries the database for verified shops in the user's city that carry the searched device category. Shops with no inventory tags set are included as a fallback.
- **Data Stores read:** D2 `shops`, D6 `shop_inventory`
- **Input:** city, device_category from process 2.1
- **Output:** List of matching verified shops (name, address, phone, social links, logo) passed to process 2.3

#### 2.3 ເອີ້ນໃຊ້ Gemini AI — Call Gemini AI

- **What happens:** Backend builds a prompt combining: user inputs, shop data, brand-tier guide, and LAK pricing rules. The prompt is sent to Gemini AI (gemini-2.5-flash, with gemini-2.0-flash as fallback) with Google Search grounding enabled so Gemini can fetch real-time prices from Thai retail sites (advice.co.th, jib.co.th, banana.co.th, etc.). Gemini returns 3 product recommendations as JSON.
- **External API:** Gemini AI (11 key pool, 2-model fallback on 429/503 errors)
- **Input:** Prompt from process 2.2
- **Output:** 3 recommended products (name, price, specs, pros/cons, reasoning) passed to process 2.4

#### 2.4 ກວດສອບລາຄາ ແລະ ຮູບສິນຄ້າ — Verify Price & Image

- **What happens:**
  1. **Price verification:** Google CSE searches Thai retail sites for the current price. The result is only accepted if it falls within ±35% of Gemini's estimate (plausibility check). Price inversion guard corrects older models priced higher than newer models (capped at 90% of newer model's price). newerModel upgrade banners are suppressed if the newer model exceeds 140% of the user's budget.
  2. **Image search:** Google CSE finds the official product image URL for each recommended device.
- **External API:** Google Custom Search Engine (2 key+CX pairs, rotating), open.er-api.com (live USD/LAK and THB/LAK exchange rates)
- **Input:** Product list from process 2.3
- **Output:** Final product list with verified prices and image URLs passed to process 2.5

#### 2.5 ສົ່ງຜົນ ແລະ ບັນທຶກ — Return Result & Log

- **What happens:**
  1. Final result is streamed back to the user in real-time via SSE (Server-Sent Events) with live progress steps
  2. Full recommendation result is saved to `recommendation_logs`
  3. Each shop shown in the result is recorded in `shop_impressions`
  4. When user clicks a shop contact link → recorded in `shop_clicks`
  5. When user saves a product → recorded in `saved_products`
  6. Result is cached in-memory for 30 minutes (keyed by hash of all input fields)
- **Data Stores written:** D3 `recommendation_logs`, D4 `shop_impressions`, D5 `shop_clicks`, D7 `saved_products`
- **Output:** Recommendation result displayed to user

---

### 3.0 ລາຍງານ — Reports

#### 3.1 ລາຍງານຂໍ້ມູນຜູ້ໃຊ້ — User Data Report

- **Who:** Admin
- **What it shows:**
  - Total registered users
  - Total shops (verified vs. pending)
  - Full user list with roles and registration dates
- **Endpoints:** `GET /api/admin/analytics`, `GET /api/admin/users`
- **Data Stores used:** D1 `users`, D2 `shops`

#### 3.2 ລາຍງານຂໍ້ມູນສິນຄ້າ — Product / Device Report

- **Who:** Admin
- **What it shows:**
  - Top 5 products recommended by Gemini AI (most frequently appearing in results)
  - Top 5 most searched device types (Smartphone / Laptop / Tablet)
  - Geographic demand — which cities generate the most searches
- **Endpoint:** `GET /api/admin/analytics`
- **Data Store used:** D3 `recommendation_logs`

#### 3.3 ລາຍງານຂໍ້ມູນການໂຄສະນາ — Shop Ad Performance Report

- **Who:** Admin (platform-wide) and Shop Owner (own shop only)
- **What it shows (Admin):**
  - Total platform impressions and clicks
  - Platform conversion rate (clicks ÷ impressions)
  - Top 5 shops by impressions
- **What it shows (Shop Owner):**
  - Own impressions and click-through breakdown (Facebook / Line / Instagram / Maps / Phone)
  - Daily impressions chart (last 14 days)
  - Top devices triggering their shop's ad
  - Missed opportunities — searches in their city where they were not shown
- **Endpoints:** `GET /api/admin/analytics`, `GET /api/shop/analytics`, `GET /api/shop/missed-opportunities`
- **Data Stores used:** D4 `shop_impressions`, D5 `shop_clicks`, D3 `recommendation_logs`, D2 `shops`

#### 3.4 ລາຍງານຂໍ້ມູນງົບລາຄາ — Budget Range Report

- **Who:** Admin
- **What it shows:**
  - Lowest / Average / Highest budget searched (LAK and USD separately)
  - Budget distribution buckets:
    - LAK: `< ₭5M` / `₭5M–₭10M` / `₭10M–₭20M` / `₭20M+`
    - USD: `< $300` / `$300–$600` / `$600+`
  - 7-day recommendation trend bar chart
- **Endpoints:** `GET /api/admin/analytics`, `GET /api/admin/trends`
- **Data Store used:** D3 `recommendation_logs`

#### 3.5 ລາຍງານປະຫວັດການຄົ້ນຫາ — Search History Report

- **Who:** User
- **What it shows:**
  - Personal list of past recommendation searches (device type, budget, city, date)
  - Saved products wishlist (product name, price, specs, image)
  - User can delete history entries or remove saved items
- **Endpoints:** `GET /api/user/history`, `GET /api/user/saved`
- **Data Stores used:** D3 `recommendation_logs`, D7 `saved_products`

---

## System Architecture Summary

```
┌─────────────┐     HTTP/SSE      ┌──────────────────────────────┐
│  React App  │ ◄───────────────► │       Flask Backend          │
│  (Port 3000)│                   │       (Port 5000)            │
└─────────────┘                   │                              │
                                  │  ┌─────────────────────────┐ │
  3 User Roles:                   │  │   SQLite Database        │ │
  • user   — chatbot only         │  │   recommender.db         │ │
  • shop   — dashboard + profile  │  │                          │ │
  • admin  — full platform view   │  │  D1 users                │ │
                                  │  │  D2 shops                │ │
  Auth: JWT tokens (7-day expiry) │  │  D3 recommendation_logs  │ │
  Language: Lao / English         │  │  D4 shop_impressions     │ │
  Currency: LAK / USD             │  │  D5 shop_clicks          │ │
                                  │  │  D6 shop_inventory       │ │
                                  │  │  D7 saved_products       │ │
                                  │  └─────────────────────────┘ │
                                  │                              │
                                  │  External APIs:              │
                                  │  • Gemini AI (11 keys)       │
                                  │  • Google CSE (2 pairs)      │
                                  │  • open.er-api.com (rates)   │
                                  └──────────────────────────────┘
```
