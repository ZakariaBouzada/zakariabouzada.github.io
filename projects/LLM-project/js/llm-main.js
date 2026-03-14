// Store conversation history
let miniChatHistory = [];
let fullChatHistory = [];

const SUGGESTED_QUESTIONS = [
    "What projects has he built?",
    "What are his skills?",
    "Is he available for work?"
];

// Wake up the Render server as soon as the page loads
window.addEventListener('DOMContentLoaded', () => {
    fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ping")
        .then(() => console.log("Server waking up..."))
        .catch(() => console.log("Server spin-up initiated."));

    // Show greeting immediately
    const chatBox = document.getElementById("mini-chat-box");
    if (chatBox) {
        chatBox.style.display = "block";
        const greeting = document.createElement("div");
        greeting.className = "chat-msg ai";
        greeting.textContent = "Hi! I'm Zakaria's AI assistant. Ask me anything about his background, projects, or skills.";
        chatBox.appendChild(greeting);

        const chipsContainer = document.createElement("div");
        chipsContainer.className = "chat-chips";
        SUGGESTED_QUESTIONS.forEach(q => {
            const chip = document.createElement("button");
            chip.className = "chat-chip";
            chip.textContent = q;
            chip.onclick = () => {
                document.getElementById("mini-llm-input").value = q;
                miniAskLLM();
            };
            chipsContainer.appendChild(chip);
        });
        chatBox.appendChild(chipsContainer);
    }
});

async function miniAskLLM() {
    const input = document.getElementById("mini-llm-input");
    const chatBox = document.getElementById("mini-chat-box");
    const question = input.value.trim();
    if (!question) return;

    // SHOW THE BOX: Change display from 'none' to 'block'
    chatBox.style.display = "block";

    // Remove chips once user starts chatting
    const chips = chatBox.querySelector(".chat-chips");
    if (chips) chips.remove();

    // User message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);

    chatBox.scrollTop = chatBox.scrollHeight;
    input.value = "";

    // Thinking message
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "chat-msg thinking";
    thinkingMsg.textContent = "Thinking...";
    chatBox.appendChild(thinkingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, history: miniChatHistory })
        });

        const data = await response.json();

        thinkingMsg.remove();

        if (data.history) miniChatHistory = data.history;

        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai";
        aiMsg.textContent = data.answer || "No response from AI.";
        chatBox.appendChild(aiMsg);

    } catch (err) {
        thinkingMsg.textContent = "Error connecting to AI.";
    }

    chatBox.scrollTop = chatBox.scrollHeight;
}
async function askLLM() {
    const inputBox = document.getElementById("llm-question");
    const chatBox = document.getElementById("chat-box");
    const button = document.querySelector(".chat-input button");

    const question = inputBox.value.trim();
    if (!question) return;

    // Remove chips
    const chips = chatBox.querySelector(".chat-chips");
    if (chips) chips.remove();

    // User message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);

    // Scroll after user speaks
    chatBox.scrollTop = chatBox.scrollHeight;

    inputBox.value = "";
    button.disabled = true;

    // Thinking message
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "chat-msg thinking";
    thinkingMsg.textContent = "AI is thinking...";
    chatBox.appendChild(thinkingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const res = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, history: fullChatHistory})
        });

        const data = await res.json();

        thinkingMsg.remove();

        if (data.history) fullChatHistory = data.history;

        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai";
        aiMsg.textContent = data.answer || "No response from AI.";
        chatBox.appendChild(aiMsg);

    } catch (err) {
        thinkingMsg.textContent = "Error: AI backend unreachable.";
    } finally {
        button.disabled = false;
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
