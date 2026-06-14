import React, { useState, useEffect } from "react";
import { Users, Pencil, Trash2, X, Store, User } from "lucide-react";
import axios from "axios";
import { useLanguage } from "../context/LanguageContext";

const API = (import.meta.env.VITE_API_URL||"http://localhost:5000")+"";

function EditUserModal({ user, onClose, onSaved }) {
  const { t } = useLanguage();
  const [username, setUsername] = useState(user.username);
  const [password, setPassword] = useState("");
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState("");

  const token = localStorage.getItem("token");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) { setErr(t("usernameLabel") + " required"); return; }
    setSaving(true);
    setErr("");
    try {
      const res = await axios.put(
        `${API}/api/admin/users/${user.id}`,
        { username: username.trim(), password: password.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) { onSaved(); onClose(); }
      else setErr(res.data.message || "Failed to save.");
    } catch (e) {
      setErr(e.response?.data?.message || "Request failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>{t("editUser")}</span>
          <button className="modal-close-btn" onClick={onClose}><X size={15} strokeWidth={2} /></button>
        </div>

        <div className="modal-meta">
          {user.role === "shop"
            ? <><Store size={13} strokeWidth={1.75} /> {user.shop_name || t("sellerAccounts")}</>
            : <><User  size={13} strokeWidth={1.75} /> {t("regularUser")}</>}
          <span className={`role-badge role-${user.role}`}>{user.role}</span>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <label>{t("usernameLabel")}</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="modal-input"
          />
          <label>
            {t("newPasswordLabel")}{" "}
            <span className="optional-label">({t("passwordHint")})</span>
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="modal-input"
          />
          {err && <p className="modal-error">{err}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-modal-cancel" onClick={onClose}>{t("cancelBtn")}</button>
            <button type="submit" className="btn-modal-save" disabled={saving}>
              {saving ? t("savingBtn") : t("saveChangesBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function UserManagement() {
  const { t } = useLanguage();

  const [users, setUsers]             = useState([]);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState("");
  const [successMessage, setSuccess]  = useState("");
  const [editTarget, setEditTarget]   = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const token   = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API}/api/admin/users`, { headers });
      if (res.data.success) setUsers(res.data.data);
    } catch {
      setError(t("failedLoadUsers"));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      setSuccess(""); setError("");
      const res = await axios.delete(`${API}/api/admin/users/${userId}`, { headers });
      if (res.data.success) {
        setSuccess(t("userDeletedMsg"));
        setDeleteConfirm(null);
        fetchUsers();
      }
    } catch (e) {
      setError(e.response?.data?.message || t("failedDeleteUser"));
      setDeleteConfirm(null);
    }
  };

  const shopUsers    = users.filter((u) => u.role === "shop");
  const regularUsers = users.filter((u) => u.role === "user");

  if (loading) return <div className="dashboard-loading">{t("loadingUsers")}</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1><Users size={20} strokeWidth={1.75} /> {t("userManagement")}</h1>
        <p>{t("userMgmtSub")}</p>
      </div>

      {successMessage && <div className="dashboard-success-message">{successMessage}</div>}
      {error          && <div className="dashboard-error-message">{error}</div>}

      {/* Summary chips */}
      <div className="um-summary-row">
        <div className="um-chip">
          <Store size={14} strokeWidth={1.75} />
          <span className="um-chip-count">{shopUsers.length}</span>
          <span className="um-chip-label">{t("sellerAccounts")}</span>
        </div>
        <div className="um-chip">
          <User size={14} strokeWidth={1.75} />
          <span className="um-chip-count">{regularUsers.length}</span>
          <span className="um-chip-label">{t("shopperAccounts")}</span>
        </div>
        <div className="um-chip">
          <Users size={14} strokeWidth={1.75} />
          <span className="um-chip-count">{users.length}</span>
          <span className="um-chip-label">{t("totalUsers")}</span>
        </div>
      </div>

      {/* Seller accounts */}
      <div className="dashboard-card" style={{ marginBottom: "1.25rem" }}>
        <h2 className="um-section-title">
          <Store size={15} strokeWidth={1.75} /> {t("sellerAccounts")}
          <span className="um-count-badge">{shopUsers.length}</span>
        </h2>
        <div className="table-responsive">
          <table className="minimal-table">
            <thead>
              <tr>
                <th>{t("colId")}</th>
                <th>{t("colUsername")}</th>
                <th>{t("colShopName")}</th>
                <th>{t("colCity")}</th>
                <th>{t("colVerified")}</th>
                <th>{t("colJoined")}</th>
                <th>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {shopUsers.length === 0 ? (
                <tr><td colSpan="7" className="no-data-td">{t("noSellers")}</td></tr>
              ) : (
                shopUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="uid-td">{u.id}</td>
                    <td className="bold-td">{u.username}</td>
                    <td>{u.shop_name || <span className="muted-td">—</span>}</td>
                    <td>{u.shop_city || <span className="muted-td">—</span>}</td>
                    <td>
                      <span className={`badge ${u.shop_verified === 1 ? "verified" : "pending"}`}>
                        {u.shop_verified === 1 ? t("verified") : t("pending")}
                      </span>
                    </td>
                    <td className="date-td">{u.created_at?.slice(0, 10)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon-edit" onClick={() => setEditTarget(u)} title={t("editUser")}>
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        {deleteConfirm === u.id ? (
                          <span className="delete-confirm-row">
                            {t("confirmSure")}
                            <button className="btn-confirm-yes" onClick={() => handleDeleteUser(u.id)}>{t("confirmYes")}</button>
                            <button className="btn-confirm-no"  onClick={() => setDeleteConfirm(null)}>{t("confirmNo")}</button>
                          </span>
                        ) : (
                          <button className="btn-icon-delete" onClick={() => setDeleteConfirm(u.id)}>
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Shopper accounts */}
      <div className="dashboard-card">
        <h2 className="um-section-title">
          <User size={15} strokeWidth={1.75} /> {t("shopperAccounts")}
          <span className="um-count-badge">{regularUsers.length}</span>
        </h2>
        <div className="table-responsive">
          <table className="minimal-table">
            <thead>
              <tr>
                <th>{t("colId")}</th>
                <th>{t("colUsername")}</th>
                <th>{t("colRole")}</th>
                <th>{t("colJoined")}</th>
                <th>{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {regularUsers.length === 0 ? (
                <tr><td colSpan="5" className="no-data-td">{t("noShoppers")}</td></tr>
              ) : (
                regularUsers.map((u) => (
                  <tr key={u.id}>
                    <td className="uid-td">{u.id}</td>
                    <td className="bold-td">{u.username}</td>
                    <td><span className="role-badge role-user">user</span></td>
                    <td className="date-td">{u.created_at?.slice(0, 10)}</td>
                    <td>
                      <div className="action-btns">
                        <button className="btn-icon-edit" onClick={() => setEditTarget(u)} title={t("editUser")}>
                          <Pencil size={13} strokeWidth={2} />
                        </button>
                        {deleteConfirm === u.id ? (
                          <span className="delete-confirm-row">
                            {t("confirmSure")}
                            <button className="btn-confirm-yes" onClick={() => handleDeleteUser(u.id)}>{t("confirmYes")}</button>
                            <button className="btn-confirm-no"  onClick={() => setDeleteConfirm(null)}>{t("confirmNo")}</button>
                          </span>
                        ) : (
                          <button className="btn-icon-delete" onClick={() => setDeleteConfirm(u.id)}>
                            <Trash2 size={13} strokeWidth={2} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editTarget && (
        <EditUserModal
          user={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setSuccess(t("userUpdatedMsg")); fetchUsers(); }}
        />
      )}
    </div>
  );
}

export default UserManagement;
