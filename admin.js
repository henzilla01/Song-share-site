import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Firebase config (same as main site)
const firebaseConfig = {
  apiKey: "AIzaSyAeOEO_5kOqqQU845sSKOsaeJzFmk-MauY",
  authDomain: "joinhugparty.firebaseapp.com",
  projectId: "joinhugparty",
  storageBucket: "joinhugparty.firebasestorage.app",
  messagingSenderId: "540501854830",
  appId: "1:540501854830:web:7249bb97b50582fe97747f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const uploadForm = document.getElementById("uploadForm");
const adminStatus = document.getElementById("adminStatus");
const songList = document.getElementById("songList");

// ⚠️ Replace THIS with your Cloudflare R2 upload endpoint later
const R2_UPLOAD_URL = "https://pub-bf38f9589fd44fdc8fd0388dcd8eeba5.r2.dev/upload";

uploadForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  adminStatus.textContent = "Uploading... Please wait.";

  const title = document.getElementById("songTitle").value.trim();
  const artist = document.getElementById("songArtist").value.trim();
  const songFile = document.getElementById("songFile").files[0];
  const coverFile = document.getElementById("coverFile").files[0];

  // Upload both files to Cloudflare R2
  const formData = new FormData();
  formData.append("song", songFile);
  formData.append("cover", coverFile);

  const uploadResponse = await fetch(R2_UPLOAD_URL, {
    method: "POST",
    body: formData,
  });

  const uploaded = await uploadResponse.json();

  if (!uploaded.success) {
    adminStatus.textContent = "Upload failed!";
    return;
  }

  const songURL = uploaded.songUrl;
  const coverURL = uploaded.coverUrl;

  // Save metadata to Firestore
  await addDoc(collection(db, "songs"), {
    title,
    artist,
    songURL,
    coverURL,
    timestamp: Date.now(),
  });

  adminStatus.textContent = "Song added successfully!";
  uploadForm.reset();
  loadSongs();
});

// Load all songs for admin view
async function loadSongs() {
  songList.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "songs"));
  querySnapshot.forEach((doc) => {
    const s = doc.data();

    const item = document.createElement("div");
    item.classList.add("admin-song-item");

    item.innerHTML = `
      <img src="${s.coverURL}" class="admin-cover"/>
      <div>
        <h3>${s.title}</h3>
        <p>${s.artist}</p>
        <audio controls src="${s.songURL}"></audio>
      </div>
    `;

    songList.appendChild(item);
  });
}

loadSongs();
