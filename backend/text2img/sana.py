import gc
import os
from typing import Callable, Dict

from diffusers import SanaPipeline, DiffusionPipeline
import torch
from diffusers.callbacks import PipelineCallback

CallbackType = Callable[[int], None]

pipe: SanaPipeline | None = None

def load_model():
    global pipe
    pipe = SanaPipeline.from_pretrained(
        "Efficient-Large-Model/Sana_600M_512px_diffusers",
        variant="fp16",
        torch_dtype=torch.float16,
    )
    pipe.to("cuda")
    
    pipe.vae.to(torch.bfloat16)
    pipe.text_encoder.to(torch.bfloat16)
    
def unload_model():
    global pipe
    del pipe
    pipe = None
    gc.collect()
    torch.cuda.empty_cache()

def run(prompt: str, callback: PipelineCallback) -> str:
    global pipe
    if not pipe:
        return "error model not initialised"

    def progress_callback(self: DiffusionPipeline, step: int, timestep: int, callback_kwargs: Dict) -> Dict:
        callback(step)
        return {}

    image = pipe(
        prompt=prompt,
        height=512,
        width=512,
        guidance_scale=5.0,
        num_inference_steps=20,
        generator=torch.Generator(device="cuda").manual_seed(42),
        callback_on_step_end=progress_callback,
    )[0]

    image[0].save("sana.png")
    return os.path.abspath("sana.png")


if __name__ == "__main__":
    def callback(s: int):
        print(s)
    run("Isometric style, wooden cube with a tree on top.", callback)