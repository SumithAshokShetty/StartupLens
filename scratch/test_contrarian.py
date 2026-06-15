import os
import json
from dotenv import load_dotenv
load_dotenv()

from src.rag.retriever import get_failed_startups_info

groq_key = os.environ.get("GROQ_API_KEY")
query = "Information A location-based social check-in application where users share photos and earn loyalty points/rewards for visiting retail venues and venues with friends."

print("Running get_failed_startups_info...")
res = get_failed_startups_info(query, groq_key)
print("Keys in response:", res.keys())
if "synthesis" in res:
    print("Synthesis keys:", res["synthesis"].keys())
    print("Contrarian Take:", json.dumps(res["synthesis"].get("contrarian_take"), indent=2))
else:
    print("No synthesis in response!")
