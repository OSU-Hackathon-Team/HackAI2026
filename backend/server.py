import argparse
import asyncio
import json
import logging
import uuid
from aiohttp import web
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaBlackhole

# A Set to keep track of active RTCPeerConnections
pcs = set()

async def offer(request):
    """
    WebRTC Offer Endpoint: /api/offer
    
    How to use:
    1. The client (frontend) should create an RTCPeerConnection and add their webcam
       video and audio tracks to it. Give the frontend audio and video media streams.
    2. The client generates an SDP offer and sends it via POST request to this endpoint
       with a JSON payload containing `sdp` and `type` fields.
    3. The server processes the offer, sets up listeners for incoming media tracks,
       creates an SDP answer, and returns it to the client.
    4. The client applies the SDP answer to establish the WebRTC connection.
    5. The server will receive the video/audio streams on the 'track' event.

    Example JSON payload from client:
    {
        "sdp": "v=0\r\no=- 4209 ...",
        "type": "offer"
    }
    """
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pc_id = "PeerConnection(%s)" % uuid.uuid4()
    pcs.add(pc)

    # We use a MediaBlackhole to consume incoming media streams, meaning
    # we receive the data but don't do anything with it by default.
    # You could replace this with processing logic (e.g. saving to file, running ML models)
    recorder = MediaBlackhole()

    def log_info(msg, *args):
        logger.info(pc_id + " " + msg, *args)

    log_info("Created for %s", request.remote)

    @pc.on("datachannel")
    def on_datachannel(channel):
        @channel.on("message")
        def on_message(message):
            if isinstance(message, str) and message.startswith("ping"):
                channel.send("pong" + message[4:])

    @pc.on("connectionstatechange")
    async def on_connectionstatechange():
        log_info("Connection state is %s", pc.connectionState)
        if pc.connectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    @pc.on("track")
    def on_track(track):
        log_info("Track %s received", track.kind)

        # Here is where the user's webcam video and audio arrive!
        # `track.kind` will be "audio" or "video".
        # You can access the frames via async iteration (e.g., `frame = await track.recv()`).
        # For now, we add the tracks to the blackhole so they are consumed and don't buffer infinitely.
        if track.kind == "audio":
            recorder.addTrack(track)
        elif track.kind == "video":
            recorder.addTrack(track)

        @track.on("ended")
        async def on_ended():
            log_info("Track %s ended", track.kind)
            await recorder.stop()

    # handle offer
    await pc.setRemoteDescription(offer)
    await recorder.start()

    # send answer
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return web.Response(
        content_type="application/json",
        text=json.dumps(
            {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}
        ),
    )


async def on_shutdown(app):
    # close peer connections
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="WebRTC audio / video / data-channels server"
    )
    parser.add_argument("--host", default="0.0.0.0", help="Host for HTTP server (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8080, help="Port for HTTP server (default: 8080)")
    parser.add_argument("--verbose", "-v", action="count")
    args = parser.parse_args()

    if args.verbose:
        logging.basicConfig(level=logging.DEBUG)
    else:
        logging.basicConfig(level=logging.INFO)

    logger = logging.getLogger("pc")

    app = web.Application()
    app.on_shutdown.append(on_shutdown)
    
    # Prefix all routes with /api/ to handle proxy
    app.router.add_post("/api/offer", offer)

    # Simple health check endpoint
    app.router.add_get("/api/health", lambda request: web.Response(text="OK"))

    web.run_app(app, access_log=None, host=args.host, port=args.port)
