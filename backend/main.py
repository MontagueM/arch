# backend/main.py
import io
from enum import Enum

import rembg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
from fastapi.middleware.cors import CORSMiddleware
import text2img.sana as sana
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import generate_3d_gaussian
from text2img.dalle3 import get_dalle3_image_bytes
app = FastAPI()

executor = ThreadPoolExecutor(max_workers=4)

class ImageModel(Enum):
    dalle3 = "dalle3"
    sana = "sana"


@app.websocket("/ws/generate-image")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive the initial message containing the prompt
        data = await websocket.receive_text()
        message = json.loads(data)
        prompt = message.get("prompt")
        image_model_str = message.get("image_model")
        if not prompt:
            await websocket.send_text(json.dumps({"type": "error", "message": "No prompt provided."}))
            await websocket.close()
            return
        if not image_model_str:
            await websocket.send_text(json.dumps({"type": "error", "message": "No image model provided."}))
            await websocket.close()
            return
        
        try:
            image_model = ImageModel[image_model_str]
        except KeyError:
            await websocket.send_text(json.dumps({"type": "error", "message": "Invalid image model provided."}))
            await websocket.close()
            return

        # Replace this with actual image generation logic
        await generate_image(prompt, image_model, websocket)
        await websocket.close()
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        await websocket.close()


async def generate_image(object_prompt: str, image_model: ImageModel, websocket: WebSocket) -> str:
    prompt = f"A single whimsical, highly detailed 3D object centered in the frame against a simple light background. The object should fill most of the image, with no distracting elements around it. Capture it from a slightly angled front-facing perspective so its features are fully visible. Render it in a bright, vibrant, and polished illustrative style with clean edges, crisp details, and subtle, even lighting. The result should look like a standalone, hero-style product shot of a fantastical or stylized building, creature, or construct, similar to the style of high-quality concept art pieces. The object itself should be a unique, original design that's visually striking and interesting to look at, with a clear focal point and a sense of depth and dimension. The object should be evenly lit from all sides with no shadows. The object is {object_prompt}."
    if image_model == ImageModel.dalle3:
        img = get_dalle3_image_bytes(prompt)
        rembg_img = rembg.remove(img)
        await websocket.send_bytes(rembg_img)
    else:
        async def send_progress(progress: int):
            await websocket.send_text(json.dumps({"type": "progress", "progress": progress}))
    
        def callback(step: int):
            progress = int((step / 20) * 100)
            print(f"Progress: {progress}%")
            asyncio.run(send_progress(progress))
        
    
        sana.load_model()
        image_path = await asyncio.get_event_loop().run_in_executor(
            executor, sana.run, prompt, callback
        )
        sana.unload_model()
    
        if image_path.startswith("error"):
            await websocket.send_text(json.dumps({"type": "error", "message": image_path}))
            return
    
        image_bytes = await generate_webp_image(image_path)

        # Send the WebP image as binary data
        await websocket.send_bytes(image_bytes)

async def generate_webp_image(image_path: str) -> bytes:
    with Image.open(image_path) as img:
        rembg_img = rembg.remove(img)
        # Optionally, you can perform image manipulations here
        # For example, converting to RGB if the image has an alpha channel
        if rembg_img.mode in ("RGBA", "P"):
            rembg_img = rembg_img.convert("RGB")
    
        # Create an in-memory bytes buffer
        webp_buffer = io.BytesIO()
    
        # Save the image to the buffer in WebP format
        rembg_img.save(webp_buffer, format="WEBP", quality=100)
    
        # Retrieve the byte data from the buffer
        webp_data = webp_buffer.getvalue()
    
    return webp_data

@app.websocket("/ws/generate-3d-view")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive the initial binary data of the iamge
        image_data = await websocket.receive_bytes()
        if not image_data:
            await websocket.send_text(json.dumps({"type": "error", "message": "No image provided."}))
            await websocket.close()
            return

        await generate_3d_view(image_data, websocket)
        await websocket.close()
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        await websocket.close()
        

async def generate_3d_view(image_data: bytes, websocket: WebSocket) -> None:
    # read ply from output/test.ply and return the bytes
    # ply_bytes = open("output/test.ply", "rb").read()
    # await websocket.send_bytes(ply_bytes)
    # return
    
    async def send_progress(progress: int):
        await websocket.send_text(json.dumps({"type": "progress", "progress": progress}))

    def callback(step: int):
        progress = int((step * 20))
        print(f"Progress: {progress}%")
        asyncio.run(send_progress(progress))

    generate_3d_gaussian.load_model()
    gaussian_ply_bytes = await asyncio.get_event_loop().run_in_executor(
        executor, generate_3d_gaussian.run, image_data, callback
    )
    generate_3d_gaussian.unload_model()

    await websocket.send_bytes(gaussian_ply_bytes)


@app.websocket("/ws/generate-3d-model")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        await generate_3d_model(websocket)
        await websocket.close()
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        await websocket.close()
        

async def generate_3d_model(websocket: WebSocket) -> None:
    # read ply from output/test.ply and return the bytes
    # _bytes = open("output/sample.glb", "rb").read()
    # await websocket.send_bytes(_bytes)
    # return

    async def send_progress(progress: int):
        await websocket.send_text(json.dumps({"type": "progress", "progress": progress}))

    def callback(step: int):
        progress = int((step * 20))
        print(f"Progress: {progress}%")
        asyncio.run(send_progress(progress))

    gaussian_ply_bytes = await asyncio.get_event_loop().run_in_executor(
        executor, generate_3d_gaussian.get_mesh, callback
    )

    await websocket.send_bytes(gaussian_ply_bytes)

@app.websocket("/ws/remove-background")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_bytes()
            input_image = Image.open(io.BytesIO(data))
            output_image = rembg.remove(input_image)

            buf = io.BytesIO()
            output_image.save(buf, format='PNG')
            processed_bytes = buf.getvalue()

            await websocket.send_bytes(processed_bytes)
    except WebSocketDisconnect:
        print("Client disconnected")