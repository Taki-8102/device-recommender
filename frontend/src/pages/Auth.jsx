import React, { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";
import "./Auth.css";

const EMPTY_FORM = {
  username: "", password: "",
  role: "user",
  shopName: "", addressText: "", googleMapUrl: "",
  phone: "", city: "", facebook: "", line: "", instagram: "",
};

function Auth({ onLoginSuccess, initialMode = "login" }) {
  const { lang } = useLanguage();
  const [isLogin, setIsLogin] = useState(initialMode !== "register");
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const switchMode = (login) => {
    setIsLogin(login);
    setError("");
    setFormData(EMPTY_FORM);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        const res = await axios.post((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/auth/login", {
          username: formData.username,
          password: formData.password,
        });
        if (res.data.success) {
          localStorage.setItem("token", res.data.token);
          onLoginSuccess(res.data.user);
        }
      } else {
        const socialMediaLinks = formData.role === "shop"
          ? JSON.stringify({ facebook: formData.facebook, line: formData.line, instagram: formData.instagram })
          : "{}";
        const res = await axios.post((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/auth/register", {
          username: formData.username, password: formData.password, role: formData.role,
          shopName: formData.shopName, addressText: formData.addressText,
          googleMapUrl: formData.googleMapUrl, phone: formData.phone,
          city: formData.city, socialMediaLinks,
        });
        if (res.data.success) {
          localStorage.setItem("token", res.data.token);
          onLoginSuccess(res.data.user);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await axios.post((import.meta.env.VITE_API_URL||"http://localhost:5000")+"/api/auth/google", {
        credential: credentialResponse.credential,
      });
      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        onLoginSuccess(res.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Google login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const isShop = !isLogin && formData.role === "shop";

  return (
    <div className="auth-page">
      <div className="auth-card">

        {/* Logo */}
        <div className="auth-logo">Aiycom</div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab ${isLogin ? "active" : ""}`}
            onClick={() => switchMode(true)}
          >
            {lang === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Login"}
          </button>
          <button
            className={`auth-tab ${!isLogin ? "active" : ""}`}
            onClick={() => switchMode(false)}
          >
            {lang === "lo" ? "ລົງທະບຽນ" : "Register"}
          </button>
          <div className={`auth-tab-indicator ${isLogin ? "left" : "right"}`} />
        </div>

        {/* Google login */}
        <div className="auth-google-wrap">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google login failed.")}
            theme="filled_black"
            shape="pill"
            width="100%"
            text={isLogin ? "signin_with" : "signup_with"}
          />
        </div>

        {/* Divider */}
        <div className="auth-divider">
          <span>{lang === "lo" ? "ຫຼື" : "or"}</span>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-field">
            <label>{lang === "lo" ? "ຊື່ຜູ້ໃຊ້" : "Username"}</label>
            <input
              type="text" name="username"
              value={formData.username} onChange={change}
              placeholder={lang === "lo" ? "ໃສ່ຊື່ຜູ້ໃຊ້" : "Enter username"}
              required autoComplete="username"
            />
          </div>

          <div className="auth-field">
            <label>{lang === "lo" ? "ລະຫັດຜ່ານ" : "Password"}</label>
            <input
              type="password" name="password"
              value={formData.password} onChange={change}
              placeholder={lang === "lo" ? "ໃສ່ລະຫັດຜ່ານ" : "Enter password"}
              required autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {!isLogin && (
            <>
              <div className="auth-field">
                <label>{lang === "lo" ? "ປະເພດບັນຊີ" : "Account Type"}</label>
                <select name="role" value={formData.role} onChange={change}>
                  <option value="user">{lang === "lo" ? "ຜູ້ໃຊ້ທົ່ວໄປ" : "General User"}</option>
                  <option value="shop">{lang === "lo" ? "ເຈົ້າຂອງຮ້ານ" : "Shop Owner (Seller)"}</option>
                </select>
              </div>

              {isShop && (
                <div className="auth-shop-section">
                  <p className="auth-shop-title">
                    {lang === "lo" ? "ຂໍ້ມູນຮ້ານ (ສຳລັບການຢັ້ງຢືນ)" : "Shop Information (for verification)"}
                  </p>

                  <div className="auth-fields-2col">
                    <div className="auth-field">
                      <label>{lang === "lo" ? "ຊື່ຮ້ານ" : "Shop Name"}</label>
                      <input type="text" name="shopName" value={formData.shopName} onChange={change}
                        placeholder="e.g. Banana IT" required />
                    </div>
                    <div className="auth-field">
                      <label>{lang === "lo" ? "ເມືອງ" : "City"}</label>
                      <input type="text" name="city" value={formData.city} onChange={change}
                        placeholder="e.g. Bangkok" required />
                    </div>
                    <div className="auth-field">
                      <label>{lang === "lo" ? "ເບີໂທ" : "Phone"}</label>
                      <input type="text" name="phone" value={formData.phone} onChange={change}
                        placeholder="+66 2 123 4567" required />
                    </div>
                    <div className="auth-field">
                      <label>{lang === "lo" ? "ລິ້ງ Google Maps" : "Google Maps Link"}</label>
                      <input type="url" name="googleMapUrl" value={formData.googleMapUrl} onChange={change}
                        placeholder="https://maps.app.goo.gl/..." />
                    </div>
                  </div>

                  <div className="auth-field">
                    <label>{lang === "lo" ? "ທີ່ຢູ່ເຕັມ" : "Full Address"}</label>
                    <textarea name="addressText" value={formData.addressText} onChange={change}
                      placeholder="e.g. 4th Floor, Central World, Bangkok" required rows={2} />
                  </div>

                  <p className="auth-shop-social-title">
                    {lang === "lo" ? "ໂຊຊຽລ (ທາງເລືອກ)" : "Social Media (optional)"}
                  </p>
                  <div className="auth-fields-2col">
                    <div className="auth-field">
                      <label>Facebook</label>
                      <input type="url" name="facebook" value={formData.facebook} onChange={change}
                        placeholder="https://facebook.com/..." />
                    </div>
                    <div className="auth-field">
                      <label>Line</label>
                      <input type="text" name="line" value={formData.line} onChange={change}
                        placeholder="@shopname" />
                    </div>
                    <div className="auth-field">
                      <label>Instagram</label>
                      <input type="text" name="instagram" value={formData.instagram} onChange={change}
                        placeholder="@shop_ig" />
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <button type="submit" className="auth-submit" disabled={loading}>
            {loading
              ? (lang === "lo" ? "ກຳລັງດຳເນີນການ..." : "Processing...")
              : isLogin
                ? (lang === "lo" ? "ເຂົ້າສູ່ລະບົບ" : "Login")
                : (lang === "lo" ? "ລົງທະບຽນ" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Auth;
