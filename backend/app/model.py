import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ChatModel:
    """Handles loading and inference with the Huggingface model."""
    
    def __init__(self, model_name: str = "HuggingFaceTB/SmolLM2-360M-Instruct"):
        self.model_name = model_name
        self.model = None
        self.tokenizer = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        logger.info(f"Using device: {self.device}")
    
    def load(self) -> None:
        """Load the model and tokenizer."""
        logger.info(f"Loading model: {self.model_name}")
        
        self.tokenizer = AutoTokenizer.from_pretrained(
            self.model_name,
            trust_remote_code=True
        )
        
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_name,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
            trust_remote_code=True,
            low_cpu_mem_usage=True
        )
        
        self.model.to(self.device)
        self.model.eval()
        
        if self.tokenizer.pad_token is None:
            self.tokenizer.pad_token = self.tokenizer.eos_token
        
        logger.info("Model loaded successfully")
    
    def is_loaded(self) -> bool:
        """Check if the model is loaded."""
        return self.model is not None and self.tokenizer is not None
    
    def generate_response(
        self,
        messages: List[Dict[str, str]],
        max_new_tokens: int = 256,
        temperature: float = 0.7,
        top_p: float = 0.9
    ) -> str:
        """Generate a response based on the conversation history."""
        if not self.is_loaded():
            raise RuntimeError("Model not loaded. Call load() first.")
        
        prompt = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=True
        )
        
        inputs = self.tokenizer(
            prompt,
            return_tensors="pt",
            truncation=True,
            max_length=2048
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.model.generate(
                **inputs,
                max_new_tokens=max_new_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id
            )
        
        full_response = self.tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        response = self._extract_response(full_response, prompt)
        
        return response.strip()
    
    def _extract_response(self, full_response: str, prompt: str) -> str:
        """Extract just the assistant's response from the full output."""
        prompt_text = self.tokenizer.decode(
            self.tokenizer(prompt, return_tensors="pt")["input_ids"][0],
            skip_special_tokens=True
        )
        
        if full_response.startswith(prompt_text):
            response = full_response[len(prompt_text):]
        else:
            # fallback: try to find where the assistant response starts
            markers = ["assistant\n", "Assistant:", "<|assistant|>"]
            for marker in markers:
                if marker in full_response:
                    parts = full_response.split(marker)
                    if len(parts) > 1:
                        response = parts[-1]
                        break
            else:
                response = full_response
        
        return response.strip()
