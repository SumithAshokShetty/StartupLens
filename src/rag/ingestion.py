import os
import pandas as pd
from langchain_core.documents import Document
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_chroma import Chroma

CSV_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "CSV")
CHROMA_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "chroma")

def load_documents_from_csvs():
    documents = []
    if not os.path.exists(CSV_DIR):
        print(f"Directory {CSV_DIR} does not exist.")
        return documents

    # Read sector-specific files first, then general Startup Failures.csv
    all_files = os.listdir(CSV_DIR)
    sector_files = [f for f in all_files if f.endswith(".csv") and f != "Startup Failures.csv"]
    general_file = "Startup Failures.csv" if "Startup Failures.csv" in all_files else None
    
    files_to_process = sector_files + ([general_file] if general_file else [])
    processed_startup_names = set()

    def clean_val(val):
        if pd.isna(val):
            return ""
        val_str = str(val).strip()
        if val_str.lower() in ["nan", "null", "none", ""]:
            return ""
        return val_str

    for filename in files_to_process:
        file_path = os.path.join(CSV_DIR, filename)
        try:
            df = pd.read_csv(file_path)
            # Ensure columns are cleaned
            df.columns = [c.strip() for c in df.columns]
            
            for _, row in df.iterrows():
                name = clean_val(row.get('Name', ''))
                if not name:
                    continue
                
                name_lower = name.lower()
                # Deduplication logic: Only skip if this is the generic file and we already have a detailed record
                if filename == "Startup Failures.csv" and name_lower in processed_startup_names:
                    continue
                
                sector = clean_val(row.get('Sector', ''))
                years = clean_val(row.get('Years of Operation', ''))
                what = clean_val(row.get('What They Did', ''))
                raised = clean_val(row.get('How Much They Raised') or row.get('Cash Burned', ''))
                why = clean_val(row.get('Why They Failed') or row.get('Why they failed', ''))
                takeaway = clean_val(row.get('Takeaway') or row.get('Learnings', ''))
                
                # Check if this row is rich or generic
                is_generic = not (what or raised or why or takeaway)
                
                # Mark as processed if it's rich
                if not is_generic:
                    processed_startup_names.add(name_lower)
                
                # Construct natural language narrative
                narrative_parts = []
                if sector:
                    narrative_parts.append(f"{name} was a startup in the {sector} sector.")
                else:
                    narrative_parts.append(f"{name} was a startup company.")
                
                if years:
                    narrative_parts.append(f"It operated for {years}.")
                if what:
                    narrative_parts.append(f"The company worked on: {what}.")
                if raised:
                    narrative_parts.append(f"They raised or burned approximately {raised}.")
                if why:
                    narrative_parts.append(f"Ultimately, the company failed and shut down because {why}.")
                if takeaway:
                    narrative_parts.append(f"A key learning from their failure is: {takeaway}.")
                
                page_content = " ".join(narrative_parts)
                
                metadata = {
                    "source": filename,
                    "name": name,
                    "sector": sector,
                    "years_of_operation": years,
                    "what_they_did": what,
                    "cash_burned": raised,
                    "failure_analysis": why,
                    "learnings": takeaway
                }
                
                documents.append(Document(page_content=page_content, metadata=metadata))
        except Exception as e:
            print(f"Error reading {filename}: {e}")
            
    return documents

def ingest_data():
    print("Loading documents from CSVs...")
    docs = load_documents_from_csvs()
    print(f"Loaded {len(docs)} records from CSV files.")
    
    if not docs:
        print("No documents to ingest. Aborting.")
        return

    print("Initializing HuggingFace embeddings (all-MiniLM-L6-v2)...")
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    
    print("Creating/updating Chroma vector store...")
    os.makedirs(os.path.dirname(CHROMA_DB_DIR), exist_ok=True)
    
    # Remove existing vector store if present to prevent mixing old and new embeddings formats
    import shutil
    if os.path.exists(CHROMA_DB_DIR):
        print(f"Removing old vector store directory at {CHROMA_DB_DIR}")
        shutil.rmtree(CHROMA_DB_DIR)
        
    vectorstore = Chroma.from_documents(
        documents=docs,
        embedding=embeddings,
        persist_directory=CHROMA_DB_DIR
    )
    print("Ingestion complete. Database stored at", CHROMA_DB_DIR)

if __name__ == "__main__":
    ingest_data()

