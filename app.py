import os
import json
import time 
import datetime 
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from google import genai
from google.genai import types
import plant_info 

# --- CONFIGURATION ---
# Tells Flask to look for HTML/CSS/JS files in the current directory ('.')
app = Flask(__name__, static_folder='.', static_url_path='')
CORS(app)

# Your API Key (Ideally set this in Render's Environment Variables)
os.environ["GOOGLE_API_KEY"] = "AIzaSyCEwx--sMz8KtxMn90cbxOThMszq2vyT5I"

client = genai.Client(
    api_key=os.environ["GOOGLE_API_KEY"]
)

# --- MASTER MODEL LIST ---
MODELS_TO_TRY = [
    "gemini-2.5-flash-lite",                
    "gemini-2.0-flash-lite-preview-02-05", 
    "gemini-2.5-flash",                     
    "gemini-2.0-flash",                     
    "gemini-flash-latest",                  
    "gemini-exp-1206"                       
]

# --- HELPER: ROBUST AI CALL ---
def get_gemini_response(prompt, image_bytes=None, mime_type="image/jpeg"):
    for model_name in MODELS_TO_TRY:
        for attempt in range(1, 3):
            try:
                print(f"🔄 Trying {model_name} (Attempt {attempt})...")
                
                if image_bytes:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[prompt, types.Part.from_bytes(data=image_bytes, mime_type=mime_type)]
                    )
                else:
                    response = client.models.generate_content(
                        model=model_name,
                        contents=[prompt]
                    )
                
                text = response.text.replace("```json", "").replace("```", "").strip()
                print(f"✅ Success with {model_name}!")
                return json.loads(text)

            except Exception as e:
                error_str = str(e)
                if "503" in error_str:
                    time.sleep(2)
                    continue 
                elif "429" in error_str:
                    break 
                else:
                    break
    return None

# --- ROUTE 1: DIAGNOSIS ---
@app.route("/identify", methods=["POST"])
def identify():
    if "image" not in request.files:
        return jsonify({"error": "No image uploaded"}), 400
    try:
        image_file = request.files["image"]
        file_mimetype = image_file.content_type or "image/jpeg"
        image_bytes = image_file.read()

        prompt = """
        You are an agricultural expert for Kenya. Analyze the plant image.
        OUTPUT ONLY RAW JSON. NO MARKDOWN.
        {
            "plant_name": "Common Name",
            "scientific_name": "Scientific Name",
            "description": "Short description.",
            "is_healthy": true/false,
            "diagnoses": [
                {
                    "name": "Disease Name",
                    "common_regions": "List 3 specific Kenyan Counties known for growing this crop where this disease is common (e.g. 'Kericho, Bomet, Uasin Gishu'). Do NOT say 'Widespread'.",
                    "symptoms": ["Symptom 1 (English/Kiswahili)", "Symptom 2...", "Symptom 3..."],
                    "remedy": ["Step 1 (Chemical)", "Step 2 (Organic)", "Step 3 (Prevention)"]
                }
            ]
        }
        """
        analysis = get_gemini_response(prompt, image_bytes, mime_type=file_mimetype)
        
        if not analysis:
             return jsonify({"error": "System Busy. Please try again later."}), 503

        if analysis.get("diagnoses"):
            for d in analysis["diagnoses"]:
                try: d["images"] = plant_info.get_images_for_disease(d["name"])
                except: d["images"] = []
                
        return jsonify(analysis)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# --- ROUTE 2: RISK FORECAST ---
@app.route("/forecast_risk", methods=["POST"])
def forecast_risk():
    data = request.json
    crop_name = data.get("crop_name", "")
    county = data.get("county", "")

    if not crop_name: return jsonify({"error": "Enter crop name"}), 400

    current_year = datetime.datetime.now().year
    location_str = f"specifically in {county} County, Kenya" if county else "in Kenya"
    
    # Strict Localization Prompt
    if county:
        affected_counties_prompt = f"List 3 specific sub-counties, wards, or areas strictly INSIDE {county}. Do NOT list other counties."
    else:
        affected_counties_prompt = "List 3 specific Kenyan Counties where this is common"

    prompt = f"""
    You are an Agricultural Expert. 
    The current year is {current_year}. 
    Predict disease risks for '{crop_name}' {location_str} for the upcoming seasons of {current_year}.
    
    OUTPUT ONLY RAW JSON. NO MARKDOWN.
    {{
        "crop": "{crop_name}",
        "location": "{county if county else 'National'}",
        "risks": [
            {{
                "disease_name": "Name of Disease",
                "probability_score": 85, 
                "description": "A simple 1-sentence description.",
                "risk_months": "Specific months and year (e.g. 'March - May {current_year}') when this disease is most likely to attack.",
                "affected_counties": "{affected_counties_prompt}",
                "conditions": "Short weather condition summary.",
                "remedy": "Brief chemical/organic remedy or prevention advice."
            }}
        ]
    }}
    """
    prediction = get_gemini_response(prompt)
    
    if not prediction:
        return jsonify({"error": "Daily Quota Exceeded. Please try again tomorrow."}), 500
        
    return jsonify(prediction)

# --- FRONTEND ROUTES (SERVES HTML PAGES) ---
@app.route('/')
def serve_index():
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory('.', path)

if __name__ == "__main__":
    app.run(debug=True)