# backend/main.py
import io

import rembg
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
from fastapi.middleware.cors import CORSMiddleware
import text2img.sana as sana
from PIL import Image
from concurrent.futures import ThreadPoolExecutor
import generate_3d_gaussian

app = FastAPI()

executor = ThreadPoolExecutor(max_workers=4)

@app.websocket("/ws/generate-image")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        # Receive the initial message containing the prompt
        data = await websocket.receive_text()
        message = json.loads(data)
        prompt = message.get("prompt")
        if not prompt:
            await websocket.send_text(json.dumps({"type": "error", "message": "No prompt provided."}))
            await websocket.close()
            return

        # Replace this with actual image generation logic
        await generate_image(prompt, websocket)
        await websocket.close()
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        await websocket.send_text(json.dumps({"type": "error", "message": str(e)}))
        await websocket.close()

async def generate_image(prompt: str, websocket: WebSocket) -> str:
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