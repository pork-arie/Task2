// Post cards with likes and comments, shared by the feed and profile pages

function postCard(post) {
    const likedByMe = me && post.likes.includes(me._id)
    const isMine = me && post.author?._id === me._id

    const likeBtn = el("button", { className: "link" + (likedByMe ? " liked" : "") },
        (likedByMe ? "♥ " : "♡ ") + post.likes.length)
    likeBtn.addEventListener("click", async () => {
        if (!me) return (location.href = "/login.html")
        try {
            const { liked, likes } = await api(`/post/${post._id}/like`, { method: "POST" })
            likeBtn.textContent = (liked ? "♥ " : "♡ ") + likes
            likeBtn.classList.toggle("liked", liked)
        } catch (err) {
            toast(err.message)
        }
    })

    const comments = el("div", { className: "comments", hidden: "" })

    const card = el("div", { className: "card" },
        el("div", { className: "row" },
            post.author
                ? el("a", { className: "post-author", href: "/profile.html?id=" + post.author._id }, post.author.name)
                : el("span", { className: "muted" }, "[deleted user]"),
            el("span", { className: "muted" }, timeAgo(post.createdAt))
        ),
        el("div", { className: "content" }, post.content),
        el("div", { className: "actions" },
            likeBtn,
            el("button", { className: "link", onclick: () => toggleComments(post, comments) }, "💬 Comments"),
            isMine && el("button", {
                className: "danger",
                onclick: async () => {
                    if (!confirm("Delete this post?")) return
                    try {
                        await api("/post/" + post._id, { method: "DELETE" })
                        card.remove()
                        toast("Post deleted")
                    } catch (err) {
                        toast(err.message)
                    }
                }
            }, "Delete")
        ),
        comments
    )
    return card
}

async function toggleComments(post, box) {
    if (!box.hidden) return (box.hidden = true)
    box.hidden = false
    box.replaceChildren(el("div", { className: "muted" }, "Loading..."))

    try {
        const list = await api(`/post/${post._id}/comments`)
        const items = el("div")
        const empty = el("div", { className: "muted" }, "No comments yet")
        items.append(...list.map(commentRow))
        if (!list.length) items.append(empty)

        let footer
        if (me) {
            const input = el("input", { placeholder: "Write a comment...", maxlength: "300" })
            footer = el("form", {
                onsubmit: async (e) => {
                    e.preventDefault()
                    if (!input.value.trim()) return
                    try {
                        const c = await api(`/post/${post._id}/comments`, { method: "POST", body: { content: input.value } })
                        empty.remove()
                        items.append(commentRow(c))
                        input.value = ""
                    } catch (err) {
                        toast(err.message)
                    }
                }
            }, input, el("button", { type: "submit" }, "Send"))
        } else {
            footer = el("div", { className: "muted" }, el("a", { href: "/login.html" }, "Log in"), " to comment")
        }

        box.replaceChildren(items, footer)
    } catch (err) {
        box.replaceChildren(el("div", { className: "error" }, err.message))
    }
}

function commentRow(c) {
    const isMine = me && c.author?._id === me._id
    const row = el("div", { className: "comment" },
        el("div", {},
            c.author ? el("a", { href: "/profile.html?id=" + c.author._id }, el("strong", {}, c.author.name)) : "[deleted user]",
            " ", c.content, " ",
            el("span", { className: "muted" }, timeAgo(c.createdAt))
        ),
        isMine && el("button", {
            className: "danger",
            title: "Delete comment",
            onclick: async () => {
                try {
                    await api("/comments/" + c._id, { method: "DELETE" })
                    row.remove()
                } catch (err) {
                    toast(err.message)
                }
            }
        }, "✕")
    )
    return row
}
