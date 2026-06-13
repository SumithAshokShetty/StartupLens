import os
from dotenv import load_dotenv
from src.rag.retriever import vectorstore, expand_query, predict_sectors_from_query, get_failed_startups_info
import json

load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

queries = [
    "retail fashion platform for dresses",
    "educational apps for children",
    "fintech credit card for startups"
]

for query in queries:
    print("\n" + "="*80)
    print(f"QUERY: {query}")
    print("="*80)
    
    # 1. Similarity search results
    search_query = expand_query(query)
    print(f"Expanded Query: {search_query}")
    predicted_sectors = predict_sectors_from_query(query)
    print(f"Predicted Sectors: {predicted_sectors}")
    
    docs = vectorstore.similarity_search(search_query, k=100)
    print(f"Retrieved {len(docs)} docs from Chroma")
    
    # 2. Hybrid scores
    scored_docs = []
    query_words = set(search_query.lower().split())
    for doc in docs:
        score = 0.0
        meta = doc.metadata
        name_lower = meta.get('name', '').lower()
        sector_lower = meta.get('sector', '').lower()
        what_lower = meta.get('what_they_did', '').lower()
        why_lower = meta.get('failure_analysis', '').lower()
        takeaway_lower = meta.get('learnings', '').lower()
        
        # 1. Predicted Sector Match
        if meta.get('sector') in predicted_sectors:
            score += 3.0
        
        # 2. Keyword Matches
        for word in query_words:
            if len(word) <= 2 or word in ["for", "the", "and", "app", "apps", "niche", "space"]:
                continue
            if word in name_lower:
                score += 4.0
            if word in what_lower:
                score += 2.0
            if word in why_lower:
                score += 0.5
            if word in takeaway_lower:
                score += 0.5
        
        if what_lower or why_lower or takeaway_lower:
            score += 1.5
            
        scored_docs.append((score, doc))
    
    scored_docs.sort(key=lambda x: x[0], reverse=True)
    
    print("\nTop 15 hybrid reranked candidates:")
    seen_names = set()
    count = 0
    for score, doc in scored_docs:
        name = doc.metadata.get('name', 'Unknown')
        if not name or name == 'Unknown' or name.lower() in seen_names:
            continue
        seen_names.add(name.lower())
        count += 1
        print(f" {count:2d}. Name: {name:<20} | Sector: {doc.metadata.get('sector'):<30} | Score: {score:.1f} | Why: {doc.metadata.get('failure_analysis')[:60] if doc.metadata.get('failure_analysis') else 'N/A'}")
        if count >= 15:
            break

    # 3. Groq Response
    res = get_failed_startups_info(query, api_key)
    print("\nGroq Selected Startups:")
    for s in res.get('startups', []):
        print(f" - {s['name']}")
    print(f"Summary: {res.get('summary')}")
