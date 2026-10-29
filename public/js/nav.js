// Shared helpers and the top navigation, loaded on every page

let me = null

async function api(url, options = {}) {
    const res = await fetch("/api" + url, {
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        ...options,
        body: options.body ? JSON.stringify(options.body) : undefined
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.error || data.message || "Something went wrong")
    return data
}

// Build elements without innerHTML so user content is never parsed as HTML
function el(tag, props = {}, ...children) {
    const node = document.createElement(tag)
    for (const [key, value] of Object.entries(props)) {
        if (key.startsWith("on")) node.addEventListener(key.slice(2), value)
        else if (key === "className") node.className = value
        else node.setAttribute(key, value)
    }
    for (const child of children.flat()) {
        if (child == null || child === false) continue
        node.append(child instanceof Node ? child : document.createTextNode(child))
    }
    return node
}

function toast(message) {
    const t = document.getElementById("toast")
    t.textContent = message
    t.hidden = false
    clearTimeout(toast.timer)
    toast.timer = setTimeout(() => (t.hidden = true), 2500)
}

function timeAgo(date) {
    const s = Math.floor((Date.now() - new Date(date)) / 1000)
    if (s < 60) return "just now"
    if (s < 3600) return Math.floor(s / 60) + "m ago"
    if (s < 86400) return Math.floor(s / 3600) + "h ago"
    return new Date(date).toLocaleDateString()
}

function renderNav() {
    const nav = document.getElementById("nav")
    nav.replaceChildren()
    if (me) {
        nav.append(
            el("a", { href: "/" }, "Feed"),
            el("a", { href: "/profile.html?id=" + me._id }, me.name),
            el("button", { className: "secondary", onclick: logout }, "Log out")
        )
    } else {
        nav.append(el("a", { href: "/login.html" }, "Log in"), el("a", { href: "/register.html" }, "Sign up"))
    }
}

async function logout() {
    await api("/auth/logout", { method: "POST" })
    location.href = "/login.html"
}

// Resolves once we know who (if anyone) is logged in
const ready = api("/auth/me")
    .then((user) => (me = user))
    .catch(() => (me = null))
    .finally(renderNav)
