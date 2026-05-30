import speech_recognition as sr
import google.generativeai as genai
from config import POSSIBLE_WAKE_PHRASES


class VoiceModule:
    def __init__(self, gemini_api_key: str):
        self.recognizer = sr.Recognizer()

        # Mic sensitivity settings
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8

        genai.configure(api_key=gemini_api_key)
        self.model = genai.GenerativeModel("models/gemini-flash-latest")

    def listen_for_wake_word(self, wake_word: str = "hi aura") -> bool:
        """
        Continuously listens until the wake word is detected.
        """
        print(f"Waiting for wake word: '{wake_word}'")

        with sr.Microphone() as source:
            self.recognizer.adjust_for_ambient_noise(source, duration=1)

            while True:
                try:
                    audio = self.recognizer.listen(source, timeout=None, phrase_time_limit=4)
                    heard_text = self.recognizer.recognize_google(audio).lower().strip()

                    print(f"Heard: {heard_text}")

                    if any(phrase in heard_text for phrase in POSSIBLE_WAKE_PHRASES):
                        print("Wake word detected.")
                        return True

                except sr.UnknownValueError:
                    continue
                except sr.RequestError as e:
                    print(f"Speech service error while waiting for wake word: {e}")
                    continue
                except Exception as e:
                    print(f"Unexpected wake word error: {e}")
                    continue

    def listen_and_convert_to_text(self, timeout: int = 5, phrase_time_limit: int = 8) -> str | None:
        """
        Listen once and convert speech to text.
        """
        try:
            with sr.Microphone() as source:
                print("Listening for user command...")
                self.recognizer.adjust_for_ambient_noise(source, duration=0.5)

                audio = self.recognizer.listen(
                    source,
                    timeout=timeout,
                    phrase_time_limit=phrase_time_limit
                )

            print("Converting speech to text...")
            text = self.recognizer.recognize_google(audio).strip()
            print(f"User said: {text}")
            return text

        except sr.WaitTimeoutError:
            print("No speech detected before timeout.")
            return None
        except sr.UnknownValueError:
            print("Could not understand the audio.")
            return None
        except sr.RequestError as e:
            print(f"Speech recognition service error: {e}")
            return None
        except Exception as e:
            print(f"Unexpected speech-to-text error: {e}")
            return None

    def get_gemini_response(self, user_text: str, menu_context: str | None = None, order_state: list | None = None) -> str:
        """
        Send user text to Gemini and return AURA's reply, using current menu and order context when available.
        """
        try:
            menu_section = ""
            if menu_context:
                menu_section = f"Current menu and availability:\n{menu_context}\n\n"

            order_section = ""
            if order_state:
                order_section = f"User's current unconfirmed order items: {order_state}\n\n"

            prompt = f"""
You are AURA, a smart and friendly restaurant robot assistant.

Rules:
- Reply as AURA.
- Keep responses short, clear, and polite.
- Answer only using the current menu information when the user asks about food availability or prices.
- If the user asks about an item not on the current menu, say it is unavailable.
- Help with greetings, menu questions, ordering, and table assistance.
- If unclear, ask a short follow-up question.
- Do not mention that you are an AI model unless directly asked.

{menu_section}{order_section}User said: {user_text}
"""

            response = self.model.generate_content(prompt)

            if response and hasattr(response, "text") and response.text:
                reply = response.text.strip()
                print(f"AURA reply: {reply}")
                return reply

            return "Sorry, I could not generate a response."

        except Exception as e:
            print(f"Gemini error: {e}")
            return "Sorry, I had trouble processing that request."