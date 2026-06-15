from duckduckgo_search import DDGS
import json

try:
    with DDGS() as ddgs:
        res = list(ddgs.text("failed startup agritech", max_results=5))
        print("Results:")
        print(json.dumps(res, indent=2))
except Exception as e:
    print(f"Error: {e}")
