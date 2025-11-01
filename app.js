// app.js (or app.ts)

// 1. Import the necessary Firebase modules
import { initializeApp } from "firebase/app";
import {
  getAuth,
  PhoneAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  onAuthStateChanged,
  linkWithCredential,
  EmailAuthProvider,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";
import { getDatabase, ref, set, onValue } from "firebase/database";

// 2. Your Firebase project configuration
//    Get this from Firebase Console > Project settings > General
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

// 3. Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// 4. Get UI elements
const phoneNumberInput = document.getElementById("phoneNumberInput");
const sendOtpButton = document.getElementById("sendOtpButton");
const otpVerificationDiv = document.getElementById("otpVerification");
const otpInput = document.getElementById("otpInput");
const verifyOtpButton = document.getElementById("verifyOtpButton");
const recaptchaContainer = document.getElementById("recaptcha-container");

const firstTimeUserDiv = document.getElementById("firstTimeUser");
const usernameInput = document.getElementById("usernameInput");
const registerUsernameButton = document.getElementById("registerUsernameButton");
const emailLinkInput = document.getElementById("emailLinkInput");
const passwordLinkInput = document.getElementById("passwordLinkInput");
const linkEmailPasswordButton = document.getElementById("linkEmailPasswordButton");

const emailLoginInput = document.getElementById("emailLoginInput");
const passwordLoginInput = document.getElementById("passwordLoginInput");
const emailLoginButton = document.getElementById("emailLoginButton");

const authSection = document.getElementById("authSection");
const userInfoDiv = document.getElementById("userInfo");
const userIdSpan = document.getElementById("userId");
const userPhoneSpan = document.getElementById("userPhone");
const userEmailSpan = document.getElementById("userEmail");
const userDbUsernameSpan = document.getElementById("userDbUsername");
const signOutButton = document.getElementById("signOutButton");
const messageDiv = document.getElementById("message");

let confirmationResult; // To hold the result of sending OTP
let currentLoggedInUser; // To hold the current Firebase user object

// 5. Setup reCAPTCHA Verifier
// Use an invisible reCAPTCHA for a smoother UX.
// Make sure to add <script src="https://www.gstatic.com/firebasejs/ui/6.0.0/firebase-ui-auth.js"></script>
// and <link type="text/css" rel="stylesheet" href="https://www.gstatic.com/firebasejs/ui/6.0.0/firebase-ui-auth.css" />
// in your HTML <head> if you want the visible widget.
// For invisible, just ensure the Firebase SDK is loaded.
window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainer, {
  'size': 'invisible', // Use 'visible' if you want a checkbox
  'callback': (response) => {
    // reCAPTCHA solved, allow signInWithPhoneNumber.
    // This is optional if using 'invisible' as it auto-solves.
  },
  'expired-callback': () => {
    // Response expired. Ask user to solve reCAPTCHA again.
    displayMessage("reCAPTCHA expired. Please try again.");
    window.recaptchaVerifier.render().then(function(widgetId) {
      grecaptcha.reset(widgetId);
    });
  }
});

// 6. Event Listeners

// Send OTP
sendOtpButton.addEventListener("click", async () => {
  const phoneNumber = phoneNumberInput.value.trim();
  if (!phoneNumber) {
    displayMessage("Please enter a phone number.");
    return;
  }

  try {
    displayMessage("Sending OTP...");
    const appVerifier = window.recaptchaVerifier;
    confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    otpVerificationDiv.classList.remove("hidden");
    sendOtpButton.disabled = true;
    displayMessage("OTP sent! Please check your phone.");
  } catch (error) {
    console.error("Error sending OTP:", error);
    displayMessage(`Error sending OTP: ${error.message}`);
    // Reset reCAPTCHA on error for visible widgets.
    // For invisible, it might reset automatically or need explicit reset.
    if (window.recaptchaVerifier && window.recaptchaVerifier.reset) {
        window.recaptchaVerifier.reset();
    }
    sendOtpButton.disabled = false; // Re-enable button
  }
});

// Verify OTP
verifyOtpButton.addEventListener("click", async () => {
  const otpCode = otpInput.value.trim();
  if (!otpCode) {
    displayMessage("Please enter the OTP.");
    return;
  }

  try {
    displayMessage("Verifying OTP...");
    // confirmationResult was obtained from signInWithPhoneNumber
    await confirmationResult.confirm(otpCode);
    // User is now signed in. onAuthStateChanged will handle UI updates.
    displayMessage("Phone number verified successfully!");
    otpVerificationDiv.classList.add("hidden");
    // The onAuthStateChanged listener will handle the next steps (username reg, etc.)
  } catch (error) {
    console.error("Error verifying OTP:", error);
    displayMessage(`Error verifying OTP: ${error.message}`);
  }
});

// Register Username (after initial phone sign-in)
registerUsernameButton.addEventListener("click", async () => {
  const username = usernameInput.value.trim();
  if (!username) {
    displayMessage("Please enter a username.");
    return;
  }
  if (!currentLoggedInUser) {
    displayMessage("No user logged in to register username for.");
    return;
  }

  try {
    displayMessage("Registering username...");
    // Save username to Realtime Database under the user's UID
    // Your RTDB rules: "users": { "$uid": { ".write": "auth !== null && auth.uid === $uid" } }
    await set(ref(database, 'users/' + currentLoggedInUser.uid), {
      username: username,
      phone: currentLoggedInUser.phoneNumber,
      registeredAt: new Date().toISOString()
    });
    displayMessage("Username registered successfully!");
    firstTimeUserDiv.classList.add("hidden"); // Hide registration form
    updateUserInfoUI(currentLoggedInUser); // Refresh UI
  } catch (error) {
    console.error("Error registering username:", error);
    displayMessage(`Error registering username: ${error.message}`);
  }
});

// Link Email and Password
linkEmailPasswordButton.addEventListener("click", async () => {
  const email = emailLinkInput.value.trim();
  const password = passwordLinkInput.value.trim();

  if (!email || !password) {
    displayMessage("Please enter both email and password.");
    return;
  }
  if (!currentLoggedInUser) {
    displayMessage("No user logged in to link email/password to.");
    return;
  }

  try {
    displayMessage("Linking email and password...");
    const credential = EmailAuthProvider.credential(email, password);
    await linkWithCredential(currentLoggedInUser, credential);
    displayMessage("Email and password linked successfully! You can now log in with either.");
    updateUserInfoUI(currentLoggedInUser); // Refresh UI
    // Optionally hide linking form
  } catch (error) {
    console.error("Error linking email/password:", error);
    displayMessage(`Error linking email/password: ${error.message}`);
  }
});

// Email/Password Login
emailLoginButton.addEventListener("click", async () => {
  const email = emailLoginInput.value.trim();
  const password = passwordLoginInput.value.trim();

  if (!email || !password) {
    displayMessage("Please enter both email and password for login.");
    return;
  }

  try {
    displayMessage("Logging in with email...");
    await signInWithEmailAndPassword(auth, email, password);
    displayMessage("Logged in successfully with email!");
    // onAuthStateChanged will handle UI updates
  } catch (error) {
    console.error("Error with email login:", error);
    displayMessage(`Error with email login: ${error.message}`);
  }
});

// Sign Out
signOutButton.addEventListener("click", async () => {
  try {
    await signOut(auth);
    displayMessage("Signed out successfully.");
    // onAuthStateChanged will handle UI updates
  } catch (error) {
    console.error("Error signing out:", error);
    displayMessage(`Error signing out: ${error.message}`);
  }
});

// 7. Handle Authentication State Changes
onAuthStateChanged(auth, async (user) => {
  currentLoggedInUser = user; // Keep track of the current user

  if (user) {
    // User is signed in.
    authSection.classList.add("hidden");
    userInfoDiv.classList.remove("hidden");
    userIdSpan.textContent = user.uid;
    userPhoneSpan.textContent = user.phoneNumber || "N/A";
    userEmailSpan.textContent = user.email || "N/A";

    // Check if user has a username in RTDB
    const userRef = ref(database, 'users/' + user.uid);
    onValue(userRef, (snapshot) => {
      const userData = snapshot.val();
      if (userData && userData.username) {
        userDbUsernameSpan.textContent = userData.username;
        firstTimeUserDiv.classList.add("hidden"); // Hide registration if already has username
      } else {
        userDbUsernameSpan.textContent = "Not set";
        // Show first-time user registration options if no username
        firstTimeUserDiv.classList.remove("hidden");
      }
    }, {
      onlyOnce: true // Fetch once to check for username
    });

    displayMessage(`Welcome, User ID: ${user.uid}`);
  } else {
    // User is signed out.
    authSection.classList.remove("hidden");
    userInfoDiv.classList.add("hidden");
    firstTimeUserDiv.classList.add("hidden"); // Hide registration form on sign out
    sendOtpButton.disabled = false; // Enable send OTP button
    // Reset forms
    phoneNumberInput.value = "";
    otpInput.value = "";
    usernameInput.value = "";
    emailLinkInput.value = "";
    passwordLinkInput.value = "";
    emailLoginInput.value = "";
    passwordLoginInput.value = "";
    displayMessage("Please sign in.");
  }
});

// Helper to update user info on UI
function updateUserInfoUI(user) {
  userIdSpan.textContent = user.uid;
  userPhoneSpan.textContent = user.phoneNumber || "N/A";
  userEmailSpan.textContent = user.email || "N/A";
  // Re-fetch username from DB to ensure UI is updated if linked
  const userRef = ref(database, 'users/' + user.uid);
  onValue(userRef, (snapshot) => {
    const userData = snapshot.val();
    userDbUsernameSpan.textContent = userData && userData.username ? userData.username : "Not set";
  }, {
    onlyOnce: true
  });
}

// Helper to display messages
function displayMessage(msg) {
  messageDiv.textContent = msg;
}
