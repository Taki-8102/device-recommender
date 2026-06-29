import React, { useState } from "react";
import {
  AlertTriangle, Monitor, Cpu, Battery, ChevronDown, ChevronUp,
  List, ThumbsUp, ThumbsDown, MapPin, Phone, ArrowLeftRight,
  Laptop, Tablet, Smartphone, Tv2, CheckCircle,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./ProductCardMini.css";

const ICO = { size: 14, strokeWidth: 1.75 };

function ProductCardMini({ product }) {
  const { t } = useLanguage();
  const [showDetails, setShowDetails] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  if (product.error) {
    return (
      <div className="product-mini error">
        <AlertTriangle {...ICO} />
        <p>{product.error}</p>
      </div>
    );
  }

  const getDeviceIcon = () => {
    const tagged = (product.deviceType || product.device || "").toLowerCase();
    if (tagged.includes("laptop") || tagged.includes("notebook")) return <Laptop {...ICO} />;
    if (tagged.includes("tablet")) return <Tablet {...ICO} />;
    if (tagged.includes("desktop") || tagged.includes("pc")) return <Tv2 {...ICO} />;
    if (tagged.includes("phone")) return <Smartphone {...ICO} />;
    const name = (product.productName || "").toLowerCase();
    if (name.includes("laptop") || name.includes("macbook") || name.includes("thinkpad")) return <Laptop {...ICO} />;
    if (name.includes("ipad") || name.includes("tablet") || name.includes("tab")) return <Tablet {...ICO} />;
    if (name.includes("pc") || name.includes("desktop")) return <Tv2 {...ICO} />;
    return <Smartphone {...ICO} />;
  };

  return (
    <div className="product-mini">
      {/* Compact Header */}
      <div className="mini-header">
        <div className="mini-image">
          {!imgError && product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.productName}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="img-placeholder">{getDeviceIcon()}</div>
          )}
        </div>
        <div className="mini-info">
          <span className="mini-brand">{product.brand}</span>
          <h3>{product.productName}</h3>
          <p className="mini-price">{product.price}</p>
        </div>
      </div>

      {/* Reasoning */}
      <p className="mini-reasoning">{product.reasoning}</p>

      {/* Quick Specs */}
      {product.specs && (
        <div className="mini-specs">
          {product.specs.display    && <span><Monitor   {...ICO} /> {product.specs.display}</span>}
          {product.specs.processor  && <span><Cpu       {...ICO} /> {product.specs.processor}</span>}
          {product.specs.battery    && <span><Battery   {...ICO} /> {product.specs.battery}</span>}
        </div>
      )}

      {/* Toggle Details */}
      <button className="toggle-details" onClick={() => setShowDetails(!showDetails)}>
        {showDetails
          ? <><ChevronUp   {...ICO} /> {t("lessDetails")}</>
          : <><ChevronDown {...ICO} /> {t("moreDetails")}</>}
      </button>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mini-details">
          {/* All Specs */}
          {product.specs && (
            <div className="detail-section">
              <h4><List {...ICO} /> {t("fullSpecs")}</h4>
              <div className="specs-list">
                {product.specs.display    && <div><strong>{t("specDisplay")}:</strong> {product.specs.display}</div>}
                {product.specs.processor  && <div><strong>{t("specProcessor")}:</strong> {product.specs.processor}</div>}
                {product.specs.ram        && <div><strong>{t("specRam")}:</strong> {product.specs.ram}</div>}
                {product.specs.storage    && <div><strong>{t("specStorage")}:</strong> {product.specs.storage}</div>}
                {product.specs.battery    && <div><strong>{t("specBattery")}:</strong> {product.specs.battery}</div>}
                {product.specs.weight     && <div><strong>{t("specWeight")}:</strong> {product.specs.weight}</div>}
              </div>
            </div>
          )}

          {/* Pros & Cons */}
          {product.prosAndCons && (
            <div className="detail-section pros-cons">
              <div className="pros">
                <h4><ThumbsUp {...ICO} /> {t("pros")}</h4>
                <ul>
                  {product.prosAndCons.pros?.map((pro, idx) => (
                    <li key={idx}>{pro}</li>
                  ))}
                </ul>
              </div>
              <div className="cons">
                <h4><ThumbsDown {...ICO} /> {t("cons")}</h4>
                <ul>
                  {product.prosAndCons.cons?.map((con, idx) => (
                    <li key={idx}>{con}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Nearby Shops */}
          {product.nearbyShops && product.nearbyShops.length > 0 && (
            <div className="detail-section">
              <h4><MapPin {...ICO} /> {t("whereToBuy")}</h4>
              <div className="shops-container">
                {product.nearbyShops.map((shop, idx) => {
                  let socials = null;
                  if (shop.social_media_links) {
                    try {
                      socials = typeof shop.social_media_links === "string"
                        ? JSON.parse(shop.social_media_links)
                        : shop.social_media_links;
                    } catch (e) {}
                  }

                  return (
                    <div key={idx} className={`shop-item ${shop.is_verified ? "verified-partner-shop" : ""}`}>
                      <div className="shop-name-row">
                        <strong>{shop.name}</strong>
                        {shop.is_verified && (
                          <span className="verified-badge-mini">
                            <CheckCircle size={12} strokeWidth={2} /> {t("partner")}
                          </span>
                        )}
                      </div>
                      <span>{shop.address}</span>
                      {shop.phone && (
                        <span><Phone size={12} strokeWidth={1.75} /> {shop.phone}</span>
                      )}

                      {(shop.google_map_url || socials) && (
                        <div className="shop-links-row">
                          {shop.google_map_url && (
                            <a href={shop.google_map_url} target="_blank" rel="noopener noreferrer" className="shop-link-btn map">
                              Map ↗
                            </a>
                          )}
                          {socials?.facebook && (
                            <a href={socials.facebook} target="_blank" rel="noopener noreferrer" className="shop-link-btn fb">
                              Facebook
                            </a>
                          )}
                          {socials?.line      && <span className="shop-link-text line">Line: {socials.line}</span>}
                          {socials?.instagram && <span className="shop-link-text ig">IG: {socials.instagram}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Alternatives */}
          {product.alternatives && product.alternatives.length > 0 && (
            <div className="detail-section">
              <h4><ArrowLeftRight {...ICO} /> {t("alternatives")}</h4>
              {product.alternatives.map((alt, idx) => (
                <div key={idx} className="alt-item">
                  <div className="alt-header">
                    <strong>{alt.name}</strong>
                    <span>{alt.price}</span>
                  </div>
                  <p>{alt.reason}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductCardMini;
