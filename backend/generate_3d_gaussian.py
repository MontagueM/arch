import gc
import io
import os
from typing import Callable
from TRELLIS.trellis.models import from_pretrained
from TRELLIS.trellis.utils import postprocessing_utils

import torch

# os.environ['ATTN_BACKEND'] = 'xformers'   # Can be 'flash-attn' or 'xformers', default is 'flash-attn'
os.environ['SPCONV_ALGO'] = 'native'        # Can be 'native' or 'auto', default is 'auto'.
# 'auto' is faster but will do benchmarking at the beginning.
# Recommended to set to 'native' if run only once.

from PIL import Image
from TRELLIS.trellis.pipelines import TrellisImageTo3DPipeline

pipeline: TrellisImageTo3DPipeline | None = None

cached_slat = None
cached_gaussian = None

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
    global cached_gaussian, cached_slat
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
    cached_gaussian = outputs['gaussian'][0]
    cached_slat = outputs['slat']
    s = io.BytesIO()
    ply.write(s)
    os.makedirs("output", exist_ok=True)
    ply.write("output/test.ply")
    return s.getvalue()

def get_mesh() -> bytes | str:
    global cached_slat, cached_gaussian
    
    if not cached_slat or not cached_gaussian:
        return "error model not initialised"
    with torch.no_grad():
        mesh_decoder_model = from_pretrained("JeffreyXiang/TRELLIS-image-large/ckpts/slat_dec_mesh_swin8_B_64l8m256c_fp16")
        mesh_decoder_model.cuda()
        mesh_decoder_model.eval()
        decoded_mesh = mesh_decoder_model(cached_slat)
        del mesh_decoder_model
    
    target_triangle_count = 50_000
    texture_size = 1024

    glb = postprocessing_utils.to_glb(
        cached_gaussian,
        decoded_mesh[0],
        target_triangle_count=target_triangle_count,
        texture_size=texture_size,
    )
    glb.export("output/sample.glb")
    return glb.export()

    
if __name__ == "__main__":
    load_model()
    run(open("assets/example_image/typical_building_castle.png", "rb").read(), lambda step: print(f"Progress: {step * 20}%"))
    unload_model()
    get_mesh()
