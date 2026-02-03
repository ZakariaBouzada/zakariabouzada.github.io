import os
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# Load API key from .env
load_dotenv()
HF_API_KEY = os.getenv("HF_API_KEY")

# 1. Using Llama 3.2 (Ensure you requested access on Hugging Face first!)
MODEL = "meta-llama/Llama-3.2-1B-Instruct"
# 2. Correct Router URL for Chat
HF_URL = "https://router.huggingface.co/v1/chat/completions"

app = Flask(__name__)
CORS(app)

@app.route("/ask", methods=["POST"])
def ask():
    data = request.json
    question = data.get("question", "")
    if not question:
        return jsonify({"answer": "Please ask a question!"})

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json"
    }

    # 3. New Payload Format (Chat style)
    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content":(
                "You are the AI Assistant for Zakaria Bouzada's professional portfolio. "
                "Use these verified facts from his CV to answer questions: "
                "IDENTITY: Zakaria is a Computer Engineer born in Helsinki (2001). He is a BSc graduate and current MSc Student at Åbo Akademi University. "
                "EDUCATION: MSc in Computer Engineering (Ongoing, 2024-present); BSc in Computer Engineering (2021-2025). "
                "THESIS: His Bachelor's thesis 'Digitalisering söder om Sahara' explores digital transformation in Sub-Saharan Africa (Swedish). "
                "MASTER'S RESEARCH: Focusing on 'Infrastructure-as-Code (IaC) bundles for SMEs' using Terraform. "
                "TECHNICAL SKILLS: Python, C, Java, JavaScript (React, Django), SQL, HTML/CSS. "
                "TOOLS: Docker, Git/GitHub, AWS, Azure, Databricks, PowerBI, Postman, Linux, and CI/CD (Jenkins, GitHub Actions). "
                "KEY PROJECTS: 1) NBA Medallion Data Pipeline on Databricks using Python/SQL. 2) Gesture Classification using TensorFlow Lite Micro and Arduino Nano. "
                "WORK EXPERIENCE: Experience at Transmeri (Logistics), Svops Oy (Maintenance & Customer Service), and SE Mäkinen (Vehicle Inspection). "
                "LANGUAGES: Native Swedish; Excellent Finnish and English; Good Arabic and French. "
                "CONTACT: Email: zakaria.bouzada1@gmail.com | Phone: +358 44 2059970. "
                "MILITARY: Served in the Medical Corps (Uudenmaan Prikaati). "
                "Always be professional, concise, and identify as Zakaria's AI assistant."
            )
            },
            {"role": "user", "content": question}
        ],
        "max_tokens": 500
    }
    print(f"Sending to: {HF_URL}")
    print(f"Payload: {payload}")
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
            return jsonify({"answer": "Model is loading... try again in 20 seconds."})
        elif response.status_code == 401:
            return jsonify({"answer": "API Key error. Check your .env file."})
        elif response.status_code != 200:
            return jsonify({"answer": f"HF Error: {response.text}"})

        # 5. Parsing the Chat Completion response
        result = response.json()

        # Chat API returns structure: result['choices'][0]['message']['content']
        if "choices" in result and len(result["choices"]) > 0:
            answer = result["choices"][0]["message"]["content"]
        else:
            answer = "The model didn't provide an answer."

        return jsonify({"answer": answer})

    except Exception as e:
        return jsonify({"answer": f"Backend error: {str(e)}"})

if __name__ == "__main__":
    app.run()