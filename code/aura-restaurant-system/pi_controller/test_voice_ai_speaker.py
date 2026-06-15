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

def setup_ai_mqtt_handler(mqtt_bot: RobotMqttClient, voice: VoiceModule, audio: AudioModule):
    """
    Handles commands coming from the React Tablet UI via MQTT.
    """
    def on_ai_command(payload):
        action = payload.get("action")
        menu_context = payload.get("menu")
        
        if action == "START_VOICE_MIC":
            print("\n" + "="*40)
            print("🎙️ [UI Command Received] Tablet triggered Voice Mic!")
            print("Activating laptop microphone...")
            
            # Acknowledge the user so they know to start speaking
            audio.speak_text("I am listening.") 
            
            # Activate the laptop microphone
            user_text = voice.listen_and_convert_to_text(timeout=5, phrase_time_limit=8)
            
            if user_text:
                print(f"👤 You asked: {user_text}")
                print("🤖 Asking Gemini...")
                
                reply = voice.get_gemini_response(user_text, menu_context)
                
                print(f"🔊 AURA replied: {reply}")
                audio.speak_text(reply)
            else:
                print("⚠️ No speech detected after UI trigger.")
            print("="*40 + "\n")

    # Register this function with your MQTT bot
    mqtt_bot.set_ai_callback(on_ai_command)

def main() -> None:
    print("\nStarting AURA UI Integration Test (Laptop Mode)...")

    if not check_environment():
        return

    # Initialize Voice and Audio modules
    print("\nInitializing Audio and Voice modules...")
    audio = AudioModule()
    voice = VoiceModule(gemini_api_key=os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY)

    # Initialize MQTT client
    print("Connecting to MQTT Broker...")
    mqtt_bot = RobotMqttClient(robot_id="laptop_tester")
    mqtt_bot.start()
    time.sleep(1) # Give MQTT a moment to connect

    # Hook up the UI listener to the MQTT client
    setup_ai_mqtt_handler(mqtt_bot, voice, audio)

    print("\n" + "★"*40)
    print("✅ SYSTEM READY!")
    print("1. Ensure your React frontend is running.")
    print("2. Click the 'Voice' (Mic) button on the React UI.")
    print("3. Listen for 'I am listening', then speak into your laptop.")
    print("Press Ctrl+C in this terminal to stop the test.")
    print("★"*40 + "\n")

    try:
        # Keep the script running to listen for incoming UI commands
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Test Mode...")
        mqtt_bot.stop()
        print("Disconnected. Goodbye!")

if __name__ == "__main__":
    main()