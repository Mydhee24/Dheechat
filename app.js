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
const app = firebase.initializeApp(firebaseConfig); // Assign to 'app' for clarity, though not strictly needed for compat libs
const db = firebase.database(); // Get a reference to the Realtime Database service

// ===== DOM elements =====
const messagesDiv = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

// Store the user's name once it's entered to prevent issues with changing nameInput mid-session
let userName = "";

// ===== Event listener for the name input to store the name =====
nameInput.addEventListener('change', (event) => {
    userName = event.target.value.trim();
});


// ===== Send message =====
sendBtn.onclick = function() {
  // Use the stored userName for consistency
  if (!userName) {
    alert("Please enter your name first!");
    nameInput.focus(); // Bring focus back to the name input
    return;
  }

  const message = messageInput.value.trim();

  // Prevent truly empty messages
  if (!message) {
    console.warn("Attempted to send an empty message.");
    return;
  }

  // Always push to "messages" node
  db.ref("messages").push({
    name: userName, // Use the stored user name
    message: message,
    timestamp: firebase.database.ServerValue.TIMESTAMP // Use server timestamp for consistency
  })
  .then(() => {
    console.log("Message sent successfully!");
    messageInput.value = ""; // Clear input only on successful send
    messageInput.focus(); // Keep focus on message input for quick replies
  })
  .catch((error) => {
    console.error("Error sending message to Firebase:", error);
    alert("Failed to send message. Please check the console for details.");
    // Optionally re-enable the send button if it was disabled, or show specific error UI
  });
};

// ===== Listen for new messages =====
db.ref("messages").orderByChild("timestamp").on("child_added", function(snapshot) {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.classList.add("message");

  // Determine if it's 'my-message' based on the stored userName
  if (userName && msg.name === userName) { // Ensure userName is set before comparison
    div.classList.add("my-message");
  } else {
    div.classList.add("other-message");
  }

  // Display timestamp (optional, but good for chat)
  const date = new Date(msg.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  div.innerHTML = `<strong>${msg.name}</strong><br>${msg.message}<span style="font-size: 0.7em; color: #666; display: block; text-align: right;">${timeString}</span>`;
  messagesDiv.appendChild(div);

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
