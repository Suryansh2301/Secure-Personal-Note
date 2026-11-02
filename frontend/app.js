const API_BASE = "";
const TOKEN_KEY = "access_token";

const $ = (id) => document.getElementById(id);
const { escapeHtml, validateRegistration, errorMessage, formatDate } = window.Utils;

function showMessage(el, text, type = "error") {
    el.textContent = text;
    el.className = `message is-${type}`;
    el.hidden = false;
}
    function clearMessage(el) { el.hidden = true; el.textContent = ""; }
    function setLoading(btn, loading) {
    btn.disabled = loading;
    btn.classList.toggle("is-loading", loading);
}

/* Sign in <-> Create account toggle */
function setMode(mode) {
    document.querySelector(".switch").dataset.mode = mode;
    document.querySelectorAll(".switch-btn").forEach((b) => {
        const active = b.dataset.mode === mode;
        b.setAttribute("aria-selected", String(active));
        b.tabIndex = active ? 0 : -1;
    });
    $("panel-login").hidden = mode !== "login";
    $("panel-register").hidden = mode !== "register";
    clearMessage($("auth-message"));
}

/* API */
async function api(path, options = {}) {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers = { ...(options.headers || {}) };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
    if (res.status === 401 && token) logout();
    return res;
}
    async function readError(res) {
    try { return errorMessage((await res.json()).detail); }
    catch { return errorMessage(); }
}

/* Register */
async function handleRegister(e) {
    e.preventDefault();
    const msg = $("auth-message");
    const btn = e.submitter || e.target.querySelector("button[type=submit]");
    const body = {
    username: $("reg-user").value.trim(),
    email: $("reg-email").value.trim(),
    password: $("reg-pass").value,
    };
    const problems = validateRegistration(body);
    if (problems.length) return showMessage(msg, problems[0]);

    setLoading(btn, true);
    try {
    const res = await api("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) return showMessage(msg, await readError(res));

    e.target.reset();
    setMode("login");
    $("login-user").value = body.username;
    $("login-pass").focus();
    showMessage($("auth-message"), "Account created. Sign in to open your vault.", "success");
    } catch {
    showMessage(msg, "Can't reach the server. Is it running?");
    } finally {
    setLoading(btn, false);
}
}

/* Login (OAuth2 form encoding) */
async function handleLogin(e) {
    e.preventDefault();
    const msg = $("auth-message");
    const btn = e.submitter || e.target.querySelector("button[type=submit]");
    const username = $("login-user").value.trim();
    const password = $("login-pass").value;
    if (!username || !password) return showMessage(msg, "Enter your username (or email) and password.");

    setLoading(btn, true);
    try {
    const res = await api("/login", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ username, password }),
    });
    if (!res.ok) return showMessage(msg, await readError(res));
    const data = await res.json();
    localStorage.setItem(TOKEN_KEY, data.access_token);
    e.target.reset();
    showDashboard();
    } catch {
    showMessage(msg, "Can't reach the server. Is it running?");
    } finally {
    setLoading(btn, false);
}
}

/* Notes */
function renderNotes(notes) {
const box = $("notes-container");
$("note-count").textContent = notes.length;
if (!notes.length) {
    box.innerHTML = `<div class="empty">Nothing here yet. Your first note will show up here.</div>`;
    return;
}
box.innerHTML = notes.map((n) => `
    <article class="note-card">
    <h3>${escapeHtml(n.title)}</h3>
    <p>${escapeHtml(n.content)}</p>
    <span class="note-meta">${escapeHtml(formatDate(n.created_at))}</span>
    <button type="button" class="note-delete" data-id="${Number(n.id)}"
            aria-label="Delete note ${escapeHtml(n.title)}">Delete</button>
    </article>`).join("");
}

async function fetchNotes() {
    const res = await api("/notes/");
    if (res.ok) renderNotes(await res.json());
    else if (res.status !== 401) showMessage($("dash-message"), await readError(res));
}

async function handleCreateNote(e) {
    e.preventDefault();
    const msg = $("dash-message");
    clearMessage(msg);
    const btn = e.submitter || e.target.querySelector("button[type=submit]");
    const title = $("note-title").value.trim();
    const content = $("note-content").value.trim();
    if (!title || !content) return showMessage(msg, "Give your note a title and some content.");

setLoading(btn, true);
try {
    const res = await api("/notes/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
    });
    if (!res.ok) return showMessage(msg, await readError(res));
    e.target.reset();
    await fetchNotes();
} finally {
    setLoading(btn, false);
}
}

async function deleteNote(id) {
    const res = await api(`/notes/${id}`, { method: "DELETE" });
    if (!res.ok && res.status !== 401) showMessage($("dash-message"), await readError(res));
    fetchNotes();
}

/* Screens */
function showDashboard() {
    $("auth-section").hidden = true;
    $("dashboard-section").hidden = false;
    clearMessage($("dash-message"));
    fetchNotes();
}
function logout() {
    localStorage.removeItem(TOKEN_KEY);
    $("dashboard-section").hidden = true;
    $("auth-section").hidden = false;
    $("notes-container").innerHTML = "";
    setMode("login");
}

/* Wire up */
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".switch-btn").forEach((b) => {
    b.addEventListener("click", () => setMode(b.dataset.mode));
    b.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const next = b.dataset.mode === "login" ? "register" : "login";
        setMode(next);
        $(`tab-${next}`).focus();
    }
    });
});

document.querySelectorAll(".reveal").forEach((b) =>
    b.addEventListener("click", () => {
        const input = $(b.dataset.target);
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        b.textContent = show ? "Hide" : "Show";
        b.setAttribute("aria-label", show ? "Hide password" : "Show password");
    })
);

    $("panel-login").addEventListener("submit", handleLogin);
    $("panel-register").addEventListener("submit", handleRegister);
    $("note-form").addEventListener("submit", handleCreateNote);
    $("logout-btn").addEventListener("click", logout);
    $("notes-container").addEventListener("click", (e) => {
    const btn = e.target.closest(".note-delete");
    if (btn) deleteNote(btn.dataset.id);
});

if (localStorage.getItem(TOKEN_KEY)) showDashboard();
});