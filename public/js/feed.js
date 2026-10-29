const composerBox = document.getElementById("composer")
const tabsBox = document.getElementById("tabs")
const list = document.getElementById("posts")
const loadMoreBtn = document.getElementById("load-more")

let feed = "all"
let page = 1

function renderComposer() {
    if (!me) {
        composerBox.replaceChildren(el("div", { className: "card" },
            el("a", { href: "/login.html" }, "Log in"), " or ", el("a", { href: "/register.html" }, "sign up"),
            " to share your kwento."))
        return
    }

    const text = el("textarea", { placeholder: "What's your kwento?", maxlength: "500" })
    const counter = el("span", { className: "muted" }, "0/500")
    text.addEventListener("input", () => (counter.textContent = `${text.value.length}/500`))

    composerBox.replaceChildren(el("form", {
        className: "card",
        onsubmit: async (e) => {
            e.preventDefault()
            if (!text.value.trim()) return
            try {
                const post = await api("/post", { method: "POST", body: { content: text.value } })
                text.value = ""
                counter.textContent = "0/500"
                list.querySelector(".empty")?.remove()
                if (feed === "all") list.prepend(postCard(post))
                else toast("Posted! Switch to Everyone to see it.")
            } catch (err) {
                toast(err.message)
            }
        }
    }, text, el("div", { className: "row" }, counter, el("button", { type: "submit" }, "Post"))))
}

function renderTabs() {
    if (!me) return tabsBox.replaceChildren()
    const tab = (name, label) => el("button", {
        className: "secondary" + (feed === name ? " active" : ""),
        onclick: () => {
            feed = name
            renderTabs()
            loadFeed(true)
        }
    }, label)
    tabsBox.replaceChildren(tab("all", "Everyone"), tab("following", "Following"))
}

async function loadFeed(reset) {
    if (reset) {
        page = 1
        list.replaceChildren(el("div", { className: "muted" }, "Loading..."))
    }
    loadMoreBtn.disabled = true

    try {
        const data = await api(`/post?feed=${feed}&page=${page}`)
        if (reset) list.replaceChildren()
        list.append(...data.posts.map(postCard))

        if (reset && !data.posts.length) {
            list.append(el("div", { className: "card muted empty" },
                feed === "following" ? "No posts yet. Follow some people to fill this feed." : "No posts yet"))
        }

        loadMoreBtn.hidden = !data.hasMore
        page++
    } catch (err) {
        list.replaceChildren(el("div", { className: "error" }, err.message))
    } finally {
        loadMoreBtn.disabled = false
    }
}

loadMoreBtn.addEventListener("click", () => loadFeed(false))

ready.then(() => {
    renderComposer()
    renderTabs()
    loadFeed(true)
})
