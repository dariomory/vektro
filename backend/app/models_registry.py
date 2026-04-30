"""Registry of chat models available in the API.

This is the single source of truth for which models the API advertises.
The frontend reads from /models and renders the selector. When a new
model is added here with implemented=True, the rest of the stack
(loading, chat templates, switching) will need to catch up — for now
only SmolLM2 is actually wired into inference.

Speed and quality scores are approximate, based on public benchmarks
(MMLU, HumanEval, throughput numbers from the Huggingface leaderboard).
They're meant to give users a rough "what am I trading off" signal,
not a precise ranking.
"""
from typing import List, Optional
from pydantic import BaseModel, ConfigDict


class ModelInfo(BaseModel):
    model_config = ConfigDict(protected_namespaces=())

    id: str
    display_name: str
    hf_repo: str
    parameters: str
    context_length: int
    speed_score: int  # 1 (slow) - 5 (fast)
    quality_score: int  # 1 (lower) - 5 (higher)
    description: str
    notes: Optional[str] = None
    implemented: bool  # whether inference actually switches to this model yet


# Scores below are deliberately approximate and should be reviewed when
# we do the real multi-model implementation — inference benchmarks on
# the target hardware will tell us the truth.
#
# All four roadmap models are exposed in the switcher. Only SmolLM2 is
# backed by real inference today (implemented=True); the others render
# with a Preview badge on the frontend and fall back to the default
# model on the backend until loading and per-model chat templates land.

ACTIVE_MODELS: List[ModelInfo] = [
    ModelInfo(
        id="smollm2-360m",
        display_name="SmolLM2 360M",
        hf_repo="HuggingFaceTB/SmolLM2-360M-Instruct",
        parameters="360M",
        context_length=2048,
        speed_score=5,
        quality_score=2,
        description="Tiny and fast. Runs on CPU, good for quick replies and low-resource deployments.",
        implemented=True,
    ),
    ModelInfo(
        id="phi-3-mini",
        display_name="Phi-3 Mini",
        hf_repo="microsoft/Phi-3-mini-4k-instruct",
        parameters="3.8B",
        context_length=4096,
        speed_score=3,
        quality_score=4,
        description="Strong reasoning for its size. Good balance of speed and quality.",
        implemented=False,
    ),
    ModelInfo(
        id="gemma-2b",
        display_name="Gemma 2B",
        hf_repo="google/gemma-2b-it",
        parameters="2B",
        context_length=8192,
        speed_score=4,
        quality_score=3,
        description="Google's small instruction-tuned model. Well-rounded general-purpose option.",
        implemented=False,
    ),
    ModelInfo(
        id="mistral-7b",
        display_name="Mistral 7B",
        hf_repo="mistralai/Mistral-7B-Instruct-v0.2",
        parameters="7B",
        context_length=8192,
        speed_score=1,
        quality_score=5,
        description="Highest quality option in this list. Best for complex prompts.",
        notes="Needs a GPU. On CPU responses can take minutes.",
        implemented=False,
    ),
]

# Reserved for future roadmap entries (e.g. larger/specialised models)
# that aren't ready to appear in the switcher yet.
UPCOMING_MODELS: List[ModelInfo] = []

# Public list used by the API.
MODELS: List[ModelInfo] = ACTIVE_MODELS

MODELS_BY_ID = {m.id: m for m in MODELS}
DEFAULT_MODEL_ID = "smollm2-360m"


def get_model(model_id: Optional[str]) -> ModelInfo:
    """Look up a model by id, falling back to the default."""
    if model_id and model_id in MODELS_BY_ID:
        return MODELS_BY_ID[model_id]
    return MODELS_BY_ID[DEFAULT_MODEL_ID]
