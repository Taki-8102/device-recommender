import React, { useState } from "react";
import {
  CheckSquare, Square, ArrowLeftRight, X,
  Monitor, Cpu, Battery,
  ThumbsUp, ThumbsDown, MapPin, Phone, CheckCircle,
  ChevronDown, ChevronUp, Bookmark, BookmarkCheck, AlertTriangle, Tag,
  ExternalLink, MessageCircle,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./ProductCarousel.css";

const API = (import.meta.env.VITE_API_URL||"http://localhost:5000")+"";

function trackClick(shopId, clickType) {
  if (!shopId) return;
  fetch(`${API}/api/shop/click`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shopId, clickType }),
  }).catch(() => {});
}

const ICO = { size: 13, strokeWidth: 1.75 };

const PLACEHOLDERS = {
  laptop:     "💻",
  tablet:     "📱",
  smartphone: "📱",
};

function detectDeviceType(product) {
  const name = (product.productName || "").toLowerCase();
  const brand = (product.brand || "").toLowerCase();
  const combined = name + " " + brand;
  if (combined.includes("laptop") || combined.includes("macbook") || combined.includes("notebook") || combined.includes("chromebook")) return "laptop";
  if (combined.includes("tablet") || combined.includes("ipad") || combined.includes("tab ") || combined.includes("surface pro")) return "tablet";
  return "smartphone";
}

function getSpecsUrl(product, deviceType) {
  // Strip "(8GB RAM, 256GB Storage)" style suffixes — they confuse site searches
  const cleanName = (product.productName || "").replace(/\s*\(.*?\)\s*/g, "").trim();
  const q = encodeURIComponent(`${product.brand || ""} ${cleanName}`.trim());
  if (deviceType === "laptop") {
    return `https://www.notebookcheck.net/Search.html?q=${q}`;
  }
  return `https://www.gsmarena.com/results.php3?sQuickSearch=${q}`;
}

function parsePriceNum(priceStr) {
  if (!priceStr) return null;
  const n = parseFloat(String(priceStr).replace(/[^0-9.]/g, ""));
  return isNaN(n) ? null : n;
}

export function MiniCard({ product, isSelected, isDisabled, onToggleSelect, isSaved, onToggleSave, user }) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  if (product.error) {
    return (
      <div className="pcard pcard-error">
        <p style={{ color: "#fca5a5", fontSize: "0.85rem", padding: "0.5rem 0" }}>
          ⚠ {product.error || product.message || "Something went wrong"}
        </p>
      </div>
    );
  }

  const deviceType    = detectDeviceType(product);
  const placeholder   = PLACEHOLDERS[deviceType];
  const currentPrice  = parsePriceNum(product.price);
  const launchPrice   = parsePriceNum(product.launchPrice);
  const hasPriceDrop  = currentPrice && launchPrice && launchPrice > currentPrice * 1.04;
  const dropPct       = hasPriceDrop ? Math.round((1 - currentPrice / launchPrice) * 100) : 0;
  const specsUrl      = getSpecsUrl(product, deviceType);
  const specsLabel    = deviceType === "laptop" ? t("viewOnNotebook") : t("viewOnGsmarena");

  return (
    <div className={`pcard ${isSelected ? "pcard-selected" : ""}`}>
      {/* Newer model alert */}
      {product.newerModel && (
        <div className="pcard-newer-alert">
          <AlertTriangle size={11} strokeWidth={2} />
          {t("newerModelAlert")} <strong>{product.newerModel}</strong>
        </div>
      )}

      {/* Header */}
      <div className="pcard-header">
        <div className="pcard-image-wrap">
          <a href={specsUrl} target="_blank" rel="noopener noreferrer"
             className="pcard-image" title={t("viewSpecsTip")}>
            {!imgError && product.imageUrl ? (
              <img src={product.imageUrl} alt={product.productName} onError={() => setImgError(true)} />
            ) : (
              <div className="pcard-img-placeholder">{placeholder}</div>
            )}
          </a>
          <a href={specsUrl} target="_blank" rel="noopener noreferrer"
             className="pcard-specs-badge">
            {specsLabel} <ExternalLink size={9} strokeWidth={2} />
          </a>
        </div>
        <div className="pcard-info">
          <div className="pcard-brand-row">
            <span className="pcard-brand">{product.brand}</span>
            {product.releaseYear && (
              <span className="pcard-year-badge">{product.releaseYear}</span>
            )}
          </div>
          <h3 className="pcard-name">{product.productName}</h3>
          <div className="pcard-price-row">
            {hasPriceDrop && (
              <span className="pcard-launch-price">{product.launchPrice}</span>
            )}
            <span className="pcard-price">{product.price}</span>
            {hasPriceDrop && (
              <span className="pcard-drop-badge">
                <Tag size={9} strokeWidth={2} /> -{dropPct}%
              </span>
            )}
          </div>
        </div>
        {/* Bookmark button — only for logged-in users */}
        {user && (
          <button
            className={`pcard-bookmark-btn ${isSaved ? "saved" : ""}`}
            onClick={(e) => { e.stopPropagation(); onToggleSave && onToggleSave(product); }}
            title={isSaved ? t("unsaveProduct") : t("saveProduct")}
          >
            {isSaved
              ? <BookmarkCheck size={15} strokeWidth={1.75} />
              : <Bookmark      size={15} strokeWidth={1.75} />}
          </button>
        )}
      </div>

      {/* Reasoning */}
      <p className="pcard-reasoning">{product.reasoning}</p>

      {/* Quick specs */}
      {product.specs && (
        <div className="pcard-specs">
          {product.specs.display   && <span><Monitor {...ICO} /> {product.specs.display}</span>}
          {product.specs.processor && <span><Cpu     {...ICO} /> {product.specs.processor}</span>}
          {product.specs.battery   && <span><Battery {...ICO} /> {product.specs.battery}</span>}
        </div>
      )}

      {/* Expand toggle */}
      <button className="pcard-toggle" onClick={() => setExpanded(!expanded)}>
        {expanded
          ? <><ChevronUp   {...ICO} /> {t("lessDetails")}</>
          : <><ChevronDown {...ICO} /> {t("moreDetails")}</>}
      </button>

      {expanded && (
        <div className="pcard-expanded">
          {/* Full specs */}
          {product.specs && (
            <div className="pcard-section">
              <h4>{t("fullSpecs")}</h4>
              <div className="pcard-spec-list">
                {product.specs.display   && <div><b>{t("specDisplay")}:</b> {product.specs.display}</div>}
                {product.specs.processor && <div><b>{t("specProcessor")}:</b> {product.specs.processor}</div>}
                {product.specs.ram       && <div><b>{t("specRam")}:</b> {product.specs.ram}</div>}
                {product.specs.storage   && <div><b>{t("specStorage")}:</b> {product.specs.storage}</div>}
                {product.specs.battery   && <div><b>{t("specBattery")}:</b> {product.specs.battery}</div>}
                {product.specs.weight    && <div><b>{t("specWeight")}:</b> {product.specs.weight}</div>}
              </div>
            </div>
          )}

          {/* Pros & Cons */}
          {product.prosAndCons && (
            <div className="pcard-section pcard-procon">
              <div>
                <h4><ThumbsUp {...ICO} /> {t("pros")}</h4>
                <ul>{product.prosAndCons.pros?.map((p, i) => <li key={i}>{p}</li>)}</ul>
              </div>
              <div>
                <h4><ThumbsDown {...ICO} /> {t("cons")}</h4>
                <ul>{product.prosAndCons.cons?.map((c, i) => <li key={i}>{c}</li>)}</ul>
              </div>
            </div>
          )}

          {/* Nearby shops */}
          {product.nearbyShops?.length > 0 && (
            <div className="pcard-section">
              <h4><MapPin {...ICO} /> {t("whereToBuy")}</h4>
              {product.nearbyShops.map((shop, i) => {
                let soc = {};
                try { soc = JSON.parse(shop.social_media_links || "{}"); } catch {}
                const sid = shop.shop_id;
                return (
                  <div key={i} className={`pcard-shop ${shop.is_verified ? "verified" : ""}`}>
                    <div className="pcard-shop-name">
                      <strong>{shop.name}</strong>
                      {shop.is_verified && (
                        <span className="pcard-verified">
                          <CheckCircle size={11} strokeWidth={2} /> {t("partner")}
                        </span>
                      )}
                    </div>
                    {shop.address && <span className="pcard-shop-addr">{shop.address}</span>}

                    {/* Action links row */}
                    <div className="pcard-shop-links">
                      {shop.phone && (
                        <a
                          href={`tel:${shop.phone}`}
                          className="pcard-shop-link link-phone"
                          onClick={() => trackClick(sid, "phone")}
                        >
                          <Phone size={11} strokeWidth={2} /> {shop.phone}
                        </a>
                      )}
                      {shop.google_map_url && (
                        <a
                          href={shop.google_map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pcard-shop-link link-map"
                          onClick={() => trackClick(sid, "google_maps")}
                        >
                          <ExternalLink size={11} strokeWidth={2} /> Map
                        </a>
                      )}
                      {soc.facebook && (
                        <a
                          href={soc.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pcard-shop-link link-fb"
                          onClick={() => trackClick(sid, "facebook")}
                        >
                          <span className="pcard-social-label">f</span> Facebook
                        </a>
                      )}
                      {soc.instagram && (
                        <a
                          href={`https://instagram.com/${soc.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pcard-shop-link link-ig"
                          onClick={() => trackClick(sid, "instagram")}
                        >
                          <span className="pcard-social-label">ig</span> Instagram
                        </a>
                      )}
                      {soc.line && (
                        <a
                          href={`https://line.me/R/ti/p/${soc.line.replace(/^@/, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="pcard-shop-link link-line"
                          onClick={() => trackClick(sid, "line")}
                        >
                          <MessageCircle size={11} strokeWidth={2} /> Line
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Compare toggle */}
      <button
        className={`pcard-compare-btn ${isSelected ? "active" : ""} ${isDisabled ? "disabled" : ""}`}
        onClick={isDisabled ? undefined : onToggleSelect}
        disabled={isDisabled}
        title={isDisabled ? "Can only compare same device type" : undefined}
      >
        {isSelected
          ? <><CheckSquare size={13} strokeWidth={2} /> {t("removeCompare")}</>
          : <><Square      size={13} strokeWidth={2} /> {t("addCompare")}</>}
      </button>
    </div>
  );
}

export function CompareTable({ products, onClose }) {
  const { t } = useLanguage();

  const ROWS = [
    { label: t("comparePrice"),     get: (p) => p.price },
    { label: t("specDisplay"),      get: (p) => p.specs?.display },
    { label: t("specProcessor"),    get: (p) => p.specs?.processor },
    { label: t("specRam"),          get: (p) => p.specs?.ram },
    { label: t("specStorage"),      get: (p) => p.specs?.storage },
    { label: t("specBattery"),      get: (p) => p.specs?.battery },
    { label: t("specWeight"),       get: (p) => p.specs?.weight },
  ];

  return (
    <div className="compare-wrap">
      <div className="compare-header">
        <span className="compare-title">{t("compareTitle")}</span>
        <button className="compare-close" onClick={onClose}><X size={15} strokeWidth={2} /></button>
      </div>
      <div className="compare-scroll">
        <table className="compare-table">
          <thead>
            <tr>
              <th className="compare-label-col"></th>
              {products.map((p, i) => (
                <th key={i} className="compare-product-col">
                  <div className="cth-brand">{p.brand}</div>
                  <div className="cth-name">{p.productName}</div>
                  <div className="cth-price">{p.price}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label}>
                <td className="compare-row-label">{row.label}</td>
                {products.map((p, i) => (
                  <td key={i} className="compare-row-val">{row.get(p) || "—"}</td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="compare-row-label"><ThumbsUp size={12} strokeWidth={2} /> {t("pros")}</td>
              {products.map((p, i) => (
                <td key={i} className="compare-row-val compare-pros">
                  <ul>{p.prosAndCons?.pros?.slice(0, 2).map((x, j) => <li key={j}>{x}</li>)}</ul>
                </td>
              ))}
            </tr>
            <tr>
              <td className="compare-row-label"><ThumbsDown size={12} strokeWidth={2} /> {t("cons")}</td>
              {products.map((p, i) => (
                <td key={i} className="compare-row-val compare-cons">
                  <ul>{p.prosAndCons?.cons?.slice(0, 2).map((x, j) => <li key={j}>{x}</li>)}</ul>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductCarousel({ products, compareList, onToggleCompare, user, savedNames, onToggleSave }) {
  const { t } = useLanguage();

  if (!products?.length) return null;

  const currentType = compareList.length > 0 ? detectDeviceType(compareList[0]) : null;

  return (
    <div className="carousel-wrap">
      {/* Scrollable cards */}
      <div className="carousel-track">
        {products.map((product, idx) => {
          const isSelected = compareList.some((p) => p === product || p.productName === product.productName);
          const productType = detectDeviceType(product);
          const isDisabled = !isSelected && currentType !== null && currentType !== productType;
          const isSaved = savedNames ? savedNames.has(product.productName) : false;

          return (
            <div key={idx} className="carousel-slot">
              <MiniCard
                product={product}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onToggleSelect={() => onToggleCompare(product)}
                user={user}
                isSaved={isSaved}
                onToggleSave={onToggleSave}
              />
            </div>
          );
        })}
      </div>

      {/* Scroll hint dots */}
      <div className="carousel-dots">
        {products.map((_, idx) => (
          <span key={idx} className="carousel-dot" />
        ))}
      </div>
    </div>
  );
}

export default ProductCarousel;
