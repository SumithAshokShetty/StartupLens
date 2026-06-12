import os
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma")

print(f"Loading Chroma from {CHROMA_DB_DIR}...")
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vectorstore = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)

query = "educational apps for children"
print(f"Searching for: '{query}'")
docs = vectorstore.similarity_search(query, k=3)

print(f"Found {len(docs)} docs")
for i, doc in enumerate(docs):
    print(f"\nDoc {i+1}:")
    print(doc.page_content)
    print(f"Metadata: {doc.metadata}")
