async function miniAskLLM() {
    const input = document.getElementById("mini-llm-input");
    const chatBox = document.getElementById("mini-chat-box");
    const question = input.value.trim();
    if (!question) return;

    // Display user message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);
    chatBox.scrollTop = chatBox.scrollHeight;

    input.value = "";

    try {
        const response = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });
        const data = await response.json();

        // Display AI answer
        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai";
        aiMsg.textContent = data.answer;
        chatBox.appendChild(aiMsg);
        chatBox.scrollTop = chatBox.scrollHeight;

    } catch (err) {
        const errorMsg = document.createElement("div");
        errorMsg.className = "chat-msg ai";
        errorMsg.textContent = "Error: Could not connect to backend.";
        chatBox.appendChild(errorMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }
}
async function askLLM() {
    const inputBox = document.getElementById("llm-question");
    const chatBox = document.getElementById("chat-box");
    const question = inputBox.value.trim();
    if (!question) return;

    // Display user message
    const userMsg = document.createElement("div");
    userMsg.className = "chat-msg user";
    userMsg.textContent = question;
    chatBox.appendChild(userMsg);

    inputBox.value = "";

    // Call backend
    try {
        const res = await fetch("https://llm-search-zakariabouzada-github-io.onrender.com/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question })
        });
        const data = await res.json();

        // Display AI answer
        const aiMsg = document.createElement("div");
        aiMsg.className = "chat-msg ai";
        aiMsg.textContent = data.answer;
        chatBox.appendChild(aiMsg);
        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (err) {
        const errorMsg = document.createElement("div");
        errorMsg.className = "chat-msg ai";
        errorMsg.textContent = "Error: Could not connect to backend.";
        chatBox.appendChild(errorMsg);
    }

}
