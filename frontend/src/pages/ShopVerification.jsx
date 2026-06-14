import React, { useState, useEffect } from "react";
import { ShieldCheck, Store, CheckCircle2, Clock, Map, Phone } from "lucide-react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";

const API = (import.meta.env.VITE_API_URL||"http://localhost:5000")+"";

function ShopVerification() {
  const { t } = useLanguage();

  const [shops, setShops]            = useState([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState("");
  const [successMessage, setSuccess] = useState("");

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchShops(); }, []);

  const fetchShops = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/admin/shops`, { headers });
      if (res.data.success) setShops(res.data.data);
    } catch {
      setError(t("failedLoadShops"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyToggle = async (shopId, currentStatus) => {
    try {
      setSuccess(""); setError("");
      const res = await axios.put(
        `${API}/api/admin/shops/${shopId}/verify`,
        { is_verified: currentStatus === 1 ? 0 : 1 },
        { headers }
      );
      if (res.data.success) {
        setSuccess(currentStatus === 1 ? t("shopRevokedMsg") : t("shopVerifiedMsg"));
        fetchShops();
      }
    } catch {
      setError(t("failedVerifyShop"));
    }
  };

  const verified = shops.filter((s) => s.is_verified === 1);
  const pending  = shops.filter((s) => s.is_verified !== 1);

  if (loading) return <div className="dashboard-loading">{t("loadingShops")}</div>;

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="sv-hero-header">
        <div className="sv-hero-left">
          <div className="sv-hero-icon"><ShieldCheck size={22} strokeWidth={1.5} /></div>
          <div>
            <h1 className="admin-hero-title">{t("shopVerification")}</h1>
            <p className="admin-hero-sub">{t("shopVerifySub")}</p>
          </div>
        </div>
      </div>

      {successMessage && <div className="dashboard-success-message">{successMessage}</div>}
      {error          && <div className="dashboard-error-message">{error}</div>}

      {/* Summary chips */}
      <div className="um-summary-row">
        <div className="um-chip">
          <Store size={14} strokeWidth={1.75} />
          <span className="um-chip-count">{shops.length}</span>
          <span className="um-chip-label">{t("totalShopsLabel")}</span>
        </div>
        <div className="um-chip sv-chip-verified">
          <CheckCircle2 size={14} strokeWidth={1.75} />
          <span className="um-chip-count">{verified.length}</span>
          <span className="um-chip-label">{t("verified")}</span>
        </div>
        <div className="um-chip sv-chip-pending">
          <Clock size={14} strokeWidth={1.75} />
          <span className="um-chip-count">{pending.length}</span>
          <span className="um-chip-label">{t("pending")}</span>
        </div>
      </div>

      {/* Pending first */}
      {pending.length > 0 && (
        <div className="dashboard-card" style={{ marginBottom: "1.25rem" }}>
          <div className="admin-section-header section-amber">
            <Clock size={15} strokeWidth={1.75} />
            <h2>{t("awaitingVerify")}</h2>
            <span className="um-count-badge">{pending.length}</span>
          </div>
          <ShopTable shops={pending} onToggle={handleVerifyToggle} t={t} />
        </div>
      )}

      {/* Verified shops */}
      <div className="dashboard-card">
        <div className="admin-section-header section-green">
          <CheckCircle2 size={15} strokeWidth={1.75} />
          <h2>{t("verifiedPartners")}</h2>
          <span className="um-count-badge">{verified.length}</span>
        </div>
        {verified.length === 0
          ? <p className="no-data">{t("noVerifiedShops")}</p>
          : <ShopTable shops={verified} onToggle={handleVerifyToggle} t={t} />}
      </div>

    </div>
  );
}

function ShopTable({ shops, onToggle, t }) {
  return (
    <div className="table-responsive">
      <table className="minimal-table">
        <thead>
          <tr>
            <th>{t("colShopName")}</th>
            <th>{t("colCity")}</th>
            <th>{t("colContact")}</th>
            <th>{t("colSocials")}</th>
            <th>{t("colMap")}</th>
            <th>{t("colStatus")}</th>
            <th>{t("colAction")}</th>
          </tr>
        </thead>
        <tbody>
          {shops.map((shop) => {
            let soc = {};
            try { soc = JSON.parse(shop.social_media_links || "{}"); } catch {}
            return (
              <tr key={shop.id}>
                <td className="bold-td">{shop.name}</td>
                <td>{shop.city}</td>
                <td>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", fontSize: "0.82rem" }}>
                    <Phone size={11} strokeWidth={1.75} style={{ opacity: 0.5 }} />
                    {shop.phone}
                  </div>
                </td>
                <td>
                  <div className="social-mini-list">
                    {soc.facebook   && <span className="mini-tag">FB</span>}
                    {soc.line        && <span className="mini-tag">Line</span>}
                    {soc.instagram   && <span className="mini-tag">IG</span>}
                    {!soc.facebook && !soc.line && !soc.instagram && <span className="muted-td">—</span>}
                  </div>
                </td>
                <td>
                  {shop.google_map_url
                    ? <a href={shop.google_map_url} target="_blank" rel="noopener noreferrer" className="link-highlight">
                        <Map size={12} strokeWidth={1.75} style={{ verticalAlign: "middle" }} /> {t("viewMapBtn")}
                      </a>
                    : <span className="muted-td">—</span>}
                </td>
                <td>
                  <span className={`badge ${shop.is_verified === 1 ? "verified" : "pending"}`}>
                    {shop.is_verified === 1 ? t("verified") : t("pending")}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onToggle(shop.id, shop.is_verified)}
                    className={`btn-table-action ${shop.is_verified === 1 ? "btn-unverify" : "btn-verify"}`}
                  >
                    {shop.is_verified === 1 ? t("revokeBtn") : t("approveBtn")}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default ShopVerification;
