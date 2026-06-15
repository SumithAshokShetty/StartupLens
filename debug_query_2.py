import os
from dotenv import load_dotenv
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

from langchain_groq import ChatGroq
from src.rag.retriever import vectorstore, rewrite_query, SimpleBM25, get_bm25_index
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from src.rag.retriever import FailedStartupResponse
import json

# Setup retrieval
query = "educational apps for children"
variations = rewrite_query(query, GROQ_API_KEY)
all_queries = [query] + list(set(variations))

bm25, all_docs = get_bm25_index()

unique_candidates = {}
for q in all_queries:
    v_docs_with_scores = vectorstore.similarity_search_with_relevance_scores(q, k=20)
    v_scores_map = {doc.metadata.get('name', '').lower(): (score, doc) for doc, score in v_docs_with_scores}
    
    bm25_scores = bm25.score(q)
    max_bm25 = max([score for score, idx in bm25_scores]) if bm25_scores else 0.0
    bm25_scores_map = {all_docs[idx].metadata.get('name', '').lower(): (score / max_bm25 if max_bm25 > 0 else 0.0, all_docs[idx]) for score, idx in bm25_scores}
    
    all_names = set(v_scores_map.keys()) | set(bm25_scores_map.keys())
    for name in all_names:
        v_score, doc_v = v_scores_map.get(name, (0.0, None))
        b_score, doc_b = bm25_scores_map.get(name, (0.0, None))
        doc = doc_v if doc_v else doc_b
        score = 0.5 * b_score + 0.5 * v_score
        if name not in unique_candidates or unique_candidates[name][0] < score:
            unique_candidates[name] = (score, doc)

sorted_c = sorted(unique_candidates.values(), key=lambda x: x[0], reverse=True)[:20]

from src.rag.reranker import CrossEncoderReranker
reranker = CrossEncoderReranker()
reranked = reranker.rerank(query, [item[1] for item in sorted_c], top_k=5)

print("Reranked Docs with Scores:")
for score, doc in reranked:
    print(f"Name: {doc.metadata.get('name')} | Score: {score:.3f}")

# Filter docs
filtered = [doc for score, doc in reranked if score >= 0.35]

context_list = []
for doc in filtered:
    meta = doc.metadata
    record = (
        f"- Name: {meta.get('name', 'N/A')}\n"
        f"- Sector: {meta.get('sector', 'N/A')}\n"
        f"- Years of Operation: {meta.get('years_of_operation', 'N/A')}\n"
        f"- What They Did (Product/Service): {meta.get('what_they_did', 'N/A')}\n"
        f"- Cash Raised/Burned: {meta.get('cash_burned', 'N/A')}\n"
        f"- Why They Failed: {meta.get('failure_analysis', 'N/A')}\n"
        f"- Learnings/Takeaway: {meta.get('learnings', 'N/A')}\n"
    )
    context_list.append(record)
context_str = "\n---\n".join(context_list)

print("\nContext:")
print(context_str)

# Run LLM
llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant", groq_api_key=GROQ_API_KEY)
parser = JsonOutputParser(pydantic_object=FailedStartupResponse)

prompt = PromptTemplate(
    template="You are an expert startup analyst specializing in failure post-mortems.\n"
             "Your task is to provide real examples of failed startups from the provided context database.\n\n"
             "CRITICAL RULES:\n"
             "1. Answer ONLY using the facts present in the 'Context Database Records' below. Do NOT assume, extrapolate, or invent details.\n"
             "2. Select up to 3 closest matches from the records.\n"
             "3. The 'summary' field MUST explain typical failure reasons in the '{query}' space. You must strictly derive these reasons from the details of the startups you selected. Explicitly name each selected startup to illustrate these points (e.g. 'In the {query} space, startups typically fail due to [Reason A], as seen with [Selected Startup A] failing due to [Detail A]'). Replace the bracketed terms with the actual reasons and details from the records.\n"
             "4. NEVER mention any company, competitor, or startup names in the 'summary' other than the exact names of the selected startups. If a retrieved record mentions that a startup failed because it 'lost to competitors like Chime or Amazon', you must NOT write 'Chime' or 'Amazon' in your summary; instead write 'competitors'. Only mention the names of the selected startups themselves.\n"
             "5. If the context contains insufficient information, indicate uncertainty clearly.\n\n"
             "Context Database Records:\n{context}\n\n"
             "Query: The user is building a startup in the '{query}' space.\n\n"
             "INSTRUCTION: Pick the most relevant startups from the records above (up to 3) and explain why their failures are lessons for the query.\n\n"
             "{format_instructions}",
    input_variables=["query", "context"],
    partial_variables={"format_instructions": parser.get_format_instructions()},
)

chain = prompt | llm
raw_res = chain.invoke({"query": query, "context": context_str})
print("\nRaw LLM Response:")
print(raw_res.content)
