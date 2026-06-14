import React, { useState } from "react";
import {
  Sparkles, Camera, Gamepad2, Globe, Briefcase,
  Film, BookOpen, Palette, GraduationCap, Video, Code2,
  X, ChevronLeft, ChevronRight, Smartphone, Tablet, Laptop, Clock,
  Moon, Zap, Cpu, Mail, Layers, Battery, Gauge, HardDrive, CameraOff,
  Thermometer, Monitor, PenTool, Wrench, Feather, Music, Database,
  Maximize2,
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import "./WizardPanel.css";

const ICON_SIZE   = 15;
const ICON_STROKE = 1.75;

// ── Device list ──────────────────────────────────────────────────────────────
const DEVICES = [
  { value: "Smartphone", Icon: Smartphone },
  { value: "Tablet",     Icon: Tablet     },
  { value: "Laptop",     Icon: Laptop     },
];

// ── Purposes per device ───────────────────────────────────────────────────────
const PURPOSES = {
  Smartphone: [
    { value: "General Use",         Icon: Sparkles  },
    { value: "Photography",         Icon: Camera    },
    { value: "Gaming",              Icon: Gamepad2  },
    { value: "Social Media",        Icon: Globe     },
    { value: "Work & Productivity", Icon: Briefcase },
  ],
  Tablet: [
    { value: "Entertainment",        Icon: Film      },
    { value: "Learning & Education", Icon: BookOpen  },
    { value: "Art & Drawing",        Icon: Palette   },
    { value: "Work & Productivity",  Icon: Briefcase },
  ],
  Laptop: [
    { value: "Office & Work",       Icon: Briefcase     },
    { value: "Student & Education", Icon: GraduationCap },
    { value: "Gaming",              Icon: Gamepad2      },
    { value: "Content Creation",    Icon: Video         },
    { value: "Programming",         Icon: Code2         },
  ],
};

// ── Drill-down config per purpose ─────────────────────────────────────────────
const DRILLDOWNS = {
  // Smartphone
  Photography: {
    options: [
      { value: "photo_casual",      labelKey: "photo_casual",      subKey: "photo_casual_sub",      Icon: Camera   },
      { value: "photo_nighttravel", labelKey: "photo_nighttravel", subKey: "photo_nighttravel_sub", badgeKey: "photo_nighttravel_badge", Icon: Moon  },
      { value: "photo_vlog",        labelKey: "photo_vlog",        subKey: "photo_vlog_sub",        badgeKey: "photo_vlog_badge",        Icon: Video },
    ],
  },
  Gaming: {
    options: [
      { value: "gaming_casual",      labelKey: "gaming_casual",      subKey: "gaming_casual_sub",      Icon: Gamepad2 },
      { value: "gaming_competitive", labelKey: "gaming_competitive", subKey: "gaming_competitive_sub", badgeKey: "gaming_competitive_badge", Icon: Zap  },
      { value: "gaming_heavy3d",     labelKey: "gaming_heavy3d",     subKey: "gaming_heavy3d_sub",     badgeKey: "gaming_heavy3d_badge",     Icon: Cpu  },
    ],
  },
  "Work & Productivity": {
    options: [
      { value: "work_light", labelKey: "work_light", subKey: "work_light_sub", Icon: Mail   },
      { value: "work_power", labelKey: "work_power", subKey: "work_power_sub", badgeKey: "work_power_badge", Icon: Layers },
    ],
  },
  // Tablet
  "Art & Drawing": {
    options: [
      { value: "art_pro",        labelKey: "art_pro",        subKey: "art_pro_sub",        badgeKey: "art_pro_badge", Icon: PenTool },
      { value: "art_casual_dd",  labelKey: "art_casual_dd",  subKey: "art_casual_dd_sub",  Icon: Palette },
    ],
  },
  // Laptop
  "Office & Work": {
    options: [
      { value: "work_light", labelKey: "work_light", subKey: "work_light_sub", Icon: Mail   },
      { value: "work_power", labelKey: "work_power", subKey: "work_power_sub", badgeKey: "work_power_badge", Icon: Layers },
    ],
  },
  Programming: {
    options: [
      { value: "prog_webdev",      labelKey: "prog_webdev",      subKey: "prog_webdev_sub",      Icon: Globe    },
      { value: "prog_datascience", labelKey: "prog_datascience", subKey: "prog_datascience_sub", badgeKey: "prog_datascience_badge", Icon: Database },
      { value: "prog_general",     labelKey: "prog_general",     subKey: "prog_general_sub",     Icon: Code2    },
    ],
  },
  "Content Creation": {
    options: [
      { value: "content_video", labelKey: "content_video", subKey: "content_video_sub", badgeKey: "content_video_badge", Icon: Video  },
      { value: "content_photo", labelKey: "content_photo", subKey: "content_photo_sub", Icon: Camera  },
      { value: "content_music", labelKey: "content_music", subKey: "content_music_sub", Icon: Music   },
    ],
  },
};

// ── Pain points per device ────────────────────────────────────────────────────
const PAIN_POINTS = {
  Smartphone: [
    { value: "battery",  labelKey: "pain_battery",  Icon: Battery     },
    { value: "lag",      labelKey: "pain_lag",       Icon: Gauge       },
    { value: "cracking", labelKey: "pain_cracking",  Icon: Cpu         },
    { value: "storage",  labelKey: "pain_storage",   Icon: HardDrive   },
    { value: "camera",   labelKey: "pain_camera",    Icon: CameraOff   },
    { value: "heat",     labelKey: "pain_heat",      Icon: Thermometer },
  ],
  Tablet: [
    { value: "battery",  labelKey: "pain_battery",  Icon: Battery     },
    { value: "lag",      labelKey: "pain_lag",       Icon: Gauge       },
    { value: "storage",  labelKey: "pain_storage",   Icon: HardDrive   },
    { value: "display",  labelKey: "pain_display",   Icon: Monitor     },
    { value: "stylus",   labelKey: "pain_stylus",    Icon: PenTool     },
  ],
  Laptop: [
    { value: "battery",  labelKey: "pain_battery",  Icon: Battery     },
    { value: "lag",      labelKey: "pain_lag",       Icon: Gauge       },
    { value: "heat",     labelKey: "pain_heat",      Icon: Thermometer },
    { value: "storage",  labelKey: "pain_storage",   Icon: HardDrive   },
    { value: "build",    labelKey: "pain_build",     Icon: Wrench      },
    { value: "weight",   labelKey: "pain_weight",    Icon: Feather     },
  ],
};

// ── Brand config ──────────────────────────────────────────────────────────────
const BRANDS = {
  Smartphone: {
    premium: ["Apple", "Samsung", "Google", "Sony"],
    value:   ["Xiaomi", "Oppo", "Vivo", "Realme", "OnePlus"],
  },
  Tablet: {
    premium: ["Apple", "Samsung", "Microsoft"],
    value:   ["Lenovo", "Amazon"],
  },
  Laptop: {
    premium: ["Apple", "Dell", "HP"],
    value:   ["Lenovo", "ASUS", "Acer"],
  },
};

// ── Lifecycle options ─────────────────────────────────────────────────────────
const LIFECYCLE = {
  Smartphone: ["~1 year", "2 years", "3 years", "4+ years"],
  Tablet:     ["2 years", "3 years", "4 years", "5+ years"],
  Laptop:     ["2 years", "3 years", "4 years", "5+ years"],
};

// ── Screen size options ───────────────────────────────────────────────────────
const LAPTOP_SCREENS = [
  { value: "13-14 inch (Compact)",  labelKey: "screenCompact",  subKey: "screenCompact_sub",  Icon: Laptop    },
  { value: "15 inch (Standard)",    labelKey: "screenStandard", subKey: "screenStandard_sub", Icon: Maximize2 },
  { value: "16-17 inch (Large)",    labelKey: "screenLarge",    subKey: "screenLarge_sub",    Icon: Monitor   },
];
const LAPTOP_WEIGHTS = [
  { value: "Ultraportable (<1.5kg)", labelKey: "weightUltra", subKey: "weightUltra_sub", Icon: Feather },
  { value: "No preference",          labelKey: "weightAny",   subKey: "weightAny_sub",   Icon: Cpu     },
];
const TABLET_SIZES = [
  { value: "8-10 inch (Small)",  labelKey: "tabletSizeSmall",  subKey: "tabletSizeSmall_sub",  Icon: Smartphone },
  { value: "10-12 inch (Medium)",labelKey: "tabletSizeMedium", subKey: "tabletSizeMedium_sub", Icon: Tablet     },
  { value: "12+ inch (Large)",   labelKey: "tabletSizeLarge",  subKey: "tabletSizeLarge_sub",  Icon: Monitor    },
];
const TABLET_STYLUS = [
  { value: "Stylus required",   labelKey: "stylusYes", subKey: "stylusYes_sub", Icon: PenTool },
  { value: "No stylus needed",  labelKey: "stylusNo",  subKey: "stylusNo_sub",  Icon: Tablet  },
];

// ── Step system ───────────────────────────────────────────────────────────────
const DRILLDOWN_TRIGGERS = new Set([
  "Photography", "Gaming", "Work & Productivity", "Office & Work",
  "Art & Drawing", "Programming", "Content Creation",
]);

function getActiveSteps(device, purposes) {
  const base = ["device", "purpose"];
  if (purposes.some(p => DRILLDOWN_TRIGGERS.has(p))) base.push("drilldown");
  base.push("brand");
  if (device === "Laptop")  base.push("laptopspecs");
  if (device === "Tablet")  base.push("tabletspecs");
  base.push("lifecycle", "painpoints", "budget");
  return base;
}

function getDrilldownPurpose(purposes) {
  const priority = [
    "Gaming", "Photography", "Work & Productivity", "Office & Work",
    "Art & Drawing", "Programming", "Content Creation",
  ];
  return priority.find(p => purposes.includes(p)) || null;
}


// ── Component ─────────────────────────────────────────────────────────────────
function WizardPanel({ onSubmit, onClose, isLoading }) {
  const { t } = useLanguage();

  const [currentStep,     setCurrentStep]     = useState("device");
  const [device,          setDevice]          = useState(null);
  const [purposes,        setPurposes]        = useState([]);
  const [drilldownAnswer, setDrilldownAnswer] = useState(null);
  const [brand,           setBrand]           = useState(null);
  const [brandTier,       setBrandTier]       = useState(null);
  const [customBrand,     setCustomBrand]     = useState("");
  const [lifecycle,       setLifecycle]       = useState(null);
  const [painPoints,      setPainPoints]      = useState([]);
  // Laptop-specific
  const [laptopScreen,    setLaptopScreen]    = useState(null);
  const [laptopWeight,    setLaptopWeight]    = useState(null);
  // Tablet-specific
  const [tabletSize,      setTabletSize]      = useState(null);
  const [tabletStylus,    setTabletStylus]    = useState(null);
  // Budget & city
  const [currency,        setCurrency]        = useState("USD");
  const [budgetAmount,    setBudgetAmount]    = useState("");
  const [city,            setCity]            = useState("Luang Prabang");
  const [citySuggestions, setCitySuggestions] = useState([]);

  React.useEffect(() => {
    fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/cities")
      .then(r => r.json())
      .then(d => { if (d.success && d.data.length) setCitySuggestions(d.data); })
      .catch(() => {});
  }, []);

  const activeSteps = getActiveSteps(device, purposes);
  const currentIdx  = activeSteps.indexOf(currentStep);
  const totalSteps  = activeSteps.length;

  const formattedBudget = budgetAmount
    ? `${currency === "USD" ? "$" : "₭"}${Number(budgetAmount).toLocaleString()}`
    : t("noPreference");

  // ── Navigation ──────────────────────────────────────────────────────────────
  const advance = () => {
    const steps = getActiveSteps(device, purposes);
    const idx   = steps.indexOf(currentStep);
    if (idx < steps.length - 1) setCurrentStep(steps[idx + 1]);
  };

  const back = () => {
    const steps = getActiveSteps(device, purposes);
    const idx   = steps.indexOf(currentStep);
    if (idx > 0) setCurrentStep(steps[idx - 1]);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleDevice = (d) => {
    setDevice(d);
    setPurposes([]);
    setBrand(null); setBrandTier(null); setCustomBrand("");
    setLifecycle(null);
    setDrilldownAnswer(null);
    setPainPoints([]);
    setLaptopScreen(null); setLaptopWeight(null);
    setTabletSize(null);   setTabletStylus(null);
    setCurrentStep("purpose");
  };

  const togglePurpose = (p) => {
    setPurposes(prev => {
      const next = prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p];
      if (!next.some(x => DRILLDOWN_TRIGGERS.has(x))) setDrilldownAnswer(null);
      return next;
    });
  };

  const handleDrilldown  = (value) => { setDrilldownAnswer(value); advance(); };
  const handleBrand = (b, tier) => {
    setCustomBrand("");
    setBrand(b);
    setBrandTier(tier);
    advance();
  };

  const handleCustomBrand = (val) => {
    setCustomBrand(val);
    setBrand(val.trim() || null);
    setBrandTier(val.trim() ? "custom" : null);
  };
  const handleLifecycle  = (l) => { setLifecycle(l); advance(); };

  const togglePainPoint = (value) => {
    setPainPoints(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    );
  };

  const handleSearch = () => {
    onSubmit({
      device,
      purposes,
      brand,
      brandTier:      brandTier  || "",
      lifecycle,
      drilldown:      drilldownAnswer || "",
      painPoints,
      budget:         formattedBudget,
      rawBudgetAmount: Number(budgetAmount) || 0,
      currency,
      city,
      // device-specific extras sent to backend
      screenSize:     laptopScreen || tabletSize || "No preference",
      weightPriority: laptopWeight || "No preference",
      stylusNeeded:   tabletStylus || "",
    });
  };

  // ── Step titles ─────────────────────────────────────────────────────────────
  const drilldownPurpose = getDrilldownPurpose(purposes);
  const STEP_TITLES = {
    device:      t("step1Title"),
    purpose:     t("step2Title").replace("{device}", t(device || "")),
    drilldown:   t("stepDrilldownTitle").replace("{purpose}", t(drilldownPurpose || "")),
    brand:       t("step3Title"),
    laptopspecs: t("stepLaptopSpecsTitle"),
    tabletspecs: t("stepTabletSpecsTitle"),
    lifecycle:   t("step4Title"),
    painpoints:  t("stepPainPointsTitle"),
    budget:      t("step5Title"),
  };

  // ── Summary chips ────────────────────────────────────────────────────────────
  const summaryItems = [
    device && t(device),
    ...purposes.map(p => t(p)),
    brand && (brand === "No preference" ? t("brandBestMoney") : brand),
    lifecycle && t(lifecycle),
    budgetAmount && formattedBudget,
  ].filter(Boolean);

  const brandConfig     = BRANDS[device]      || { premium: [], value: [] };
  const lifecycleOpts   = LIFECYCLE[device]   || LIFECYCLE.Smartphone;
  const painPointOpts   = PAIN_POINTS[device] || PAIN_POINTS.Smartphone;

  return (
    <div className="wizard-panel">
      {/* ── Header ── */}
      <div className="wizard-header">
        <div className="wizard-header-left">
          {currentIdx > 0 && (
            <button className="wizard-back-btn" onClick={back}>
              <ChevronLeft size={15} strokeWidth={2} /> {t("back")}
            </button>
          )}
          <span className="wizard-title">{STEP_TITLES[currentStep]}</span>
        </div>
        <div className="wizard-header-right">
          <span className="wizard-step-label">{currentIdx + 1} / {totalSteps}</span>
          <button className="wizard-close-btn" onClick={onClose}>
            <X size={14} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div className="wizard-progress-track">
        <div className="wizard-progress-bar" style={{ width: `${((currentIdx + 1) / totalSteps) * 100}%` }} />
      </div>

      {/* ── Step content ── */}
      <div className="wizard-body">

        {/* Step: Device */}
        {currentStep === "device" && (
          <div className="wizard-device-grid">
            {DEVICES.map(({ value, Icon }) => (
              <button key={value} className="wizard-device-card" onClick={() => handleDevice(value)}>
                <Icon className="device-icon-svg" strokeWidth={1.25} />
                <span className="device-label">{t(value)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step: Purpose */}
        {currentStep === "purpose" && device && (
          <div className="wizard-step-multi">
            <div className="wizard-chips">
              {(PURPOSES[device] || []).map(({ value, Icon }) => (
                <button
                  key={value}
                  className={`wizard-chip ${purposes.includes(value) ? "selected" : ""}`}
                  onClick={() => togglePurpose(value)}
                >
                  <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  <span>{t(value)}</span>
                </button>
              ))}
            </div>
            <button className="wizard-next-btn" onClick={advance} disabled={purposes.length === 0}>
              {t("next")} <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Step: Drill-down */}
        {currentStep === "drilldown" && drilldownPurpose && (
          <div className="wizard-drilldown-grid">
            {(DRILLDOWNS[drilldownPurpose]?.options || []).map(({ value, labelKey, subKey, badgeKey, Icon }) => (
              <button
                key={value}
                className={`wizard-drilldown-card ${drilldownAnswer === value ? "selected" : ""}`}
                onClick={() => handleDrilldown(value)}
              >
                <Icon size={22} strokeWidth={1.5} className="drilldown-icon" />
                <div className="drilldown-text">
                  <span className="drilldown-label">{t(labelKey)}</span>
                  <span className="drilldown-sub">{t(subKey)}</span>
                  {badgeKey && <span className="drilldown-badge">{t(badgeKey)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Brand */}
        {currentStep === "brand" && device && (
          <div className="wizard-brand-section">
            {brandConfig.premium.length > 0 && (
              <div className="wizard-brand-group">
                <div className="wizard-brand-group-label">{t("brandPremium")}</div>
                <div className="wizard-chips">
                  {brandConfig.premium.map(b => (
                    <button key={b} className={`wizard-chip ${!customBrand && brand === b ? "selected" : ""}`} onClick={() => handleBrand(b, "premium")}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {brandConfig.value.length > 0 && (
              <div className="wizard-brand-group">
                <div className="wizard-brand-group-label">{t("brandValue")}</div>
                <div className="wizard-chips">
                  {brandConfig.value.map(b => (
                    <button key={b} className={`wizard-chip ${!customBrand && brand === b ? "selected" : ""}`} onClick={() => handleBrand(b, "value")}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <button className="wizard-best-value-chip" onClick={() => handleBrand("No preference", "best_value")}>
              ✨ {t("brandBestMoney")}
            </button>

            {/* Custom brand text input */}
            <div className="wizard-brand-custom">
              <div className="wizard-brand-custom-label">{t("brandOrType")}</div>
              <div className="wizard-brand-input-wrap">
                <input
                  type="text"
                  className={`wizard-brand-input ${customBrand ? "has-value" : ""}`}
                  placeholder={t("brandTypePlaceholder")}
                  value={customBrand}
                  onChange={(e) => handleCustomBrand(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customBrand.trim()) advance();
                  }}
                />
                {customBrand && (
                  <button className="wizard-brand-input-clear" onClick={() => handleCustomBrand("")}>
                    <X size={12} strokeWidth={2.5} />
                  </button>
                )}
              </div>
              {customBrand.trim() && (
                <button className="wizard-next-btn" style={{ marginTop: "0.5rem" }} onClick={advance}>
                  {t("next")} <ChevronRight size={14} strokeWidth={2.5} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Step: Laptop specs (screen size + weight) */}
        {currentStep === "laptopspecs" && (
          <div className="wizard-specs-step">
            <div className="wizard-specs-group">
              <div className="wizard-specs-group-label">Screen Size</div>
              <div className="wizard-drilldown-grid">
                {LAPTOP_SCREENS.map(({ value, labelKey, subKey, Icon }) => (
                  <button
                    key={value}
                    className={`wizard-drilldown-card ${laptopScreen === value ? "selected" : ""}`}
                    onClick={() => setLaptopScreen(value)}
                  >
                    <Icon size={20} strokeWidth={1.5} className="drilldown-icon" />
                    <div className="drilldown-text">
                      <span className="drilldown-label">{t(labelKey)}</span>
                      <span className="drilldown-sub">{t(subKey)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="wizard-specs-group">
              <div className="wizard-specs-group-label">Portability</div>
              <div className="wizard-chips">
                {LAPTOP_WEIGHTS.map(({ value, labelKey, Icon }) => (
                  <button
                    key={value}
                    className={`wizard-chip ${laptopWeight === value ? "selected" : ""}`}
                    onClick={() => setLaptopWeight(value)}
                  >
                    <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                    <span>{t(labelKey)}</span>
                  </button>
                ))}
              </div>
            </div>
            <button
              className="wizard-next-btn"
              onClick={advance}
              disabled={!laptopScreen}
            >
              {t("next")} <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Step: Tablet specs (screen size + stylus) */}
        {currentStep === "tabletspecs" && (
          <div className="wizard-specs-step">
            <div className="wizard-specs-group">
              <div className="wizard-specs-group-label">Screen Size</div>
              <div className="wizard-drilldown-grid">
                {TABLET_SIZES.map(({ value, labelKey, subKey, Icon }) => (
                  <button
                    key={value}
                    className={`wizard-drilldown-card ${tabletSize === value ? "selected" : ""}`}
                    onClick={() => setTabletSize(value)}
                  >
                    <Icon size={20} strokeWidth={1.5} className="drilldown-icon" />
                    <div className="drilldown-text">
                      <span className="drilldown-label">{t(labelKey)}</span>
                      <span className="drilldown-sub">{t(subKey)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div className="wizard-specs-group">
              <div className="wizard-specs-group-label">Stylus / Pen</div>
              <div className="wizard-drilldown-grid">
                {TABLET_STYLUS.map(({ value, labelKey, subKey, Icon }) => (
                  <button
                    key={value}
                    className={`wizard-drilldown-card ${tabletStylus === value ? "selected" : ""}`}
                    onClick={() => setTabletStylus(value)}
                  >
                    <Icon size={20} strokeWidth={1.5} className="drilldown-icon" />
                    <div className="drilldown-text">
                      <span className="drilldown-label">{t(labelKey)}</span>
                      <span className="drilldown-sub">{t(subKey)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <button
              className="wizard-next-btn"
              onClick={advance}
              disabled={!tabletSize || !tabletStylus}
            >
              {t("next")} <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Step: Lifecycle */}
        {currentStep === "lifecycle" && (
          <div className="wizard-chips">
            {lifecycleOpts.map(l => (
              <button key={l} className={`wizard-chip ${lifecycle === l ? "selected" : ""}`} onClick={() => handleLifecycle(l)}>
                <Clock size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                <span>{t(l)}</span>
              </button>
            ))}
          </div>
        )}

        {/* Step: Pain Points */}
        {currentStep === "painpoints" && (
          <div className="wizard-step-multi">
            <div className="wizard-chips">
              {painPointOpts.map(({ value, labelKey, Icon }) => (
                <button
                  key={value}
                  className={`wizard-chip ${painPoints.includes(value) ? "selected" : ""}`}
                  onClick={() => togglePainPoint(value)}
                >
                  <Icon size={ICON_SIZE} strokeWidth={ICON_STROKE} />
                  <span>{t(labelKey)}</span>
                </button>
              ))}
            </div>
            <button className="wizard-next-btn" onClick={advance}>
              {painPoints.length === 0 ? t("skipPainPoints") : t("next")} <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Step: Budget & Location */}
        {currentStep === "budget" && (
          <div className="wizard-step4">
            {summaryItems.length > 0 && (
              <div className="wizard-summary-chips">
                {summaryItems.map((chip, i) => (
                  <span key={i} className="summary-chip">{chip}</span>
                ))}
              </div>
            )}
            <div className="wizard-fields">
              <div className="wizard-field">
                <div className="wizard-field-header">
                  <label>{t("budgetLabel")}</label>
                  <div className="currency-toggle">
                    <button type="button" className={`cur-btn ${currency === "USD" ? "active" : ""}`} onClick={() => setCurrency("USD")}>$ USD</button>
                    <button type="button" className={`cur-btn ${currency === "LAK" ? "active" : ""}`} onClick={() => setCurrency("LAK")}>₭ LAK</button>
                  </div>
                </div>
                <div className="budget-input-wrap">
                  <span className="currency-symbol">{currency === "USD" ? "$" : "₭"}</span>
                  <input
                    type="number"
                    min="0"
                    value={budgetAmount}
                    onChange={(e) => setBudgetAmount(e.target.value)}
                    placeholder={currency === "USD" ? "e.g. 500" : t("budgetPlaceholderLAK")}
                    className="budget-amount-input"
                  />
                </div>
              </div>
              <div className="wizard-field">
                <label>{t("cityLabel")}</label>
                <input
                  type="text"
                  list="wizard-city-list"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder={t("cityPlaceholder")}
                />
                <datalist id="wizard-city-list">
                  {citySuggestions.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
            <button className="wizard-search-btn" onClick={handleSearch} disabled={isLoading}>
              {isLoading ? t("searching2") : t("search")}
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default WizardPanel;
