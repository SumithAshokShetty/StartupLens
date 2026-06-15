import re

filepath = r"c:\Users\user\OneDrive\Desktop\StartupLens\frontend\src\components\LandingPage.tsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find("agent_scout_loop.sh")
if start_idx != -1:
    print("Found scout loop in file, showing 2000 chars after:")
    sub = content[start_idx:start_idx+2000]
    print(repr(sub))
else:
    print("Could not find scout loop")
