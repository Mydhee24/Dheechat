// ===== Firebase config (your project) =====
const firebaseConfig = {
  apiKey: "AIzaSyD8H7djMIWuXB8f0t37S0VwL8xm39jaWdI",
  authDomain: "dheechat-1258a.firebaseapp.com",
  databaseURL: "https://dheechat-1258a-default-rtdb.firebaseio.com",
  projectId: "dheechat-1258a",
  storageBucket: "dheechat-1258a.firebasestorage.app",
  messagingSenderId: "893019112248",
  appId: "1:893019112248:web:9d813c2339311f74f5f7cd",
  measurementId: "G-GHHWSG2HFV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== DOM elements =====
const messagesDiv = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// ===== Send message =====
sendBtn.onclick = function() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  // Prevent empty name or message
  if (!name) return alert("Please enter your name!");
  if (!message) return;

  // Always push to "messages" node
  db.ref("messages").push({
    name,
    message,
    timestamp: Date.now()
  });

  messageInput.value = "";
};

// ===== Listen for new messages =====
db.ref("messages").orderByChild("timestamp").on("child_added", function(snapshot) {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.classList.add("message");

  // Your messages vs others
  if (msg.name === nameInput.value.trim()) {
    div.classList.add("my-message");
  } else {
    div.classList.add("other-message");
  }

  div.textContent = `${msg.name}: ${msg.message}`;
  messagesDiv.appendChild(div);

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
