import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")

# 1. Using Llama 3.2 (Ensure you requested access on Hugging Face first!)
MODEL = "mistralai/Mistral-7B-Instruct-v0.3"
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
            "1. Answer in maximum 2 sentences.\n"
            "2. NEVER invent information not in FACTS below.\n"
            "3. NEVER mention family, wife, children or anything not in FACTS.\n"
            "4. If asked about hobbies, answer ONLY: judo, gym, basketball.\n"
            "5. Do not explain yourself or add disclaimers.\n\n"

            "FACTS:\n"
            "- MSc student in Computer Engineering at Åbo Akademi University (started Sep 2024, ongoing). "
            "BSc in Computer Engineering completed Sep 2021 - Jun 2025 at same university.\n"
            "- Thesis: 'Digitalisering söder om Sahara' — digital infrastructure gaps in Sub-Saharan Africa (written in Swedish).\n"
            "- Matriculation examination from Helsinge Gymnasium, Vantaa, May 2020.\n"
            "- Relevant courses: Cloud Computing, Software Construction, Machine Learning, Data Analytics.\n\n"
            "- Programming: Python (Pandas, NumPy), Java, C/C++, JavaScript (React), SQL, Django, HTML/CSS, REST APIs.\n"
            "- AI & Data: LLMs, PyTorch, TensorFlow, Microsoft Databricks, Medallion architecture pipelines, Data Lakes, PowerBI, Kaggle.\n"
            "- Cloud: AWS, Microsoft Azure (VMs, Host Pools, Storage Accounts, Key Vault, Entra ID), Docker, Linux (Ubuntu/Debian).\n"
            "- DevOps: CI/CD (GitHub Actions, Jenkins), Git/GitHub, Postman, Hugging Face, Jupyter Notebooks, MATLAB.\n"
            "- Security & Admin: Microsoft 365, Microsoft Defender, System Architecture, Embedded Systems (Arduino).\n\n"
            "- Languages: Swedish (native), Finnish (native), English (excellent), Arabic (good), French (good).\n\n"
            "PROJECTS:\n"
            "- NBA Databricks Pipeline: Automated medallion ETL pipeline (Bronze/Silver/Gold) on Microsoft Databricks. "
            "73+ years of NBA data, 5300+ players, 22 datasets. Gold-layer powers a Chart.js dashboard and Power BI report.\n"
            "- LLM Portfolio Search: This chatbot. Meta LLaMA 3.2 1B via Hugging Face Inference API, Flask backend on Render, GitHub Pages frontend.\n"
            "- Gesture Classification: TensorFlow Lite Micro on Arduino Nano 33 BLE Sense, real-time Rock-Paper-Scissors detection using OV7670 camera.\n"
            "- QuickFix — Mobile App: Cross-platform Android and iOS app with scalable backend. "
            "Integrated Google Cloud and JavaScript APIs for location-based services, Firebase for real-time database and authentication. "
            "Tools: Android Studio, Kotlin, Swift, Firebase, Google Cloud, Render.\n\n"
            "WORK EXPERIENCE:\n"
            "- HR Tukku Oy (Transmeri): Warehouse worker, packing and assembly line. Aug 2024 - present (freelance).\n"
            "- Svops Oy (Fölläri): City bike system maintenance, van driver, customer service, bicycle repair. 2022-2024 (seasonal).\n"
            "- Bolt Works Oy (SE Mäkinen): Vehicle import inspector and driver. May-Aug 2023.\n"
            "- HOK-Elanto (ABC Car Wash): Customer service. May-Aug 2021.\n"
            "- Kotikatu Oy: Property caretaker. Summers 2019 and 2020.\n\n"
            "MILITARY SERVICE:\n"
            "- Medical Corps, Uudenmaan Prikaati. Jul 2020 - Mar 2021.\n\n"
            "HOBBIES: Judo, gym, basketball.\n\n"
            "OPEN TO: Data engineering, ML/AI engineering, backend, cloud roles.\n"
            "WEBSITE: https://zakariabouzada.github.io\n"
            "EMAIL: zakaria.bouzada1@gmail.com\n"
        )}
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