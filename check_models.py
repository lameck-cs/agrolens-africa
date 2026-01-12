import os
from google import genai

# Configure your API key
os.environ["GOOGLE_API_KEY"] = "AIzaSyCEwx--sMz8KtxMn90cbxOThMszq2vyT5I"

client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])

print("--- Listing Available Models ---")
try:
    # List models and filter for those that support generating content
    for model in client.models.list():
        if "generateContent" in model.supported_actions:
            print(f"Model Name: {model.name}")
            print(f"   Display: {model.display_name}")
except Exception as e:
    print(f"Error: {e}")