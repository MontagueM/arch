import gc
import os
from typing import Callable, Dict

import rembg
from diffusers import SanaPipeline, DiffusionPipeline
import torch
from PIL import Image
from diffusers.callbacks import PipelineCallback

CallbackType = Callable[[int], None]

pipe: SanaPipeline | None = None

def load_model():
    global pipe
    pipe = SanaPipeline.from_pretrained(
        # "Efficient-Large-Model/Sana_600M_512px_diffusers",
        "Efficient-Large-Model/Sana_600M_1024px_diffusers",
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
        height=1024,
        width=1024,
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
        
    object_prompt = "a cute snowman toy with a scarf"
    prompt=f"A single whimsical, highly detailed 3D object centered in the frame against a simple dark background. The object should fill most of the image, with no distracting elements around it. Capture it from a slightly angled front-facing perspective so its features are fully visible. Render it in a bright, vibrant, and polished illustrative style with clean edges, crisp details, and subtle, even lighting. The result should look like a standalone, hero-style product shot of a fantastical or stylized building, creature, or construct, similar to the style of high-quality concept art pieces. The object itself should be a unique, original design that's visually striking and interesting to look at, with a clear focal point and a sense of depth and dimension. The object is {object_prompt}."
    # load_model()
    # run(prompt, callback)
    # unload_model()
    
    inputfile = "sana.png"
    image = Image.open(inputfile)
    output = rembg.remove(image)
    output.save("sana_transparent.png")