import sys
import unittest.mock as mock

mock_sr = mock.MagicMock()
sys.modules['speech_recognition'] = mock_sr
mock_genai = mock.MagicMock()
mock_google = mock.MagicMock()
mock_google.generativeai = mock_genai
sys.modules['google'] = mock_google
sys.modules['google.generativeai'] = mock_genai

mock_config = mock.MagicMock()
mock_config.POSSIBLE_WAKE_PHRASES = ["hi aura", "hey aura", "hello aura", "aura", "hi ora"]
sys.modules['config'] = mock_config

from voice_module import VoiceModule
from config import POSSIBLE_WAKE_PHRASES

def matches_wake_word(heard_text):
    return any(phrase in heard_text.lower() for phrase in POSSIBLE_WAKE_PHRASES)

class TestVoiceModule:
    def setup_method(self):
        self.voice = VoiceModule(gemini_api_key="test_key")
        self.voice.model = mock.MagicMock()

    def test_wake_phrase_matching_exact(self):
        assert matches_wake_word("hi aura") == True

    def test_wake_phrase_matching_variations(self):
        assert matches_wake_word("hey aura") == True
        assert matches_wake_word("hello aura") == True
        assert matches_wake_word("aura") == True
        assert matches_wake_word("hi ora") == True

    def test_wake_phrase_no_match(self):
        assert matches_wake_word("hello world") == False
        assert matches_wake_word("hey siri") == False

    def test_wake_phrase_case_insensitive(self):
        assert matches_wake_word("HI AURA") == True

    def test_gemini_response_with_menu_context(self):
        mock_response = mock.MagicMock()
        mock_response.text = "Here is the menu"
        self.voice.model.generate_content.return_value = mock_response
        
        response = self.voice.get_gemini_response("hello", menu_context="Pizza, Burger")
        assert response == "Here is the menu"
        
        call_args = self.voice.model.generate_content.call_args[0][0]
        assert "Pizza, Burger" in call_args
        assert "hello" in call_args

    def test_gemini_response_without_menu_context(self):
        mock_response = mock.MagicMock()
        mock_response.text = "Hello there"
        self.voice.model.generate_content.return_value = mock_response
        
        response = self.voice.get_gemini_response("hello")
        assert response == "Hello there"
        
        call_args = self.voice.model.generate_content.call_args[0][0]
        assert "Current menu and availability" not in call_args
        assert "hello" in call_args

    def test_gemini_response_on_api_error(self):
        self.voice.model.generate_content.side_effect = Exception("API Error")
        response = self.voice.get_gemini_response("hello")
        assert response == "Sorry, I had trouble processing that request."

    def test_gemini_response_empty_response(self):
        mock_response = mock.MagicMock()
        mock_response.text = ""
        self.voice.model.generate_content.return_value = mock_response
        
        response = self.voice.get_gemini_response("hello")
        assert response == "Sorry, I could not generate a response."

    def test_exit_phrases_detection(self):
        def is_exit(text):
            return any(word in text.lower() for word in ["exit", "quit", "goodbye"])
        
        assert is_exit("i want to exit") == True
        assert is_exit("quit now") == True
        assert is_exit("goodbye aura") == True
        assert is_exit("hello there") == False
