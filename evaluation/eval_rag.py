import os
import pandas as pd
import json
import time
from dotenv import load_dotenv
from src.rag.retriever import get_failed_startups_info
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate

# Load environment variables
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Benchmark Test Cases
# Format: (query, [ground_truth_startup_names])
BENCHMARK = [
    ("retail fashion platform for dresses", ["99dresses", "AllRomance", "Ahalife"]),
    ("educational apps for children", ["Airy Labs", "Codeacademy", "Edmodo"]),
    ("fintech credit card for startups", ["Brex", "Clinkle", "Cardless"]),
]

class RAGEvaluator:
    def __init__(self, api_key):
        self.api_key = api_key
        self.llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant", groq_api_key=api_key)
        
    def robust_json_loads(self, text):
        text = text.strip()
        if not text:
            return {"score": 0.0, "reason": "Empty response"}
        # Try to find JSON block
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1 and end > start:
            json_str = text[start:end+1]
            try:
                return json.loads(json_str)
            except Exception:
                pass
        try:
            return json.loads(text)
        except Exception as e:
            return {"score": 0.0, "reason": f"Failed to parse JSON: {e}. Raw response: {text[:200]}"}

    def evaluate_faithfulness(self, query, context_startups, summary):
        """Checks if the summary is faithful to the retrieved startups."""
        prompt = PromptTemplate.from_template("""
        You are a highly critical judge of AI responses.
        Task: Determine if the 'Summary' provided is faithful ONLY to the 'Retrieved Startups' records details.
        
        Retrieved Startups Records:
        {startups}
        
        Summary: {summary}
        
        Rules:
        1. If the summary mentions facts or startups NOT present in the retrieved records above, it is NOT faithful.
        2. Score from 0 to 1 (0 = total hallucination, 1 = perfectly faithful).
        
        Return ONLY a JSON object: {{"score": float, "reason": "string"}}
        """)
        
        chain = prompt | self.llm
        startup_details = "\n---\n".join([
            f"Name: {s.get('name', 'N/A')}\nSector: {s.get('sector', 'N/A')}\nProduct: {s.get('product_type', 'N/A')}\nWhy Failed: {s.get('failure_analysis', 'N/A')}\nLearnings: {s.get('learnings', 'N/A')}"
            for s in context_startups
        ])
        for _ in range(3):
            try:
                res = chain.invoke({"startups": startup_details, "summary": summary})
                return self.robust_json_loads(res.content)
            except Exception as e:
                print(f"    [!] Faithfulness eval failed, retrying... ({e})")
                time.sleep(10)
        return {"score": 0.0, "reason": "Eval failed after retries"}

    def evaluate_relevance(self, query, summary):
        """Checks if the summary is relevant to the user query."""
        prompt = PromptTemplate.from_template("""
        Task: Determine if the 'Summary' provided is relevant to the user's query '{query}'.
        Does it explain typical failure reasons in this specific niche?
        
        Summary: {summary}
        
        Score from 0 to 1 (0 = irrelevant, 1 = highly relevant).
        
        Return ONLY a JSON object: {{"score": float, "reason": "string"}}
        """)
        
        chain = prompt | self.llm
        for _ in range(3):
            try:
                res = chain.invoke({"query": query, "summary": summary})
                return self.robust_json_loads(res.content)
            except Exception as e:
                print(f"    [!] Relevance eval failed, retrying... ({e})")
                time.sleep(10)
        return {"score": 0.0, "reason": "Eval failed after retries"}

def run_evaluation():
    if not GROQ_API_KEY:
        print("ERROR: GROQ_API_KEY not found in .env")
        return

    evaluator = RAGEvaluator(GROQ_API_KEY)
    results = []
    
    total_hit_rate = 0
    total_faithfulness = 0
    total_relevance = 0

    print(f"Starting evaluation of {len(BENCHMARK)} cases...\n")

    for query, ground_truth in BENCHMARK:
        print(f"Testing Query: '{query}'")
        
        # 1. Get RAG Response (with retry)
        response = {"startups": [], "summary": "Error"}
        for _ in range(3):
            try:
                response = get_failed_startups_info(query, GROQ_API_KEY)
                if "Data processing error" not in response.get('summary', ''):
                    break
                print(f"    [!] RAG fetch failed, retrying... ({response.get('summary')})")
            except Exception as e:
                print(f"    [!] RAG fetch error, retrying... ({e})")
            time.sleep(15)
            
        startups = response.get('startups', [])
        summary = response.get('summary', '')

        # 2. Retrieval Score (Hit Rate@3)
        retrieved_names = [s['name'].lower() for s in startups]
        print(f"  - Selected Startups: {[s['name'] for s in startups]}")
        hits = sum(1 for gt in ground_truth if gt.lower() in retrieved_names)
        hit_rate = hits / len(ground_truth) if ground_truth else 0
        
        # 3. Generation Scores (using LLM-as-a-judge)
        faith_res = evaluator.evaluate_faithfulness(query, startups, summary)
        rel_res = evaluator.evaluate_relevance(query, summary)

        case_results = {
            "query": query,
            "retrieved_count": len(startups),
            "hit_rate": hit_rate,
            "faithfulness": faith_res['score'],
            "relevance": rel_res['score'],
            "details": {
                "hits": hits,
                "faith_reason": faith_res['reason'],
                "rel_reason": rel_res['reason']
            }
        }
        results.append(case_results)
        
        total_hit_rate += hit_rate
        total_faithfulness += faith_res['score']
        total_relevance += rel_res['score']
        
        print(f"  - Hit Rate: {hit_rate:.2f}")
        print(f"  - Faithfulness: {faith_res['score']:.2f}")
        print(f"  - Relevance: {rel_res['score']:.2f}")
        print("-" * 30)
        
        # Sleep to avoid rate limits (TPM)
        time.sleep(30)

    # Summary report
    avg_hr = total_hit_rate / len(BENCHMARK)
    avg_faith = total_faithfulness / len(BENCHMARK)
    avg_rel = total_relevance / len(BENCHMARK)
    
    report = {
        "summary": {
            "avg_retrieval_hit_rate": avg_hr,
            "avg_faithfulness": avg_faith,
            "avg_relevance": avg_rel,
            "overall_accuracy": (avg_hr + avg_faith + avg_rel) / 3
        },
        "cases": results
    }

    with open("rag_accuracy_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "="*40)
    print("FINAL EVALUATION RESULTS")
    print(f"Retrieval Hit Rate: {avg_hr:.2%}")
    print(f"Generation Faithfulness: {avg_faith:.2%}")
    print(f"Answer Relevance: {avg_rel:.2%}")
    print(f"OVERALL RAG ACCURACY: {report['summary']['overall_accuracy']:.2%}")
    print("="*40)
    print("Detailed report saved to 'rag_accuracy_report.json'")

if __name__ == "__main__":
    run_evaluation()
