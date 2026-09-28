import os
from dotenv import load_dotenv
from hindsight_client import Hindsight

# Load .env
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Connect to Hindsight
client = Hindsight(
    base_url=os.getenv("HINDSIGHT_API_URL"),
    api_key=os.getenv("HINDSIGHT_API_KEY"),
)

# Recall a previous incident
result = client.recall(
    bank_id=os.getenv("HINDSIGHT_BANK_ID"),
    query="What happened after the deployment when API latency increased?"
)

print("Hindsight recalled:")
print(result)