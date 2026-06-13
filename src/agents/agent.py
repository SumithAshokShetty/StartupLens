import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GOOGLE_API_KEY")

model_primary_name = "gemini-2.5-flash"
model_fallback_name = "gemini-2.5-flash"

class NativeAgentWrapper:
    def __init__(self, client, model_name, config):
        self.client = client
        self.model_name = model_name
        self.config = config

def create_agent_graph(target_model_name, target_api_key=None):
    key_to_use = target_api_key if target_api_key else os.getenv("GOOGLE_API_KEY")
    client = genai.Client(api_key=key_to_use)
    
    # Configure native search grounding tool for Gemini
    config = types.GenerateContentConfig(
        temperature=0.2,
        tools=[{"google_search": {}}],
    )
    
    # Force use of gemini-2.5-flash as it supports grounding tools properly
    model_name = "gemini-2.5-flash" if "flash" in target_model_name.lower() else target_model_name
    return NativeAgentWrapper(client, model_name, config)

def run_agent(agent_wrapper, prompt_text):
    try:
        response = agent_wrapper.client.models.generate_content(
            model=agent_wrapper.model_name,
            contents=prompt_text,
            config=agent_wrapper.config
        )
        print(f"--> API Response Object: {response}")
        if not response.text:
            raise ValueError("Model returned empty response")
        return response.text
    except Exception as e:
        error_str = str(e)
        print(f"    [Agent Error]: {error_str}")
        if "429" in error_str or "quota" in error_str.lower() or "limit" in error_str.lower() or "exhausted" in error_str.lower():
             raise RuntimeError("API_QUOTA_EXHAUSTED") from e
        raise e
