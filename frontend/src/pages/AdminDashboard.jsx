import React, { useState, useEffect } from "react";
import {
  Settings, Map, BarChart2, Store, ShieldCheck, AlertTriangle,
  Eye, MousePointerClick, TrendingUp, Activity, Wallet, ChevronDown,
} from "lucide-react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";

const API = (import.meta.env.VITE_API_URL||"http://localhost:5000")+"";

function KpiCard({ color, icon: Icon, value, label }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon-wrap"><Icon size={17} strokeWidth={1.75} /></div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  );
}

function AdminDashboard() {
  const { t } = useLanguage();

  const [collapsed, setCollapsed] = useState({ usage: true, trends: true, budget: true, geo: true });
  const toggleCard = (key) => setCollapsed(p => ({ ...p, [key]: !p[key] }));

  const [analytics, setAnalytics] = useState({
    totalRecommendations: 0,
    totalShops: 0,
    verifiedShops: 0,
    pendingShops: 0,
    topProducts: [],
    topDevices: [],
    topShops: [],
    cityDistribution: [],
    platformConversionRate: 0,
    totalPlatformImpressions: 0,
    totalPlatformClicks: 0,
    budgetStats: { lak: { count:0, min:0, max:0, avg:0, buckets:[] }, usd: { count:0, min:0, max:0, avg:0, buckets:[] } },
  });
  const [trends, setTrends]   = useState([]);
  const [trendRange, setTrendRange] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchData(); }, []);
  // Refetch only the chart when the day/week/month/year range changes.
  useEffect(() => { fetchTrends(trendRange); }, [trendRange]);

  const fetchTrends = async (range) => {
    try {
      const res = await axios.get(`${API}/api/admin/trends?range=${range}`, { headers });
      if (res.data.success) setTrends(res.data.daily);
    } catch { /* keep previous chart on error */ }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const analyticsRes = await axios.get(`${API}/api/admin/analytics`, { headers });
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch {
      setError(t("failedFetchAdmin"));
    } finally {
      setLoading(false);
    }
  };

  const fmtLAK = (v) => {
    if (!v) return "₭0";
    if (v >= 1_000_000) return `₭${(v / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    return `₭${v.toLocaleString()}`;
  };

  if (loading) return <div className="dashboard-loading">{t("adminTitle")}...</div>;

  return (
    <div className="dashboard-container admin-dashboard">

      {/* Hero Header */}
      <div className="admin-hero-header">
        <div className="admin-hero-left">
          <div className="admin-hero-icon">
            <Settings size={22} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="admin-hero-title">{t("adminTitle")}</h1>
            <p className="admin-hero-sub">{t("adminSub")}</p>
          </div>
        </div>
        <div className="admin-live-badge">
          <Activity size={12} strokeWidth={2} />
          {t("liveDashboard")}
        </div>
      </div>

      {error && <div className="dashboard-error-message">{error}</div>}

      {/* KPI Row 1 */}
      <div className="kpi-row-label">{t("kpiPlatformActivity")}</div>
      <div className="kpi-grid kpi-4">
        <KpiCard color="purple" icon={BarChart2}    value={analytics.totalRecommendations} label={t("kpiTotalRecs")} />
        <KpiCard color="blue"   icon={Store}         value={analytics.totalShops}           label={t("kpiRegisteredShops")} />
        <KpiCard color="green"  icon={ShieldCheck}   value={analytics.verifiedShops}        label={t("kpiVerifiedShops")} />
        <KpiCard color="amber"  icon={AlertTriangle} value={analytics.pendingShops}         label={t("kpiPendingVerify")} />
      </div>

      {/* KPI Row 2 */}
      <div className="kpi-row-label" style={{ marginTop: "1rem" }}>{t("kpiConversionFunnel")}</div>
      <div className="kpi-grid kpi-3">
        <KpiCard color="indigo" icon={Eye}               value={analytics.totalPlatformImpressions}     label={t("kpiImpressions")} />
        <KpiCard color="rose"   icon={MousePointerClick} value={analytics.totalPlatformClicks}           label={t("kpiClicks")} />
        <KpiCard color="teal"   icon={TrendingUp}        value={`${analytics.platformConversionRate}%`} label={t("kpiConversion")} />
      </div>

      <div className="dashboard-grid">

        {/* System Usage Reports */}
        <div className="dashboard-card admin-section-card">
          <div
            className="admin-section-header section-purple collapsible-header"
            onClick={() => toggleCard("usage")}
          >
            <BarChart2 size={15} strokeWidth={1.75} />
            <h2>{t("adminUsageReports")}</h2>
            <ChevronDown size={15} strokeWidth={2} className={`collapse-chevron ${collapsed.usage ? "" : "rotated"}`} />
          </div>

          {!collapsed.usage && (
            <>
              <div className="analytics-section">
                <h3>{t("adminTopGemini")}</h3>
                {analytics.topProducts.length === 0 ? (
                  <p className="no-data">{t("adminNoRecs")}</p>
                ) : (
                  <ul className="minimal-list">
                    {analytics.topProducts.map((item, idx) => (
                      <li key={idx} className="list-item">
                        <span className="product-rank">{idx + 1}</span>
                        <span className="product-name">{item.recommended_product}</span>
                        <span className="product-count">{item.count} {t("hitsLabel")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="analytics-section">
                <h3>{t("adminTopDevices")}</h3>
                {analytics.topDevices.length === 0 ? (
                  <p className="no-data">{t("adminNoSearches")}</p>
                ) : (
                  <ul className="minimal-list">
                    {analytics.topDevices.map((item, idx) => (
                      <li key={idx} className="list-item">
                        <span className="product-rank">{idx + 1}</span>
                        <span className="product-name">{item.device}</span>
                        <span className="product-count">{item.count} {t("searchesLabel")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="analytics-section">
                <h3>{t("adminTopShops")}</h3>
                {analytics.topShops.length === 0 ? (
                  <p className="no-data">{t("adminNoAds")}</p>
                ) : (
                  <ul className="minimal-list">
                    {analytics.topShops.map((item, idx) => (
                      <li key={idx} className="list-item">
                        <span className="product-rank">{idx + 1}</span>
                        <span className="product-name">{item.name}</span>
                        <span className="product-count">{item.impressions} {t("viewsLabel")}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </div>

        {/* Recommendations trend chart */}
        <div className="dashboard-card admin-section-card">
          <div
            className="admin-section-header section-purple collapsible-header"
            onClick={() => toggleCard("trends")}
          >
            <Activity size={15} strokeWidth={1.75} />
            <h2>Recommendations — {t(`trendTitle_${trendRange}`)}</h2>
            <ChevronDown size={15} strokeWidth={2} className={`collapse-chevron ${collapsed.trends ? "" : "rotated"}`} />
          </div>

          {!collapsed.trends && (
            <>
              <div className="trend-range-tabs">
                {["day", "week", "month", "year"].map((r) => (
                  <button
                    key={r}
                    className={`trend-range-tab ${trendRange === r ? "active" : ""}`}
                    onClick={() => setTrendRange(r)}
                  >
                    {t(`trend_${r}`)}
                  </button>
                ))}
              </div>
              {trends.length === 0 ? (
                <p className="no-data">No data yet</p>
              ) : (() => {
                const maxVal = Math.max(...trends.map(d => d.count), 1);
                // Many bars (month/day) would crowd the labels — hide them and rely on hover.
                const showLabels = trends.length <= 12;
                return (
                  <div className="trend-chart">
                    {trends.map((d, i) => (
                      <div key={i} className="trend-col" title={`${d.label}: ${d.count}`}>
                        <div className="trend-bar-wrap">
                          {d.count > 0 && showLabels && <span className="trend-val">{d.count}</span>}
                          <div
                            className="trend-bar"
                            style={{ height: `${Math.max((d.count / maxVal) * 90, d.count > 0 ? 6 : 2)}%` }}
                          />
                        </div>
                        {showLabels && <span className="trend-date">{d.label}</span>}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>

        {/* Budget Range Insights */}
        <div className="dashboard-card admin-section-card">
          <div
            className="admin-section-header section-amber collapsible-header"
            onClick={() => toggleCard("budget")}
          >
            <Wallet size={15} strokeWidth={1.75} />
            <h2>{t("adminBudgetTitle")}</h2>
            <ChevronDown size={15} strokeWidth={2} className={`collapse-chevron ${collapsed.budget ? "" : "rotated"}`} />
          </div>

          {!collapsed.budget && (
            <>
              <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", marginBottom: "1rem" }}>
                {t("adminBudgetSub")}
              </p>
              {analytics.budgetStats.lak.count === 0 && analytics.budgetStats.usd.count === 0 ? (
                <p className="no-data">{t("adminBudgetNoData")}</p>
              ) : (
                <>
                  {analytics.budgetStats.lak.count > 0 && (
                    <div className="analytics-section">
                      <h3>{t("adminBudgetLAK")} <span className="budget-count-badge">{analytics.budgetStats.lak.count}</span></h3>
                      <div className="budget-stat-row">
                        <div className="budget-stat-box">
                          <span className="budget-stat-label">{t("adminBudgetLowest")}</span>
                          <span className="budget-stat-val">{fmtLAK(analytics.budgetStats.lak.min)}</span>
                        </div>
                        <div className="budget-stat-box budget-stat-highlight">
                          <span className="budget-stat-label">{t("adminBudgetAvg")}</span>
                          <span className="budget-stat-val">{fmtLAK(analytics.budgetStats.lak.avg)}</span>
                        </div>
                        <div className="budget-stat-box">
                          <span className="budget-stat-label">{t("adminBudgetHighest")}</span>
                          <span className="budget-stat-val">{fmtLAK(analytics.budgetStats.lak.max)}</span>
                        </div>
                      </div>
                      <h4 className="demand-col-title" style={{ marginTop: "1rem" }}>{t("adminBudgetDist")}</h4>
                      <div className="city-demand-list">
                        {analytics.budgetStats.lak.buckets.map((b, i) => {
                          const maxB = Math.max(...analytics.budgetStats.lak.buckets.map(x => x.count), 1);
                          return (
                            <div key={i} className="city-demand-row">
                              <span className="city-demand-name">{b.range}</span>
                              <div className="city-demand-bar-wrap">
                                <div className="city-demand-bar budget-bar" style={{ width: `${(b.count / maxB) * 100}%` }} />
                              </div>
                              <span className="city-demand-count">{b.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {analytics.budgetStats.usd.count > 0 && (
                    <div className="analytics-section">
                      <h3>{t("adminBudgetUSD")} <span className="budget-count-badge">{analytics.budgetStats.usd.count}</span></h3>
                      <div className="budget-stat-row">
                        <div className="budget-stat-box">
                          <span className="budget-stat-label">{t("adminBudgetLowest")}</span>
                          <span className="budget-stat-val">${analytics.budgetStats.usd.min}</span>
                        </div>
                        <div className="budget-stat-box budget-stat-highlight">
                          <span className="budget-stat-label">{t("adminBudgetAvg")}</span>
                          <span className="budget-stat-val">${analytics.budgetStats.usd.avg}</span>
                        </div>
                        <div className="budget-stat-box">
                          <span className="budget-stat-label">{t("adminBudgetHighest")}</span>
                          <span className="budget-stat-val">${analytics.budgetStats.usd.max}</span>
                        </div>
                      </div>
                      <div className="city-demand-list" style={{ marginTop: "0.75rem" }}>
                        {analytics.budgetStats.usd.buckets.map((b, i) => {
                          const maxB = Math.max(...analytics.budgetStats.usd.buckets.map(x => x.count), 1);
                          return (
                            <div key={i} className="city-demand-row">
                              <span className="city-demand-name">{b.range}</span>
                              <div className="city-demand-bar-wrap">
                                <div className="city-demand-bar budget-bar-usd" style={{ width: `${(b.count / maxB) * 100}%` }} />
                              </div>
                              <span className="city-demand-count">{b.count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Geographic Demand */}
        <div className="dashboard-card admin-section-card">
          <div
            className="admin-section-header section-teal collapsible-header"
            onClick={() => toggleCard("geo")}
          >
            <Map size={15} strokeWidth={1.75} />
            <h2>{t("adminGeoTitle")}</h2>
            <ChevronDown size={15} strokeWidth={2} className={`collapse-chevron ${collapsed.geo ? "" : "rotated"}`} />
          </div>

          {!collapsed.geo && (
            analytics.cityDistribution.length === 0 ? (
              <p className="no-data">{t("adminNoCities")}</p>
            ) : (
              <>
                <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.3)", marginBottom: "1rem" }}>
                  {t("adminGeoCities")}
                </p>
                <div className="city-demand-list">
                  {analytics.cityDistribution.map((item, idx) => {
                    const maxCount = analytics.cityDistribution[0]?.count || 1;
                    return (
                      <div key={idx} className="city-demand-row">
                        <span className="city-demand-name">{item.city}</span>
                        <div className="city-demand-bar-wrap">
                          <div className="city-demand-bar" style={{ width: `${(item.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="city-demand-count">{item.count}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;
