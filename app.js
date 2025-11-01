// ===== Firebase config (your project) =====
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// ===== DOM elements =====
const messagesDiv = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const clearChatBtn = document.getElementById("clearChatBtn"); // NEW: Get the Clear Chat button

// Store the user's name once it's entered for consistency across messages
let userName = "";

// ===== Optional: Load user name from localStorage on startup =====
document.addEventListener('DOMContentLoaded', () => {
    const storedName = localStorage.getItem('dheeChatUserName');
    if (storedName) {
        nameInput.value = storedName;
        userName = storedName;
    }
});

// ===== Event listener for the name input to store the name =====
nameInput.addEventListener('change', (event) => {
    userName = event.target.value.trim();
    // Optional: Store name in localStorage to persist across sessions
    localStorage.setItem('dheeChatUserName', userName);
});

// ===== Send message function =====
sendBtn.onclick = function() {
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

  // Push the message to the "messages" node in Realtime Database
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
  });
};

// ===== NEW: Clear Chat button functionality =====
clearChatBtn.onclick = function() {
  // Ask for user confirmation before performing a destructive action
  if (confirm("Are you sure you want to clear the entire chat history for everyone? This cannot be undone.")) {
    db.ref("messages").remove() // Removes the entire "messages" node
      .then(() => {
        console.log("Chat history cleared successfully!");
        messagesDiv.innerHTML = ''; // Immediately clear the displayed messages from the UI
      })
      .catch((error) => {
        console.error("Error clearing chat history:", error);
        alert("Failed to clear chat. Please check the console for details.");
      });
  }
};


// ===== Listen for new messages =====
db.ref("messages").orderByChild("timestamp").on("child_added", function(snapshot) {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.classList.add("message");

  // Determine if it's 'my-message' based on the stored userName
  if (userName && msg.name === userName) {
    div.classList.add("my-message");
  } else {
    div.classList.add("other-message");
  }

  const date = new Date(msg.timestamp);
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Use spans for better styling control of timestamp
  div.innerHTML = `<strong>${msg.name}</strong><br>${msg.message}<span class="timestamp">${timeString}</span>`;
  messagesDiv.appendChild(div);

  // Scroll to bottom of the messages div
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});

// Optional: You can also listen for 'child_removed' if individual messages could be deleted
// However, for a full chat clear using .remove() on the parent, clearing innerHTML is often enough.
db.ref("messages").on("child_removed", function(oldSnapshot) {
    console.log("A message with key", oldSnapshot.key, "was removed.");
    // If you were deleting individual messages, you'd find and remove the specific div here.
    // For a full clear, the messagesDiv.innerHTML = '' already handles this.
});

