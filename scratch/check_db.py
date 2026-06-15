from src.rag.retriever import get_bm25_index
bm25, all_docs = get_bm25_index()
print(f"Total documents in database: {len(all_docs)}")
sectors = set()
for doc in all_docs:
    sectors.add(doc.metadata.get('sector', 'N/A'))
print("Sectors in database:")
print(list(sectors)[:20])
print("\nSample startups in database:")
for doc in all_docs[:10]:
    print(f"- {doc.metadata.get('name')}: {doc.metadata.get('sector')} ({doc.metadata.get('what_they_did')[:60]}...)")
