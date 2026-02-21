import argparse
import asyncio
import json
import logging
import os
import platform

import aiohttp
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaPlayer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pc")

import time

async def run(pc, audio_player, video_player, server_url):
    client_start_time = time.time() * 1000

    @pc.on("iceconnectionstatechange")
    async def on_iceconnectionstatechange():
        logger.info(f"ICE connection state is {pc.iceConnectionState}")
        if pc.iceConnectionState == "failed":
            await pc.close()

    # Create a datachannel
    channel = pc.createDataChannel("chat")

    @channel.on("open")
    def on_open():
        logger.info("Data channel is open")

    @channel.on("message")
    def on_message(message):
        # We expect JSON messages from the server
        try:
            data = json.loads(message)
            client_elapsed = (time.time() * 1000) - client_start_time
            if "timestamp" in data:
                # server sends its elapsed timestamp when it read the frame
                lag_ms = client_elapsed - data["timestamp"]
                data["estimated_lag_ms"] = round(lag_ms, 2)
            
            logger.info(f"✅ Received from Server: {json.dumps(data, indent=2)}")
        except json.JSONDecodeError:
            logger.info(f"Received message: {message}")

    # Add media tracks
    if audio_player:
        pc.addTrack(audio_player.audio)
        logger.info("Added audio track")
    if video_player:
        pc.addTrack(video_player.video)
        logger.info("Added video track")

    # Create offer
    logger.info("Creating offer...")
    offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    # Send offer to server
    logger.info(f"Sending offer to {server_url}...")
    async with aiohttp.ClientSession() as session:
        async with session.post(
            server_url,
            json={"sdp": pc.localDescription.sdp, "type": pc.localDescription.type},
        ) as response:
            if response.status != 200:
                logger.error(f"Failed to get offer from server: {response.status}")
                return
            
            answer = await response.json()
            logger.info("Received answer from server. Setting remote description...")
            await pc.setRemoteDescription(
                RTCSessionDescription(sdp=answer["sdp"], type=answer["type"])
            )

    logger.info("Connection established! Streaming media... Press Ctrl+C to stop.")
    
    # Keep running until cancelled
    while True:
        await asyncio.sleep(1)

def create_players():
    # Attempt to open default webcam and microphone on Linux
    sys_plat = platform.system()
    audio_player = None
    video_player = None
    
    try:
        if sys_plat == "Linux":
            video_player = MediaPlayer("/dev/video0", format="v4l2")
            try:
                # Try pulse, fallback to hw:0
                audio_player = MediaPlayer("default", format="pulse")
            except Exception:
                audio_player = MediaPlayer("hw:0", format="alsa")
        elif sys_plat == "Darwin":
            video_player = MediaPlayer("default:none", format="avfoundation", options={"framerate": "30", "video_size": "640x480"})
            audio_player = MediaPlayer("none:default", format="avfoundation")
        elif sys_plat == "Windows":
            video_player = MediaPlayer("video=Integrated Camera", format="dshow")
            audio_player = MediaPlayer("audio=Microphone Array", format="dshow")
    except Exception as e:
        logger.warning(f"Could not open media devices automatically: {e}")
        logger.info("Fallback: Provide media paths directly if needed.")
        
    return audio_player, video_player

async def main():
    parser = argparse.ArgumentParser(description="WebRTC test client")
    parser.add_argument("--server", default="http://localhost:8080/api/offer", help="Server URL for the offer endpoint")
    args = parser.parse_args()

    # Create players
    audio_player, video_player = create_players()

    pc = RTCPeerConnection()
    
    try:
        await run(pc, audio_player, video_player, args.server)
    except KeyboardInterrupt:
        pass
    finally:
        await pc.close()

if __name__ == "__main__":
    asyncio.run(main())
