// LOGIN
function enterApp() {
    const name = document.getElementById("name").value;

    if (!name) {
        alert("Upiši ime!");
        return;
    }

    localStorage.setItem("user", name);
    window.location.href = "app.html";
}

window.addEventListener("DOMContentLoaded", () => {
    const welcomeEl = document.getElementById("welcome");

    if (welcomeEl) {
        const user = localStorage.getItem("user");

        if (!user) {
            window.location.href = "index.html";
        } else {
            welcomeEl.innerText = "Pozdrav, " + user;

            // 🔥 OVO SAD SIGURNO RADI
            window.loadMyImages(user);
        }
    }
});

async function uploadFile(files) {
    const user = localStorage.getItem("user");

    for (let file of files) {
        const url = await window.uploadToFirebase(file, user);

        const img = document.createElement("img");
        img.src = url;

        document.getElementById("gallery").appendChild(img);
    }

    showToast("Uploadano 🎉");
}
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}
