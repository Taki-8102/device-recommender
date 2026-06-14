import sqlite3
import os
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(__file__), "recommender.db")

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

    # Seed default Admin and Shops if none exist
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        print("[Seeding] Seeding default users...")
        # Password hashes for seed users
        admin_pass = generate_password_hash("admin123")
        shop1_pass = generate_password_hash("shop123")
        shop2_pass = generate_password_hash("shop123")
        shop3_pass = generate_password_hash("shop123")
        
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                       ("admin", admin_pass, "admin"))
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                       ("banana_it", shop1_pass, "shop"))
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                       ("jib_shop", shop2_pass, "shop"))
        cursor.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", 
                       ("lao_digital", shop3_pass, "shop"))
        
        # Get user ids
        cursor.execute("SELECT id, username FROM users")
        user_map = {row["username"]: row["id"] for row in cursor.fetchall()}
        
        # Seed shops
        print("[Seeding] Seeding shops...")
        cursor.execute("""
        INSERT INTO shops (user_id, name, google_map_url, address_text, city, phone, social_media_links, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_map["banana_it"], 
            "Banana IT (Central World Branch)",
            "https://maps.app.goo.gl/CentralWorldBananaIT",
            "4th Floor, Central World Shopping Mall, Pathum Wan, Bangkok 10330",
            "Bangkok",
            "+66 2 250 8888",
            '{"facebook": "https://facebook.com/bananaitshop", "line": "@bananait"}',
            1 # verified
        ))
        
        cursor.execute("""
        INSERT INTO shops (user_id, name, google_map_url, address_text, city, phone, social_media_links, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_map["jib_shop"], 
            "JIB Computer (Fortune Town Branch)",
            "https://maps.app.goo.gl/FortuneTownJIB",
            "3rd Floor, Fortune Town IT Mall, Din Daeng, Bangkok 10400",
            "Bangkok",
            "+66 2 642 1234",
            '{"facebook": "https://facebook.com/JIBComputerGroup", "instagram": "jib.computer"}',
            0 # pending/unverified
        ))

        cursor.execute("""
        INSERT INTO shops (user_id, name, google_map_url, address_text, city, phone, social_media_links, is_verified)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            user_map["lao_digital"], 
            "Lao Digital Store (Luang Prabang Branch)",
            "https://maps.google.com/?q=Luang+Prabang",
            "Sisavangvong Road, Luang Prabang 06000",
            "Luang Prabang",
            "+856 71 212 345",
            '{"facebook": "https://facebook.com/laodigitalstore", "line": "@laodigital"}',
            1 # verified
        ))
        
    conn.commit()
    conn.close()
    print("[Database] Database initialized and seed data inserted (if applicable).")

if __name__ == "__main__":
    init_db()
