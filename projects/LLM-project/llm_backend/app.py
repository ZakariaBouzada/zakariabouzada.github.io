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

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"status": "awake"}), 200

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
                "You are Zakaria Bouzada's Digital Assistant. Answer as if you are his personal AI representative. "
                "Use the following structured Resume Data to answer ANY question about his background, skills, or projects.\n\n"

                "NAME: Zakaria Bouzada\n"
                "PROFILE: Computer Engineering graduate and current MSc student at Åbo Akademi University. Expert in AI, LLMs, and Data Engineering.\n\n"

                "EDUCATION:\n"
                "- MSc in Computer Engineering (Ongoing, Åbo Akademi University).\n"
                "- BSc in Computer Engineering (2021-2025). Thesis: 'Digitalisering söder om Sahara' (Swedish).\n\n"

                "TECHNICAL SKILLS:\n"
                "- Languages: Python, Java, C, JavaScript, SQL, HTML/CSS.\n"
                "- Frameworks: React, Django, FastAPI, TensorFlow Lite Micro.\n"
                "- Tools: Docker, Terraform, Git, AWS, Azure, Databricks, PowerBI, Jenkins.\n\n"

                "PROJECT HIGHLIGHTS:\n"
                "- NBA Data Pipeline: Automatic medallion architecture on Databricks using Python and SQL.\n"
                "- Gesture Classification: Edge Computing on Arduino Nano using TensorFlow Lite.\n\n"

                "EXPERIENCE & LANGUAGES:\n"
                "- Native Swedish; Excellent Finnish and English; Good Arabic and French.\n"
                "- Professional background in Logistics, Customer Service, and Military Medical Corps.\n\n"

                "INSTRUCTIONS:\n"
                "1. If asked who Zakaria is, summarize his profile and education.\n"
                "2. If asked about skills, list his technical stack.\n"
                "3. If the answer isn't in the data above, say: 'I'm not sure about that specific detail, but you can reach Zakaria at zakaria.bouzada1@gmail.com'.\n"
                "4. Stay professional, confident, and helpful."
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