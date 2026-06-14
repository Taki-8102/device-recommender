# usecas.md — Use Case Diagram Explanation

> ລະບົບ: ລະບົບແຊັດບອດແນະນຳອຸປະກອນອີເລັກໂຕນິກທີ່ຂັບເຄື່ອນໂດຍປັນຍາປະດິດ
> (AI-powered Electronic Device Recommendation Chatbot)
> ອ້າງອີງຮູບ: ຮູບທີ 3.x ບຸກຄະລາກອນທີ່ກ່ຽວຂ້ອງກັບລະບົບ (Use Case Diagram)

---

## 1. ຜູ້ກ່ຽວຂ້ອງ (Actors)

ລະບົບມີຜູ້ກ່ຽວຂ້ອງທັງໝົດ 3 ພາກສ່ວນ:

| # | Actor (ລາວ) | Actor (English) | ໜ້າທີ່ |
|---|---|---|---|
| 1 | ຜູ້ໃຊ້ງານ | User | ຜູ້ໃຊ້ທົ່ວໄປທີ່ຄົ້ນຫາການແນະນຳອຸປະກອນ |
| 2 | ເຈົ້າຂອງຮ້ານ | Shop Owner | ເຈົ້າຂອງຮ້ານທີ່ຈັດການໂປຣໄຟລ໌ ແລະ ເບິ່ງສະຖິຕິ |
| 3 | ຜູ້ດູແລລະບົບ | Admin | ຜູ້ຄຸ້ມຄອງລະບົບທັງໝົດ ຢືນຢັນຮ້ານ ແລະ ຈັດການບັນຊີ |

---

## 2. ລາຍການ Use Case ທັງໝົດ (8 Use Cases)

| # | Use Case (ລາວ) | Use Case (English) | Actor ທີ່ໃຊ້ |
|---|---|---|---|
| UC1 | ລ໊ອກອິນ | Login | ຜູ້ໃຊ້, ເຈົ້າຂອງຮ້ານ, Admin |
| UC2 | ຄົ້ນຫາ | Search for Device Recommendations | ຜູ້ໃຊ້ |
| UC3 | ດູລາຍການ | View List / Browse Results | ຜູ້ໃຊ້ |
| UC4 | ເພີ່ມ, ລຶບ, ແກ້ໄຂ | Add / Delete / Edit Data | Admin |
| UC5 | ບັນທຶກເຂົ້າ-ອອກ | Save Records | ຜູ້ໃຊ້ |
| UC6 | ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ | Edit Personal Information / Profile | ຜູ້ໃຊ້, ເຈົ້າຂອງຮ້ານ |
| UC7 | ເຫັນໂອກາດສານລາໄຍ | View Missed Opportunities | ເຈົ້າຂອງຮ້ານ |
| UC8 | ລາຍງານ | View Reports | Admin, ເຈົ້າຂອງຮ້ານ |

---

## 3. ຄວາມສຳພັນລະຫວ່າງ Use Case (UML Relationships)

### `<<include>>` — ການລວມ (ຕ້ອງເຮັດສະເໝີ)

> A `<<include>>` B ໝາຍຄວາມວ່າ: ທຸກຄັ້ງທີ່ A ຖືກໃຊ້ງານ, B ຈະຖືກເຮັດໂດຍອັດຕະໂນມັດ (B ເປັນເງື່ອນໄຂຈຳເປັນ).

| Use Case (A) | ລວມ (<<include>>) | Use Case (B) | ເຫດຜົນ |
|---|---|---|---|
| UC2 ຄົ້ນຫາ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ກ່ອນຈຶ່ງຄົ້ນຫາໄດ້ |
| UC3 ດູລາຍການ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ກ່ອນຈຶ່ງດູລາຍການໄດ້ |
| UC4 ເພີ່ມ,ລຶບ,ແກ້ໄຂ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ດ້ວຍ role `admin` |
| UC5 ບັນທຶກເຂົ້າ-ອອກ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ກ່ອນຈຶ່ງບັນທຶກໄດ້ |
| UC6 ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ກ່ອນຈຶ່ງແກ້ໄຂໄດ້ |
| UC7 ເຫັນໂອກາດສານລາໄຍ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ດ້ວຍ role `shop` |
| UC8 ລາຍງານ | `<<include>>` | UC1 ລ໊ອກອິນ | ຕ້ອງ Login ດ້ວຍ role `admin` ຫຼື `shop` |

### `<<extend>>` — ການຕໍ່ (ທາງເລືອກ)

> A `<<extend>>` B ໝາຍຄວາມວ່າ: A ເປັນພຶດຕິກຳທາງເລືອກ ທີ່ອາດຈະເກີດຂຶ້ນ ຫຼື ບໍ່ກໍ ໄດ້ ໃນຂະນະທີ່ B ດຳເນີນຢູ່.

| Use Case (A) | ຕໍ່ (<<extend>>) | Use Case (B) | ເຫດຜົນ |
|---|---|---|---|
| UC5 ບັນທຶກເຂົ້າ-ອອກ | `<<extend>>` | UC3 ດູລາຍການ | ຜູ້ໃຊ້ **ອາດ** ກົດ "ບັນທຶກ" ສິນຄ້າ ຫຼັງຈາກດູຜົນ — ບໍ່ຈຳເປັນຕ້ອງ |
| UC7 ເຫັນໂອກາດສານລາໄຍ | `<<extend>>` | UC8 ລາຍງານ | ເຈົ້າຂອງຮ້ານ **ອາດ** ດູໂອກາດທີ່ພາດ ເປັນຂໍ້ມູນຕໍ່ຈາກລາຍງານ |

---

## 4. ຕາຕະລາງ Actor ↔ Use Case

| Use Case | ຜູ້ໃຊ້ (User) | ເຈົ້າຂອງຮ້ານ (Shop) | Admin |
|---|---|---|---|
| UC1 ລ໊ອກອິນ | ✅ | ✅ | ✅ |
| UC2 ຄົ້ນຫາ | ✅ | | |
| UC3 ດູລາຍການ | ✅ | | |
| UC4 ເພີ່ມ,ລຶບ,ແກ້ໄຂ | | | ✅ |
| UC5 ບັນທຶກເຂົ້າ-ອອກ | ✅ | | ✅ |
| UC6 ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ | ✅ | ✅ | |
| UC7 ເຫັນໂອກາດສານລາໄຍ | | ✅ | |
| UC8 ລາຍງານ | | ✅ | ✅ |

---

## 5. ອະທິບາຍ Use Case ແຕ່ລະອັນ

---

### UC1 — ລ໊ອກອິນ (Login)

- **Actors:** ຜູ້ໃຊ້, ເຈົ້າຂອງຮ້ານ, Admin (ທຸກຄົນ)
- **ຄຳອະທິບາຍ:** ຜູ້ໃຊ້ທຸກລະດັບຕ້ອງລ໊ອກອິນດ້ວຍ username + password ກ່ອນຈຶ່ງເຂົ້າໃຊ້ລະບົບໄດ້. ລະບົບກວດສອບ role (`user` / `shop` / `admin`) ຈາກ `users` table ແລ້ວອອກ JWT Token (ໃຊ້ໄດ້ 7 ມື້).
- **Endpoint:** `POST /api/auth/login`
- **Pre-condition:** ມີບັນຊີຢູ່ໃນລະບົບແລ້ວ
- **Post-condition:** ໄດ້ JWT Token, ຖືກສົ່ງໄປໜ້າທີ່ກົງກັບ role ຂອງຕົນ

---

### UC2 — ຄົ້ນຫາ (Search for Device Recommendations)

- **Actor:** ຜູ້ໃຊ້
- **ຄຳອະທິບາຍ:** ຜູ້ໃຊ້ສ້ອນ/ພິມ ຄຳຖາມໃນຊ່ອງ chat ຫຼື ຕອບ Quiz ເພື່ອລະບຸ: ປະເພດອຸປະກອນ, ງົບປະມານ (LAK/USD), ຈຸດປະສົງ, ຍີ່ຫໍ້ທີ່ຕ້ອງການ, ເມືອງ, ພາສາ. ລະບົບສົ່ງຂໍ້ມູນໄປໃຫ້ Gemini AI ແລ້ວສົ່ງຜົນການແນະນຳ 3 ລາຍການກັບຄືນ.
- **Endpoint:** `POST /recommend/stream` (real-time SSE) ຫຼື `POST /recommend`
- **Pre-condition:** ລ໊ອກອິນດ້ວຍ role `user` ແລ້ວ
- **Post-condition:** ໄດ້ຮັບ 3 ສິນຄ້າທີ່ AI ແນະນຳ ພ້ອມລາຄາ, spec, ຮູບ ແລະ ຮ້ານທີ່ຂາຍ

---

### UC3 — ດູລາຍການ (View List / Browse Results)

- **Actor:** ຜູ້ໃຊ້
- **ຄຳອະທິບາຍ:** ຜູ້ໃຊ້ດູລາຍການຜົນການຄົ້ນຫາ, ຂໍ້ມູນລາຍລະອຽດສິນຄ້າ (spec, pros/cons, ລາຄາ), ຂໍ້ມູນຮ້ານທີ່ຂາຍ (ທີ່ຢູ່, ເບີໂທ, ລິ້ງ social media). ຜູ້ໃຊ້ສາມາດ drill-down ຂໍລາຍລະອຽດເພີ່ມເຕີມ ຫຼື ຖາມ AI ຕໍ່ໄດ້.
- **Endpoints:** (ສ່ວນ frontend — ດູຜົນຈາກ UC2)
- **Pre-condition:** ທຳ UC2 ສຳເລັດແລ້ວ ຫຼື ມີປະຫວັດ
- **Post-condition:** ຜູ້ໃຊ້ຮູ້ຈັກສິນຄ້າ ແລະ ຮ້ານທີ່ຈະຊື້

---

### UC4 — ເພີ່ມ, ລຶບ, ແກ້ໄຂ (Add / Delete / Edit Data)

- **Actor:** Admin
- **ຄຳອະທິບາຍ:** Admin ຈັດການຂໍ້ມູນທຸກຢ່າງໃນລະບົບ:
  - ດູ/ແກ້ໄຂ/ລຶບ ບັນຊີຜູ້ໃຊ້ (username, role)
  - ຢືນຢັນ ຫຼື ປະຕິເສດ ການລົງທະບຽນຂອງຮ້ານ (`is_verified`)
  - ຮ້ານທີ່ Admin ຢືນຢັນແລ້ວ (`is_verified = 1`) ຈຶ່ງຈະປະກົດໃນຜົນການຄົ້ນຫາ
- **Endpoints:** `GET/PUT/DELETE /api/admin/users/<id>`, `PUT /api/admin/shops/<id>/verify`
- **Pre-condition:** ລ໊ອກອິນດ້ວຍ role `admin`
- **Post-condition:** ຂໍ້ມູນ `users` ແລະ `shops` ຖືກອັບເດດ

---

### UC5 — ບັນທຶກເຂົ້າ-ອອກ (Save Records)

- **Actor:** ຜູ້ໃຊ້
- **`<<extend>>` UC3:** ເກີດຂຶ້ນເມື່ອຜູ້ໃຊ້ເລືອກກົດ "ບັນທຶກ" ຫຼັງຈາກດູຜົນ (ທາງເລືອກ)
- **ຄຳອະທິບາຍ:** ຜູ້ໃຊ້ກົດ "ບັນທຶກ" ເພື່ອເກັບສິນຄ້ານັ້ນໄວ້ໃນ wishlist (`saved_products`). ຜູ້ໃຊ້ຍັງສາມາດລຶບສິນຄ້າອອກຈາກ wishlist ໄດ້ທຸກເວລາ. ໝາຍເຫດ: ປະຫວັດການຄົ້ນຫາ ແລະ impression/click ຖືກບັນທຶກ**ອັດຕະໂນມັດ**ໂດຍລະບົບ (Process 2.5) — ບໍ່ແມ່ນ use case ຂອງ Admin.
- **Endpoints:** `POST /api/user/saved`, `DELETE /api/user/saved/<id>`
- **Pre-condition:** ລ໊ອກອິນດ້ວຍ role `user` ແລະ ດູຜົນ AI ຢູ່ (UC3)
- **Post-condition:** ສິນຄ້າຖືກບັນທຶກໃນ `saved_products` ແລະ ສາມາດດູໃນ wishlist ໄດ້

---

### UC6 — ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ (Edit Personal Information / Profile)

- **Actors:** ຜູ້ໃຊ້, ເຈົ້າຂອງຮ້ານ
- **ຄຳອະທິບາຍ:**
  - **ຜູ້ໃຊ້:** ແກ້ໄຂ username ຫຼື password ຂອງຕົນ
  - **ເຈົ້າຂອງຮ້ານ:** ແກ້ໄຂໂປຣໄຟລ໌ຮ້ານ: ຊື່ຮ້ານ, ທີ່ຢູ່, ເມືອງ, ເບີໂທ, Google Maps URL, Facebook/Line/Instagram links, ອັບໂຫຼດໂລໂກ້ຮ້ານ.
- **Endpoints:**
  - User: (ຜ່ານ admin endpoint ຫຼື self-service — ຂຶ້ນກັບ implementation)
  - Shop: `GET /api/shop/profile`, `PUT /api/shop/profile`, `POST /api/shop/upload-image`
- **Pre-condition:** ລ໊ອກອິນດ້ວຍ role ທີ່ຖືກຕ້ອງ
- **Post-condition:** ຂໍ້ມູນ `users` / `shops` ຖືກອັບເດດ; ໂປຣໄຟລ໌ຮ້ານທີ່ອັບເດດຈະສະແດງໃຫ້ຜູ້ໃຊ້ເຫັນທັນທີ

---

### UC7 — ເຫັນໂອກາດສານລາໄຍ (View Missed Opportunities)

- **Actor:** ເຈົ້າຂອງຮ້ານ
- **ຄຳອະທິບາຍ:** ລະບົບສະແດງໃຫ້ຮ້ານຮູ້ວ່າ: ມີຜູ້ໃຊ້ຄົ້ນຫາໃນເມືອງ/ປະເພດອຸປະກອນດຽວກັນ ແຕ່ ຮ້ານຂອງຕົນ **ບໍ່ໄດ້ປາກົດ** ໃນຜົນ ເນື່ອງຈາກຍັງບໍ່ໄດ້ຕັ້ງ inventory ສຳລັບປະເພດນັ້ນ. ຊ່ວຍໃຫ້ຮ້ານຮູ້ວ່າຄວນເພີ່ມ inventory ປະເພດໃດ.
- **Endpoint:** `GET /api/shop/missed-opportunities`
- **Data Stores used:** `shop_inventory`, `recommendation_logs`, `shop_impressions`
- **Pre-condition:** ລ໊ອກອິນດ້ວຍ role `shop` ແລະ ຮ້ານຖືກ admin ຢືນຢັນແລ້ວ
- **Post-condition:** ຮ້ານເຫັນລາຍການໂອກາດທີ່ພາດໄປ ແລະ ສາມາດໄປເພີ່ມ inventory ໄດ້

---

### UC8 — ລາຍງານ (View Reports)

- **Actors:** Admin (ລາຍງານລວມ), ເຈົ້າຂອງຮ້ານ (ລາຍງານສະເພາະຮ້ານ)
- **ຄຳອະທິບາຍ:**

  **Admin ເຫັນ:**
  - ລາຍງານຜູ້ໃຊ້: ຈຳນວນຜູ້ໃຊ້ລົງທະບຽນ, ຮ້ານຢືນຢັນ/ລໍຖ້າ
  - ລາຍງານສິນຄ້າ: Top 5 ສິນຄ້າທີ່ AI ແນະນຳຫຼາຍສຸດ, ປະເພດອຸປະກອນທີ່ຄົ້ນຫາຫຼາຍ, ຄວາມຕ້ອງການຕາມເມືອງ
  - ລາຍງານໂຄສະນາ: impressions ລວມ, clicks ລວມ, conversion rate, Top 5 ຮ້ານ
  - ລາຍງານງົບລາຄາ: ງົບຕ່ຳ/ສະເລ່ຍ/ສູງ (LAK & USD), ການແຈກຢາຍງົບ, ແນວໂນ້ມ 7 ມື້

  **ເຈົ້າຂອງຮ້ານ ເຫັນ:**
  - ການເບິ່ງເຫັນ (impressions) ແລະ ການຄລິກ (clicks) ຂອງຮ້ານຕົນ
  - ການຄລິກແຍກຕາມປະເພດ: Facebook / Line / Instagram / Google Maps / Phone
  - ກາຟ impressions ລາຍວັນ (14 ມື້ຜ່ານມາ)
  - ປະເພດອຸປະກອນທີ່ trigger ໂຄສະນາຂອງຮ້ານຫຼາຍສຸດ

- **Endpoints:**
  - Admin: `GET /api/admin/analytics`, `GET /api/admin/trends`
  - Shop: `GET /api/shop/analytics`, `GET /api/shop/missed-opportunities`
- **Data Stores used:** `recommendation_logs`, `shop_impressions`, `shop_clicks`, `users`, `shops`
- **Pre-condition:** ລ໊ອກອິນດ້ວຍ role `admin` ຫຼື `shop`
- **Post-condition:** ຜູ້ໃຊ້ໄດ້ຮັບລາຍງານສະຖິຕິຂອງລະບົບ/ຮ້ານ

---

## 6. ສະຫຼຸບ (Summary)

| Use Case | ຜູ້ໃຊ້ | ເຈົ້າຂອງຮ້ານ | Admin | Table ທີ່ກ່ຽວຂ້ອງ |
|---|---|---|---|---|
| UC1 ລ໊ອກອິນ | ✅ | ✅ | ✅ | `users` |
| UC2 ຄົ້ນຫາ | ✅ | | | `recommendation_logs`, `shops`, `shop_inventory` |
| UC3 ດູລາຍການ | ✅ | | | `recommendation_logs`, `saved_products` |
| UC4 ເພີ່ມ,ລຶບ,ແກ້ໄຂ | | | ✅ | `users`, `shops` |
| UC5 ບັນທຶກເຂົ້າ-ອອກ | ✅ | | | `saved_products` |
| UC6 ແກ້ໄຂຂໍ້ມູນສ່ວນຕົວ | ✅ | ✅ | | `users`, `shops` |
| UC7 ເຫັນໂອກາດສານລາໄຍ | | ✅ | | `shop_inventory`, `recommendation_logs` |
| UC8 ລາຍງານ | | ✅ | ✅ | `recommendation_logs`, `shop_impressions`, `shop_clicks`, `users`, `shops` |
