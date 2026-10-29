const header = document.getElementById("profile")
const list = document.getElementById("posts")

async function loadProfile() {
    const id = new URLSearchParams(location.search).get("id") || me?._id
    if (!id) return (location.href = "/login.html")

    try {
        const { user, posts } = await api("/users/" + id)
        document.title = `${user.name} · kwento.`
        renderHeader(user, posts.length)

        list.replaceChildren(...posts.map(postCard))
        if (!posts.length) list.append(el("div", { className: "card muted" }, "No posts yet"))
    } catch (err) {
        header.replaceChildren(el("div", { className: "card error" }, err.message))
    }
}

function renderHeader(user, postCount) {
    const isMe = me && me._id === user._id
    let isFollowing = me && user.followers.includes(me._id)

    const followerCount = el("strong", {}, user.followers.length)
    const followBtn = me && !isMe && el("button", { className: isFollowing ? "secondary" : "" },
        isFollowing ? "Unfollow" : "Follow")

    followBtn?.addEventListener("click", async () => {
        followBtn.disabled = true
        try {
            const res = await api(`/users/${user._id}/follow`, { method: "POST" })
            isFollowing = res.following
            followBtn.textContent = isFollowing ? "Unfollow" : "Follow"
            followBtn.className = isFollowing ? "secondary" : ""
            followerCount.textContent = res.followers
        } catch (err) {
            toast(err.message)
        } finally {
            followBtn.disabled = false
        }
    })

    const bio = el("p", {}, user.bio || (isMe ? "You haven't written a bio yet." : ""))

    header.replaceChildren(el("div", { className: "card" },
        el("div", { className: "row" }, el("h1", {}, user.name), followBtn || ""),
        bio,
        el("div", { className: "stats muted" },
            el("span", {}, el("strong", {}, postCount), " posts"),
            el("span", {}, followerCount, " followers"),
            el("span", {}, el("strong", {}, user.following.length), " following")
        ),
        el("div", { className: "muted" }, "Joined " + new Date(user.createdAt).toLocaleDateString()),
        isMe && el("div", { style: "margin-top:10px" },
            el("button", { className: "secondary", onclick: () => editBio(user, postCount) }, "Edit bio"))
    ))
}

function editBio(user, postCount) {
    const bio = el("textarea", { placeholder: "Tell people about yourself", maxlength: "160" })
    bio.value = user.bio || ""

    header.replaceChildren(el("form", {
        className: "card",
        onsubmit: async (e) => {
            e.preventDefault()
            try {
                const updated = await api("/users/me", { method: "PATCH", body: { bio: bio.value } })
                user.bio = updated.bio
                renderHeader(user, postCount)
                toast("Bio updated")
            } catch (err) {
                toast(err.message)
            }
        }
    },
        el("h2", {}, "Edit bio"),
        bio,
        el("div", { className: "actions" },
            el("button", { type: "submit" }, "Save"),
            el("button", { type: "button", className: "secondary", onclick: () => renderHeader(user, postCount) }, "Cancel")
        )
    ))
}

ready.then(loadProfile)
