import os
import time
import threading
import json
import asyncio
import subprocess
import sys
import websockets
import RPi.GPIO as GPIO
from dotenv import load_dotenv

from oled_module import OLEDModule
from mqtt_client import RobotMqttClient
from config import USE_WAKE_WORD, WAKE_WORD
from hardware_config import GPIO_MODE, TOUCH_SEQUENCE
from touch_module import TouchModule
from stepper_module import StepperModule

# Set global GPIO mode before initializing modules
GPIO.setwarnings(False)
GPIO.setmode(GPIO.BCM if GPIO_MODE == "BCM" else GPIO.BOARD)
load_dotenv()

async def frontend_handler(websocket, *args, mqtt_bot=None):
    print("Frontend UI connected via WebSocket.")
    try:
        async for message in websocket:
            data = json.loads(message)
            if data.get("type") == "PLACE_ORDER":
                table_id = data.get("tableId", "1")
                items = data.get("items", [])
                mqtt_bot.publish_order(table_id, items)
    except Exception as e:
        print(f"WebSocket error: {e}")

async def _run_ws_server(mqtt_bot):
    async def handler_wrapper(websocket, *args):
        await frontend_handler(websocket, *args, mqtt_bot=mqtt_bot)
    
    # Modern websockets usage
    async with websockets.serve(handler_wrapper, "0.0.0.0", 8765):
        await asyncio.Future() 

def start_websocket_server(mqtt_bot):
    # USE THIS:
    asyncio.run(_run_ws_server(mqtt_bot))

# def start_websocket_server(mqtt_bot):
#     loop = asyncio.new_event_loop()
#     asyncio.set_event_loop(loop)
#     # 8765 port එකේ WebSocket Server එක ආරම්භ වේ
#     start_server = websockets.serve(lambda ws, path: frontend_handler(ws, path, mqtt_bot), "0.0.0.0", 8765)
#     loop.run_until_complete(start_server)
#     loop.run_forever()

def _run_face_tracker_cycle():
    tracker_script = os.path.join(os.path.dirname(__file__), "robot_face_tracker.py")
    max_seconds = os.getenv("FACE_TRACKER_MAX_SECONDS", "30")
    command = [
        sys.executable,
        tracker_script,
        "--auto-stop-on-lock",
        "--max-run-seconds",
        str(max_seconds),
    ]

    print("Starting face tracker cycle...")
    try:
        result = subprocess.run(command, check=False)
        print(f"Face tracker cycle finished with exit code {result.returncode}.")
    except Exception as e:
        print(f"Face tracker start error: {e}")

def _touch_worker(
    touch: TouchModule,
    servo: StepperModule,
    oled: OLEDModule,
    stop_event: threading.Event,
):
    sequence = list(getattr(touch, "sequence_order", TOUCH_SEQUENCE))
    sequence_index = 0

    last_sensor = None
    last_trigger_time = 0.0
    debounce_seconds = 0.35

    while not stop_event.is_set():
        try:
            sensor_id = touch.get_touched_sensor()
            if sensor_id is not None:
                now = time.time()
                if sensor_id != last_sensor or (now - last_trigger_time) > debounce_seconds:
                    direction = touch.sensor_directions.get(sensor_id, "front")
                    expected_sensor = sequence[sequence_index]

                    if sensor_id == expected_sensor:
                        print(
                            f"Touch sensor {sensor_id} accepted "
                            f"({sequence_index + 1}/{len(sequence)}): rotate to sensor sector {sensor_id}."
                        )
                        oled.look_at(direction)
                        servo.rotate_to_sensor(sensor_id)
                        sequence_index += 1

                        if sequence_index >= len(sequence):
                            print("Sequence complete: 360-degree rotation finished.")
                            sequence_index = 0
                    else:
                        print(
                            f"Touch sensor {sensor_id} out of sequence "
                            f"(expected {expected_sensor}); rotating shortest path to sensor sector {sensor_id}."
                        )
                        oled.look_at(direction)
                        servo.rotate_to_sensor(sensor_id)
                        sequence_index = 1 if sensor_id == sequence[0] else 0

                    if not stop_event.is_set():
                        _run_face_tracker_cycle()

                    last_sensor = sensor_id
                    last_trigger_time = now
            time.sleep(0.05)
        except Exception as e:
            print(f"Touch worker error: {e}")
            time.sleep(0.2)

def main():
    gemini_api_key = os.getenv("GEMINI_API_KEY")

    class _SilentAudio:
        def speak_text(self, text: str):
            print(f"AURA speaking (audio disabled): {text}")

    voice = None
    audio = _SilentAudio()

    try:
        from audio_module import AudioModule
        audio = AudioModule()
    except ModuleNotFoundError as e:
        print(f"Audio disabled (missing dependency): {e}")
        print("Tip: run with venv Python -> ./venv/bin/python main_controller.py")
    except Exception as e:
        print(f"Audio disabled (initialization error): {e}")

    if gemini_api_key:
        try:
            from voice_module import VoiceModule
            voice = VoiceModule(gemini_api_key=gemini_api_key)
        except ModuleNotFoundError as e:
            print(f"Voice mode disabled (missing dependency): {e}")
            print("Tip: run with venv Python -> ./venv/bin/python main_controller.py")
        except Exception as e:
            print(f"Voice mode disabled (initialization error): {e}")

    # Initialize MQTT client
    mqtt_bot = RobotMqttClient(robot_id="aura_bot_01")
    mqtt_bot.start()

    # Initialize WebSocket Server in background
    ws_thread = threading.Thread(target=start_websocket_server, args=(mqtt_bot,), daemon=True)
    ws_thread.start()

    # Initialize Hardware Modules
    touch = TouchModule()
    servo = StepperModule()
    oled = OLEDModule()
    oled.show_aura()

    print(f"Touch pins active: {touch.sensor_pins}")
    print(f"Touch order: {touch.sequence_order}")
    
    stop_event = threading.Event()
    
    # Start Touch + Stepper Worker Thread
    touch_thread = threading.Thread(
        target=_touch_worker,
        args=(touch, servo, oled, stop_event),
        daemon=True,
    )
    touch_thread.start()

    print("AURA voice assistant started.")

    if voice and USE_WAKE_WORD:
        print(f"Wake word mode enabled. Say '{WAKE_WORD}' to activate.")
    else:
        print("Wake word mode disabled. Listening directly for commands.")

    mqtt_bot.publish_status(battery=100, location="Home", state="ONLINE")
    print("AURA System Started with MQTT Integration.")

    while True:
        try:
            if voice:
                if USE_WAKE_WORD:
                    voice.listen_for_wake_word(WAKE_WORD)
                    audio.speak_text("Yes, how can I help you?")

                user_text = voice.listen_and_convert_to_text()

                if not user_text:
                    continue

                if user_text.lower() in ["exit", "quit", "stop", "goodbye", "bye"]:
                    goodbye_text = "Goodbye. Have a nice day."
                    audio.speak_text(goodbye_text)
                    break

                reply = voice.get_gemini_response(user_text)
                audio.speak_text(reply)
            else:
                # Keep main thread alive while background workers handle hardware
                time.sleep(0.1)

        except KeyboardInterrupt:
            print("\nProgram stopped by user.")
            break
        except Exception as e:
            print(f"Main controller error: {e}")

    # Graceful Shutdown
    stop_event.set()
    touch_thread.join(timeout=1.0)
    servo.cleanup()
    GPIO.cleanup()
    mqtt_bot.stop()

if __name__ == "__main__":
    main()