// Replace this with your own Firebase config:
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8H7djMIWuXB8f0t37S0VwL8xm39jaWdI",
  authDomain: "dheechat-1258a.firebaseapp.com",
  projectId: "dheechat-1258a",
  storageBucket: "dheechat-1258a.firebasestorage.app",
  messagingSenderId: "893019112248",
  appId: "1:893019112248:web:9d813c2339311f74f5f7cd",
  measurementId: "G-GHHWSG2HFV"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const messagesDiv = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = function() {
  const name = nameInput.value;
  const message = messageInput.value;
  if (name && message) {
    db.ref("messages").push({
      name: name,
      message: message
    });
    messageInput.value = "";
  }
};

db.ref("messages").on("child_added", function(snapshot) {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.textContent = msg.name + ": " + msg.message;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});