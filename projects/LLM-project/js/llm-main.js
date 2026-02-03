// Wake up the Render server as soon as the page loads
window.addEventListener('DOMContentLoaded', () => {
    fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ping")
        .then(() => console.log("Server waking up..."))
        .catch(() => console.log("Server spin-up initiated."));
});

async function miniAskLLM() {
    const input = document.getElementById("mini-llm-input");
    const chatBox = document.getElementById("mini-chat-box");
    const question = input.value.trim();
    if (!question) return;

    // SHOW THE BOX: Change display from 'none' to 'block'
    chatBox.style.display = "block";

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
    thinkingMsg.textContent = "AI is thinking...";
    chatBox.appendChild(thinkingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    try {
        const response = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });

        const data = await response.json();

        thinkingMsg.remove();

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
            body: JSON.stringify({ question })
        });

        const data = await res.json();

        thinkingMsg.remove();

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
