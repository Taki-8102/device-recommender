import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "recommender.db")

# Real verified shops in Luang Prabang. Used to seed a fresh database (e.g. after a
# Render redeploy wipes the SQLite file) so the demo always comes back with the real
# approved shops instead of placeholder data. password_hash values are the owners'
# actual hashes so their existing logins keep working after a reseed.
SHOP_SEED = [
    {
        "username": "MRIT",
        "password_hash": "scrypt:32768:8:1$wpTSNcI8kcV0S7Eu$7cb683db9633cd6a15854e20ef1d6ce5085bda62947a0059a046a83d8273a7ef5ec59f50a887c57b048159ccb6e4a98be24bac74373cb6b518d92f08cce9fe5b",
        "name": "MRIT Shop ທ້າວ ໄອທີ",
        "google_map_url": "https://maps.app.goo.gl/RFKaXARvVvEoAtjEA?g_st=ac",
        "address_text": "ບ້ານ ວຽງໃໝ່, ເມືອງ ຫຼວງພະບາງ, ແຂວງ ຫຼວງພະບາງ, ລາວ",
        "city": "ຫຼວງພະບາງ",
        "phone": "02059450123",
        "social_media_links": '{"facebook":"https://www.facebook.com/share/1EqYFJdxvS/","line":"","instagram":""}',
        "image_path": "/uploads/shops/shop_4.png",
        "inventory": ["Laptop", "Smartphone", "Tablet"],
    },
    {
        "username": "LTH",
        "password_hash": "scrypt:32768:8:1$zccB1TePKbkWfUqI$3ea6f0422438d9258acf9499080f137caa4cbe6520a88fcbd206b4fd5b11552ea071832b55e53883c0ef901ead4d1b3867f4149cb04375fb894c133cced93bab",
        "name": "LTH Luangprabang",
        "google_map_url": "https://maps.app.goo.gl/j8CFz1J8zXVgAkpa6?g_st=aw",
        "address_text": "ບ້ານໂພສີ, ເມືອງຫຼວງພະບາງ, ແຂວງຫຼວງພະບາງ",
        "city": "ຫຼວງພະບາງ",
        "phone": "021453095",
        "social_media_links": '{"facebook":"https://www.facebook.com/share/1E7bQ5orpE/","line":"","instagram":""}',
        "image_path": "/uploads/shops/shop_5.png",
        "inventory": ["Smartphone", "Tablet"],
    },
    {
        "username": "TK",
        "password_hash": "scrypt:32768:8:1$8AEiIKhqD6PMlx2s$f984f359858646865ae143bc66bebd103e833e19ba988e1459b3807022a0599ae32cfa875890f6d565df4778e555ba5f7a081846a4c7d75bbca54105906f396c",
        "name": "ຕົ້ນຂາມ ໂມບາຍ",
        "google_map_url": "https://maps.app.goo.gl/e7CxsfnxfxuLD1dA8?g_st=aw",
        "address_text": "ບ້ານມະໂນ (ໃກ້ກັບທະນາຄານການຄ້າ), ເມືອງຫຼວງພະບາງ, ແຂວງຫຼວງພະບາງ",
        "city": "ຫຼວງພະບາງ",
        "phone": "2023888883",
        "social_media_links": '{"facebook":"https://www.facebook.com/share/1E45kpE9gR/","line":"","instagram":""}',
        "image_path": "/uploads/shops/shop_6.jpeg",
        "inventory": ["Smartphone"],
    },
    {
        "username": "adviceshopLPB",
        "password_hash": "scrypt:32768:8:1$Mg4fJPMhJuTsj5BE$def7d83226f6e12c650aa158dae2f39b54772cbc9b93d28ae733509b605a3713e3ea36fca66f6c0ed331b5628c3dd7ba6246ef397ee2a50a0aec4b0c7f790f29",
        "name": "Advice Shop - ແອັດໄວສ໌ ຫຼວງພະບາງ",
        "google_map_url": "https://maps.app.goo.gl/6xr5mrjUTrLiNHGh9?g_st=aw",
        "address_text": "ສາມແຍກທາງໄປ 3 ແຝດ, ບ້ານໂພນແພງ, ນະຄອນຫຼວງພະບາງ, ແຂວງຫຼວງພະບາງ",
        "city": "ຫຼວງພະບາງ",
        "phone": "02055509000",
        "social_media_links": '{"facebook":"https://www.facebook.com/share/1BacimEEA7/","line":"","instagram":""}',
        "image_path": "/uploads/shops/shop_7.png",
        "inventory": ["Gaming PC", "Laptop"],
    },
    {
        "username": "Skmobile",
        "password_hash": "scrypt:32768:8:1$grkR34hGAeZj6lfH$e7d21e496890707bc38b8fbf8e3fa6ea7cbc355b49252f4c709767869fa80adda498195f6896fe352743e5026285594ecd3af2d9a68d6f6a78175edcb02b42dd",
        "name": "ສົ້ນຂົວໄອທີMobile & Computer ສູນຈໍາຫນ່າຍໂທລະສັບແລະຄອມພິວເຕີ",
        "google_map_url": "https://maps.app.goo.gl/g2WQgT7Q7LrhwTZJA?g_st=aw",
        "address_text": "ທາງໄປຕະຫຼາດໂພສີ ຂ້າງຂົວ, ບ້ານໂພສີ, ນະຄອນຫຼວງພະບາງ, ແຂວງຫຼວງພະບາງ",
        "city": "ຫຼວງພະບາງ",
        "phone": "02028638888",
        "social_media_links": '{"facebook":"https://www.facebook.com/share/1CsDZiNdZs/","line":"","instagram":""}',
        "image_path": "/uploads/shops/shop_8.png",
        "inventory": ["Gaming PC", "Laptop", "Smartphone", "Tablet"],
    },
]

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'shop', 'user')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)
    
    # 2. Shops Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shops (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        google_map_url TEXT,
        address_text TEXT NOT NULL,
        city TEXT NOT NULL,
        phone TEXT NOT NULL,
        social_media_links TEXT, -- JSON-formatted or plain text links (e.g. {"facebook": "...", "line": "..."})
        is_verified INTEGER DEFAULT 0, -- 0 = pending/unverified, 1 = verified
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)
    
    # 3. Recommendation Logs Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS recommendation_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        device TEXT,
        budget TEXT,
        purpose TEXT,
        brand TEXT,
        city TEXT,
        raw_query TEXT,
        recommended_product TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    """)
    
    # 4. Shop Impressions Table (Advertising Analytics)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shop_impressions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        recommendation_log_id INTEGER NOT NULL,
        viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(shop_id) REFERENCES shops(id) ON DELETE CASCADE,
        FOREIGN KEY(recommendation_log_id) REFERENCES recommendation_logs(id) ON DELETE CASCADE
    );
    """)
    
    # 5. Shop Clicks Table (Conversion Tracking)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shop_clicks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        click_type TEXT NOT NULL CHECK(click_type IN ('facebook', 'instagram', 'line', 'google_maps', 'phone')),
        recommendation_log_id INTEGER,
        clicked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(shop_id) REFERENCES shops(id) ON DELETE CASCADE
    );
    """)

    # 6. Shop Inventory Table (for Missed Opportunities)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS shop_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        shop_id INTEGER NOT NULL,
        device_category TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(shop_id) REFERENCES shops(id) ON DELETE CASCADE,
        UNIQUE(shop_id, device_category)
    );
    """)

    # 7. Saved Products Table (Wishlist)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS saved_products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        product_data TEXT NOT NULL,
        saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, product_name),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # Add columns if upgrading from older schema
    for alter_sql in [
        "ALTER TABLE recommendation_logs ADD COLUMN response_json TEXT",
        "ALTER TABLE recommendation_logs ADD COLUMN drilldown TEXT",
        "ALTER TABLE recommendation_logs ADD COLUMN pain_points TEXT",
        "ALTER TABLE shops ADD COLUMN image_path TEXT",
    ]:
        try:
            cursor.execute(alter_sql)
            conn.commit()
        except Exception:
            pass  # Column already exists

    # Seed default Admin and the real verified Luang Prabang shops if none exist.
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("[Seeding] Seeding admin user...")
        admin_pass = generate_password_hash("admin123")
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)",
                       ("admin", admin_pass, "admin"))

        print(f"[Seeding] Seeding {len(SHOP_SEED)} verified shops...")
        for s in SHOP_SEED:
            cursor.execute(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'shop')",
                (s["username"], s["password_hash"])
            )
            user_id = cursor.lastrowid
            cursor.execute("""
                INSERT INTO shops
                  (user_id, name, google_map_url, address_text, city, phone,
                   social_media_links, is_verified, image_path)
                VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
            """, (
                user_id, s["name"], s["google_map_url"], s["address_text"],
                s["city"], s["phone"], s["social_media_links"], s["image_path"],
            ))
            shop_id = cursor.lastrowid
            for category in s["inventory"]:
                cursor.execute(
                    "INSERT OR IGNORE INTO shop_inventory (shop_id, device_category) VALUES (?, ?)",
                    (shop_id, category)
                )

    conn.commit()
    conn.close()
    print("[Database] Database initialized and seed data inserted (if applicable).")

if __name__ == "__main__":
    init_db()
