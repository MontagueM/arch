import gc
import io
import os
from typing import Callable

import torch

# os.environ['ATTN_BACKEND'] = 'xformers'   # Can be 'flash-attn' or 'xformers', default is 'flash-attn'
os.environ['SPCONV_ALGO'] = 'native'        # Can be 'native' or 'auto', default is 'auto'.
# 'auto' is faster but will do benchmarking at the beginning.
# Recommended to set to 'native' if run only once.

from PIL import Image
from TRELLIS.trellis.pipelines import TrellisImageTo3DPipeline

pipeline: TrellisImageTo3DPipeline | None = None


def load_model():
    global pipeline
    # Load a pipeline from a model folder or a Hugging Face model hub.
    pipeline = TrellisImageTo3DPipeline.from_pretrained("JeffreyXiang/TRELLIS-image-large")
    pipeline.cuda()


def unload_model():
    global pipeline
    del pipeline
    pipeline = None
    gc.collect()
    torch.cuda.empty_cache()

def run(image: bytes, callback: Callable[[int], None]) -> bytes:
    image = Image.open(io.BytesIO(image))

    outputs = pipeline.run(
        image,
        # Optional parameters
        seed=1,
        formats=["gaussian"],
        step_callback=callback,
    )
    
    # convert gaussian to PLY format
    ply = outputs['gaussian'][0].to_ply()
    s = io.BytesIO()
    ply.write(s)
    os.makedirs("output", exist_ok=True)
    ply.write("output/test.ply")
    return s.getvalue()

    
if __name__ == "__main__":
    load_model()
    run(open("assets/example_image/typical_building_castle.png", "rb").read(), lambda step: print(f"Progress: {step * 20}%"))
    unload_model()