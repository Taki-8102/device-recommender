# dbthesis.md — Database Reference for Aiycom Thesis Project

> ລະບົບ: ລະບົບແຊັດບອດແນະນຳອຸປະກອນອີເລັກໂຕນິກທີ່ຂັບເຄື່ອນໂດຍປັນຍາປະດິດ
> Database: SQLite (`recommender.db`) | Backend: Flask | File: `backend/db.py`

---

## Overview

The system uses **7 tables** in a single SQLite database file `recommender.db`.
All 3 user roles (user / shop / admin) share the same `users` table, distinguished by the `role` column.
The `shops` table is separate from `users` — it stores the shop's public profile and is linked via `user_id`.

---

## Table 1 — `users` (D1 ຂໍ້ມູນຜູ້ໃຊ້)

Stores all accounts: regular users, shop owners, and admins.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique account ID |
| `username` | TEXT | UNIQUE NOT NULL | Login username |
| `password_hash` | TEXT | NOT NULL | Hashed password (werkzeug) |
| `role` | TEXT | NOT NULL, CHECK IN ('admin','shop','user') | Account type |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Registration date/time |

**Notes:**
- `role = 'user'` — regular chatbot user
- `role = 'shop'` — shop owner (also has a row in `shops`)
- `role = 'admin'` — platform administrator
- One `users` row per person; shop owners have both a `users` row AND a `shops` row

**Seed data (default accounts):**
| username | password | role |
|---|---|---|
| admin | admin123 | admin |
| banana_it | shop123 | shop |
| jib_shop | shop123 | shop |
| lao_digital | shop123 | shop |

---

## Table 2 — `shops` (D2 ຂໍ້ມູນຮ້ານຄ້າ)

Stores the public shop profile shown in recommendation results.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique shop ID |
| `user_id` | INTEGER | NOT NULL, FK → users(id) ON DELETE CASCADE | Links to the shop's login account |
| `name` | TEXT | NOT NULL | Shop display name |
| `google_map_url` | TEXT | | Google Maps link |
| `address_text` | TEXT | NOT NULL | Full address string |
| `city` | TEXT | NOT NULL | City (used to match user's search city) |
| `phone` | TEXT | NOT NULL | Contact phone number |
| `social_media_links` | TEXT | | JSON string: `{"facebook":"...","line":"...","instagram":"..."}` |
| `is_verified` | INTEGER | DEFAULT 0 | 0 = pending, 1 = verified by admin |
| `image_path` | TEXT | | File path to uploaded shop logo image |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Shop registration date/time |

**Notes:**
- Only verified shops (`is_verified = 1`) appear in AI recommendation results
- `social_media_links` is stored as a JSON string, parsed in Python/JavaScript
- `city` is matched against the user's selected city during recommendation search
- `image_path` stores the server-side path to the logo file (uploaded via `POST /api/shop/upload-image`)

---

## Table 3 — `recommendation_logs` (D3 ບັນທຶກການແນະນຳ)

Stores every AI recommendation session — both the user's input and the AI's full output.
Written by process 2.5 after the AI finishes. Read by process 1.2 (user history) and 3.0 (reports).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique log ID |
| `user_id` | INTEGER | FK → users(id) ON DELETE SET NULL | User who made the search (NULL if deleted) |
| `device` | TEXT | | Device type searched: Smartphone / Tablet / Laptop / Gaming PC |
| `budget` | TEXT | | Budget value as string (e.g. "15000000" for LAK or "500" for USD) |
| `purpose` | TEXT | | Use case: Gaming / Work / Study / etc. |
| `brand` | TEXT | | Brand preference: Apple / Samsung / Any / etc. |
| `city` | TEXT | | City the user selected for shop search |
| `raw_query` | TEXT | | Full raw query string sent to AI |
| `recommended_product` | TEXT | | Name of the top recommended product |
| `response_json` | TEXT | | Full AI response as JSON string (all 3 products with specs, pros/cons, price, image) |
| `drilldown` | TEXT | | Follow-up drill-down query data (if user asked more details) |
| `pain_points` | TEXT | | Detected pain points from user input |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Timestamp of the search |

**Notes:**
- `user_id` uses `ON DELETE SET NULL` — if user is deleted, logs are kept for analytics but user link becomes NULL
- `response_json` contains the complete recommendation result (parsed for reports/history display)
- `budget` is stored as a TEXT string to preserve the original currency/value without conversion
- This table is the primary source for all admin analytics reports (3.1–3.4) and user history (3.5)

---

## Table 4 — `shop_impressions` (D4 ການເບິ່ງເຫັນໂຄສະນາ)

Records each time a shop was shown to a user inside a recommendation result.
Written automatically by process 2.5. Used by report 3.3.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique impression ID |
| `shop_id` | INTEGER | NOT NULL, FK → shops(id) ON DELETE CASCADE | Which shop was shown |
| `recommendation_log_id` | INTEGER | NOT NULL, FK → recommendation_logs(id) ON DELETE CASCADE | Which search session showed the shop |
| `viewed_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the impression happened |

**Notes:**
- One row = one shop appearing in one recommendation result
- Multiple shops can be shown per search → multiple rows per `recommendation_log_id`
- Used to calculate: total impressions, impressions per shop, daily impression trends

---

## Table 5 — `shop_clicks` (D5 ການຄລິກໂຄສະນາ)

Records each time a user clicks a contact link (Facebook, Line, etc.) on a shop card.
Written by process 2.5 when user clicks. Used by report 3.3.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique click ID |
| `shop_id` | INTEGER | NOT NULL, FK → shops(id) ON DELETE CASCADE | Which shop was clicked |
| `click_type` | TEXT | NOT NULL, CHECK IN ('facebook','instagram','line','google_maps','phone') | Which contact button was clicked |
| `recommendation_log_id` | INTEGER | nullable, no FK constraint | Which search session the click came from (optional reference, not enforced) |
| `clicked_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the click happened |

**Notes:**
- `click_type` tracks which channel users prefer (Facebook vs Line vs Phone etc.)
- Conversion rate = total clicks ÷ total impressions (platform-wide or per shop)
- `recommendation_log_id` is nullable — click can happen outside a specific search context

---

## Table 6 — `shop_inventory` (D6 ປະເພດສິນຄ້າຂອງຮ້ານ)

Stores which device categories each shop carries. Controls which shops appear in searches.
Managed by the shop owner in process 1.3.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique inventory ID |
| `shop_id` | INTEGER | NOT NULL, FK → shops(id) ON DELETE CASCADE | Which shop this category belongs to |
| `device_category` | TEXT | NOT NULL | Device type: Smartphone / Tablet / Laptop / Gaming PC |
| `created_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the category was added |

**Constraint:** `UNIQUE(shop_id, device_category)` — a shop cannot add the same category twice.

**Notes:**
- During recommendation search (process 2.2), the system queries verified shops WHERE `device_category` matches the user's searched device type
- Shops with NO inventory rows are included as a fallback (assumed to carry all categories)
- Shop owner can add/remove categories at any time from the Seller Portal

---

## Table 7 — `saved_products` (D7 ສິນຄ້າທີ່ບັນທຶກ)

Stores products a user explicitly saved to their wishlist after seeing a recommendation.
Written by process 2.5 when user clicks Save. Read/deleted by process 1.2.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | INTEGER | PRIMARY KEY AUTOINCREMENT | Unique saved item ID |
| `user_id` | INTEGER | NOT NULL, FK → users(id) ON DELETE CASCADE | Owner of this saved item |
| `product_name` | TEXT | NOT NULL | Product name string |
| `product_data` | TEXT | NOT NULL | Full product JSON (price, specs, pros, cons, image URL) |
| `saved_at` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When the user saved it |

**Constraint:** `UNIQUE(user_id, product_name)` — a user cannot save the same product name twice.

**Notes:**
- `product_data` is stored as a JSON string containing the full product object from the AI response
- If the user account is deleted → all saved products are deleted too (`ON DELETE CASCADE`)
- Displayed in the user's Search History page (3.5) alongside their past searches

---

## Table Relationships (Foreign Keys)

```
users (id)
  ├── shops.user_id              (1 user → 1 shop profile)
  ├── recommendation_logs.user_id (1 user → many searches)
  └── saved_products.user_id     (1 user → many saved items)

shops (id)
  ├── shop_impressions.shop_id   (1 shop → many impressions)
  ├── shop_clicks.shop_id        (1 shop → many clicks)
  └── shop_inventory.shop_id     (1 shop → many device categories)

recommendation_logs (id)
  ├── shop_impressions.recommendation_log_id  (1 search → many shop impressions)
  └── shop_clicks.recommendation_log_id       (1 search → many clicks)
```

---

## Which Process Writes / Reads Each Table

| Table | Written by | Read by |
|---|---|---|
| `users` | 1.1 (register/edit/delete) | 1.1, 1.4, 3.1 |
| `shops` | 1.4 (verify), 1.5 (profile) | 2.2, 3.1, 3.3 |
| `recommendation_logs` | 2.5 (after AI done) | 1.2 (user history), 3.2, 3.4, 3.5 |
| `shop_impressions` | 2.5 (auto on result shown) | 3.3 |
| `shop_clicks` | 2.5 (when user clicks contact) | 3.3 |
| `shop_inventory` | 1.3 (shop sets categories) | 2.2 (filter shops by device) |
| `saved_products` | 2.5 (user clicks Save) | 1.2, 3.5 |

---

## API Endpoints per Table

| Table | Endpoints |
|---|---|
| `users` | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/admin/users`, `PUT /api/admin/users/<id>`, `DELETE /api/admin/users/<id>` |
| `shops` | `GET/PUT /api/shop/profile`, `POST /api/shop/upload-image`, `GET /api/admin/shops`, `PUT /api/admin/shops/<id>/verify` |
| `recommendation_logs` | `POST /recommend`, `POST /recommend/stream`, `GET /api/user/history`, `DELETE /api/user/history/<id>`, `GET /api/admin/analytics` |
| `shop_impressions` | (written internally by `/recommend`) `GET /api/admin/analytics`, `GET /api/shop/analytics` |
| `shop_clicks` | `POST /api/shop/click`, `GET /api/shop/analytics` |
| `shop_inventory` | `GET /api/shop/inventory`, `POST /api/shop/inventory`, `DELETE /api/shop/inventory/<id>` |
| `saved_products` | `GET /api/user/saved`, `POST /api/user/saved`, `DELETE /api/user/saved/<id>` |

---

## Currency & Budget Notes

- `budget` in `recommendation_logs` is stored as a raw TEXT string with no currency label
- The frontend sends either a LAK number (e.g. `"15000000"`) or a USD number (e.g. `"500"`)
- Currency mode (LAK or USD) is determined by context at query time — not stored separately in the log
- Price conversion uses live exchange rates from `open.er-api.com` — **no markup is added**
- LAK display format: `₭15M`, `₭5,000,000` etc. (formatted in frontend)
