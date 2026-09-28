import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from hindsight_client import Hindsight
from groq import Groq

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://recallops-web.onrender.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hindsight = Hindsight(
    base_url=os.getenv("HINDSIGHT_API_URL"),
    api_key=os.getenv("HINDSIGHT_API_KEY"),
)

groq = Groq(
    api_key=os.getenv("GROQ_API_KEY")
)


class IncidentRequest(BaseModel):
    incident: str


class ResolutionRequest(BaseModel):
    incident: str
    resolution: str
    outcome: str


@app.get("/")
def home():
    return {"message": "RecallOps backend is running!"}


@app.post("/analyze")
async def analyze_incident(data: IncidentRequest):
    print("ANALYZE ENDPOINT STARTED", flush=True)

    incident = data.incident

    try:
        print("Recalling Hindsight memory...", flush=True)

        memory = await hindsight.arecall(
            bank_id=os.getenv("HINDSIGHT_BANK_ID"),
            query=incident
        )

        print("Hindsight recall completed.", flush=True)

        memories_text = "\n".join(
            item.text for item in memory.results
        )

        if not memories_text:
            memories_text = "No similar previous incidents found."

        prompt = f"""
You are RecallOps, an AI incident response agent.

Current incident:
{incident}

Relevant previous incident memories:
{memories_text}

Analyze the current incident using the previous memories.

Give:
1. Possible cause
2. Recommended action
3. Why the previous memory is relevant

Do not claim certainty if the evidence is insufficient.
"""

        print("Sending information to Groq...", flush=True)

        response = groq.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert production "
                        "incident response assistant."
                    )
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        ai_response = response.choices[0].message.content

        print("Groq response received.", flush=True)

        return {
            "incident": incident,
            "recalled_memories": memories_text,
            "ai_response": ai_response
        }

    except Exception as e:
        print("ERROR:", repr(e), flush=True)
        return {"error": str(e)}


@app.post("/resolve")
async def save_resolution(data: ResolutionRequest):
    print("RESOLUTION ENDPOINT STARTED", flush=True)

    try:
        memory = f"""
RecallOps production incident record.

Incident:
{data.incident}

Resolution:
{data.resolution}

Outcome:
{data.outcome}

This is the actual recorded outcome of the incident.
Use this experience when analyzing similar future incidents.
"""

        await hindsight.aretain(
            bank_id=os.getenv("HINDSIGHT_BANK_ID"),
            content=memory
        )

        print("Resolution stored in Hindsight.", flush=True)

        return {
            "status": "success",
            "message": "Resolution stored in Hindsight successfully.",
            "incident": data.incident,
            "resolution": data.resolution,
            "outcome": data.outcome
        }

    except Exception as e:
        print("ERROR:", repr(e), flush=True)
        return {"error": str(e)}