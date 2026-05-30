import argparse
import os

from dotenv import load_dotenv

from audio_module import AudioModule
from config import GEMINI_API_KEY, USE_WAKE_WORD, WAKE_WORD
from voice_module import VoiceModule


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Quick voice -> Gemini -> speaker test for AURA."
    )
    parser.add_argument(
        "--wake-word",
        action="store_true",
        help="Wait for wake word before listening.",
    )
    parser.add_argument(
        "--no-wake-word",RobotUI
        action="store_true",
        help="Skip wake word and listen immediately.",
    )
    return parser.parse_args()


def resolve_wake_word(args: argparse.Namespace) -> bool:
    if args.wake_word and args.no_wake_word:
        return False
    if args.wake_word:
        return True
    if args.no_wake_word:
        return False
    return USE_WAKE_WORD


def main() -> None:
    load_dotenv()
    api_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY
    if not api_key:
        print("ERROR: GEMINI_API_KEY is not set. Add it to .env or config.py.")
        return

    args = parse_args()
    use_wake_word = resolve_wake_word(args)

    audio = AudioModule()
    voice = VoiceModule(gemini_api_key=api_key)

    print("Voice test started.")
    if use_wake_word:
        print(f"Wake word mode enabled. Say '{WAKE_WORD}'.")
        voice.listen_for_wake_word(WAKE_WORD)
        audio.speak_text("Yes, how can I help you?")
    else:
        print("Wake word mode disabled. Speak your command now.")

    user_text = voice.listen_and_convert_to_text(timeout=8, phrase_time_limit=8)
    if not user_text:
        print("No speech recognized. Try again.")
        return

    if user_text.lower().strip() in {"exit", "quit", "stop", "goodbye", "bye"}:
        audio.speak_text("Goodbye. Have a nice day.")
        return

    reply = voice.get_gemini_response(user_text)
    audio.speak_text(reply)
    print("Voice test completed.")


if __name__ == "__main__":
    main()
