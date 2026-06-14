import React from "react";
import {
  AlertTriangle, Lightbulb, List, Monitor, Cpu, MemoryStick,
  HardDrive, Battery, Scale, ThumbsUp, ThumbsDown,
  MapPin, Phone, ArrowLeftRight, Search,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./ProductCard.css";

const ICO = { size: 16, strokeWidth: 1.75 };

function ProductCard({ product, onReset }) {
  const { t } = useLanguage();
  if (!product) return null;

  if (product.error) {
    return (
      <div className="product-card error">
        <h2><AlertTriangle size={20} strokeWidth={1.75} /> {t("somethingWrong")}</h2>
        <p>{product.error}</p>
        {product.raw && (
          <details>
            <summary>Raw Response</summary>
            <pre>{product.raw}</pre>
          </details>
        )}
        <button onClick={onReset} className="reset-btn">{t("tryAgain")}</button>
      </div>
    );
  }

  return (
    <div className="product-card">
      {/* Header */}
      <div className="card-header">
        <div className="product-image">
          <img
            src={product.imageUrl}
            alt={product.productName}
            onError={(e) => {
              e.target.src = "https://via.placeholder.com/300x300?text=No+Image";
            }}
          />
        </div>
        <div className="product-intro">
          <span className="brand-tag">{product.brand}</span>
          <h2>{product.productName}</h2>
          <p className="price">{product.price}</p>
        </div>
      </div>

      {/* Why this matches */}
      <div className="card-section reasoning">
        <h3><Lightbulb {...ICO} /> {t("whyMatches")}</h3>
        <p>{product.reasoning}</p>
      </div>

      {/* Specifications */}
      {product.specs && (
        <div className="card-section specs">
          <h3><List {...ICO} /> {t("specifications")}</h3>
          <div className="specs-grid">
            {product.specs.display && (
              <div className="spec-item">
                <span className="spec-icon"><Monitor {...ICO} /></span>
                <span className="spec-label">{t("specDisplay")}</span>
                <span className="spec-value">{product.specs.display}</span>
              </div>
            )}
            {product.specs.processor && (
              <div className="spec-item">
                <span className="spec-icon"><Cpu {...ICO} /></span>
                <span className="spec-label">{t("specProcessor")}</span>
                <span className="spec-value">{product.specs.processor}</span>
              </div>
            )}
            {product.specs.ram && (
              <div className="spec-item">
                <span className="spec-icon"><MemoryStick {...ICO} /></span>
                <span className="spec-label">{t("specRam")}</span>
                <span className="spec-value">{product.specs.ram}</span>
              </div>
            )}
            {product.specs.storage && (
              <div className="spec-item">
                <span className="spec-icon"><HardDrive {...ICO} /></span>
                <span className="spec-label">{t("specStorage")}</span>
                <span className="spec-value">{product.specs.storage}</span>
              </div>
            )}
            {product.specs.battery && (
              <div className="spec-item">
                <span className="spec-icon"><Battery {...ICO} /></span>
                <span className="spec-label">{t("specBattery")}</span>
                <span className="spec-value">{product.specs.battery}</span>
              </div>
            )}
            {product.specs.weight && (
              <div className="spec-item">
                <span className="spec-icon"><Scale {...ICO} /></span>
                <span className="spec-label">{t("specWeight")}</span>
                <span className="spec-value">{product.specs.weight}</span>
              </div>
            )}
          </div>
          {product.specs.specialFeatures && product.specs.specialFeatures.length > 0 && (
            <div className="special-features">
              <h4>{t("specialFeatures")}</h4>
              <div className="feature-tags">
                {product.specs.specialFeatures.map((feature, idx) => (
                  <span key={idx} className="feature-tag">{feature}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pros and Cons */}
      {product.prosAndCons && (
        <div className="card-section pros-cons">
          <div className="pros">
            <h3><ThumbsUp {...ICO} /> {t("pros")}</h3>
            <ul>
              {product.prosAndCons.pros?.map((pro, idx) => (
                <li key={idx}>{pro}</li>
              ))}
            </ul>
          </div>
          <div className="cons">
            <h3><ThumbsDown {...ICO} /> {t("cons")}</h3>
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
        <div className="card-section shops">
          <h3><MapPin {...ICO} /> {t("whereToBuyNear")}</h3>
          <div className="shops-list">
            {product.nearbyShops.map((shop, idx) => (
              <div key={idx} className="shop-item">
                {shop.image_path && (
                  <img
                    src={`${import.meta.env.VITE_API_URL||"http://localhost:5000"}${shop.image_path}`}
                    alt={shop.name}
                    className="shop-item-logo"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                )}
                <strong>{shop.name}</strong>
                <p>{shop.address}</p>
                {shop.phone && (
                  <span className="phone"><Phone size={13} strokeWidth={1.75} /> {shop.phone}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Alternatives */}
      {product.alternatives && product.alternatives.length > 0 && (
        <div className="card-section alternatives">
          <h3><ArrowLeftRight {...ICO} /> {t("altToConsider")}</h3>
          <div className="alternatives-list">
            {product.alternatives.map((alt, idx) => (
              <div key={idx} className="alt-item">
                <div className="alt-header">
                  <strong>{alt.name}</strong>
                  <span className="alt-price">{alt.price}</span>
                </div>
                <p>{alt.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Button */}
      <button onClick={onReset} className="reset-btn">
        <Search size={15} strokeWidth={2} /> {t("searchAgain")}
      </button>
    </div>
  );
}

export default ProductCard;
