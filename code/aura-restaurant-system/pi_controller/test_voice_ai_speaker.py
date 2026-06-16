import os
import time
from dotenv import load_dotenv

from audio_module import AudioModule
from mqtt_client import RobotMqttClient
from voice_module import VoiceModule
from config import GEMINI_API_KEY


def check_environment() -> bool:
    print("\n=== Environment Check ===")
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if not api_key:
        print("ERROR: GEMINI_API_KEY is not set in environment or config.py.")
        print("Create a .env file with GEMINI_API_KEY=your_key or set the environment variable.")
        return False
    print("GEMINI_API_KEY found.")
    return True


def check_microphone(voice: VoiceModule) -> str | None:
    print("\n=== Microphone Check ===")
    print("Please speak clearly into your laptop mic.")
    print("Say a short phrase like: 'Hello Aura' or 'What is available?'")
    print("Listening for up to 8 seconds...")

    recognized_text = voice.listen_and_convert_to_text(timeout=8, phrase_time_limit=6)

    if recognized_text:
        print(f"Microphone check passed. Recognized text: {recognized_text}")
        return recognized_text

    print("Microphone check failed or no speech was recognized.")
    return None


def check_ai_assistant(voice: VoiceModule, prompt_text: str, menu_context: str | None = None) -> str:
    print("\n=== AI Assistant Check ===")
    print(f"Sending query to Gemini: {prompt_text}")
    if menu_context:
        print("Using backend menu context in the prompt.")
    response = voice.get_gemini_response(prompt_text, menu_context=menu_context)
    print(f"AI assistant replied: {response}")
    return response


def request_backend_menu(mqtt_bot: RobotMqttClient, table_id: str = "1") -> dict | None:
    print("\n=== Backend Menu Request ===")
    print(f"Requesting live menu for table {table_id} from backend via MQTT...")
    menu_payload = mqtt_bot.request_menu(table_id=table_id, timeout=5)
    if menu_payload:
        print(f"Menu payload received: {menu_payload}")
        return menu_payload

    print("No menu payload received from backend. Falling back to sample values.")
    return None


def check_speaker(audio: AudioModule, text: str) -> bool:
    print("\n=== Speaker Check ===")
    print(f"Attempting to speak: {text}")
    audio.speak_text(text)
    if audio.enabled:
        print("Speaker check completed. If you heard the audio, the speaker is working.")
        return True

    print("Speaker is disabled or could not initialize. Audio output will only be printed.")
    return False


def main() -> None:
    print("\nRunning AURA microphone + AI assistant + speaker test script.")

    if not check_environment():
        return

    audio = AudioModule()
    voice = VoiceModule(gemini_api_key=os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY)
    mqtt_bot = RobotMqttClient(robot_id="aura_bot_01")

    mqtt_bot.start()
    time.sleep(1)

    recognized_text = check_microphone(voice)

    sample_question = (
        "What menu items are available and what are their prices?"
        if recognized_text is None
        else f"You said: {recognized_text}. Do we have that on the menu?"
    )

    menu_payload = request_backend_menu(mqtt_bot, table_id="1")
    menu_context = None

    if menu_payload and isinstance(menu_payload, dict):
        menu_items = menu_payload.get("menu")
        if isinstance(menu_items, list) and menu_items:
            menu_lines = []
            for item in menu_items:
                name = item.get("name", "Unknown")
                category = item.get("category", "General")
                price = item.get("price", "N/A")
                availability = "Available" if item.get("availability", True) else "Unavailable"
                emoji = item.get("emoji", "")
                menu_lines.append(f"{emoji} {name} ({category}) - Rs {price} - {availability}".strip())
            menu_context = "\n".join(menu_lines)
        else:
            print("Backend menu response did not include a valid item list.")

    if not menu_context:
        menu_context = (
            "Chicken Burger (Main) - Rs 450 - Available\n"
            "Mango Shake (Drinks) - Rs 180 - Available\n"
            "Chocolate Cake (Dessert) - Rs 320 - Unavailable"
        )

    ai_reply = check_ai_assistant(voice, sample_question, menu_context=menu_context)

    print("\nWaiting 2 seconds before speaker test...")
    time.sleep(2)

    check_speaker(audio, "This is a quick AURA speaker test. If you hear this, the speaker works.")

    mqtt_bot.stop()

    print("\nTest summary:")
    print(f"- Microphone recognized text: {recognized_text}")
    print(f"- AI response: {ai_reply}")
    print("- Speaker check was executed.")
    print("\nIf you want to test again, rerun this script.")


if __name__ == "__main__":
    main()
