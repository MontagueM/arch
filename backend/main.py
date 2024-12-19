# backend/main.py
import io

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import asyncio
import json
from fastapi.middleware.cors import CORSMiddleware
import text2img.sana as sana
from PIL import Image
from concurrent.futures import ThreadPoolExecutor

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
        # Schedule the send_progress coroutine
        asyncio.run(send_progress(progress))
    
    
    # Example of generating images with progress updates
    # image_path = r"/text-to-image/sana.png"
    # total_steps = 5
    # for step in range(1, total_steps + 1):
    #     # Simulate processing time
    #     await asyncio.sleep(1)
    #     progress = int((step / total_steps) * 100)
    #     await websocket.send_text(json.dumps({"type": "progress", "progress": progress}))
    #     # Optionally, generate or fetch actual image URLs here
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
        # Optionally, you can perform image manipulations here
        # For example, converting to RGB if the image has an alpha channel
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
    
        # Create an in-memory bytes buffer
        webp_buffer = io.BytesIO()
    
        # Save the image to the buffer in WebP format
        img.save(webp_buffer, format="WEBP", quality=80)
    
        # Retrieve the byte data from the buffer
        webp_data = webp_buffer.getvalue()
    
    return webp_data