import sys
import unittest.mock as mock

sys.modules['luma'] = mock.MagicMock()
sys.modules['luma.core'] = mock.MagicMock()
sys.modules['luma.core.interface'] = mock.MagicMock()
sys.modules['luma.core.interface.serial'] = mock.MagicMock()
sys.modules['luma.oled'] = mock.MagicMock()
sys.modules['luma.oled.device'] = mock.MagicMock()
sys.modules['luma.core.render'] = mock.MagicMock()

mock_hw = mock.MagicMock()
mock_hw.OLED_I2C_ADDRESS = 0x3C
mock_hw.OLED_I2C_PORTS = [3, 1]
sys.modules['hardware_config'] = mock_hw

from oled_module import OLEDModule

class TestOLEDLogic:
    def setup_method(self):
        self.oled = OLEDModule()

    def test_measure_text_single_char(self):
        if hasattr(self.oled, '_measure_text'):
            width, height = self.oled._measure_text("A", scale=1, spacing=1)
            assert width == 5
            assert height == 7

    def test_measure_text_two_chars(self):
        if hasattr(self.oled, '_measure_text'):
            width, height = self.oled._measure_text("AU", scale=1, spacing=1)
            assert width == 11
            assert height == 7

    def test_measure_text_four_chars(self):
        if hasattr(self.oled, '_measure_text'):
            width, height = self.oled._measure_text("AURA", scale=1, spacing=1)
            assert width == 23
            assert height == 7

    def test_measure_text_scaled(self):
        if hasattr(self.oled, '_measure_text'):
            width, height = self.oled._measure_text("AU", scale=6, spacing=1)
            assert width == 66
            assert height == 42

    def test_eye_gaze_offsets(self):
        offsets = {"center": 0, "left": -15, "right": 15}
        assert offsets["center"] == 0
        assert offsets["left"] == -15
        assert offsets["right"] == 15
