import duckduckgo_search
print(f"duckduckgo_search version: {duckduckgo_search.__version__}")
from duckduckgo_search import DDGS

try:
    ddg = DDGS()
    print("Testing ddgs.text('python'):")
    res = list(ddg.text("python", max_results=3))
    print(res)
except Exception as e:
    import traceback
    traceback.print_exc()
