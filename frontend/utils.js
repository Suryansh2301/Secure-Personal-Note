(function (root, factory) {
    if (typeof module === "object" && module.exports) module.exports = factory();
    else root.Utils = factory();
})(typeof self !== "undefined" ? self : this, function () {
    const FALLBACK = "Something went wrong. Please try again.";

function escapeHtml(value) {
    if (value === null || value === undefined) return "";
    return String(value)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function validateRegistration({ username = "", email = "", password = "" } = {}) {
    const errors = [];
    if (!/^[A-Za-z0-9_.-]{3,100}$/.test(String(username).trim()))
        errors.push("Username must be 3-100 characters: letters, numbers, . _ -");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email).trim()))
        errors.push("Enter a valid email address.");
    if (String(password).length < 6 || String(password).length > 72)
        errors.push("Password must be 6-72 characters.");
    return errors;
}

  function errorMessage(detail) {
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail) && detail.length) {
      return detail.map((d) => {
        const field = Array.isArray(d.loc) ? d.loc[d.loc.length - 1] : "";
        return field ? `${field}: ${d.msg}` : d.msg;
      }).join("; ");
    }
    return FALLBACK;
  }

  function formatDate(iso, locale, options) {
    if (!iso) return "";
    const s = String(iso);
    const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(s);
    const d = new Date(hasZone ? s : s + "Z");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleString(locale, options || { dateStyle: "medium", timeStyle: "short" });
  }

  return { escapeHtml, validateRegistration, errorMessage, formatDate };
});