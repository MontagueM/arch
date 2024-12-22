import requests
from openai import OpenAI

def get_dalle3_image_bytes(prompt):
    client = OpenAI()
    image_params = {
        "model": "dall-e-3",
        "n": 1,
        "size": "1024x1024",
        "prompt": prompt,
        "quality": "standard"
    }
    response = client.images.generate(**image_params)
    url = response.data[0].url
    # Download the image
    response = requests.get(url)
    return response.content
    
    a = 0

if __name__ == "__main__":
    object_prompt = "A christmas tree with a star on top and colorful ornaments."
    prompt = f"A single whimsical, highly detailed 3D object centered in the frame against a simple light background. The object should fill most of the image, with no distracting elements around it. Capture it from a slightly angled front-facing perspective so its features are fully visible. Render it in a bright, vibrant, and polished illustrative style with clean edges, crisp details, and subtle, even lighting. The result should look like a standalone, hero-style product shot of a fantastical or stylized building, creature, or construct, similar to the style of high-quality concept art pieces. The object itself should be a unique, original design that's visually striking and interesting to look at, with a clear focal point and a sense of depth and dimension. The object is {object_prompt}."
    image_bytes = get_dalle3_image_bytes(prompt)
    with open("dalle3.png", "wb") as f:
        f.write(image_bytes)