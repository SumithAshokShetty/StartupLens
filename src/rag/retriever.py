import os
from langchain_groq import ChatGroq
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma
from pydantic import BaseModel, Field

CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma")

try:
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = Chroma(persist_directory=CHROMA_DB_DIR, embedding_function=embeddings)
except Exception as e:
    print(f"Error initializing vector store: {e}")
    vectorstore = None

class FailedStartupInfo(BaseModel):
    name: str = Field(description="Name of the startup")
    sector: str = Field(description="The sector or industry it belonged to")
    product_type: str = Field(description="What they did or their product/service")
    cash_burned: str = Field(description="Total cash burned or how much they raised before failing")
    years_of_operation: str = Field(description="Years of operation (format: start_year - end_year)")
    failure_analysis: str = Field(description="Why they failed, main reasons for shutting down")
    learnings: str = Field(description="Startup learnings or key takeaways from their failure")

class FailedStartupResponse(BaseModel):
    startups: list[FailedStartupInfo] = Field(description="List of maximum 3 relevant failed startups from the context")
    summary: str = Field(description="A brief summary of why startups in this space typically fail")

def predict_sectors_from_query(query: str):
    query_lower = query.lower()
    query_words = set(query_lower.split())
    sectors = []
    mapping = {
        "Finance and Insurance": ["finance", "fintech", "credit", "card", "payments", "bank", "banking", "crypto", "blockchain", "loan", "micropayment"],
        "Retail Trade": ["retail", "fashion", "dress", "dresses", "ecommerce", "shopping", "sales", "store", "clothing"],
        "Information": ["education", "educational", "app", "apps", "learning", "edtech", "information", "saas", "software", "crm", "platform", "online", "cloud", "database", "web", "internet", "social", "chat", "messaging", "automation"],
        "Health Care": ["health", "healthcare", "medical", "biotech", "gene", "therapy", "clinical", "doctor", "patient"],
        "Accommodation and Food Services": ["food", "restaurant", "delivery", "meal", "recipe", "pizza", "beers", "coffee"],
        "Manufacturing": ["hardware", "robotics", "robot", "device", "manufacture", "energy", "tracker"],
        "Transportation and Warehousing": ["transport", "transportation", "warehouse", "delivery", "logistics", "drone", "car", "transit"]
    }
    for sector, keywords in mapping.items():
        if any(kw in query_words for kw in keywords):
            sectors.append(sector)
    return sectors

def expand_query(query: str):
    query_lower = query.lower()
    expanded_terms = [query]
    synonyms = {
        "credit card": ["wallet", "payments", "cashless", "card", "prepaid", "visa", "debit", "banking", "transaction"],
        "dresses": ["apparel", "romance", "novels", "luxury", "lifestyle", "fashion", "retail", "dresses", "clothing"],
        "educational": ["school", "kids", "children", "lessons", "education", "books", "edtech", "learning"],
        "health": ["medical", "healthcare", "biotech", "clinical", "doctor", "wellness", "fitness", "patient"],
        "delivery": ["logistics", "shipping", "courier", "transport", "on-demand", "warehouse", "supply-chain"]
    }
    for term, syns in synonyms.items():
        if term in query_lower:
            expanded_terms.extend(syns)
    # Check individual words as well
    if "fintech" in query_lower or "finance" in query_lower:
        expanded_terms.extend(["wallet", "payments", "visa", "card"])
    if "retail" in query_lower or "ecommerce" in query_lower:
        expanded_terms.extend(["shop", "store", "commerce", "sales", "merchant"])
    return " ".join(list(set(expanded_terms)))

def get_failed_startups_info(query: str, groq_api_key: str):
    try:
        groq_api_key = groq_api_key.strip() if groq_api_key else ""
        
        context = "No relevant startup data found."

        if vectorstore:
            # Expand the query for vector store to capture relevant synonyms
            search_query = expand_query(query)
            
            # Query a larger candidate pool (k=100) to capture specific edge-cases like Clinkle
            docs = vectorstore.similarity_search(search_query, k=100)
            
            if docs:
                # Hybrid Reranking Heuristic
                scored_docs = []
                query_lower = query.lower()
                query_words = set(search_query.lower().split())
                predicted_sectors = predict_sectors_from_query(query)
                
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
                    
                    # 2. Keyword Matches (using expanded query words)
                    for word in query_words:
                        # Skip short stop-like words to avoid noise
                        if len(word) <= 2 or word in ["for", "the", "and", "app", "apps", "niche", "space"]:
                            continue
                        if word in name_lower:
                            score += 4.0  # High weight for exact name match
                        if word in what_lower:
                            score += 2.0
                        if word in why_lower:
                            score += 0.5
                        if word in takeaway_lower:
                            score += 0.5
                    
                    # 3. Boost detailed entries over generic entries
                    if what_lower or why_lower or takeaway_lower:
                        score += 1.5
                        
                    scored_docs.append((score, doc))
                
                # Sort by our hybrid score descending
                scored_docs.sort(key=lambda x: x[0], reverse=True)
                
                context_list = []
                seen_names = set()
                for score, doc in scored_docs:
                    name = doc.metadata.get('name', 'Unknown')
                    if not name or name == 'Unknown' or name.lower() in seen_names:
                        continue
                    seen_names.add(name.lower())
                    
                    meta = doc.metadata
                    record = (
                        f"STARTUP RECORD (Relevance Score: {score:.1f}):\n"
                        f"- Name: {meta.get('name', 'N/A')}\n"
                        f"- Sector: {meta.get('sector', 'N/A')}\n"
                        f"- Years of Operation: {meta.get('years_of_operation', 'N/A')}\n"
                        f"- What They Did (Product/Service): {meta.get('what_they_did', 'N/A')}\n"
                        f"- Cash Raised/Burned: {meta.get('cash_burned', 'N/A')}\n"
                        f"- Why They Failed: {meta.get('failure_analysis', 'N/A')}\n"
                        f"- Learnings/Takeaway: {meta.get('learnings', 'N/A')}\n"
                    )
                    context_list.append(record)
                    
                    # Limit formatted context to top 15 candidates to avoid prompt clutter
                    if len(context_list) >= 15:
                        break
                
                if context_list:
                    context = "\n---\n".join(context_list)
                else:
                    return {
                        "startups": [],
                        "summary": "No directly relevant failed startup case studies were found in our specialized database for this specific niche."
                    }
            else:
                return {
                    "startups": [],
                    "summary": "No directly relevant failed startup case studies were found in our specialized database for this specific niche."
                }
        else:
            return {
                "startups": [],
                "summary": "Search system is currently unavailable. Please check the database status."
            }
        
        llm = ChatGroq(temperature=0, model_name="llama-3.1-8b-instant", groq_api_key=groq_api_key)
        parser = JsonOutputParser(pydantic_object=FailedStartupResponse)
        
        prompt = PromptTemplate(
            template="You are an expert startup analyst specializing in failure post-mortems.\n"
                     "Your task is to provide real examples of failed startups from the provided context database.\n\n"
                     "CRITICAL RULES:\n"
                     "1. ONLY use startups present in the 'Context Database Records' below.\n"
                     "2. Select the startups from the context that are the closest matches or belong to the same general industry sector as the query '{query}' (e.g. Retail startups for fashion/dresses, Finance/Insurance startups for fintech, Information for apps/software). Do NOT discard them for minor niche differences. List up to 3 closest matches.\n"
                     "3. If you find absolutely no records in the context, return an empty 'startups' list [] and in the 'summary', state that no direct matches were found.\n"
                     "4. If you find matching startups in the context, list a maximum of 3.\n"
                     "5. The 'summary' field MUST explain typical failure reasons in the '{query}' space, but you MUST strictly derive these reasons from the details of the startups you selected. Explicitly name each selected startup to illustrate these points (e.g. 'In the {query} space, startups typically fail due to [Reason A], as seen with [Selected Startup A] failing due to [Detail A], or due to [Reason B], as demonstrated by [Selected Startup B] failing due to [Detail B]'). Replace the bracketed terms with the actual reasons and details from the records. Do NOT hallucinate or copy the terms 'cash burn' or 'lack of product focus' unless they are explicitly present in the selected records.\n"
                     "6. NEVER mention any company, competitor, or startup names in the 'summary' other than the exact names of the selected startups. For example, if a retrieved record mentions that a startup failed because it 'lost to competitors like Chime or Amazon', you must NOT write 'Chime' or 'Amazon' in your summary; instead write 'competitors'. Only mention the names of the selected startups themselves.\n"
                     "7. The 'Context Database Records' are sorted by relevance. You MUST select the startups with higher Relevance Scores (from the top of the list) when choosing your top 3. Strongly prefer higher-scoring records.\n\n"
                     "Context Database Records:\n{context}\n\n"
                     "Query: The user is building a startup in the '{query}' space.\n\n"
                     "INSTRUCTION: Pick the most relevant startups from the records above (up to 3) and explain why their failures are lessons for the query. If the records are empty or totally irrelevant, be honest.\n\n"
                     "{format_instructions}",
            input_variables=["query", "context"],
            partial_variables={"format_instructions": parser.get_format_instructions()},
        )
        
        chain = prompt | llm | parser
        
        result = chain.invoke({"query": query, "context": context})
        return result
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {
            "startups": [],
            "summary": f"Data processing error: {str(e)}. Please check your API key."
        }
