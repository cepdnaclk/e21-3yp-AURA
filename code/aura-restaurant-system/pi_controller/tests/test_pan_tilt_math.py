import sys
import unittest.mock as mock

mock_servokit = mock.MagicMock()
sys.modules['adafruit_servokit'] = mock_servokit
mock_hw = mock.MagicMock()
mock_hw.PAN_CHANNEL = 0
mock_hw.TILT_CHANNEL = 1
sys.modules['hardware_config'] = mock_hw

from pan_tilt import _clamp, PanTiltModule

class TestPanTiltMath:
    def setup_method(self):
        self.pt = PanTiltModule()
        self.pt.pan_angle = 90
        self.pt.tilt_angle = 90
        # Mock internal kit to avoid hardware operations
        self.pt.kit = mock.MagicMock()
        
    def test_clamp_within_range(self):
        assert _clamp(90, 30, 150) == 90

    def test_clamp_below_lower(self):
        assert _clamp(10, 30, 150) == 30

    def test_clamp_above_upper(self):
        assert _clamp(200, 30, 150) == 150

    def test_clamp_at_lower_boundary(self):
        assert _clamp(30, 30, 150) == 30

    def test_clamp_at_upper_boundary(self):
        assert _clamp(150, 30, 150) == 150

    def test_track_face_center(self):
        self.pt.pan_angle = 90
        self.pt.tilt_angle = 90
        if hasattr(self.pt, 'track_face'):
            self.pt.track_face(0, 0)
            assert self.pt.pan_angle == 90
            assert self.pt.tilt_angle == 90

    def test_track_face_left(self):
        self.pt.pan_angle = 90
        if hasattr(self.pt, 'track_face'):
            self.pt.track_face(-0.5, 0)
            assert self.pt.pan_angle > 90

    def test_track_face_right(self):
        self.pt.pan_angle = 90
        if hasattr(self.pt, 'track_face'):
            self.pt.track_face(0.5, 0)
            assert self.pt.pan_angle < 90

    def test_track_face_clamped(self):
        self.pt.pan_angle = 150
        if hasattr(self.pt, 'track_face'):
            self.pt.track_face(-1.0, 0) 
            assert self.pt.pan_angle <= 150

    def test_set_angles_clamps_pan(self):
        if hasattr(self.pt, 'set_angles'):
            self.pt.set_angles(200, 90)
            assert self.pt.pan_angle <= 150

    def test_set_angles_clamps_tilt(self):
        if hasattr(self.pt, 'set_angles'):
            self.pt.set_angles(90, 10)
            assert self.pt.tilt_angle >= 60

    def test_center_sets_midpoints(self):
        if hasattr(self.pt, 'center'):
            self.pt.center()
            assert self.pt.pan_angle == 90
            assert self.pt.tilt_angle == 90
