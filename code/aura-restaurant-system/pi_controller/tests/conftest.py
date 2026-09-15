import sys
import os
import pytest

# Add the pi_controller root to sys.path so tests can import modules
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
