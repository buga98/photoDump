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


window.uploadFile = async function(files) {
    const user = localStorage.getItem("user");
    const gallery = document.getElementById("gallery");

    for (let file of files) {
        // wrapper za sliku + progress
        const wrapper = document.createElement("div");
        wrapper.className = "upload-item";

        const progress = document.createElement("div");
        progress.className = "upload-progress";

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);

        progress.style.bottom = "0";
        progress.style.left = "0";
        progress.style.height = "5px";
        progress.style.width = "0%";
        progress.style.background = "#e91e63";

        wrapper.appendChild(img);
        wrapper.appendChild(progress);
        gallery.appendChild(wrapper);

        // upload sa progressom
        window.uploadToFirebase(file, user, (percent) => {
            progress.style.width = percent + "%";
        }).then((url) => {
            img.src = url;
            progress.remove();
        });
    }

    showToast("Upload u tijeku 🚀");
}
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}
