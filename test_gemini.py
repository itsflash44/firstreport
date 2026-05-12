import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env.local')
key = os.environ.get('GEMINI_API_KEY')
print(f"Key loaded: {bool(key)}")
try:
    genai.configure(api_key=key)
    model = genai.GenerativeModel("gemini-1.5-flash")
    res = model.generate_content("hello")
    print(res.text)
except Exception as e:
    print(f"Error: {e}")
