import React, { useState, useEffect } from "react";
import "./QuizForm.css";

function QuizForm({ onSubmit, isLoading }) {
  // Basic filters
  const [device, setDevice] = useState("Smartphone");
  const [budget, setBudget] = useState("Under $300");
  const [purpose, setPurpose] = useState("General");
  const [brand, setBrand] = useState("No preference");
  const [city, setCity] = useState("");

  // NEW: Extended filters
  const [screenSize, setScreenSize] = useState("No preference");
  const [storage, setStorage] = useState("No preference");
  const [ram, setRam] = useState("No preference");
  const [batteryLife, setBatteryLife] = useState("No preference");
  const [weightPriority, setWeightPriority] = useState("No preference");
  const [specialFeatures, setSpecialFeatures] = useState([]);

  // Show/hide extended options
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Dynamic options based on device type
  const getScreenSizeOptions = () => {
    switch (device) {
      case "Smartphone":
        return ["No preference", "Compact (< 6\")", "Medium (6-6.5\")", "Large (> 6.5\")"];
      case "Tablet":
        return ["No preference", "Small (7-8\")", "Medium (10-11\")", "Large (12\"+)"];
      case "Laptop":
      case "Notebook":
        return ["No preference", "Compact (13\")", "Medium (14-15\")", "Large (16-17\")"];
      case "Gaming PC":
        return ["No preference", "24\"", "27\"", "32\"+"];
      default:
        return ["No preference"];
    }
  };

  const getStorageOptions = () => {
    if (device === "Smartphone" || device === "Tablet") {
      return ["No preference", "64GB", "128GB", "256GB", "512GB", "1TB"];
    }
    return ["No preference", "256GB SSD", "512GB SSD", "1TB SSD", "2TB SSD", "1TB+ HDD"];
  };

  const getRamOptions = () => {
    if (device === "Smartphone" || device === "Tablet") {
      return ["No preference", "4GB", "6GB", "8GB", "12GB", "16GB"];
    }
    return ["No preference", "8GB", "16GB", "32GB", "64GB"];
  };

  const getBrandOptions = () => {
    switch (device) {
      case "Smartphone":
        return ["No preference", "Apple", "Samsung", "Google", "OnePlus", "Xiaomi", "Sony"];
      case "Tablet":
        return ["No preference", "Apple", "Samsung", "Microsoft", "Lenovo", "Amazon"];
      case "Laptop":
      case "Notebook":
        return ["No preference", "Apple", "Dell", "HP", "Lenovo", "ASUS", "Acer", "Microsoft"];
      case "Gaming PC":
        return ["No preference", "ASUS ROG", "MSI", "Alienware", "Razer", "Custom Build"];
      default:
        return ["No preference"];
    }
  };

  const getSpecialFeatureOptions = () => {
    switch (device) {
      case "Smartphone":
        return ["5G", "Wireless Charging", "Water Resistant", "Dual SIM", "High Refresh Rate", "Stylus Support"];
      case "Tablet":
        return ["Stylus Support", "Keyboard Compatible", "Cellular/5G", "High Refresh Rate", "Face ID"];
      case "Laptop":
      case "Notebook":
        return ["Touchscreen", "2-in-1 Convertible", "Thunderbolt", "Backlit Keyboard", "Fingerprint Reader", "OLED Display"];
      case "Gaming PC":
        return ["RGB Lighting", "Liquid Cooling", "VR Ready", "4K Gaming", "Ray Tracing", "High Refresh Monitor"];
      default:
        return [];
    }
  };

  // Reset extended filters when device changes
  useEffect(() => {
    setScreenSize("No preference");
    setStorage("No preference");
    setRam("No preference");
    setSpecialFeatures([]);
  }, [device]);

  const handleFeatureToggle = (feature) => {
    setSpecialFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      device,
      budget,
      purpose,
      brand,
      city,
      screenSize,
      storage,
      ram,
      batteryLife,
      weightPriority,
      specialFeatures,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="quiz-form">
      <h2>Find Your Perfect Device</h2>
      <p className="subtitle">Answer a few questions to get personalized recommendations</p>

      {/* Basic Filters */}
      <div className="form-section">
        <h3>Basic Preferences</h3>

        <div className="form-group">
          <label>Device Type:</label>
          <select value={device} onChange={(e) => setDevice(e.target.value)}>
            <option>Smartphone</option>
            <option>Laptop</option>
            <option>Notebook</option>
            <option>Tablet</option>
            <option>Gaming PC</option>
          </select>
        </div>

        <div className="form-group">
          <label>Budget:</label>
          <select value={budget} onChange={(e) => setBudget(e.target.value)}>
            <option>Under $300</option>
            <option>$300–$600</option>
            <option>$600–$1000</option>
            <option>$1000–$1500</option>
            <option>$1500–$2000</option>
            <option>$2000+</option>
          </select>
        </div>

        <div className="form-group">
          <label>Primary Purpose:</label>
          <select value={purpose} onChange={(e) => setPurpose(e.target.value)}>
            <option>General</option>
            <option>Gaming</option>
            <option>Photography/Videography</option>
            <option>Office/Productivity</option>
            <option>Student/Education</option>
            <option>Travel/Portability</option>
            <option>Content Creation</option>
            <option>Software Development</option>
          </select>
        </div>

        <div className="form-group">
          <label>Brand Preference:</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            {getBrandOptions().map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Your City (for nearby shops):</label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="e.g., Bangkok, New York, London"
          />
        </div>
      </div>

      {/* Toggle Advanced Options */}
      <button
        type="button"
        className="toggle-advanced"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? "▲ Hide" : "▼ Show"} Advanced Filters
      </button>

      {/* Extended Filters */}
      {showAdvanced && (
        <div className="form-section advanced">
          <h3>Technical Specifications</h3>

          <div className="form-group">
            <label>Screen Size:</label>
            <select value={screenSize} onChange={(e) => setScreenSize(e.target.value)}>
              {getScreenSizeOptions().map((size) => (
                <option key={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Storage:</label>
            <select value={storage} onChange={(e) => setStorage(e.target.value)}>
              {getStorageOptions().map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>RAM:</label>
            <select value={ram} onChange={(e) => setRam(e.target.value)}>
              {getRamOptions().map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Battery Life Priority:</label>
            <select value={batteryLife} onChange={(e) => setBatteryLife(e.target.value)}>
              <option>No preference</option>
              <option>All-day battery (8+ hours)</option>
              <option>Extended battery (12+ hours)</option>
              <option>Quick charging more important</option>
            </select>
          </div>

          <div className="form-group">
            <label>Weight/Portability:</label>
            <select value={weightPriority} onChange={(e) => setWeightPriority(e.target.value)}>
              <option>No preference</option>
              <option>Ultra-light (portability is key)</option>
              <option>Balanced</option>
              <option>Performance over weight</option>
            </select>
          </div>

          <div className="form-group">
            <label>Special Features (select all that apply):</label>
            <div className="feature-chips">
              {getSpecialFeatureOptions().map((feature) => (
                <button
                  key={feature}
                  type="button"
                  className={`chip ${specialFeatures.includes(feature) ? "selected" : ""}`}
                  onClick={() => handleFeatureToggle(feature)}
                >
                  {feature}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <button type="submit" className="submit-btn" disabled={isLoading}>
        {isLoading ? "Finding..." : "Find My Device"}
      </button>
    </form>
  );
}

export default QuizForm;
