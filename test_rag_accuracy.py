import pandas as pd
import json
from src.rag.retriever import get_failed_startups_info

# Load full dataset for ground truth
CSV_PATH = 'data/CSV/Startup Failures.csv'
df = pd.read_csv(CSV_PATH)

print(f"Dataset: {len(df)} startups")
print("Sectors:", df['Sector'].value_counts().head().to_dict())

# Test cases: query -> expected sectors (for validation)
TEST_CASES = [
    {"query": "fintech payments", "expected_sectors": ["Finance and Insurance"]},
    {"query": "edtech learning platform", "expected_sectors": ["Information"]},
    {"query": "hardware robotics", "expected_sectors": ["Manufacturing"]},
    {"query": "healthcare medical app", "expected_sectors": ["Health Care"]},
    {"query": "ecommerce fashion retail", "expected_sectors": ["Retail Trade"]},
    {"query": "food delivery service", "expected_sectors": ["Accommodation and Food Services"]},
    {"query": "saas crm software", "expected_sectors": ["Information"]},
    {"query": "biotech gene therapy", "expected_sectors": ["Health Care"]},
    {"query": "crypto blockchain", "expected_sectors": ["Finance and Insurance"]},  # May be low coverage
    {"query": "quantum computing", "expected_sectors": []},  # No match expected
]

# Mock mode for keyword retrieval testing only
# Set GROQ_KEY = 'your_key' for full eval
GROQ_KEY = 'mock'
if not GROQ_KEY:
    print("WARNING: Set GROQ_KEY for full LLM eval. Using mock without LLM.")
    GROQ_KEY = "mock"

results = []
total_relevant = 0
total_found = 0
precision_scores = []
recall_scores = []

for i, case in enumerate(TEST_CASES):
    print(f"\n--- Test {i+1}: '{case['query']}' ---")
    
    res = get_failed_startups_info(case['query'], GROQ_KEY)
    
    startups = res.get('startups', [])
    summary = res.get('summary', '')
    
    print(f"Found {len(startups)} startups")
    for s in startups:
        print(f"  - {s['name']} ({s['sector']})")
    print(f"Summary: {summary[:100]}...")
    
    # Ground truth: count actual relevant in dataset
    relevant_count = 0
    for _, row in df.iterrows():
        text = str(row).lower()
        if any(kw in text for kw in case['query'].lower().split()):
            relevant_count += 1
    
    found_relevant = sum(1 for s in startups if any(es in s['sector'] for es in case['expected_sectors']))
    precision = found_relevant / max(len(startups), 1)
    recall = min(1.0, found_relevant / max(relevant_count, 1))
    
    precision_scores.append(precision)
    if relevant_count > 0:
        recall_scores.append(recall)
        total_relevant += relevant_count
        total_found += found_relevant
    
    correct = found_relevant > 0 if case['expected_sectors'] else len(startups) == 0
    results.append({
        'query': case['query'],
        'found': len(startups),
        'relevant_found': found_relevant,
        'precision': precision,
        'recall': recall,
        'correct': correct,
        'summary': summary
    })
    print(f"Precision@3: {precision:.2f}, Recall: {recall:.2f}, Correct: {correct}")

# Summary metrics
avg_precision = sum(precision_scores) / len(precision_scores)
avg_recall = sum(recall_scores) / len(recall_scores) if recall_scores else 0
accuracy = sum(1 for r in results if r['correct']) / len(results)

print("\n" + "="*50)
print("ACCURACY SUMMARY")
print(f"Average Precision@3: {avg_precision:.3f}")
print(f"Average Recall: {avg_recall:.3f}")
print(f"Overall Accuracy (correct responses): {accuracy:.3f}")
print(json.dumps(results, indent=2, default=str))

with open('rag_accuracy_report.json', 'w') as f:
    json.dump(results, f, indent=2, default=str)

print("\nReport saved to rag_accuracy_report.json")

