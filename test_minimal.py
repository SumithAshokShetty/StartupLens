import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
print(f"API Key found: {bool(api_key)}")

try:
    llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant", groq_api_key=api_key)
    res = llm.invoke("Hello, say 'API works'")
    print(res.content)
except Exception as e:
    print(f"Error: {e}")
