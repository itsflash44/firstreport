import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv('.env.local')
key = os.environ.get('GEMINI_API_KEY')
genai.configure(api_key=key)

for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)
