import React, { useState, useRef, useEffect } from "react";
import {
  Menu, X, MessageSquare, Store, Settings, User, Users, ShieldCheck,
  Compass, ArrowUp, Plus, ArrowLeftRight, Clock, LogIn, Pencil,
  GitCompare,
} from "lucide-react";
import { useLanguage } from "./context/LanguageContext";
import ProductCarousel, { CompareTable } from "./components/ProductCarousel";
import WizardPanel from "./components/WizardPanel";
import Auth from "./pages/Auth";
import ShopDashboard from "./pages/ShopDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import UserManagement from "./pages/UserManagement";
import ShopVerification from "./pages/ShopVerification";
import HistoryPage from "./pages/HistoryPage";
import ShopsPage from "./pages/ShopsPage";
import "./App.css";

function App() {
  const { lang, setLang, t } = useLanguage();

  const [activeTab, setActiveTab]       = useState("chat");
  const [user, setUser]                 = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [messages, setMessages]         = useState([
    { type: "bot", content: t("welcome") },
  ]);
  const [inputText, setInputText]   = useState("");
  const [isLoading, setIsLoading]   = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [compareList, setCompareList]           = useState([]);
  const [showCompareTable, setShowCompareTable] = useState(false);
  const [authMode, setAuthMode]                 = useState("login");
  const [lastSearchData, setLastSearchData]     = useState(null);
  const [savedProducts, setSavedProducts]       = useState([]);
  const [showGuestModal, setShowGuestModal]     = useState(false);
  const guestCount = user ? 0 : parseInt(localStorage.getItem("guestSearchCount") || "0");
  const [showEditProfile, setShowEditProfile]   = useState(false);
  const [editForm, setEditForm]                 = useState({ new_username: "", current_password: "", new_password: "" });
  const [editError, setEditError]               = useState("");
  const [editLoading, setEditLoading]           = useState(false);

  const messagesEndRef = useRef(null);
  const textareaRef    = useRef(null);

  // Update welcome message when language changes
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length === 1 && prev[0].type === "bot" && !prev[0].product) {
        return [{ type: "bot", content: t("welcome") }];
      }
      return prev;
    });
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchSavedProducts = (token) => {
    if (!token) return;
    fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/user/saved", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.success) setSavedProducts(d.data); })
      .catch(() => {});
  };

  // Verify auth on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUser(data.user);
            fetchSavedProducts(token);
          } else {
            localStorage.removeItem("token");
          }
        })
        .catch(() => localStorage.removeItem("token"));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    fetchSavedProducts(localStorage.getItem("token"));
    if (userData.role === "shop") setActiveTab("shop");
    else if (userData.role === "admin") setActiveTab("admin");
    else setActiveTab("chat");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
    setSavedProducts([]);
    setActiveTab("chat");
  };

  const handleEditProfile = async (e) => {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
        setShowEditProfile(false);
        setEditForm({ new_username: "", current_password: "", new_password: "" });
      } else {
        setEditError(data.message);
      }
    } catch {
      setEditError("ເກີດຂໍ້ຜິດພາດ ກະລຸນາລອງໃໝ່");
    } finally {
      setEditLoading(false);
    }
  };

  const savedNames = new Set(savedProducts.map(s =>
    typeof s.product_data === "object" ? s.product_data?.productName : s.productName
  ));

  const handleToggleSave = async (product) => {
    const token = localStorage.getItem("token");
    if (!token || !product?.productName) return;
    const alreadySaved = savedNames.has(product.productName);
    try {
      if (alreadySaved) {
        await fetch(`${import.meta.env.VITE_API_URL||"http://localhost:5000"}/api/user/saved/${encodeURIComponent(product.productName)}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        setSavedProducts(prev => prev.filter(s => {
          const name = typeof s.product_data === "object" ? s.product_data?.productName : s.productName;
          return name !== product.productName;
        }));
      } else {
        await fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/user/saved", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ product }),
        });
        fetchSavedProducts(token);
      }
    } catch (e) {
      console.error("Toggle save failed:", e);
    }
  };

  const detectDeviceType = (product) => {
    const combined = ((product.productName || "") + " " + (product.brand || "")).toLowerCase();
    if (combined.includes("laptop") || combined.includes("macbook") || combined.includes("notebook") || combined.includes("chromebook")) return "laptop";
    if (combined.includes("tablet") || combined.includes("ipad") || combined.includes("tab ") || combined.includes("surface pro")) return "tablet";
    return "smartphone";
  };

  const toggleCompare = (product) => {
    setCompareList((prev) => {
      const alreadyIn = prev.some((p) => p.productName === product.productName);
      if (alreadyIn) {
        const next = prev.filter((p) => p.productName !== product.productName);
        if (next.length === 0) setShowCompareTable(false);
        return next;
      }
      if (prev.length > 0) {
        const existingType = detectDeviceType(prev[0]);
        const newType = detectDeviceType(product);
        if (existingType !== newType) return prev;
      }
      return [...prev, product];
    });
  };

  const parseUserInput = (text) => {
    const lowerText = text.toLowerCase();

    let device = "Smartphone";
    if (lowerText.includes("laptop") || lowerText.includes("ຄອມພິວເຕີ")) device = "Laptop";
    else if (lowerText.includes("tablet") || lowerText.includes("ipad") || lowerText.includes("ແທັບເລັດ")) device = "Tablet";
    else if (lowerText.includes("gaming pc") || lowerText.includes("desktop")) device = "Gaming PC";
    else if (lowerText.includes("phone") || lowerText.includes("smartphone") || lowerText.includes("iphone") || lowerText.includes("android") || lowerText.includes("ໂທລະສັບ")) device = "Smartphone";

    let budget = "Under $300";
    let currency = "USD";
    let rawBudgetAmount = 0;

    // LAK detection: ລ້ານ = million, ພັນ = thousand, ກີບ/kip/lak = kip
    const lakMillion  = text.match(/(\d+(?:\.\d+)?)\s*ລ້ານ/);
    const lakThousand = text.match(/(\d+(?:\.\d+)?)\s*ພັນ/);
    const lakRaw      = text.match(/(\d[\d,]+)\s*(?:ກີບ|kip|lak)/i);

    if (lakMillion) {
      rawBudgetAmount = Math.round(parseFloat(lakMillion[1]) * 1_000_000);
      budget   = `₭${rawBudgetAmount.toLocaleString()}`;
      currency = "LAK";
    } else if (lakThousand) {
      rawBudgetAmount = Math.round(parseFloat(lakThousand[1]) * 1_000);
      budget   = `₭${rawBudgetAmount.toLocaleString()}`;
      currency = "LAK";
    } else if (lakRaw) {
      rawBudgetAmount = parseInt(lakRaw[1].replace(/,/g, ""));
      budget   = `₭${rawBudgetAmount.toLocaleString()}`;
      currency = "LAK";
    } else {
      // USD detection: $500 / 500$ / 500 USD / 500 dollars
      const usdMatch = text.match(/\$\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:\$|usd|dollars?)/i);
      if (usdMatch) {
        const price = parseInt((usdMatch[1] || usdMatch[2]).replace(/,/g, ""));
        rawBudgetAmount = price;
        if (price < 300)       budget = "Under $300";
        else if (price <= 600)  budget = "$300–$600";
        else if (price <= 1000) budget = "$600–$1000";
        else if (price <= 1500) budget = "$1000–$1500";
        else if (price <= 2000) budget = "$1500–$2000";
        else                    budget = "$2000+";
        currency = "USD";
      }
    }

    let purpose = "General";
    if (lowerText.includes("gaming") || lowerText.includes("game") || lowerText.includes("ເກມ")) purpose = "Gaming";
    else if (lowerText.includes("photo") || lowerText.includes("video") || lowerText.includes("camera") || lowerText.includes("ຖ່າຍຮູບ")) purpose = "Photography";
    else if (lowerText.includes("work") || lowerText.includes("office") || lowerText.includes("ວຽກ")) purpose = "Office & Work";
    else if (lowerText.includes("student") || lowerText.includes("school") || lowerText.includes("study") || lowerText.includes("ນັກຮຽນ")) purpose = "Student & Education";
    else if (lowerText.includes("content") || lowerText.includes("youtube") || lowerText.includes("ສ້າງເນື້ອຫາ")) purpose = "Content Creation";
    else if (lowerText.includes("coding") || lowerText.includes("programming") || lowerText.includes("ໂປຣແກຣມ")) purpose = "Programming";

    let brand = "No preference";
    const brands = ["apple", "samsung", "google", "oneplus", "xiaomi", "sony", "dell", "hp", "lenovo", "asus", "acer", "microsoft", "msi", "razer"];
    for (const b of brands) {
      if (lowerText.includes(b)) { brand = b.charAt(0).toUpperCase() + b.slice(1); break; }
    }

    let city = "Luang Prabang";
    const cityMatch = text.match(/(?:in|near|at|from|ໃນ|ຢູ່)\s+([a-zA-Zກ-ໝ\s]+?)(?:\s|$|,|\.)/i);
    if (cityMatch) {
      const parsedCity = cityMatch[1].trim();
      city = parsedCity.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }

    return {
      device, budget, purpose, brand, city, currency, rawBudgetAmount,
      screenSize: "No preference", storage: "No preference", ram: "No preference",
      batteryLife: "No preference", weightPriority: "No preference",
      specialFeatures: [], rawQuery: text, lang,
    };
  };

  const sendRequest = async (data, userMessage, opts = {}) => {
    if (!user) {
      const count = parseInt(localStorage.getItem("guestSearchCount") || "0");
      if (count >= 3) {
        setShowGuestModal(true);
        return;
      }
      localStorage.setItem("guestSearchCount", String(count + 1));
    }

    // The chat router may have already echoed the user's message into the thread.
    if (!opts.skipUserEcho) {
      setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    }
    setIsLoading(true);
    setMessages((prev) => [...prev, { type: "bot", content: t("searching"), isLoading: true, loadingStep: 0 }]);

    const headers = { "Content-Type": "application/json" };
    const token = localStorage.getItem("token");
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/recommend/stream", {
        method: "POST",
        headers,
        body: JSON.stringify({ ...data, lang }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   buffer  = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop(); // keep incomplete last line

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          let event;
          try { event = JSON.parse(line.slice(6)); } catch { continue; }

          if (event.type === "status") {
            setMessages((prev) => {
              const rest = prev.filter((m) => !m.isLoading);
              return [...rest, { type: "bot", content: event.msg, isLoading: true, loadingStep: event.step }];
            });
          } else if (event.type === "result" || event.type === "cached") {
            setLastSearchData({ ...data, lang });
            setMessages((prev) => {
              const rest = prev.filter((m) => !m.isLoading);
              return [...rest, { type: "bot", content: t("resultIntro"), products: event.products }];
            });
          } else if (event.type === "error") {
            setMessages((prev) => {
              const rest = prev.filter((m) => !m.isLoading);
              return [...rest, { type: "bot", content: `${t("errorPrefix")} ${event.msg}` }];
            });
          }
        }
      }
    } catch (error) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [...filtered, { type: "bot", content: `${t("errorPrefix")} ${error.message}` }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTradeoff = async (products) => {
    setMessages((prev) => [...prev, { type: "bot", content: t("loadingTradeoff"), isLoading: true }]);
    try {
      const res = await fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/recommend/tradeoff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: products.slice(0, 3), lang }),
      });
      const data = await res.json();
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        const text = data.summary || `${t("errorPrefix")} ${data.error || ""}`.trim();
        return [...filtered, { type: "bot", content: text }];
      });
    } catch (e) {
      setMessages((prev) => {
        const filtered = prev.filter((m) => !m.isLoading);
        return [...filtered, { type: "bot", content: `${t("errorPrefix")} ${e.message}` }];
      });
    }
  };

  const handleAllCompare = (products) => {
    if (!products || products.length < 2) return;
    const firstType = detectDeviceType(products[0]);
    const compatible = products.filter(p => detectDeviceType(p) === firstType).slice(0, 3);
    setCompareList(compatible);
    setShowCompareTable(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const userMessage = inputText.trim();
    setInputText("");

    // Echo the user's message and show a "thinking" bubble while the router decides
    // whether this is a recommendation, an in-scope tech question, or off-topic.
    setMessages((prev) => [...prev, { type: "user", content: userMessage }]);
    setIsLoading(true);
    setMessages((prev) => [...prev, { type: "bot", content: t("thinking"), isLoading: true }]);

    let intent = "recommend";
    let answer = "";
    try {
      const res = await fetch((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, lang }),
      });
      const d = await res.json();
      intent = d.intent || "recommend";
      answer = d.answer || "";
    } catch {
      intent = "recommend"; // fail safe → still try to give product cards
    }

    // Drop the "thinking" bubble before showing the real response.
    setMessages((prev) => prev.filter((m) => !m.isLoading));

    if (intent === "recommend") {
      setIsLoading(false);
      // sendRequest re-adds its own loading state; skip the duplicate user echo.
      await sendRequest(parseUserInput(userMessage), userMessage, { skipUserEcho: true });
    } else {
      // "info" or "out_of_scope" — just show the assistant's text answer, no cards.
      setMessages((prev) => [...prev, { type: "bot", content: answer }]);
      setIsLoading(false);
    }
  };

  const handleWizardSubmit = async ({
    device, purposes, brand, brandTier, lifecycle, drilldown, painPoints,
    budget, rawBudgetAmount, currency, city,
  }) => {
    const deviceLabel   = t(device);
    const purposeLabels = purposes.map((p) => t(p)).join(", ");
    const brandPart     = brand && brand !== "No preference"
      ? t("wizardBrandPart").replace("{brand}", brand)
      : "";
    const lifecyclePart = lifecycle
      ? t("wizardLifecyclePart").replace("{lifecycle}", t(lifecycle))
      : "";
    const cityPart = city ? t("wizardCityPart").replace("{city}", city) : "";

    const userMessage = t("wizardQuery")
      .replace("{device}",    deviceLabel)
      .replace("{purposes}",  purposeLabels)
      .replace("{brand}",     brandPart)
      .replace("{budget}",    budget)
      .replace("{lifecycle}", lifecyclePart)
      .replace("{city}",      cityPart);

    const data = {
      device,
      purpose: purposes.join(", "),
      purposes,
      brand,
      brandTier:  brandTier  || "",
      lifecycle:  lifecycle  || "",
      drilldown:  drilldown  || "",
      painPoints: painPoints || [],
      currency: currency || "USD",
      city: city || "",
      budget,
      rawBudgetAmount: rawBudgetAmount || 0,
      screenSize: "No preference", storage: "No preference", ram: "No preference",
      batteryLife: "No preference", weightPriority: "No preference",
      specialFeatures: [], rawQuery: userMessage, lang,
    };

    setShowWizard(false);
    await sendRequest(data, userMessage);
  };

  const isFirstMessage = messages.length === 1;

  return (
    <div className="app">

      {/* Floating sidebar toggle */}
      <button className="sidebar-toggle-btn" onClick={() => setIsSidebarOpen(true)} title="Open Menu">
        <Menu size={18} strokeWidth={1.75} />
      </button>

      {/* Slide-out sidebar */}
      <div className={`sidebar-drawer ${isSidebarOpen ? "open" : ""}`}>
        <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)} />
        <div className="sidebar-container">
          <div className="sidebar-header">
            <div className="sidebar-logo">Aiycom</div>
            <button className="sidebar-close-btn" onClick={() => setIsSidebarOpen(false)}>
              <X size={18} strokeWidth={1.75} />
            </button>
          </div>

          {/* Language toggle */}
          <div className="lang-toggle">
            <button
              className={lang === "en" ? "lang-btn active" : "lang-btn"}
              onClick={() => setLang("en")}
            >
              EN
            </button>
            <button
              className={lang === "lo" ? "lang-btn lang-btn-lo active" : "lang-btn lang-btn-lo"}
              onClick={() => setLang("lo")}
            >
              ລາວ
            </button>
          </div>

          <div className="sidebar-links">
            {/* Regular user links — hidden for admin and shop */}
            {user?.role !== "admin" && user?.role !== "shop" && (<>
            <button
              className={`sidebar-link ${activeTab === "chat" ? "active" : ""}`}
              onClick={() => { setActiveTab("chat"); setIsSidebarOpen(false); }}
            >
              <MessageSquare size={16} strokeWidth={1.75} /> {t("chatbot")}
            </button>
            <button
              className={`sidebar-link ${activeTab === "history" ? "active" : ""}`}
              onClick={() => { setActiveTab("history"); setIsSidebarOpen(false); }}
            >
              <Clock size={16} strokeWidth={1.75} /> {t("history")}
            </button>
            </>)}

            {/* Role-specific */}
            {user?.role === "shop" && (
              <button
                className={`sidebar-link ${activeTab === "shop" ? "active" : ""}`}
                onClick={() => { setActiveTab("shop"); setIsSidebarOpen(false); }}
              >
                <Settings size={16} strokeWidth={1.75} /> {t("sellerPortal")}
              </button>
            )}
            {user?.role === "admin" && (
              <button
                className={`sidebar-link ${activeTab === "admin" ? "active" : ""}`}
                onClick={() => { setActiveTab("admin"); setIsSidebarOpen(false); }}
              >
                <Settings size={16} strokeWidth={1.75} /> {t("adminPanel")}
              </button>
            )}
            {user?.role === "admin" && (
              <button
                className={`sidebar-link ${activeTab === "users" ? "active" : ""}`}
                onClick={() => { setActiveTab("users"); setIsSidebarOpen(false); }}
              >
                <Users size={16} strokeWidth={1.75} /> {t("userManagement")}
              </button>
            )}
            {user?.role === "admin" && (
              <button
                className={`sidebar-link ${activeTab === "shopverify" ? "active" : ""}`}
                onClick={() => { setActiveTab("shopverify"); setIsSidebarOpen(false); }}
              >
                <ShieldCheck size={16} strokeWidth={1.75} /> {t("shopVerification")}
              </button>
            )}

            {/* Auth section */}
            {user ? (
              <div className="sidebar-user-section">
                <div className="sidebar-user-row">
                  <span className="sidebar-user-name">
                    <User size={14} strokeWidth={1.75} /> {user.username}
                  </span>
                  <button
                    className="sidebar-edit-btn"
                    title="ແກ້ໄຂຂໍ້ມູນ"
                    onClick={() => { setShowEditProfile(true); setIsSidebarOpen(false); setEditError(""); }}
                  >
                    <Pencil size={13} strokeWidth={1.75} />
                  </button>
                </div>
                <button className="sidebar-logout-btn" onClick={() => { handleLogout(); setIsSidebarOpen(false); }}>
                  {t("logout")}
                </button>
              </div>
            ) : (
              <div className="sidebar-login-section">
                <button
                  className="sidebar-login-btn"
                  onClick={() => { setAuthMode("login"); setActiveTab("auth"); setIsSidebarOpen(false); }}
                >
                  <LogIn size={15} strokeWidth={1.75} /> {t("login")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Chat Tab ── */}
      {activeTab === "chat" && (
        <main className="chat-container">
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.type} ${msg.isLoading ? "loading" : ""}`}>
                <div className="message-bubble">
                  {msg.isLoading ? (
                    <div className="loading-status">
                      <span className={`loading-dot-row step-${msg.loadingStep}`}>
                        <span /><span /><span />
                      </span>
                      <span className="loading-step-text">{msg.content}</span>
                    </div>
                  ) : (
                    msg.content.split("\n").map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < msg.content.split("\n").length - 1 && <br />}
                      </span>
                    ))
                  )}
                  {msg.isLoading && (
                    <div className="skeleton-cards">
                      {[0,1,2].map((i) => (
                        <div key={i} className="sk-card">
                          <div className="sk-header">
                            <div className="sk-img sk-shimmer" />
                            <div className="sk-lines">
                              <div className="sk-line sk-shimmer" style={{width:"45%"}} />
                              <div className="sk-line sk-shimmer" style={{width:"80%",height:"14px"}} />
                              <div className="sk-line sk-shimmer" style={{width:"35%"}} />
                            </div>
                          </div>
                          <div className="sk-line sk-shimmer" style={{marginTop:"0.75rem"}} />
                          <div className="sk-line sk-shimmer" style={{width:"70%"}} />
                          <div className="sk-line sk-shimmer" style={{width:"90%",marginTop:"0.5rem"}} />
                        </div>
                      ))}
                    </div>
                  )}
                  {msg.products && (
                    <div className="product-in-chat">
                      <ProductCarousel
                        products={msg.products}
                        compareList={compareList}
                        onToggleCompare={toggleCompare}
                        user={user}
                        savedNames={savedNames}
                        onToggleSave={handleToggleSave}
                      />
                      {!isLoading && (
                        <div className="post-reco-actions">
                          {msg.products.length >= 2 && (
                            <button
                              className="reco-action-chip"
                              onClick={() => handleAllCompare(msg.products)}
                            >
                              <ArrowLeftRight size={12} strokeWidth={2} /> {t("chipCompareAll")}
                            </button>
                          )}
                          {msg.products.length >= 2 && (
                            <button
                              className="reco-action-chip"
                              onClick={() => handleTradeoff(msg.products)}
                            >
                              <GitCompare size={12} strokeWidth={2} /> {t("chipTradeoff")}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Landing choices */}
            {isFirstMessage && !showWizard && (
              <div className="landing-choices">
                <button className="landing-choice guided" onClick={() => setShowWizard(true)}>
                  <span className="lc-icon"><Compass size={22} strokeWidth={1.5} /></span>
                  <div className="lc-text">
                    <strong>{t("helpMeChoose")}</strong>
                    <span>{t("helpMeChooseSub")}</span>
                  </div>
                </button>
                <button className="landing-choice manual" onClick={() => textareaRef.current?.focus()}>
                  <span className="lc-icon"><MessageSquare size={22} strokeWidth={1.5} /></span>
                  <div className="lc-text">
                    <strong>{t("typeOwn")}</strong>
                    <span>{t("typeOwnSub")}</span>
                  </div>
                </button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Wizard panel */}
          {showWizard && (
            <WizardPanel
              onSubmit={handleWizardSubmit}
              onClose={() => setShowWizard(false)}
              isLoading={isLoading}
            />
          )}

          {/* Global compare bar */}
          {compareList.length >= 2 && !showCompareTable && (
            <div className="compare-bar global-compare-bar">
              <span className="compare-bar-label">
                {t("compareSelected").replace("{n}", compareList.length)}
              </span>
              <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                <button className="compare-clear-btn" onClick={() => setCompareList([])}>
                  <X size={13} strokeWidth={2} />
                </button>
                <button className="compare-trigger-btn" onClick={() => setShowCompareTable(true)}>
                  <ArrowLeftRight size={14} strokeWidth={2} /> {t("compare")}
                </button>
              </div>
            </div>
          )}

          {/* Global compare table */}
          {showCompareTable && (
            <div className="global-compare-table">
              <CompareTable
                products={compareList}
                onClose={() => { setShowCompareTable(false); setCompareList([]); }}
              />
            </div>
          )}

          {/* Text input */}
          <div className="claude-input-wrap">
          <form onSubmit={handleSubmit} className="claude-input-container">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (inputText.trim() && !isLoading) handleSubmit(e);
                }
              }}
              placeholder={guestCount >= 3 ? "ໃຊ້ຄົບ 3 ຄຳຖາມແລ້ວ — ລ໊ອກອິນເພື່ອໃຊ້ງານຕໍ່" : t("inputPlaceholder")}
              disabled={isLoading || guestCount >= 3}
              rows={1}
              className="claude-textarea"
            />
            {!user && (
              <div className="guest-count-bar">
                <LogIn size={12} strokeWidth={2} />
                {guestCount >= 3
                  ? <span className="guest-count-limit" onClick={() => setShowGuestModal(true)}>ໃຊ້ຄົບ 3 ຄັ້ງແລ້ວ — <u>ລ໊ອກອິນ</u></span>
                  : <span>ຍັງເຫຼືອ <b>{3 - guestCount}</b> / 3 ຄຳຖາມ · <u style={{cursor:"pointer"}} onClick={() => { setAuthMode("login"); setActiveTab("auth"); }}>ລ໊ອກອິນ</u> ເພື່ອໃຊ້ງານຕໍ່</span>
                }
              </div>
            )}
            <div className="claude-input-footer">
              <button
                type="button"
                className="claude-add-btn"
                onClick={() => setShowWizard((v) => !v)}
                title="Guided setup"
                disabled={guestCount >= 3}
              >
                <Plus size={16} strokeWidth={2} />
              </button>
              <button type="submit" className="claude-send-btn" disabled={isLoading || !inputText.trim() || guestCount >= 3}>
                {isLoading ? "···" : <ArrowUp size={16} strokeWidth={2.5} />}
              </button>
            </div>
          </form>
          </div>
        </main>
      )}

      {activeTab === "auth"    && <Auth onLoginSuccess={handleLoginSuccess} initialMode={authMode} />}
      {activeTab === "history" && (
        <HistoryPage
          user={user}
          onGoToAuth={(mode) => { setAuthMode(mode); setActiveTab("auth"); }}
          compareList={compareList}
          onToggleCompare={toggleCompare}
          savedProducts={savedProducts}
          onToggleSave={handleToggleSave}
        />
      )}
      {activeTab === "shop"    && user?.role === "shop"  && <ShopDashboard />}
      {activeTab === "admin"   && user?.role === "admin" && <AdminDashboard />}
      {activeTab === "users"      && user?.role === "admin" && <UserManagement />}
      {activeTab === "shopverify" && user?.role === "admin" && <ShopVerification />}

      {showEditProfile && (
        <div className="guest-modal-overlay" onClick={() => setShowEditProfile(false)}>
          <div className="guest-modal edit-profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="guest-modal-close" onClick={() => setShowEditProfile(false)}>✕</button>
            <div className="guest-modal-icon"><Pencil size={24} strokeWidth={1.5} /></div>
            <h2 className="guest-modal-title">ແກ້ໄຂຂໍ້ມູນ</h2>
            <form onSubmit={handleEditProfile} className="edit-profile-form">
              <label className="edit-profile-label">Username ໃໝ່ (ຖ້າຕ້ອງການປ່ຽນ)</label>
              <input
                className="edit-profile-input"
                type="text"
                placeholder={user?.username}
                maxLength={30}
                value={editForm.new_username}
                onChange={(e) => setEditForm((f) => ({ ...f, new_username: e.target.value }))}
              />
              <label className="edit-profile-label">ລະຫັດຜ່ານປັດຈຸບັນ <span style={{color:"#f87171"}}>*</span></label>
              <input
                className="edit-profile-input"
                type="password"
                placeholder="ລະຫັດຜ່ານຕອນນີ້"
                required
                value={editForm.current_password}
                onChange={(e) => setEditForm((f) => ({ ...f, current_password: e.target.value }))}
              />
              <label className="edit-profile-label">ລະຫັດຜ່ານໃໝ່ (ຖ້າຕ້ອງການປ່ຽນ)</label>
              <input
                className="edit-profile-input"
                type="password"
                placeholder="ລະຫັດຜ່ານໃໝ່"
                maxLength={100}
                value={editForm.new_password}
                onChange={(e) => setEditForm((f) => ({ ...f, new_password: e.target.value }))}
              />
              {editError && <p className="edit-profile-error">{editError}</p>}
              <button className="guest-modal-btn primary" type="submit" disabled={editLoading}>
                {editLoading ? "ກຳລັງບັນທຶກ..." : "ບັນທຶກ"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showGuestModal && (
        <div className="guest-modal-overlay" onClick={() => setShowGuestModal(false)}>
          <div className="guest-modal" onClick={(e) => e.stopPropagation()}>
            <div className="guest-modal-icon"><LogIn size={28} strokeWidth={1.5} /></div>
            <h2 className="guest-modal-title">ໃຊ້ຄົບ 3 ຄຳຖາມແລ້ວ</h2>
            <p className="guest-modal-desc">
              ຜູ້ໃຊ້ທົ່ວໄປສາມາດຄົ້ນຫາໄດ້ <b>3 ຄັ້ງ</b> ເທົ່ານັ້ນ.<br />
              ລ໊ອກອິນ ຫຼື ລົງທະບຽນ ເພື່ອໃຊ້ງານຕໍ່.
            </p>
            <div className="guest-modal-actions">
              <button
                className="guest-modal-btn primary"
                onClick={() => { setShowGuestModal(false); setAuthMode("register"); setActiveTab("auth"); }}
              >
                ລົງທະບຽນ
              </button>
              <button
                className="guest-modal-btn secondary"
                onClick={() => { setShowGuestModal(false); setAuthMode("login"); setActiveTab("auth"); }}
              >
                ລ໊ອກອິນ
              </button>
            </div>
            <button className="guest-modal-close" onClick={() => setShowGuestModal(false)}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
