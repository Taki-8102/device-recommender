import React, { useEffect, useState } from "react";
import { MapPin, Phone, CheckCircle, Clock, ExternalLink, Store } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./ShopsPage.css";

function socialLabel(key) {
  const map = { facebook: "Facebook", line: "Line", instagram: "Instagram", twitter: "Twitter" };
  return map[key] || key;
}

function ShopsPage() {
  const { t } = useLanguage();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shops/public")
      .then((r) => r.json())
      .then((d) => { if (d.success) setShops(d.data); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = shops.filter((s) => {
    const q = search.toLowerCase();
    return !q || s.name.toLowerCase().includes(q) || s.city.toLowerCase().includes(q);
  });

  return (
    <div className="shops-page">
      <div className="shops-header">
        <div className="shops-title-row">
          <h2>{t("shopsTitle")}</h2>
        </div>
        <p className="shops-subtitle">{t("shopsSubtitle")}</p>
        <input
          className="shops-search"
          type="text"
          placeholder="Search by name or city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && (
        <div className="shops-loading">
          <div className="shops-spinner" />
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="shops-empty">
          <Store size={32} strokeWidth={1.25} />
          <p>{t("shopsEmpty")}</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="shops-list">
          {filtered.map((shop) => {
            let social = {};
            try { social = JSON.parse(shop.social_media_links || "{}"); } catch {}

            return (
              <div key={shop.id} className={`shop-card ${shop.is_verified ? "verified" : ""}`}>
                <div className="shop-card-top">
                  <div className="shop-name-row">
                    <span className="shop-name">{shop.name}</span>
                    {shop.is_verified
                      ? <span className="shop-badge verified-badge"><CheckCircle size={11} strokeWidth={2} /> {t("verified")}</span>
                      : <span className="shop-badge pending-badge"><Clock size={11} strokeWidth={2} /> {t("pending")}</span>
                    }
                  </div>
                  <span className="shop-city">{shop.city}</span>
                </div>

                <div className="shop-details">
                  <span className="shop-detail"><MapPin size={13} strokeWidth={1.75} /> {shop.address_text}</span>
                  <span className="shop-detail"><Phone size={13} strokeWidth={1.75} /> {shop.phone}</span>
                </div>

                <div className="shop-footer">
                  <div className="shop-social">
                    {Object.entries(social).filter(([, v]) => v).map(([k, v]) => (
                      <a key={k} href={v} target="_blank" rel="noopener noreferrer" className="shop-social-link">
                        {socialLabel(k)}
                      </a>
                    ))}
                  </div>
                  {shop.google_map_url && (
                    <a href={shop.google_map_url} target="_blank" rel="noopener noreferrer" className="shop-map-btn">
                      <MapPin size={12} strokeWidth={2} /> {t("viewOnMap")} <ExternalLink size={11} strokeWidth={2} />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ShopsPage;
