const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project-id.firebaseapp.com",
  databaseURL: "https://your-project-id-default-rtdb.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();

const messagesDiv = document.getElementById("messages");
const nameInput = document.getElementById("nameInput");
const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");

sendBtn.onclick = function() {
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();
  if (name && message) {
    db.ref("messages").push({ name, message });
    messageInput.value = "";
  }
};

// Listen for new messages
db.ref("messages").on("child_added", function(snapshot) {
  const msg = snapshot.val();
  const div = document.createElement("div");
  div.classList.add("message");

  if (msg.name === nameInput.value.trim()) {
    div.classList.add("my-message");
  } else {
    div.classList.add("other-message");
  }

  div.textContent = `${msg.name}: ${msg.message}`;
  messagesDiv.appendChild(div);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
});
