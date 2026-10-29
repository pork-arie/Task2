// Handles both login.html and register.html
const form = document.getElementById("auth-form")
const error = document.getElementById("error")
const isRegister = form.dataset.mode === "register"

ready.then(() => {
    if (me) location.href = "/"
})

form.addEventListener("submit", async (e) => {
    e.preventDefault()
    error.textContent = ""
    const button = form.querySelector("button")
    button.disabled = true

    const { name, email, password } = form.elements
    try {
        if (isRegister) {
            await api("/auth/register", {
                method: "POST",
                body: { name: name.value, email: email.value, password: password.value }
            })
        }
        await api("/auth/login", { method: "POST", body: { email: email.value, password: password.value } })
        location.href = "/"
    } catch (err) {
        error.textContent = err.message
        button.disabled = false
    }
})
