from fastapi import WebSocket

class ProgressManager:
    def __init__(self):
        self.connections = {}

    async def connect(self, job_id: str, websocket: WebSocket):
        await websocket.accept()
        self.connections[job_id] = websocket

    def disconnect(self, job_id: str):
        self.connections.pop(job_id, None)

    async def send(self, job_id: str, data: dict):
        websocket = self.connections.get(job_id)

        if websocket:
            await websocket.send_json(data)

manager = ProgressManager()
