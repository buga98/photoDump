import { initializeApp } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-app.js";
import { getFirestore, doc, setDoc, addDoc, collection,getDoc, getDocs, query, where,deleteDoc } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-storage.js";


const firebaseConfig = {
  apiKey: "AIzaSyAccA3xReidCOmkpZf_EDwIzb_SckGAM4Y",
  authDomain: "photodump-ml.firebaseapp.com",
  projectId: "photodump-ml",
  storageBucket: "photodump-ml.firebasestorage.app",
  messagingSenderId: "33564506308",
  appId: "1:33564506308:web:83f8a2127d3dc18e51b191"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);
window.enterApp = function() {
    const name = document.getElementById("name").value.trim();

    if (!name) {
        alert("Upiši ime i prezime");
        return;
    }

    const userId = Date.now().toString();

    localStorage.setItem("userId", userId);
    localStorage.setItem("name", name);

    createUser(userId, name);

    window.location.href = "app.html";
};
let selectedPhotoId = null;

window.confirmDelete = async function() {
  document.getElementById("deleteModal").style.display = "none";

  const docRef = doc(db, "photos", selectedPhotoId);
  const snap = await getDocs(query(collection(db, "photos")));

  let imageUrl = null;

  snap.forEach(d => {
    if (d.id === selectedPhotoId) {
      imageUrl = d.data().imageUrl;
    }
  });

  // 🔥 DELETE FROM STORAGE
  if (imageUrl) {
    try {
      const storage = getStorage();
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    } catch (e) {
      console.log("Storage delete fail:", e);
    }
  }

  // 🔥 DELETE FROM FIRESTORE
  await deleteDoc(docRef);

  loadMyImages(); // refresh
};

window.closeDelete = function() {
  document.getElementById("deleteModal").style.display = "none";
};
function openFullscreen(url) {
  const full = document.createElement("div");

  full.style.position = "fixed";
  full.style.top = 0;
  full.style.left = 0;
  full.style.width = "100%";
  full.style.height = "100%";
  full.style.background = "rgba(0,0,0,0.9)";
  full.style.display = "flex";
  full.style.alignItems = "center";
  full.style.justifyContent = "center";
  full.style.zIndex = 999;

  const img = document.createElement("img");
  img.src = url;
  img.style.maxWidth = "90%";
  img.style.maxHeight = "90%";

  full.appendChild(img);
  full.onclick = () => full.remove();

  document.body.appendChild(full);
}

window.openGallery = async function() {
  document.getElementById("galleryModal").style.display = "flex";

  const gallery = document.getElementById("publicGallery");
  gallery.innerHTML = "Učitavanje...";

  const snapshot = await getDocs(collection(db, "photos"));

  gallery.innerHTML = "";

  snapshot.forEach(doc => {
    const data = doc.data();

    // 🔥 FILTER
    if (data.visible === false) return;
    if (data.type === "video") return;

    const img = document.createElement("img");
    img.src = data.imageUrl;

    // fullscreen
    img.onclick = () => openFullscreen(data.imageUrl);

    gallery.appendChild(img);
  });
};

window.closeGallery = function() {
  document.getElementById("galleryModal").style.display = "none";
};

window.uploadToFirebase = function(file, user, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, 'photos/' + Date.now() + '_' + file.name);

    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        if (onProgress) onProgress(percent);
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);

        await addDoc(collection(db, "photos"), {
          imageUrl: url,
          user: user, // 🔥 VAŽNO!
          userId: localStorage.getItem("userId"), 
          created: new Date()
        });

        resolve(url);
      }
    );
  });
};

let clickCount = 0;

window.secretAdminClick = function() {
  clickCount++;

  if (clickCount === 3) {
    openAdminModal();
    clickCount = 0;
  }

  setTimeout(() => {
    clickCount = 0;
  }, 1000);
};
window.closeAdminModal = function() {
  document.getElementById("adminModal").style.display = "none";
};

window.openAdminModal = function() {
  document.getElementById("adminModal").style.display = "flex";
};
window.onclick = function(e) {
  const modal = document.getElementById("adminModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
};
window.showTab = function(tab) {
  document.querySelectorAll(".tab").forEach(btn => btn.classList.remove("active"));
  document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

  if (tab === "photos") {
    document.getElementById("photosTab").classList.add("active");
    document.querySelectorAll(".tab")[0].classList.add("active");
  } else {
    document.getElementById("dedicationTab").classList.add("active");
    document.querySelectorAll(".tab")[1].classList.add("active");
  }
};

window.saveDedication = async function() {
  const text = document.getElementById("dedicationText").value.trim();
  const name = localStorage.getItem("name");

  if (!text) {
    alert("Upiši posvetu");
    return;
  }

  await addDoc(collection(db, "dedications"), {
    name: name,
    text: text,
    created: new Date()
  });

  document.getElementById("dedicationText").value = "";
  showSuccessModal();
};
window.showSuccessModal = function() {
  const message = `
    Zahvaljujemo se na vašoj predivnoj posveti ❤️<br><br>
    Uvijek ćemo ih rado čitati i čuvati kao dio
    najljepših uspomena na naš dan 💍✨
  `;

  document.getElementById("successMessage").innerHTML = message;
  document.getElementById("successModal").style.display = "flex";
};

window.closeSuccessModal = function() {
  document.getElementById("successModal").style.display = "none";
};

window.loadMyImages = async function() {
    const userId = localStorage.getItem("userId");
    const gallery = document.getElementById("gallery");
    const name = localStorage.getItem("name");
    
    if (!gallery) return; // Sigurnosna provjera
    
    gallery.innerHTML = "<p>Učitavam tvoje slike...</p>";

    try {
        const q = query(
            collection(db, "photos"),
            where("user", "==", name)
        );

        const snapshot = await getDocs(q);
        gallery.innerHTML = ""; // Očisti loader

        if (snapshot.empty) {
            gallery.innerHTML = "<p style='grid-column: 1/-1; opacity: 0.6;'>Još nisi dodao nijednu sliku 📸</p>";
            return;
        }

        snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const wrapper = document.createElement("div");
            wrapper.className = "my-photo-item";

            const img = document.createElement("img");
            img.src = data.imageUrl;
            img.onclick = () => openFullscreen(data.imageUrl);

            wrapper.appendChild(img);

            // Long press za brisanje
            let pressTimer;
            const startPress = () => {
                pressTimer = setTimeout(() => {
                    selectedPhotoId = docSnap.id;
                    document.getElementById("deleteModal").style.display = "flex";
                }, 700);
            };
            const cancelPress = () => clearTimeout(pressTimer);

            wrapper.onmousedown = startPress;
            wrapper.ontouchstart = startPress;
            wrapper.onmouseup = cancelPress;
            wrapper.ontouchend = cancelPress;

            gallery.appendChild(wrapper);
        });
    } catch (error) {
        console.error("Greška pri učitavanju:", error);
        gallery.innerHTML = "Greška pri učitavanju slika.";
    }
};
const user = localStorage.getItem("name");
const welcomeEl = document.getElementById("welcome");

const isIndex = window.location.pathname.includes("index.html");

if (!user && !isIndex) {
  window.location.href = "index.html";
}

if (user && welcomeEl) {
  welcomeEl.innerText = "Pozdrav, " + user;
  loadMyImages(user);
}

window.createUser = async function(id, name) {
    await setDoc(doc(db, "users", id), {
        name: name,
        created: new Date()
    });
};
window.uploadFile = async function(files) {
    const gallery = document.getElementById("gallery");
    const user = localStorage.getItem("name");
    for (let file of files) {
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

        window.uploadToFirebase(file, user, (percent) => {
            progress.style.width = percent + "%";
        }).then((url) => {
            img.src = url;
            progress.remove();
        });
    }

    showToast("Upload u tijeku 🚀");
}
window.checkAdmin = function() {
  const pass = document.getElementById("adminPass").value;

  if (pass === "admin") {
    window.location.href = "admin.html";
  } else {
    alert("Kriva šifra");
  }
};


function showToast(message) {
    const toast = document.getElementById("toast");
    toast.innerText = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2000);
}



