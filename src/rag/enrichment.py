import json
import os
from src.rag.config import KNOWLEDGE_BASE_JSON

class MetadataProvider:
    def __init__(self):
        self.knowledge_base = {}
        if os.path.exists(KNOWLEDGE_BASE_JSON):
            try:
                with open(KNOWLEDGE_BASE_JSON, "r") as f:
                    self.knowledge_base = json.load(f)
            except Exception as e:
                print(f"Error loading startup knowledge base: {e}")
        else:
            print(f"Startup knowledge base JSON not found at {KNOWLEDGE_BASE_JSON}")

    def enrich_record(self, name: str, existing_metadata: dict) -> dict:
        """
        Enrich existing metadata with information from the startup knowledge base.
        """
        name_key = name.strip()
        
        # Exact match or case-insensitive fallback search
        match = self.knowledge_base.get(name_key)
        if not match:
            for k, v in self.knowledge_base.items():
                if k.lower() == name_key.lower():
                    match = v
                    break
        
        if match:
            enriched = existing_metadata.copy()
            # Enrich only if the field in metadata is empty or missing
            for field, key_in_kb in [
                ("sector", "Sector"),
                ("years_of_operation", "Years of Operation"),
                ("what_they_did", "What They Did"),
                ("cash_burned", "Cash Burned"),
                ("failure_analysis", "Why They Failed"),
                ("learnings", "Takeaway")
            ]:
                kb_val = match.get(key_in_kb, "")
                if kb_val and not enriched.get(field):
                    enriched[field] = kb_val
            return enriched
        
        return existing_metadata

    def get_all_kb_startups(self) -> list:
        """
        Returns a list of all startup entries in the knowledge base.
        Useful for injecting missing startups.
        """
        results = []
        for name, data in self.knowledge_base.items():
            results.append({
                "name": data.get("Name", name),
                "sector": data.get("Sector", ""),
                "years_of_operation": data.get("Years of Operation", ""),
                "what_they_did": data.get("What They Did", ""),
                "cash_burned": data.get("Cash Burned", ""),
                "failure_analysis": data.get("Why They Failed", ""),
                "learnings": data.get("Takeaway", "")
            })
        return results
