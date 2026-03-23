"""
WebSocket server that broadcasts detected draft events to connected web clients.
"""
import asyncio
import json
import websockets

class DraftServer:
    def __init__(self, host: str = 'localhost', port: int = 3001):
        self.host = host
        self.port = port
        self.clients = set()
        self.event_queue = asyncio.Queue()
    
    async def register(self, websocket):
        self.clients.add(websocket)
        print(f"Client connected ({len(self.clients)} total)")
        try:
            await websocket.wait_closed()
        finally:
            self.clients.discard(websocket)
            print(f"Client disconnected ({len(self.clients)} total)")
    
    async def broadcast(self, event: dict):
        """Send an event to all connected clients."""
        if not self.clients:
            return
        message = json.dumps(event)
        await asyncio.gather(
            *[client.send(message) for client in self.clients],
            return_exceptions=True
        )
    
    async def process_events(self):
        """Process events from the queue and broadcast them."""
        while True:
            event = await self.event_queue.get()
            await self.broadcast(event)
    
    def queue_event(self, event: dict):
        """Thread-safe way to queue an event from the capture thread."""
        asyncio.get_event_loop().call_soon_threadsafe(
            self.event_queue.put_nowait, event
        )
    
    async def start(self):
        """Start the WebSocket server."""
        print(f"WebSocket server starting on ws://{self.host}:{self.port}")
        async with websockets.serve(self.register, self.host, self.port):
            await self.process_events()
