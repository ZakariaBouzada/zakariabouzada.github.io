// Store conversation history
let miniChatHistory = [];
let fullChatHistory = [];
let isThinking = false

const SUGGESTED_QUESTIONS = [
    "What projects has he built?",
    "What are his skills?",
    "Is he available for work?"
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

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
    if (!question || isThinking) return;
    isThinking = true;

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



    input.disabled = true;
    input.placeholder = "AI is thinking...";
    // Thinking message
    const thinkingMsg = document.createElement("div");
    thinkingMsg.className = "chat-msg thinking";
    thinkingMsg.textContent = "Thinking...";
    chatBox.appendChild(thinkingMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    // Create AI message box immediately — text streams into it
    //const aiMsg = document.createElement("div");
    //aiMsg.className = "chat-msg ai";
    //aiMsg.textContent = "";
    //chatBox.appendChild(aiMsg);

    try {
        const response = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask-stream", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question, history: miniChatHistory })
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiMsg = null;


        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            if (thinkingMsg && thinkingMsg.parentNode) {
                thinkingMsg.remove();
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    if (dataStr.startsWith("[HISTORY]")) {
                        miniChatHistory = JSON.parse(dataStr.slice(9));
                    } else {
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.token) {
                                if (!aiMsg) {
                                    aiMsg = document.createElement("div");
                                    aiMsg.className = "chat-msg ai";
                                    chatBox.appendChild(aiMsg);
                                }
                                aiMsg.textContent += parsed.token;
                                chatBox.scrollTop = chatBox.scrollHeight;
                                await sleep(30)
                            }
                        } catch {}
                    }
                }
            }
        }
        if (thinkingMsg && thinkingMsg.parentNode)
            thinkingMsg.remove();
        if (!aiMsg){
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "chat-msg ai";
            emptyMsg.textContent = "No response received.";
            chatBox.appendChild(emptyMsg);
        }
    } catch (err) {
        if (thinkingMsg && thinkingMsg.parentNode) thinkingMsg.remove();

        // 2. Create a fresh error bubble (don't use aiMsg here)
        const errorMsg = document.createElement("div");
        errorMsg.className = "chat-msg ai";
        errorMsg.textContent = "Error connecting to AI.";
        chatBox.appendChild(errorMsg);
    } finally {
        isThinking = false;
        input.disabled = false;
        input.placeholder = "Ask AI..."
        input.focus();
    }
}
async function askLLM() {
    const inputBox = document.getElementById("llm-question");
    const chatBox = document.getElementById("chat-box");
    const button = document.querySelector(".chat-input button");

    const question = inputBox.value.trim();
    if (!question || isThinking) return;
    isThinking = true;

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



    button.disabled = true;
    // Create AI message box immediately — text streams into it
    //const aiMsg = document.createElement("div");
    //aiMsg.className = "chat-msg ai";
    //aiMsg.textContent = "";
    //chatBox.appendChild(aiMsg);


    try {
        const response = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask-stream", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({question, history: fullChatHistory})
        });

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        let aiMsg = null; // Use consistent camelCase

        while (true) {
            const {done, value} = await reader.read();
            if (done) break;

            // Remove thinking message the moment data starts arriving
            if (thinkingMsg && thinkingMsg.parentNode) {
                thinkingMsg.remove();
            }

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");

            for (const line of lines) {
                if (line.startsWith("data: ")) {
                    const dataStr = line.slice(6);
                    if (dataStr.startsWith("[HISTORY]")) {
                        fullChatHistory = JSON.parse(dataStr.slice(9));
                    } else {
                        try {
                            const parsed = JSON.parse(dataStr);
                            if (parsed.token) {
                                // Create the bubble ONLY on the first token
                                if (!aiMsg) {
                                    aiMsg = document.createElement("div");
                                    aiMsg.className = "chat-msg ai";
                                    chatBox.appendChild(aiMsg);
                                }
                                aiMsg.textContent += parsed.token;
                                chatBox.scrollTop = chatBox.scrollHeight;
                                await sleep(30);
                            }
                        } catch (e) {}
                    }
                }
            }
        }
        if (thinkingMsg && thinkingMsg.parentNode)
            thinkingMsg.remove();
        if (!aiMsg){
            const emptyMsg = document.createElement("div");
            emptyMsg.className = "chat-msg ai";
            emptyMsg.textContent = "No response received.";
            chatBox.appendChild(emptyMsg);
        }
    } catch (err) {
        if (thinkingMsg) thinkingMsg.remove();
        // Create an error message bubble manually since aiMsg might be null
        const errorMsg = document.createElement("div");
        errorMsg.className = "chat-msg ai";
        errorMsg.textContent = "Error connecting to AI.";
        chatBox.appendChild(errorMsg);
    } finally {
        isThinking = false;
        button.disabled = false;
        inputBox.disabled = false;
        inputBox.focus();
    }
}