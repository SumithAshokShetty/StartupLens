import os
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

from src.rag.retriever import get_failed_startups_info
import json

res = get_failed_startups_info("educational apps for children", GROQ_API_KEY)
print(json.dumps(res, indent=2))
