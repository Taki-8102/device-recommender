import React, { useEffect, useState } from "react";
import { Lock, Clock, Smartphone, Laptop, Tablet, Search, ArrowLeft, ChevronRight, Bookmark, BookmarkCheck, Trash2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import ProductCarousel, { CompareTable, MiniCard } from "../components/ProductCarousel";
import "./HistoryPage.css";

function deviceIcon(device) {
  const d = (device || "").toLowerCase();
  if (d.includes("laptop")) return <Laptop size={15} strokeWidth={1.75} />;
  if (d.includes("tablet")) return <Tablet size={15} strokeWidth={1.75} />;
  return <Smartphone size={15} strokeWidth={1.75} />;
}

function ConversationView({ log, onBack, compareList, onToggleCompare, user, savedNames, onToggleSave }) {
  const { t } = useLanguage();

  return (
    <div className="history-convo">
      <button className="history-back-btn" onClick={onBack}>
        <ArrowLeft size={15} strokeWidth={2} /> {t("back")}
      </button>

      <div className="history-convo-date">
        {new Date(log.created_at).toLocaleDateString(undefined, {
          year: "numeric", month: "long", day: "numeric",
          hour: "2-digit", minute: "2-digit",
        })}
      </div>

      {/* User message bubble */}
      <div className="history-bubble user">
        <p>{log.raw_query}</p>
      </div>

      {/* Bot response bubble */}
      <div className="history-bubble bot">
        <p className="history-result-intro">{t("resultIntro")}</p>
        {log.products?.length > 0 ? (
          <div className="history-carousel-wrap">
            <ProductCarousel
              products={log.products}
              compareList={compareList}
              onToggleCompare={onToggleCompare}
              user={user}
              savedNames={savedNames}
              onToggleSave={onToggleSave}
            />
          </div>
        ) : (
          <p className="history-no-products">{log.recommended_product || "—"}</p>
        )}
      </div>
    </div>
  );
}

function SavedProductCard({ product, onUnsave, user, isSaved, onToggleSave }) {
  const { t } = useLanguage();
  return (
    <div className="saved-product-card">
      <MiniCard
        product={product}
        isSelected={false}
        isDisabled={true}
        onToggleSelect={() => {}}
        user={user}
        isSaved={isSaved}
        onToggleSave={onToggleSave}
      />
    </div>
  );
}

function HistoryPage({ user, onGoToAuth, compareList, onToggleCompare, savedProducts, onToggleSave }) {
  const { t } = useLanguage();
  const [logs, setLogs]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [active, setActive]     = useState(null);
  const [activeTab, setActiveTab] = useState("history");

  const savedNames = new Set((savedProducts || []).map(s =>
    typeof s.product_data === "object" ? s.product_data.productName : s.productName
  ));

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const token = localStorage.getItem("token");
    fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/history", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((d) => { if (d.success) setLogs(d.data); })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="history-page">
        <div className="history-gate">
          <div className="history-gate-icon">
            <Lock size={36} strokeWidth={1.25} />
          </div>
          <h2>{t("historyLoginTitle")}</h2>
          <p>{t("historyLoginDesc")}</p>
          <div className="history-gate-btns">
            <button className="hgate-login-btn" onClick={() => onGoToAuth("login")}>
              {t("loginBtn")}
            </button>
            <button className="hgate-register-btn" onClick={() => onGoToAuth("register")}>
              {t("registerBtn")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (active) {
    return (
      <div className="history-page">
        <ConversationView
          log={active}
          onBack={() => setActive(null)}
          compareList={compareList}
          onToggleCompare={onToggleCompare}
          user={user}
          savedNames={savedNames}
          onToggleSave={onToggleSave}
        />
      </div>
    );
  }

  return (
    <div className="history-page">
      <div className="history-header">
        <Clock size={18} strokeWidth={1.75} />
        <h2>{t("historyTitle")}</h2>
      </div>

      {/* Tab switcher */}
      <div className="history-tabs">
        <button
          className={`history-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          <Clock size={13} strokeWidth={2} /> {t("historyTab")}
        </button>
        <button
          className={`history-tab ${activeTab === "saved" ? "active" : ""}`}
          onClick={() => setActiveTab("saved")}
        >
          <Bookmark size={13} strokeWidth={2} /> {t("savedTab")}
          {savedProducts?.length > 0 && (
            <span className="history-tab-count">{savedProducts.length}</span>
          )}
        </button>
      </div>

      {/* History tab */}
      {activeTab === "history" && (
        <>
          {loading && (
            <div className="history-loading">
              <div className="history-spinner" />
            </div>
          )}

          {!loading && logs.length === 0 && (
            <div className="history-empty">
              <Search size={32} strokeWidth={1.25} />
              <p>{t("historyEmpty")}</p>
            </div>
          )}

          {!loading && logs.length > 0 && (
            <div className="history-list">
              {logs.map((log) => (
                <button
                  key={log.id}
                  className="history-item"
                  onClick={() => setActive(log)}
                >
                  <div className="history-item-icon">{deviceIcon(log.device)}</div>
                  <div className="history-item-body">
                    <p className="history-item-query">{log.raw_query}</p>
                    <div className="history-item-meta">
                      {log.device && <span>{log.device}</span>}
                      {log.budget && <span>{log.budget}</span>}
                      {log.city   && <span>{log.city}</span>}
                    </div>
                    <p className="history-item-date">
                      {new Date(log.created_at).toLocaleDateString(undefined, {
                        year: "numeric", month: "short", day: "numeric",
                      })}
                    </p>
                  </div>
                  <ChevronRight size={15} strokeWidth={1.75} className="history-item-arrow" />
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* Saved tab */}
      {activeTab === "saved" && (
        <>
          {(!savedProducts || savedProducts.length === 0) ? (
            <div className="history-empty">
              <BookmarkCheck size={32} strokeWidth={1.25} />
              <p>{t("noSavedProducts")}</p>
            </div>
          ) : (
            <div className="saved-products-grid">
              {savedProducts.map((item, idx) => {
                const product = typeof item.product_data === "object" ? item.product_data : item;
                return (
                  <SavedProductCard
                    key={idx}
                    product={product}
                    user={user}
                    isSaved={true}
                    onToggleSave={onToggleSave}
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default HistoryPage;
