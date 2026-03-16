import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")

# 1. Using Llama 3.2 (Ensure you requested access on Hugging Face first!)
MODEL = "Qwen/Qwen2.5-7B-Instruct:fastest"
# 2. Correct Router URL for Chat
HF_URL = "https://router.huggingface.co/v1/chat/completions"

app = Flask(__name__)
CORS(app)

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "awake"}), 200

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question", "")
    history = data.get("history", [])
    if not question:
        return jsonify({"answer": "Please ask a question!"})

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }

    # Build messages: system + last 5 history + current question
    messages = [
        {"role": "system", "content": (
            "STRICT RULES — follow these exactly:\n"
            "You are a friendly and professional AI assistant representing Zakaria Bouzada. ONLY answer the exact question asked. "
            "Answer warmly but concisely with maximum 3 sentences.\n\n"
            "If information isn't in the FACTS, politely say you don't have that detail and suggest contacting Zakaria directly at zakaria.bouzada1@gmail.com.:\n"
            "NEVER mention family, wife, children or anything not in FACTS.\n"
            "Do not explain yourself or add disclaimers.\n\n"

            "ABOUT ZAKARIA:\n"
            "- Zakaria Bouzada is a Computer Engineering graduate and MSc student at Åbo Akademi University in Finland.\n"
            "- He is a multilingual developer focused on solving real-world problems through scalable infrastructure.\n"
            "- He is comfortable taking responsibility and works well in international and multicultural teams.\n"
            "- Based in Finland. Finnish and Swedish are his native languages.\n\n"

            "EDUCATION:\n"
            "- MSc in Computer Engineering at Åbo Akademi University, Sep 2024 — ongoing.\n"
            "- BSc in Computer Engineering at Åbo Akademi University, Sep 2021 — Jun 2025.\n"
            "- Bachelor Thesis: 'Digitalisering söder om Sahara' — digitalization in Sub-Saharan Africa (written in Swedish).\n"
            "- Relevant courses: Cloud Computing, Software Construction, Machine Learning, Data Analytics.\n"
            "- Matriculation examination from Helsinge Gymnasium, Vantaa, May 2020.\n\n"

            "TECHNICAL SKILLS:\n"
            "- Programming: Python (Pandas, NumPy), Java, C/C++, JavaScript (React), SQL, Django, HTML/CSS, REST APIs.\n"
            "- AI & Data: LLMs, PyTorch, TensorFlow, Microsoft Databricks, Medallion architecture pipelines, Data Lakes, PowerBI, Kaggle.\n"
            "- Cloud: AWS, Microsoft Azure (VMs, Host Pools, Storage Accounts, Key Vault, Entra ID), Docker, Linux (Ubuntu/Debian).\n"
            "- DevOps: CI/CD (GitHub Actions, Jenkins), Git/GitHub, Postman, Hugging Face, Jupyter Notebooks, MATLAB.\n"
            "- Security & Admin: Microsoft 365, Microsoft Defender, System Architecture, Embedded Systems (Arduino).\n\n"

            "LANGUAGES:\n"
            "- Swedish: Native\n"
            "- Finnish: Native\n"
            "- English: Excellent\n"
            "- Arabic: Good\n"
            "- French: Good\n\n"

            "PROJECTS:\n"
            "- NBA Databricks Pipeline: Automated medallion ETL pipeline (Bronze/Silver/Gold) on Microsoft Databricks. "
            "73+ years of NBA data, 5300+ players, 22 datasets. Gold-layer powers a Chart.js dashboard and Power BI report. "
            "Link: https://zakariabouzada.github.io/projects/databricks-pipeline/databricks-pipeline.html\n"
            "- LLM Portfolio Search: This chatbot. Meta LLaMA 3.2 via Hugging Face Inference API, Flask backend on Render, GitHub Pages frontend.\n"
            "- Gesture Classification: TensorFlow Lite Micro on Arduino Nano 33 BLE Sense, real-time Rock-Paper-Scissors detection using OV7670 camera. "
            "Link: https://github.com/it-teaching-abo-akademi/edge-computing-for-ml-2025-ZakariaBouzada/tree/main/report\n"
            "- QuickFix — Mobile App: Cross-platform Android and iOS app with scalable backend. "
            "Integrated Google Cloud and JavaScript APIs for location-based services, Firebase for real-time database and authentication. "
            "Tools: Android Studio, Kotlin, Swift, Firebase, Google Cloud, Render.\n\n"

            "WORK EXPERIENCE:\n"
            "- HR Tukku Oy (Transmeri): Warehouse worker, packing, order fulfillment and assembly line. Aug 2024 - present (freelance).\n"
            "- Svops Oy (Fölläri): City bike system maintenance, van driver, customer service, bicycle repair. Jun-Oct 2022, Sep-Dec 2023, Sep-Dec 2024.\n"
            "- Bolt Works Oy (SE Mäkinen): Vehicle import inspector and driver. May-Aug 2023.\n"
            "- HOK-Elanto (ABC Car Wash): Customer service. May-Aug 2021.\n"
            "- Kotikatu Oy: Property caretaker. Jun-Jul 2019 and Jun-Jul 2020.\n\n"

            "MILITARY SERVICE:\n"
            "- Medical Corps, Uudenmaan Prikaati. Jul 2020 - Mar 2021.\n\n"

            "HOBBIES: Judo (junior Finnish national gold medalist), gym, basketball.\n\n"

            "OPEN TO: Data engineering, ML/AI engineering, backend, cloud roles.\n"
            "WEBSITE: https://zakariabouzada.github.io\n"
            "LINKEDIN: https://www.linkedin.com/in/zakaria-bouzada-54588622b/\n"
            "GITHUB: https://github.com/ZakariaBouzada/\n"
            "EMAIL: zakaria.bouzada1@gmail.com\n"
        )},
        {"role": "user", "content": "What are his hobbies?"},
        {"role": "assistant", "content": "His hobbies include gym, and basketball. He used to do judo, and is a junior Finnish national gold medalist!"},
        {"role": "user", "content": "What languages does he speak?"},
        {"role": "assistant", "content": "He speaks Swedish and Finnish natively, excellent English, and good Arabic and French."},
    ]

    # Add last 5 messages from history
    messages += history[-10:]  # 5 exchanges = 10 messages (user+assistant pairs)

    # Add current question
    messages.append({"role": "user", "content": question})

    payload = {
        "model": MODEL,
        "messages": messages,
        "max_tokens": 150,
        "temperature": 0.3
    }
    print(f"Sending to: {HF_URL}")
    print(f"Payload: {payload}")
    print(f"Using model: {MODEL}")
    try:
        response = requests.post(
            HF_URL, # Use the fixed URL here
            headers=headers,
            json=payload,
            timeout=30
        )

        print("HF status:", response.status_code)

        # 4. Handling specific HF Status Codes
        if response.status_code == 503:
            return jsonify({"answer": "Model is loading... try again in 20 seconds.", "history": history})
        elif response.status_code == 401:
            return jsonify({"answer": "API Key error. Check your .env file.", "history": history})
        elif response.status_code != 200:
            return jsonify({"answer": f"HF Error: {response.text}", "history": history})

        # 5. Parsing the Chat Completion response
        result = response.json()

        # Chat API returns structure: result['choices'][0]['message']['content']
        if "choices" in result and len(result["choices"]) > 0:
            answer = result["choices"][0]["message"]["content"]
        else:
            answer = "The model didn't provide an answer."

        # Return answer + updated history
        updated_history = history + [
            {"role": "user", "content": question},
            {"role": "assistant", "content": answer}
        ]

        return jsonify({"answer": answer, "history": updated_history})

    except Exception as e:
        return jsonify({"answer": f"Backend error: {str(e)}", "history": history})

if __name__ == "__main__":
    app.run()