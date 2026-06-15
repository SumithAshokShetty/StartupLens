from src.rag.retriever import get_bm25_index
bm25, all_docs = get_bm25_index()
print(f"Total documents: {len(all_docs)}")
agri_docs = [doc for doc in all_docs if 'agri' in doc.metadata.get('sector', '').lower() or 'agri' in doc.metadata.get('name', '').lower() or 'agri' in doc.page_content.lower()]
print(f"Found {len(agri_docs)} documents with 'agri' in them.")
for d in agri_docs[:10]:
    print(f"- {d.metadata.get('name')}: {d.metadata.get('sector')} | {d.metadata.get('what_they_did')[:100]}")
