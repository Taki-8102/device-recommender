# analyticsys.md — ການວິເຄາະລະບົບ (System Analysis)

> ລະບົບ: **ລະບົບແຊັດບອດແນະນຳອຸປະກອນອີເລັກໂຕນິກທີ່ຂັບເຄື່ອນໂດຍປັນຍາປະດິດ**
> (AI-powered Electronic Device Recommendation Chatbot)
> Stack: React + Flask + SQLite + Gemini AI

---

## 1. List of Boundaries (ລາຍການຜູ້ກ່ຽວຂ້ອງພາຍນອກ)

| # | ຊື່ (ລາວ) | ຊື່ (English) | ໜ້າທີ່ຕົວຈິງໃນລະບົບ |
|---|---|---|---|
| B1 | ຜູ້ໃຊ້ງານ | User | ລ໊ອກອິນ, ສ້ອນ/ຕອບ Quiz ເພື່ອຄົ້ນຫາອຸປະກອນ, ດູຜົນ AI, ບັນທຶກສິນຄ້າ, ດູ/ລຶບ ປະຫວັດ |
| B2 | ເຈົ້າຂອງຮ້ານ | Shop Owner | ລ໊ອກອິນ, ກຳນົດໂປຣໄຟລ໌ຮ້ານ, ເລືອກປະເພດສິນຄ້າ, ດູ analytics ຂອງຮ້ານ |
| B3 | ຜູ້ດູແລລະບົບ | Admin | ລ໊ອກອິນ, ຈັດການບັນຊີຜູ້ໃຊ້, ຢືນຢັນ/ປະຕິເສດ ຮ້ານ, ດູລາຍງານລວມ |

---

## 2. List of Data Stores (ລາຍການບ່ອນເກັບຂໍ້ມູນ)

| # | ສັນຍາລັກ | ຊື່ (ລາວ) | ຕາຕະລາງ DB | ເກັບຫຍັງ |
|---|---|---|---|---|
| 1 | D1 | ຂໍ້ມູນຜູ້ໃຊ້ | `users` | id, username, password_hash, role (user/shop/admin), created_at |
| 2 | D2 | ຂໍ້ມູນຮ້ານຄ້າ | `shops` | ຊື່, ທີ່ຢູ່, ເມືອງ, ເບີໂທ, Google Maps, social links, logo, is_verified |
| 3 | D3 | ບັນທຶກການແນະນຳ | `recommendation_logs` | device, budget, purpose, brand, city, raw_query, ຜົນ AI, response_json |
| 4 | D4 | ການເບິ່ງເຫັນໂຄສະນາ | `shop_impressions` | shop_id, recommendation_log_id — ບັນທຶກທຸກຄັ້ງທີ່ຮ້ານຖືກສະແດງ |
| 5 | D5 | ການຄລິກໂຄສະນາ | `shop_clicks` | shop_id, click_type (facebook/line/instagram/google_maps/phone) |
| 6 | D6 | ປະເພດສິນຄ້າຂອງຮ້ານ | `shop_inventory` | shop_id, device_category — ຄວບຄຸມຮ້ານໃດຂຶ້ນໃນການຄົ້ນຫາໃດ |
| 7 | D7 | ສິນຄ້າທີ່ບັນທຶກ | `saved_products` | user_id, product_name, product_data (JSON: ລາຄາ, spec, ຮູບ) |

---

## 3. List of Processes (ລາຍການໂປຣເຊດ)

### 1.0 ຈັດການຂໍ້ມູນ — Data Management
| ໂປຣເຊດ | ຊື່ (ລາວ) | ຊື່ (English) | ຜູ້ໃຊ້ |
|---|---|---|---|
| 1.1 | ຈັດການຂໍ້ມູນຜູ້ໃຊ້ | Manage User Data | User, Admin |
| 1.2 | ຈັດການຂໍ້ມູນການແນະນຳ | Manage Recommendation Data | User |
| 1.3 | ຈັດການຂໍ້ມູນປະເພດສິນຄ້າ | Manage Product Category Data | Shop |
| 1.4 | ຈັດການຂໍ້ມູນກຳນົດສິດ | Manage Access Rights Data | Admin |
| 1.5 | ຈັດການຂໍ້ມູນຮ້ານຄ້າ | Manage Shop Data | Shop |

### 2.0 ປະມວນຜົນ — Processing (AI Engine)
| ໂປຣເຊດ | ຊື່ (ລາວ) | ຊື່ (English) |
|---|---|---|
| 2.1 | ຮັບ ແລະ ວິເຄາະຄຳຖາມ | Receive & Analyze Query |
| 2.2 | ດຶງຂໍ້ມູນຮ້ານທີ່ກ່ຽວຂ້ອງ | Fetch Verified Shops |
| 2.3 | ເອີ້ນໃຊ້ Gemini AI | Call Gemini AI |
| 2.4 | ກວດສອບລາຄາ ແລະ ຮູບສິນຄ້າ | Verify Price & Product Image |
| 2.5 | ສົ່ງຜົນ ແລະ ບັນທຶກ | Return Result & Log |

### 3.0 ລາຍງານ — Reports
| ໂປຣເຊດ | ຊື່ (ລາວ) | ຊື່ (English) | ຜູ້ຮັບ |
|---|---|---|---|
| 3.1 | ລາຍງານຂໍ້ມູນຜູ້ໃຊ້ | User Data Report | Admin |
| 3.2 | ລາຍງານຂໍ້ມູນສິນຄ້າ | Product / Device Report | Admin |
| 3.3 | ລາຍງານຂໍ້ມູນການໂຄສະນາ | Shop Ad Performance Report | Admin, Shop |
| 3.4 | ລາຍງານຂໍ້ມູນງົບລາຄາ | Budget Range Report | Admin |
| 3.5 | ລາຍງານປະຫວັດການຄົ້ນຫາ | Search History Report | User |

---

## 4. Process Hierarchy Chart (ຕາຕະລາງຊັ້ນໂປຣເຊດ)

```
                  ┌──────────────────────────────────────────────────┐
                  │   ລະບົບແຊັດບອດແນະນຳອຸປະກອນອີເລັກໂຕນິກ (0)       │
                  └────────────┬──────────────┬──────────────────────┘
                               │              │              │
               ┌───────────────┘   ┌──────────┘    ┌─────────┘
               ▼                   ▼               ▼
    ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
    │  1.0 ຈັດການ      │ │  2.0 ປະມວນຜົນ    │ │  3.0 ລາຍງານ     │
    │  ຂໍ້ມູນ          │ │  (AI Engine)     │ │                  │
    └────────┬─────────┘ └────────┬─────────┘ └────────┬─────────┘
             │                   │                     │
    ┌────────┴──────────┐ ┌──────┴──────────┐ ┌───────┴──────────┐
    │ 1.1 ຈັດການຂໍ້ມູນ │ │ 2.1 ຮັບ ແລະ     │ │ 3.1 ລາຍງານ      │
    │     ຜູ້ໃຊ້       │ │ ວິເຄາະຄຳຖາມ    │ │     ຂໍ້ມູນຜູ້ໃຊ້ │
    ├───────────────────┤ ├─────────────────┤ ├──────────────────┤
    │ 1.2 ຈັດການຂໍ້ມູນ │ │ 2.2 ດຶງຂໍ້ມູນ   │ │ 3.2 ລາຍງານ      │
    │     ການແນະນຳ     │ │ ຮ້ານທີ່ກ່ຽວຂ້ອງ │ │     ຂໍ້ມູນສິນຄ້າ │
    ├───────────────────┤ ├─────────────────┤ ├──────────────────┤
    │ 1.3 ຈັດການຂໍ້ມູນ │ │ 2.3 ເອີ້ນໃຊ້   │ │ 3.3 ລາຍງານ      │
    │     ປະເພດສິນຄ້າ  │ │     Gemini AI   │ │     ໂຄສະນາ       │
    ├───────────────────┤ ├─────────────────┤ ├──────────────────┤
    │ 1.4 ຈັດການຂໍ້ມູນ │ │ 2.4 ກວດສອບລາຄາ │ │ 3.4 ລາຍງານ      │
    │     ກຳນົດສິດ     │ │     ແລະ ຮູບ     │ │     ງົບລາຄາ      │
    ├───────────────────┤ ├─────────────────┤ ├──────────────────┤
    │ 1.5 ຈັດການຂໍ້ມູນ │ │ 2.5 ສົ່ງຜົນ     │ │ 3.5 ລາຍງານ      │
    │     ຮ້ານຄ້າ      │ │     ແລະ ບັນທຶກ  │ │     ປະຫວັດຄົ້ນຫາ │
    └───────────────────┘ └─────────────────┘ └──────────────────┘
```

---

## 5. Context Diagram — DFD Level 0

> ລະດັບນີ້ສະແດງ ລະບົບທັງໝົດເປັນ **1 ໂປຣເຊດ** ກາງ ລ້ອມຮອບດ້ວຍ 3 External Entity.
> ບໍ່ມີ Data Store ໃນລະດັບນີ້.

```
┌──────────────────┐                                    ┌──────────────────┐
│                  │──── ລົງທະບຽນ / ເຂົ້າສູ່ລະບົບ ────►│                  │
│  ຜູ້ໃຊ້ງານ       │──── ເງື່ອນໄຂການຄົ້ນຫາ ────────────►│                  │
│  (User)          │◄─── ຜົນການແນະນຳ 3 ລາຍການ ─────────│    0             │
│                  │◄─── ລາຍງານປະຫວັດການຄົ້ນຫາ ─────────│                  │
└──────────────────┘                                    │  ລະບົບແຊັດບອດ   │
                                                        │  ແນະນຳອຸປະກອນ  │
┌──────────────────┐                                    │  ອີເລັກໂຕນິກ    │
│                  │──── ຂໍ້ມູນໂປຣໄຟລ໌ຮ້ານ ────────────►│                  │
│  ເຈົ້າຂອງຮ້ານ    │──── ປະເພດສິນຄ້າທີ່ຂາຍ ─────────────►│                  │
│  (Shop Owner)    │◄─── ລາຍງານໂຄສະນາ + ໂອກາດທີ່ພາດ ───│                  │
│                  │                                    │                  │
└──────────────────┘                                    │                  │
                                                        │                  │
┌──────────────────┐                                    │                  │
│                  │──── ຈັດການຂໍ້ມູນຜູ້ໃຊ້ ────────────►│                  │
│  ຜູ້ດູແລລະບົບ    │──── ກຳນົດສິດ / ຢືນຢັນຮ້ານ ─────────►│                  │
│  (Admin)         │◄─── ລາຍງານລວມ (ຜູ້ໃຊ້/ສິນຄ້າ/ງົບ) ─│                  │
│                  │                                    └──────────────────┘
└──────────────────┘
```

### ຕາຕະລາງກະແສຂໍ້ມູນ Context Diagram

| ທິດທາງ | ຂໍ້ມູນ | ຄຳອະທິບາຍ |
|---|---|---|
| User → ລະບົບ | ຂໍ້ມູນລົງທະບຽນ/ລ໊ອກອິນ | username, password |
| User → ລະບົບ | ເງື່ອນໄຂການຄົ້ນຫາ | device, budget, purpose, brand, city, language, currency |
| ລະບົບ → User | ຜົນການແນະນຳ | 3 ສິນຄ້າ + ຮ້ານທີ່ຂາຍ + ລາຄາ + spec + ຮູບ |
| ລະບົບ → User | ລາຍງານປະຫວັດ | ປະຫວັດຄົ້ນຫາ + wishlist |
| Shop → ລະບົບ | ຂໍ້ມູນຮ້ານ | ຊື່, ທີ່ຢູ່, ເມືອງ, ເບີໂທ, social links, logo |
| Shop → ລະບົບ | ປະເພດສິນຄ້າ | Smartphone / Tablet / Laptop / Gaming PC |
| ລະບົບ → Shop | ລາຍງານໂຄສະນາ | impressions, clicks, conversion, daily chart |
| Admin → ລະບົບ | ຈັດການຜູ້ໃຊ້ | ດູ/ແກ້ໄຂ/ລຶບ ບັນຊີ |
| Admin → ລະບົບ | ກຳນົດສິດ | ຢືນຢັນ/ປະຕິເສດ ຮ້ານ (is_verified) |
| ລະບົບ → Admin | ລາຍງານລວມ | ຜູ້ໃຊ້, ສິນຄ້า, ໂຄສະນາ, ງົບລາຄາ |

---

## 6. Data Flow Diagram Level-1

> ແຕກໂປຣເຊດ 0 ອອກເປັນ **3 ໂປຣເຊດຫຼັກ** + ເຊື່ອມຕໍ່ Data Store D1–D7.

```
[User] ──────────────────────────────────────────────────────────────────►
        ລົງທະບຽນ/ແກ້ໄຂ                                                   │
                                                                          ▼
                                                              ┌─────────────────┐
[User] ─── ປະຫວັດ/wishlist ──────────────────────────────►   │   1.0           │
[Shop] ─── ຂໍ້ມູນຮ້ານ ─────────────────────────────────►    │   ຈັດການ        │   ⇄ =D1 users=
[Shop] ─── ປະເພດສິນຄ້າ ──────────────────────────────►     │   ຂໍ້ມູນ         │   ⇄ =D2 shops=
[Admin] ── ຈັດການຜູ້ໃຊ້ ──────────────────────────────►     │                  │   ⇄ =D3 rec_logs=
[Admin] ── ກຳນົດສິດ ───────────────────────────────────►    │                  │   ⇄ =D6 inventory=
                                                              └─────────────────┘   ⇄ =D7 saved=


[User] ─── ເງື່ອນໄຂຄົ້ນຫາ ────────────────────────────►   ┌─────────────────┐
                                                              │   2.0           │   ◄ =D2 shops=
                                                              │   ປະມວນຜົນ      │   ◄ =D6 inventory=
[User] ◄── ຜົນການແນະນຳ ──────────────────────────────────   │   (AI Engine)   │   ──► =D3 rec_logs=
                                                              │                  │   ──► =D4 impressions=
[User] ─── ຄລິກຮ້ານ / ບັນທຶກສິນຄ້າ ────────────────────►   │                  │   ──► =D5 clicks=
                                                              └─────────────────┘   ──► =D7 saved=


                                                              ┌─────────────────┐
                                                              │   3.0           │   ◄ =D1 users=
[Admin] ◄── ລາຍງານລວມ ───────────────────────────────────   │   ລາຍງານ         │   ◄ =D2 shops=
[Shop]  ◄── ລາຍງານຮ້ານ ───────────────────────────────────  │                  │   ◄ =D3 rec_logs=
[User]  ◄── ລາຍງານປະຫວັດ ─────────────────────────────────  │                  │   ◄ =D4 impressions=
                                                              └─────────────────┘   ◄ =D5 clicks=
                                                                                    ◄ =D7 saved=
```

### ຕາຕະລາງ: ໂປຣເຊດ ↔ Data Store (Level-1)

| ໂປຣເຊດ | ອ່ານຈາກ | ຂຽນໃສ່ |
|---|---|---|
| 1.0 ຈັດການຂໍ້ມູນ | D1, D2, D3, D6, D7 | D1, D2, D6, D7 *(ລຶບ D3 ສ່ວນຜູ້ໃຊ້)* |
| 2.0 ປະມວນຜົນ | D2, D6 | D3, D4, D5, D7 |
| 3.0 ລາຍງານ | D1, D2, D3, D4, D5, D7 | *(ບໍ່ຂຽນ — ອ່ານຢ່າງດຽວ)* |

---

## 7. Data Flow Diagram Level-2 — Process 1.0 ຈັດການຂໍ້ມູນ

### ຕາຕະລາງ Boundary ↔ Process

| ໂປຣເຊດ | Admin | Shop | User |
|---|---|---|---|
| 1.1 ຈັດການຂໍ້ມູນຜູ້ໃຊ້ | ✅ | | ✅ |
| 1.2 ຈັດການຂໍ້ມູນການແນະນຳ | | | ✅ |
| 1.3 ຈັດການຂໍ້ມູນປະເພດສິນຄ້າ | | ✅ | |
| 1.4 ຈັດການຂໍ້ມູນກຳນົດສິດ | ✅ | | |
| 1.5 ຈັດການຂໍ້ມູນຮ້ານຄ້າ | | ✅ | |

### ຕາຕະລາງ Process 1.0 ↔ Data Store

| ໂປຣເຊດ | Data Store | ການດຳເນີນງານ |
|---|---|---|
| 1.1 ຈັດການຂໍ້ມູນຜູ້ໃຊ້ | D1 `users` | User: ລົງທະບຽນ/ແກ້ໄຂ profile; Admin: ດູ/ແກ້ໄຂ/ລຶບ ບັນຊີ |
| 1.2 ຈັດການຂໍ້ມູນການແນະນຳ | D3 `recommendation_logs` | User: ອ່ານ/ລຶບ ປະຫວັດຄົ້ນຫາ |
| 1.2 ຈັດການຂໍ້ມູນການແນະນຳ | D7 `saved_products` | User: ອ່ານ/ເພີ່ມ/ລຶບ ສິນຄ້าໃນ wishlist |
| 1.3 ຈັດການຂໍ້ມູນປະເພດສິນຄ້າ | D6 `shop_inventory` | Shop: ເພີ່ມ/ລຶບ ປະເພດອຸປະກອນ |
| 1.4 ຈັດການຂໍ້ມູນກຳນົດສິດ | D2 `shops` | Admin: ອັບເດດ is_verified |
| 1.4 ຈັດການຂໍ້ມູນກຳນົດສິດ | D1 `users` | Admin: ກວດສອບ role ກ່ອນຢືນຢັນ |
| 1.5 ຈັດການຂໍ້ມູນຮ້ານຄ້າ | D2 `shops` | Shop: ບັນທຶກ/ແກ້ໄຂ ຂໍ້ມູນໂປຣໄຟລ໌ |

### ກະແສຂໍ້ມູນ Level-2 Process 1.0

```
                         ┌─────────────────────┐
[User] ─── ລົງທະບຽນ ───►│ 1.1 ຈັດການ          │
[Admin] ── ຈັດການຜູ້ໃຊ້►│     ຂໍ້ມູນຜູ້ໃຊ້    │◄──► =D1 users=
                         └─────────────────────┘

                         ┌─────────────────────┐
[User] ─── ດູ/ລຶບ ──────►│ 1.2 ຈັດການຂໍ້ມູນ   │◄──► =D3 recommendation_logs=
           ປະຫວັດ        │     ການແນະນຳ        │◄──► =D7 saved_products=
                         └─────────────────────┘
           ໝາຍເຫດ: D3 ຖືກສ້າງໂດຍ 2.5; 1.2 ອ່ານ/ລຶບ ສ່ວນຂອງ User ເທົ່ານັ້ນ

                         ┌─────────────────────┐
[Shop] ─── ເລືອກ ────────►│ 1.3 ຈັດການຂໍ້ມູນ   │◄──► =D6 shop_inventory=
           ປະເພດສິນຄ້າ   │     ປະເພດສິນຄ້າ    │
                         └─────────────────────┘

                         ┌─────────────────────┐
[Admin] ── ຢືນຢັນ ────────►│ 1.4 ຈັດການຂໍ້ມູນ  │──►  =D2 shops= (ອັບເດດ is_verified)
           / ປະຕິເສດ     │     ກຳນົດສິດ        │◄──  =D1 users= (ກວດ role)
                         └─────────────────────┘

                         ┌─────────────────────┐
[Shop] ─── ໂປຣໄຟລ໌ ──────►│ 1.5 ຈັດການຂໍ້ມູນ   │◄──► =D2 shops=
           ຮ້ານ + logo   │     ຮ້ານຄ້າ         │
                         └─────────────────────┘
```

### API Endpoints — Process 1.0

| ໂປຣເຊດ | Method | Endpoint |
|---|---|---|
| 1.1 | POST | `/api/auth/register`, `/api/auth/login` |
| 1.1 | GET / PUT / DELETE | `/api/admin/users`, `/api/admin/users/<id>` |
| 1.2 | GET / DELETE | `/api/user/history`, `/api/user/history/<id>` |
| 1.2 | GET / POST / DELETE | `/api/user/saved`, `/api/user/saved/<id>` |
| 1.3 | GET / POST / DELETE | `/api/shop/inventory`, `/api/shop/inventory/<id>` |
| 1.4 | GET | `/api/admin/shops` |
| 1.4 | PUT | `/api/admin/shops/<id>/verify` |
| 1.5 | GET / PUT | `/api/shop/profile` |
| 1.5 | POST | `/api/shop/upload-image` |

---

## 8. Data Flow Diagram Level-2 — Process 2.0 ປະມວນຜົນ

> Process 2.0 ເຮັດວຽກເປັນ **Pipeline ລຳດັບ 5 ຂັ້ນ**: 2.1 → 2.2 → 2.3 → 2.4 → 2.5
> ຂໍ້ມູນໄຫຼ ຈາກ User ເຂົ້າ → ຜ່ານ AI → ກັບຄືນ User + ບັນທຶກ DB

### ກະແສຂໍ້ມູນ Pipeline (ຕົວຈິງ)

```
[User]
  │  device, budget, purpose, brand, city, language, currency
  ▼
┌────────────────────────────────────┐
│ 2.1 ຮັບ ແລະ ວິເຄາະຄຳຖາມ           │
│ Receive & Analyze Query            │
│ (validate + structure input)       │
└────────────────────┬───────────────┘
                     │  structured query (intent + entities)
                     ▼
┌────────────────────────────────────┐
│ 2.2 ດຶງຂໍ້ມູນຮ້ານທີ່ກ່ຽວຂ້ອງ       │◄─── =D2 shops= (is_verified=1, city match)
│ Fetch Verified Shops               │◄─── =D6 shop_inventory= (device_category match)
│ (fallback: shops with no inventory)│
└────────────────────┬───────────────┘
                     │  user query + shop list (prompt ready)
                     ▼
┌────────────────────────────────────┐
│ 2.3 ເອີ້ນໃຊ້ Gemini AI             │◄──► [Gemini API] (gemini-2.5-flash / 2.0-flash fallback)
│ Call Gemini AI                     │     11 key pool, retry on 429/503
│ (Google Search Grounding enabled)  │     returns 3 products as JSON
└────────────────────┬───────────────┘
                     │  3 product recommendations (name, price, specs)
                     ▼
┌────────────────────────────────────┐
│ 2.4 ກວດສອບລາຄາ ແລະ ຮູບສິນຄ້າ      │◄──► [Google CSE] (2 key+CX pairs, rotating)
│ Verify Price & Product Image       │◄──► [open.er-api.com] (live USD/LAK, THB/LAK rates)
│ - Price check: accept ±35%         │
│ - Price inversion guard            │
│ - Suppress upgrade if >140% budget │
│ - Image search per product         │
└────────────────────┬───────────────┘
                     │  final products (verified price + image URL)
                     ▼
┌────────────────────────────────────┐
│ 2.5 ສົ່ງຜົນ ແລະ ບັນທຶກ             │──────────────────────────────────────►  [User]
│ Return Result & Log                │  (real-time via SSE streaming)          ຜົນການແນະນຳ
│ - Stream to user (SSE)            │
│ - Cache result 30 min             │────────────────────────► =D3 recommendation_logs=
│ - Log impression per shop shown   │────────────────────────► =D4 shop_impressions=
│ - Log click when user contacts    │◄── [User] ຄລິກຕິດຕໍ່ ─► =D5 shop_clicks=
│ - Save product when user saves    │◄── [User] ບັນທຶກ ──────► =D7 saved_products=
└────────────────────────────────────┘
```

### ສະຫຼຸບ Data Store ຂອງ Process 2.0

| Data Store | ການດຳເນີນງານ | ໂປຣເຊດຍ່ອຍ |
|---|---|---|
| D2 `shops` | **ອ່ານ** — ດຶງຮ້ານທີ່ verify ໃນເມືອງຜູ້ໃຊ້ | 2.2 |
| D6 `shop_inventory` | **ອ່ານ** — filter ຮ້ານຕາມ device category | 2.2 |
| D3 `recommendation_logs` | **ຂຽນ** — ບັນທຶກຜົນ AI ຫຼັງສຳເລັດ | 2.5 |
| D4 `shop_impressions` | **ຂຽນ** — ອັດຕະໂນມັດ ທຸກຮ້ານທີ່ສະແດງ | 2.5 |
| D5 `shop_clicks` | **ຂຽນ** — ເມື່ອ User ຄລິກ contact ຮ້ານ | 2.5 |
| D7 `saved_products` | **ຂຽນ** — ເມື່ອ User ກົດ Save ສິນຄ້າ | 2.5 |

### API Endpoints — Process 2.0

| ໂປຣເຊດ | Method | Endpoint | ໝາຍເຫດ |
|---|---|---|---|
| 2.1–2.5 | POST | `/recommend/stream` | Real-time SSE streaming |
| 2.1–2.5 | POST | `/recommend` | ຕອບ JSON ທຳມະດາ |
| 2.5 (click) | POST | `/api/shop/click` | ບັນທຶກ D5 |

---

## 9. Data Flow Diagram Level-2 — Process 3.0 ລາຍງານ

> Process 3.0 **ອ່ານຂໍ້ມູນ** ຈາກ D1–D5, D7 ເທົ່ານັ້ນ — ບໍ່ຂຽນ/ແກ້ໄຂ ຂໍ້ມູນໃດ.

### ຕາຕະລາງ Boundary ↔ Process 3.0

| ໂປຣເຊດ | Admin | Shop | User |
|---|---|---|---|
| 3.1 ລາຍງານຂໍ້ມູນຜູ້ໃຊ້ | ✅ | | |
| 3.2 ລາຍງານຂໍ້ມູນສິນຄ້າ | ✅ | | |
| 3.3 ລາຍງານຂໍ້ມູນການໂຄສະນາ | ✅ | ✅ | |
| 3.4 ລາຍງານຂໍ້ມູນງົບລາຄາ | ✅ | | |
| 3.5 ລາຍງານປະຫວັດການຄົ້ນຫາ | | | ✅ |

### ກະແສຂໍ້ມູນ Level-2 Process 3.0

```
=D1 users= ──────────────────────►┌────────────────────────┐
=D2 shops= ──────────────────────►│ 3.1 ລາຍງານຂໍ້ມູນຜູ້ໃຊ້ │────► [Admin]
                                  └────────────────────────┘      ຈຳນວນ user/shop, ລາຍຊື່

=D3 recommendation_logs= ────────►┌────────────────────────┐
                                  │ 3.2 ລາຍງານຂໍ້ມູນສິນຄ້າ │────► [Admin]
                                  └────────────────────────┘      Top 5 ສິນຄ້າ, Top device, ຕາມເມືອງ

=D4 shop_impressions= ───────────►┌────────────────────────┐
=D5 shop_clicks= ────────────────►│ 3.3 ລາຍງານໂຄສະນາ       │────► [Admin]  (ລວມທຸກຮ້ານ)
=D2 shops= ──────────────────────►│                        │────► [Shop]   (ສະເພາະຮ້ານຕົນ)
=D6 shop_inventory= ─────────────►│                        │
                                  └────────────────────────┘

=D3 recommendation_logs= ────────►┌────────────────────────┐
                                  │ 3.4 ລາຍງານງົບລາຄາ       │────► [Admin]
                                  └────────────────────────┘      ງົບ min/avg/max, buckets LAK+USD, 7d trend

=D3 recommendation_logs= ────────►┌────────────────────────┐
=D7 saved_products= ─────────────►│ 3.5 ລາຍງານ             │────► [User]
                                  │     ປະຫວັດການຄົ້ນຫາ    │      ປະຫວັດ + wishlist (ລຶບໄດ້)
                                  └────────────────────────┘
```

### ສິ່ງທີ່ລາຍງານແຕ່ລະອັນສະແດງ

**3.1 ລາຍງານຂໍ້ມູນຜູ້ໃຊ້** (Admin):
- ຈຳນວນຜູ້ໃຊ້ລົງທະບຽນທັງໝົດ
- ຈຳນວນຮ້ານ (ຢືນຢັນ vs ລໍຖ້າ)
- ລາຍຊື່ບັນຊີທັງໝົດ (username, role, created_at)

**3.2 ລາຍງານຂໍ້ມູນສິນຄ້າ** (Admin):
- Top 5 ສິນຄ້າທີ່ AI ແນະນຳຫຼາຍສຸດ
- Top 5 ປະເພດອຸປະກອນທີ່ຄົ້ນຫາຫຼາຍ
- ແຜນທີ່ຄວາມຕ້ອງການຕາມເມືອງ

**3.3 ລາຍງານຂໍ້ມູນໂຄສະນາ** (Admin + Shop):
- Admin: impressions ລວມ, clicks ລວມ, conversion rate, Top 5 ຮ້ານ
- Shop: impressions/clicks ຂອງຮ້ານ, click แยก (FB/Line/IG/Maps/Phone), daily 14d chart, ໂອກາດທີ່ພາດ

**3.4 ລາຍງານຂໍ້ມູນງົບລາຄາ** (Admin):
- ງົບຕ່ຳ/ສະເລ່ຍ/ສູງ (LAK ແລະ USD ແຍກ)
- Distribution buckets: LAK `<₭5M / ₭5M–₭10M / ₭10M–₭20M / ₭20M+`; USD `<$300 / $300–$600 / $600+`
- ແນວໂນ້ມ 7 ມື້ (bar chart)

**3.5 ລາຍງານປະຫວັດການຄົ້ນຫາ** (User):
- ລາຍການຄົ້ນຫາທີ່ຜ່ານມາ (device, budget, city, date) — ລຶບໄດ້
- Wishlist ສິນຄ້າທີ່ບັນທຶກ (ຊື່, ລາຄາ, spec, ຮູບ) — ລຶບໄດ້

### API Endpoints — Process 3.0

| ໂປຣເຊດ | Method | Endpoint | ຜູ້ໃຊ້ |
|---|---|---|---|
| 3.1, 3.2, 3.3(admin), 3.4 | GET | `/api/admin/analytics` | Admin |
| 3.4 (trend) | GET | `/api/admin/trends` | Admin |
| 3.3 (shop) | GET | `/api/shop/analytics` | Shop |
| 3.3 (missed) | GET | `/api/shop/missed-opportunities` | Shop |
| 3.5 | GET | `/api/user/history` | User |
| 3.5 | GET | `/api/user/saved` | User |

---

## 10. ສະຫຼຸບລວມ — ແຜນ Data Flow ທັງໝົດ

| Data Store | ຖືກສ້າງ/ຂຽນໂດຍ | ຖືກອ່ານໂດຍ | ຖືກລຶບໂດຍ |
|---|---|---|---|
| D1 `users` | 1.1 (register) | 1.1, 1.4, 3.1 | 1.1 (admin) |
| D2 `shops` | 1.4 (verify), 1.5 (profile) | 2.2, 3.1, 3.3 | 1.4 (admin) |
| D3 `recommendation_logs` | **2.5** (after AI done) | 1.2, 3.2, 3.4, 3.5 | 1.2 (user) |
| D4 `shop_impressions` | **2.5** (auto per result) | 3.3 | — |
| D5 `shop_clicks` | **2.5** (on contact click) | 3.3 | — |
| D6 `shop_inventory` | 1.3 (shop sets) | 2.2 | 1.3 (shop) |
| D7 `saved_products` | **2.5** (on user save) | 1.2, 3.5 | 1.2 (user) |

> **ສຳຄັນ:** D3, D4, D5, D7 ຖືກສ້າງໂດຍ **Process 2.5 ອັດຕະໂນມັດ** ຫຼັງ AI ຕອບສຳເລັດ.
> ຜູ້ໃຊ້ / Admin ບໍ່ສາມາດ **ສ້າງ** ຂໍ້ມູນ D3 ຜ່ານ 1.0 ໄດ້ — ເຂົາເຈົ້າ **ອ່ານ/ລຶບ** ສ່ວນຂອງຕົນເທົ່ານັ້ນ.
