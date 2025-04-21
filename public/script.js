const socket = io();

// Prompt for name
const username = prompt("Enter your name:") || "Anonymous";
socket.emit("joinRoom", username);

// DOM Elements
const chatBox = document.getElementById("chat-box");
const messageInput = document.getElementById("message");
const sendBtn = document.getElementById("send-btn");
const usersList = document.getElementById("user-list");
const voiceBtn = document.getElementById("record-btn");
const imageInput = document.getElementById("image-upload");

// New button for generating chat link
const generateLinkBtn = document.getElementById("generate-link-btn");

// === Incoming Messages ===

// Text message
socket.on("message", (msg) => {
  renderMessage(msg);
});

// Voice message
socket.on("voiceMessage", (data) => {
  renderVoice(data);
});

// Image message
socket.on("imageMessage", (data) => {
  renderImage(data);
});

// Active user list
socket.on("activeUsers", (users) => {
  usersList.innerHTML = users.map(u => `<li>${u}</li>`).join("");
});

// === Send Text Message ===
sendBtn.addEventListener("click", () => {
  const text = messageInput.value.trim();
  if (text) {
    socket.emit("chatMessage", text);
    messageInput.value = "";
  }
});

messageInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") sendBtn.click();
});

// === Voice Message ===
let mediaRecorder;
let chunks = [];

voiceBtn.addEventListener("click", async () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);

      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = () => {
          socket.emit("voiceMessage", {
            user: username,
            audio: reader.result,
            time: new Date().toLocaleTimeString()
          });
        };
        reader.readAsDataURL(blob);
        chunks = [];
      };

      mediaRecorder.start();
      voiceBtn.textContent = "⏹ Stop";
    } catch (err) {
      alert("Microphone access denied.");
    }
  } else {
    mediaRecorder.stop();
    voiceBtn.textContent = "🎤 Record";
  }
});

// === Send Image ===
imageInput.addEventListener("change", () => {
  const file = imageInput.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      socket.emit("imageMessage", {
        user: username,
        image: reader.result,
        time: new Date().toLocaleTimeString()
      });
    };
    reader.readAsDataURL(file);
  }
});


// === Render Text Message ===
function renderMessage(msg) {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.innerHTML = `
    <strong>${msg.user}</strong> <small>${msg.time}</small><br>${msg.text}
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === Render Voice Message ===
function renderVoice(msg) {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.innerHTML = `
    <strong>${msg.user}</strong> <small>${msg.time}</small><br>
    <audio controls src="${msg.audio}" style="margin-top: 5px;"></audio>
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === Render Image Message ===
function renderImage(msg) {
  const div = document.createElement("div");
  div.className = "chat-msg";
  div.innerHTML = `
    <strong>${msg.user}</strong> <small>${msg.time}</small><br>
    <img src="${msg.image}" alt="Image" style="max-width: 200px; margin-top: 5px;" />
  `;
  chatBox.appendChild(div);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// === Dark Mode Toggle ===
const toggleBtn = document.getElementById("dark-mode-toggle");
const body = document.body;

// Load saved theme from localStorage
if (localStorage.getItem("theme") === "dark") {
  body.classList.add("dark");
}

// Toggle theme
toggleBtn.addEventListener("click", () => {
  body.classList.toggle("dark");
  if (body.classList.contains("dark")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
});

// Emoji Picker Setup
const emojiBtn = document.querySelector('#emoji-btn');

const picker = new EmojiButton({
  position: 'top-end', // or 'bottom-start' if you want
  theme: 'auto' // Matches dark mode automatically
});

emojiBtn.addEventListener('click', () => {
  picker.togglePicker(emojiBtn);
});

// Insert emoji into the input field
picker.on('emoji', emoji => {
  messageInput.value += emoji;
  messageInput.focus(); // optional
});

// === Generate Chat Link Logic ===

// Generate a unique chat ID for the session (for example using Date.now() or a random string)
function generateUniqueChatID() {
  return 'chat-' + Math.random().toString(36).substr(2, 9); // Random unique ID
}

// Handle the "Generate Chat Link" button click
generateLinkBtn.addEventListener("click", function () {
  const uniqueChatID = generateUniqueChatID();
  const chatLink = `${window.location.origin}/chat/${uniqueChatID}`;
  
  // Display the link to the user (you can customize this)
  alert('Your chat link: ' + chatLink);
  console.log('Generated Chat Link:', chatLink);

  // Optionally, you can copy this link to clipboard
  navigator.clipboard.writeText(chatLink).then(() => {
    alert('Chat link copied to clipboard!');
  });
});
