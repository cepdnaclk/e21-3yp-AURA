import sys
import unittest.mock as mock
import pytest
import json
import time

with mock.patch.dict('os.environ', {'MQTT_BROKER': 'localhost', 'MQTT_PORT': '1883'}):
    mock_config = mock.MagicMock()
    mock_config.MQTT_BROKER = 'localhost'
    mock_config.MQTT_PORT = 1883
    sys.modules['config'] = mock_config
    
    mock_mqtt = mock.MagicMock()
    sys.modules['paho'] = mock.MagicMock()
    sys.modules['paho.mqtt'] = mock.MagicMock()
    sys.modules['paho.mqtt.client'] = mock_mqtt
    
    from mqtt_client import RobotMqttClient

class TestRobotMqttClient:
    def setup_method(self):
        self.client = RobotMqttClient(robot_id="aura_bot_01")
        self.client.client = mock.MagicMock()

    def test_publish_order_sends_correct_topic_and_payload(self):
        table_id = '5'
        items = [{'menuItemId': 1, 'quantity': 2}]
        self.client.publish_order(table_id, items)
        
        self.client.client.publish.assert_called_once()
        args, kwargs = self.client.client.publish.call_args
        assert args[0] == f"aura/table/5/order"
        
        payload = json.loads(args[1])
        assert payload['tableId'] == table_id
        assert payload['items'] == items
        assert 'timestamp' in payload

    def test_publish_status_sends_correct_payload(self):
        self.client.publish_status(100, 'Home', 'ONLINE')
        
        self.client.client.publish.assert_called_once()
        args, kwargs = self.client.client.publish.call_args
        assert args[0] == "aura/robot/aura_bot_01/status"
        
        payload = json.loads(args[1])
        assert payload['battery'] == 100
        assert payload['location'] == 'Home'
        assert payload['state'] == 'ONLINE'

    def test_request_menu_publishes_to_correct_topic(self):
        self.client.menu_event.wait = mock.MagicMock(return_value=False)
        self.client.request_menu('3', timeout=0)
        
        self.client.client.publish.assert_called_once()
        args, kwargs = self.client.client.publish.call_args
        assert args[0] == "aura/table/3/menu"
        assert json.loads(args[1]) == {"request": "menu"}

    def test_on_message_menu_response_sets_event(self):
        msg = mock.MagicMock()
        msg.topic = "aura/table/1/menu/response"
        menu_data = {"menu": ["pizza", "burger"]}
        msg.payload = json.dumps(menu_data).encode()
        
        self.client.on_message(None, None, msg)
        assert self.client.menu_response == menu_data
        assert self.client.menu_event.is_set()

    def test_on_message_ready_status_calls_handler(self):
        msg = mock.MagicMock()
        msg.topic = "aura/robot/1/status"
        msg.payload = json.dumps({"status": "READY", "tableId": 5}).encode()
        
        self.client.handle_hardware_action = mock.MagicMock()
        self.client.on_message(None, None, msg)
        
        self.client.handle_hardware_action.assert_called_once_with(5)

    def test_on_message_ai_command_invokes_callback(self):
        msg = mock.MagicMock()
        msg.topic = "aura/robot/ai-command"
        payload = {"action": "PROCESS_TEXT", "text": "hello"}
        msg.payload = json.dumps(payload).encode()
        
        mock_callback = mock.MagicMock()
        self.client.set_ai_callback(mock_callback)
        self.client.on_message(None, None, msg)
        
        mock_callback.assert_called_once_with(payload)

    def test_on_message_invalid_json_does_not_crash(self):
        msg = mock.MagicMock()
        msg.topic = "aura/robot/1/status"
        msg.payload = b'NOT JSON'
        
        self.client.on_message(None, None, msg)

    def test_on_connect_subscribes_to_correct_topics(self):
        self.client.on_connect(None, None, None, 0)
        
        self.client.client.subscribe.assert_any_call("aura/robot/aura_bot_01/#")
        self.client.client.subscribe.assert_any_call("aura/table/+/menu/response")
        self.client.client.subscribe.assert_any_call("aura/robot/+/status")
        self.client.client.subscribe.assert_any_call("aura/robot/ai-command")

    def test_request_menu_returns_none_on_timeout(self):
        self.client.menu_event.wait = mock.MagicMock(return_value=False)
        result = self.client.request_menu('1', timeout=0)
        assert result is None
