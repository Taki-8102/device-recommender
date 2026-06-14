import React, { useState, useEffect, useRef } from "react";
import { Store, BadgeCheck, Clock, TrendingUp, Map, AlertCircle, Package, Camera } from "lucide-react";
import axios from "axios";

const API = (import.meta.env.VITE_API_URL||"http://localhost:5000")+"";

const DEVICE_CATEGORIES = ["Smartphone", "Tablet", "Laptop", "Gaming PC"];

function ShopDashboard() {
  const [profile, setProfile] = useState({
    name: "", address_text: "", google_map_url: "",
    phone: "", city: "", social_media_links: "{}", is_verified: 0,
  });
  const [socials, setSocials] = useState({ facebook: "", line: "", instagram: "" });

  const [analytics, setAnalytics] = useState({
    totalImpressions: 0, totalClicks: 0, conversionRate: 0,
    clickBreakdown: {}, dailyViews: [], topDevices: [],
  });
  const [marketDemand, setMarketDemand] = useState(null);
  const [missedOps, setMissedOps]       = useState(null);
  const [inventory, setInventory]       = useState([]);

  const [editMode,    setEditMode]    = useState(false);
  const [loading,     setLoading]     = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [message,     setMessage]     = useState("");
  const [error,       setError]       = useState("");
  const [imageFile,   setImageFile]   = useState(null);
  const [imagePreview,setImagePreview]= useState(null);
  const fileInputRef = useRef(null);

  const token = localStorage.getItem("token");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const headers = { Authorization: `Bearer ${token}` };

      const [profRes, analRes, demandRes, missedRes, invRes] = await Promise.all([
        axios.get((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/profile",              { headers }),
        axios.get((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/analytics",            { headers }),
        axios.get((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/market-demand",        { headers }),
        axios.get((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/missed-opportunities", { headers }),
        axios.get((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/inventory",            { headers }),
      ]);

      if (profRes.data.success) {
        setProfile(profRes.data.data);
        setImagePreview(null);
        setImageFile(null);
        try {
          const s = JSON.parse(profRes.data.data.social_media_links || "{}");
          setSocials({ facebook: s.facebook || "", line: s.line || "", instagram: s.instagram || "" });
        } catch (_) {}
      }
      if (analRes.data.success)   setAnalytics(analRes.data.data);
      if (demandRes.data.success) setMarketDemand(demandRes.data.data);
      if (missedRes.data.success) setMissedOps(missedRes.data.data);
      if (invRes.data.success)    setInventory(invRes.data.data.map(i => i.device_category));
    } catch (err) {
      setError("Failed to load shop details.");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handleSocialChange  = (e) => setSocials({ ...socials,  [e.target.name]: e.target.value });

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSaveLoading(true); setMessage(""); setError("");
    try {
      const headers = { Authorization: `Bearer ${token}` };
      if (imageFile) {
        const fd = new FormData();
        fd.append("image", imageFile);
        const imgRes = await axios.post(`${API}/api/shop/upload-image`, fd, {
          headers: { ...headers, "Content-Type": "multipart/form-data" },
        });
        if (imgRes.data.success) {
          setProfile(p => ({ ...p, image_path: imgRes.data.image_path }));
        }
      }
      const res = await axios.put(
        `${API}/api/shop/profile`,
        { ...profile, social_media_links: JSON.stringify(socials) },
        { headers }
      );
      if (res.data.success) { setMessage("Profile updated successfully."); setEditMode(false); fetchData(); }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update profile.");
    } finally { setSaveLoading(false); }
  };

  const toggleInventory = async (category) => {
    const headers = { Authorization: `Bearer ${token}` };
    const has = inventory.includes(category);
    try {
      if (has) {
        await axios.delete((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/inventory", {
          headers, data: { deviceCategory: category },
        });
        setInventory(prev => prev.filter(c => c !== category));
      } else {
        await axios.post((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/inventory",
          { deviceCategory: category }, { headers });
        setInventory(prev => [...prev, category]);
      }
    } catch (_) {}
  };

  // Track click-throughs on contact links
  const trackClick = async (shopId, clickType) => {
    try {
      await axios.post((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/shop/click", { shopId, clickType });
    } catch (_) {}
  };

  if (loading) return <div className="dashboard-loading">Loading Shop Dashboard...</div>;

  const maxImpressions = Math.max(...(analytics.dailyViews.map(d => d.count)), 1);

  return (
    <div className="dashboard-container">

      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1><Store size={20} strokeWidth={1.75} /> {profile.name || "Your Shop"}</h1>
          <p className="city-tag">Location: {profile.city || "Not specified"}</p>
        </div>
        <div className={`status-badge ${profile.is_verified === 1 ? "verified" : "pending"}`}>
          {profile.is_verified === 1
            ? <><BadgeCheck size={14} strokeWidth={2} /> Verified Ad Partner</>
            : <><Clock size={14} strokeWidth={1.75} /> Verification Pending</>}
        </div>
      </div>

      {message && <div className="dashboard-success-message">{message}</div>}
      {error   && <div className="dashboard-error-message">{error}</div>}

      {/* ── Row 1: Profile + Conversion Funnel ── */}
      <div className="dashboard-grid">

        {/* Profile card */}
        <div className="dashboard-card profile-card">
          <div className="card-header">
            <h2>Shop Advertisement Profile</h2>
            <button onClick={() => setEditMode(!editMode)} className="btn-secondary-minimal">
              {editMode ? "Cancel" : "Edit Details"}
            </button>
          </div>

          {!editMode ? (
            <div className="profile-details">
              {profile.image_path && (
                <div className="shop-logo-preview">
                  <img src={`${API}${profile.image_path}`} alt="Shop logo" className="shop-logo-img" />
                </div>
              )}
              <div className="detail-row">
                <span className="label">Shop Name</span>
                <span className="value">{profile.name || "-"}</span>
              </div>
              <div className="detail-row">
                <span className="label">Phone</span>
                <span className="value">
                  {profile.phone ? (
                    <a
                      href={`tel:${profile.phone}`}
                      onClick={() => trackClick(profile.id, "phone")}
                    >{profile.phone}</a>
                  ) : "-"}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Google Maps Link</span>
                <span className="value">
                  {profile.google_map_url ? (
                    <a
                      href={profile.google_map_url}
                      target="_blank" rel="noopener noreferrer"
                      className="link-highlight"
                      onClick={() => trackClick(profile.id, "google_maps")}
                    >View on Google Maps ↗</a>
                  ) : "Not provided"}
                </span>
              </div>
              <div className="detail-row">
                <span className="label">Address</span>
                <span className="value text-block">{profile.address_text || "-"}</span>
              </div>
              <div className="detail-row">
                <span className="label">Social Media</span>
                <span className="value">
                  <div className="social-tags">
                    {socials.facebook && (
                      <span className="social-tag fb">
                        Facebook:{" "}
                        <a
                          href={socials.facebook} target="_blank" rel="noopener noreferrer"
                          onClick={() => trackClick(profile.id, "facebook")}
                        >{socials.facebook}</a>
                      </span>
                    )}
                    {socials.line && (
                      <span className="social-tag line"
                        onClick={() => trackClick(profile.id, "line")}
                        style={{ cursor: "pointer" }}
                      >Line: {socials.line}</span>
                    )}
                    {socials.instagram && (
                      <span className="social-tag ig"
                        onClick={() => trackClick(profile.id, "instagram")}
                        style={{ cursor: "pointer" }}
                      >Instagram: {socials.instagram}</span>
                    )}
                    {!socials.facebook && !socials.line && !socials.instagram && "None provided"}
                  </div>
                </span>
              </div>
            </div>
          ) : (
            <form onSubmit={handleProfileSubmit} className="minimal-form">
              {/* Logo upload */}
              <div className="form-group">
                <label>Shop Logo</label>
                <div className="logo-upload-row">
                  {(imagePreview || profile.image_path) && (
                    <img
                      src={imagePreview || `${API}${profile.image_path}`}
                      alt="Preview"
                      className="logo-upload-preview"
                    />
                  )}
                  <button type="button" className="btn-upload" onClick={() => fileInputRef.current.click()}>
                    <Camera size={15} strokeWidth={2} /> {profile.image_path || imagePreview ? "Change Logo" : "Upload Logo"}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: "none" }}
                    onChange={handleImageChange}
                  />
                  <span className="upload-hint">JPG / PNG / WebP · max 2 MB</span>
                </div>
              </div>
              <div className="form-group">
                <label>Shop Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleProfileChange} required />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City Location</label>
                  <input type="text" name="city" value={profile.city} onChange={handleProfileChange} required />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="text" name="phone" value={profile.phone} onChange={handleProfileChange} required />
                </div>
              </div>
              <div className="form-group">
                <label>Google Maps Link</label>
                <input type="url" name="google_map_url" value={profile.google_map_url} onChange={handleProfileChange} placeholder="https://maps.app.goo.gl/..." />
              </div>
              <div className="form-group">
                <label>Address Text</label>
                <textarea name="address_text" value={profile.address_text} onChange={handleProfileChange} placeholder="Village, road, subdistrict, zipcode" required />
              </div>
              <div className="social-edit-group">
                <h3>Social Media</h3>
                <div className="form-group">
                  <label>Facebook Page URL</label>
                  <input type="url" name="facebook" value={socials.facebook} onChange={handleSocialChange} placeholder="https://facebook.com/yourpage" />
                </div>
                <div className="form-group">
                  <label>Line Contact ID</label>
                  <input type="text" name="line" value={socials.line} onChange={handleSocialChange} placeholder="@shopline" />
                </div>
                <div className="form-group">
                  <label>Instagram Handle</label>
                  <input type="text" name="instagram" value={socials.instagram} onChange={handleSocialChange} placeholder="@shopig" />
                </div>
              </div>
              <button type="submit" className="btn-primary-minimal" disabled={saveLoading}>
                {saveLoading ? "Saving Changes..." : "Submit Updates"}
              </button>
            </form>
          )}
        </div>

        {/* Advertising performance + Conversion Funnel */}
        <div className="dashboard-card analytics-card">
          <h2>Advertising Performance Report</h2>

          {/* Conversion funnel stats */}
          <div className="funnel-stats-row">
            <div className="funnel-stat">
              <span className="funnel-stat-label">Impressions</span>
              <span className="funnel-stat-value">{analytics.totalImpressions}</span>
              <span className="funnel-stat-sub">Times shown to users</span>
            </div>
            <div className="funnel-arrow">→</div>
            <div className="funnel-stat">
              <span className="funnel-stat-label">Clicks</span>
              <span className="funnel-stat-value">{analytics.totalClicks}</span>
              <span className="funnel-stat-sub">Contacts clicked</span>
            </div>
            <div className="funnel-arrow">→</div>
            <div className="funnel-stat highlight">
              <span className="funnel-stat-label">Conversion</span>
              <span className="funnel-stat-value">{analytics.conversionRate}%</span>
              <span className="funnel-stat-sub">Click-through rate</span>
            </div>
          </div>

          {/* Click breakdown */}
          {Object.keys(analytics.clickBreakdown || {}).length > 0 && (
            <div className="analytics-section">
              <h3>Click-through Breakdown</h3>
              <div className="click-breakdown-row">
                {Object.entries(analytics.clickBreakdown).map(([type, count]) => (
                  <div key={type} className="click-type-chip">
                    <span className="click-type-label">{type.replace("_", " ")}</span>
                    <span className="click-type-count">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="analytics-section">
            <h3>Recent Impressions Trend</h3>
            {analytics.dailyViews.length === 0 ? (
              <p className="no-data">No impression data recorded yet.</p>
            ) : (
              <div className="bar-chart-container">
                {analytics.dailyViews.map((day) => (
                  <div key={day.view_date} className="chart-bar-row">
                    <span className="chart-date">{day.view_date}</span>
                    <div className="chart-bar-wrapper">
                      <div className="chart-bar" style={{ width: `${(day.count / maxImpressions) * 100}%` }} />
                    </div>
                    <span className="chart-count">{day.count} views</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="analytics-section">
            <h3>Top Recommended Devices Triggering Your Ads</h3>
            {analytics.topDevices.length === 0 ? (
              <p className="no-data">Your shop hasn't been featured in results yet.</p>
            ) : (
              <ul className="minimal-list">
                {analytics.topDevices.map((item, idx) => (
                  <li key={idx} className="list-item">
                    <span className="product-rank">{idx + 1}</span>
                    <span className="product-name">{item.recommended_product}</span>
                    <span className="product-count">{item.count} times</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ── Row 2: Market Demand + Missed Opportunities ── */}
      <div className="dashboard-grid">

        {/* Market Demand Insights */}
        <div className="dashboard-card">
          <h2><TrendingUp size={16} strokeWidth={1.75} style={{ marginRight: "0.5rem" }} />
            Market Demand Insights
            {marketDemand && <span className="card-subtitle"> · {marketDemand.city} · last 30 days</span>}
          </h2>

          {!marketDemand || marketDemand.totalSearches30Days === 0 ? (
            <p className="no-data" style={{ marginTop: "1rem" }}>
              No local search data yet. Demand telemetry appears once users search in your city.
            </p>
          ) : (
            <>
              <div className="demand-total-badge">
                <span>{marketDemand.totalSearches30Days}</span> total searches near your shop this month
              </div>
              <div className="demand-columns">
                <div>
                  <h4 className="demand-col-title">Top Device Types Searched</h4>
                  <ul className="minimal-list">
                    {marketDemand.topDevices.map((d, i) => (
                      <li key={i} className="list-item">
                        <span className="product-rank">{i + 1}</span>
                        <span className="product-name">{d.device}</span>
                        <span className="product-count">{d.count} searches</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="demand-col-title">Top Use-Cases</h4>
                  <ul className="minimal-list">
                    {marketDemand.topPurposes.map((p, i) => (
                      <li key={i} className="list-item">
                        <span className="product-rank">{i + 1}</span>
                        <span className="product-name">{p.purpose}</span>
                        <span className="product-count">{p.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Missed Opportunities */}
        <div className="dashboard-card">
          <h2>
            <AlertCircle size={16} strokeWidth={1.75} style={{ marginRight: "0.5rem" }} />
            Missed Opportunities
            <span className="card-subtitle"> · last 7 days</span>
          </h2>

          {!missedOps ? (
            <p className="no-data" style={{ marginTop: "1rem" }}>Loading...</p>
          ) : (
            <>
              <div className="missed-funnel-row">
                <div className="missed-stat">
                  <span className="missed-stat-value">{missedOps.week.total}</span>
                  <span className="missed-stat-label">Total searches in {missedOps.city}</span>
                </div>
                <div className="missed-minus">−</div>
                <div className="missed-stat success">
                  <span className="missed-stat-value">{missedOps.week.captured}</span>
                  <span className="missed-stat-label">You were shown</span>
                </div>
                <div className="missed-eq">=</div>
                <div className="missed-stat danger">
                  <span className="missed-stat-value">{missedOps.week.missed}</span>
                  <span className="missed-stat-label">Hot leads missed</span>
                </div>
              </div>

              {missedOps.week.missed > 0 && missedOps.missedByDevice.length > 0 && (
                <div className="analytics-section" style={{ marginTop: "1rem" }}>
                  <h3>Missed by Device Category</h3>
                  <ul className="minimal-list">
                    {missedOps.missedByDevice.map((item, idx) => (
                      <li key={idx} className="list-item">
                        <span className="product-rank">{idx + 1}</span>
                        <span className="product-name">{item.device}</span>
                        <span className="product-count text-warning">{item.count} missed</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Inventory management */}
              <div className="analytics-section" style={{ marginTop: "1.25rem" }}>
                <h3>
                  <Package size={14} strokeWidth={1.75} style={{ marginRight: "0.4rem" }} />
                  Your Listed Inventory
                </h3>
                <p className="no-data" style={{ marginBottom: "0.65rem", fontSize: "0.78rem" }}>
                  Tag what you carry so the AI can match you to more searches.
                </p>
                <div className="inventory-chips">
                  {DEVICE_CATEGORIES.map(cat => (
                    <button
                      key={cat}
                      className={`inventory-chip ${inventory.includes(cat) ? "active" : ""}`}
                      onClick={() => toggleInventory(cat)}
                    >
                      {cat} {inventory.includes(cat) ? "✓" : "+"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

    </div>
  );
}

export default ShopDashboard;
