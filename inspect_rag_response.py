import os
from dotenv import load_dotenv
from src.rag.retriever import get_failed_startups_info
import json

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

query = "educational apps for children"
print(f"Query: {query}")
res = get_failed_startups_info(query, api_key)

print("\nRAG Response:")
print(json.dumps(res, indent=2))
