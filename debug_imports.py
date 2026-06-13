import sys
print("Starting debug script...")
import os
print("Imported os")
import pandas as pd
print("Imported pandas")
from dotenv import load_dotenv
print("Imported dotenv")
from langchain_groq import ChatGroq
print("Imported ChatGroq")
from src.rag.retriever import get_failed_startups_info
print("Imported retriever function")
print("All imports complete.")
