// Ensure app, auth, and db are initialized and accessible (if separate file, need to import/export)
// For this example, assuming all JS is in the <script type="module"> block in index.html for brevity.
// If you are using a separate app.js, you'd need to re-initialize or pass these objects.

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const chatSection = document.getElementById('chat-section');
const authStatus = document.getElementById('authStatus');
const userInfoDisplay = document.getElementById('user-info');
const signOutBtn = document.getElementById('signOutBtn');

// Email/Password elements
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const emailSignUpBtn = document.getElementById('emailSignUpBtn');
const emailSignInBtn = document.getElementById('emailSignInBtn');

// Phone Auth elements
const phoneInput = document.getElementById('phoneInput');
const sendCodeBtn = document.getElementById('sendCodeBtn');
const recaptchaContainer = document.getElementById('recaptcha-container'); // This is where reCAPTCHA will render
const verificationCodeInput = document.getElementById('verificationCodeInput');
const verifyCodeBtn = document.getElementById('verifyCodeBtn');

// Chat elements
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendMessageBtn = document.getElementById('sendMessageBtn');

let recaptchaVerifier;
let confirmationResult; // To store the result of signInWithPhoneNumber

// --- UI Management ---
function showAuthSection() {
    authSection.style.display = 'block';
    chatSection.style.display = 'none';
}

function showChatSection(user) {
    authSection.style.display = 'none';
    chatSection.style.display = 'block';
    userInfoDisplay.textContent = `Logged in as: ${user.email || user.phoneNumber}`;
}

function displayMessage(message) {
    authStatus.textContent = message;
}

// --- Firebase Authentication ---

// Listener for authentication state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in
        showChatSection(user);
        loadChatMessages(); // Load messages when user logs in
    } else {
        // User is signed out
        showAuthSection();
        messagesDiv.innerHTML = ''; // Clear messages on sign out
    }
});

// Email Sign Up
emailSignUpBtn.addEventListener('click', async () => {
    try {
        await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        displayMessage("Sign up successful!");
    } catch (error) {
        displayMessage(`Sign up error: ${error.message}`);
    }
});

// Email Sign In
emailSignInBtn.addEventListener('click', async () => {
    try {
        await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
        displayMessage("Sign in successful!");
    } catch (error) {
        displayMessage(`Sign in error: ${error.message}`);
    }
});

// Phone Auth - Send Verification Code
sendCodeBtn.addEventListener('click', async () => {
    try {
        // Initialize reCAPTCHA Verifier
        // This must be done *before* calling signInWithPhoneNumber
        if (!recaptchaVerifier) {
            recaptchaVerifier = new RecaptchaVerifier(recaptchaContainer, {
                'size': 'normal', // or 'invisible'
                'callback': (response) => {
                    // reCAPTCHA solved, allow signInWithPhoneNumber.
                    // This callback isn't strictly necessary for 'normal' size as user clicks it.
                    // For 'invisible', you'd call signInWithPhoneNumber here.
                },
                'expired-callback': () => {
                    // Response expired. Ask user to solve reCAPTCHA again.
                    displayMessage("reCAPTCHA expired. Please try again.");
                }
            }, auth);
        }

        // Render the reCAPTCHA if not already rendered (for 'normal' size)
        await recaptchaVerifier.render();

        confirmationResult = await signInWithPhoneNumber(auth, phoneInput.value, recaptchaVerifier);
        displayMessage("Verification code sent to your phone!");
    } catch (error) {
        displayMessage(`Phone auth error: ${error.message}`);
        // If reCAPTCHA error, often due to invalid site keys or domain setup
        // Make sure `dheechat-1258a.firebaseapp.com` and `localhost` are authorized domains in Firebase console
    }
});

// Phone Auth - Verify Code
verifyCodeBtn.addEventListener('click', async () => {
    try {
        if (!confirmationResult) {
            displayMessage("Please send verification code first.");
            return;
        }
        const credential = await confirmationResult.confirm(verificationCodeInput.value);
        displayMessage("Phone sign in successful!");
        // User is now signed in. The onAuthStateChanged listener will handle UI.
    } catch (error) {
        displayMessage(`Verification error: ${error.message}`);
    }
});

// Sign Out
signOutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
        displayMessage("Signed out successfully!");
    } catch (error) {
        displayMessage(`Sign out error: ${error.message}`);
    }
});


// --- Firebase Cloud Firestore (Chat) ---

const messagesCollection = collection(db, "messages"); // Reference to your 'messages' collection

// Send Message
sendMessageBtn.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user && messageInput.value.trim() !== '') {
        try {
            await addDoc(messagesCollection, {
                text: messageInput.value,
                timestamp: serverTimestamp(), // Use server timestamp for consistency
                uid: user.uid,
                displayName: user.email || user.phoneNumber || 'Anonymous' // Fallback for display name
            });
            messageInput.value = ''; // Clear input field
        } catch (error) {
            displayMessage(`Error sending message: ${error.message}`);
        }
    } else if (!user) {
        displayMessage("Please sign in to send messages.");
    }
});

// Load and listen for new messages
function loadChatMessages() {
    const q = query(messagesCollection, orderBy("timestamp", "asc"), limit(50)); // Get latest 50 messages

    onSnapshot(q, (snapshot) => {
        messagesDiv.innerHTML = ''; // Clear existing messages
        snapshot.forEach((doc) => {
            const data = doc.data();
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.innerHTML = `
                <strong>${data.displayName}:</strong> <span>${data.text}</span>
            `;
            messagesDiv.appendChild(messageElement);
        });
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to bottom
    }, (error) => {
        displayMessage(`Error loading messages: ${error.message}`);
    });
}

