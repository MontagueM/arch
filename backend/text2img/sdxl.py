import torch
from diffusers import AutoPipelineForText2Image

pipe = AutoPipelineForText2Image.from_pretrained("stabilityai/sdxl-turbo", torch_dtype=torch.float16, variant="fp16")
pipe.to("cuda")

object_prompt = "a cute snowman toy with a scarf"
prompt=f"A single whimsical, highly detailed 3D object centered in the frame against a simple dark background. The object should fill most of the image, with no distracting elements around it. Capture it from a slightly angled front-facing perspective so its features are fully visible. Render it in a bright, vibrant, and polished illustrative style with clean edges, crisp details, and subtle, even lighting. The result should look like a standalone, hero-style product shot of a fantastical or stylized building, creature, or construct, similar to the style of high-quality concept art pieces. The object itself should be a unique, original design that's visually striking and interesting to look at, with a clear focal point and a sense of depth and dimension. The object is {object_prompt}."
image = pipe(prompt=prompt, num_inference_steps=1, guidance_scale=0.0).images[0]
image.save("test.png")