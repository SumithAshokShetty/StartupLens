from src.rag.retriever import vectorstore, get_bm25_index, rewrite_query
from langchain_chroma import Chroma

# Check collection size
print("Chroma Collection Count:", vectorstore._collection.count())

# Query vectorstore for Edmodo
results_ed = vectorstore.get(where={"name": "Edmodo"})
print("\nEdmodo in Vectorstore:", results_ed)

# Query vectorstore for Codeacademy
results_co = vectorstore.get(where={"name": "Codeacademy"})
print("\nCodeacademy in Vectorstore:", results_co)
