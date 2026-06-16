import paho.mqtt.client as mqtt
import json
import time
import threading
from config import MQTT_BROKER, MQTT_PORT

class RobotMqttClient:
    def __init__(self, robot_id="aura_bot_01"):
        self.robot_id = robot_id
        self.client = mqtt.Client(client_id=f"pi_{robot_id}")
        self.client.on_connect = self.on_connect
        self.client.on_message = self.on_message

        self.menu_response = None
        self.menu_event = threading.Event()

    # පියවර 01: Connect වූ පසු Status Topic එකට Subscribe වීම
    def on_connect(self, client, userdata, flags, rc):
        if rc == 0:
            print(f"✅ Connected to MQTT Broker: {MQTT_BROKER}")
            
            # පවතින Subscriptions
            self.client.subscribe(f"aura/robot/{self.robot_id}/#")
            self.client.subscribe("aura/table/+/menu/response")
            
            # නව Subscription: Backend එකෙන් එවන status updates ලබා ගැනීමට
            # මෙය aura/robot/1/status වැනි topics වලට සවන් දෙයි
            status_topic = f"aura/robot/+/status" 
            self.client.subscribe(status_topic)
            print(f"📡 Subscribed to status updates on: {status_topic}")
        else:
            print(f"❌ Connection failed with code {rc}")

    # පියවර 02: පණිවිඩය ලැබුණු විට ක්‍රියාත්මක වන Callback එක
    def on_message(self, client, userdata, msg):
        try:
            payload = json.loads(msg.payload.decode())
            # print(f"📩 Message received on {msg.topic}") # Debugging සඳහා පමණක් පාවිච්චි කරන්න

            # 1. Menu Response සඳහා (පවතින logic එක)
            if msg.topic.endswith("/menu/response"):
                self.menu_response = payload
                self.menu_event.set()

            # 2. Order Ready Status සඳහා (අලුතින් එක් කළ කොටස)
            # Topic එක "aura/robot/1/status" වැනි එකක් දැයි පරීක්ෂා කරයි
            elif "status" in msg.topic and "aura/robot/" in msg.topic:
                if payload.get("status") == "READY":
                    table_id = payload.get("tableId")
                    print(f"🚀 [ACTION] Order is READY for Table {table_id}. Moving Robot...")
                    
                    # මෙතැනදී Hardware (OLED/Stepper) ක්‍රියාත්මක කරන function එක කැඳවිය හැක
                    self.handle_hardware_action(table_id)

        except Exception as e:
            print(f"❌ Error parsing message: {e}")

    # Hardware ක්‍රියාත්මක කිරීමට අදාළ function එක (උදාහරණයක් ලෙස)
    def handle_hardware_action(self, table_id):
        # මෙහිදී main_controller හි hardware objects වෙත පණිවිඩ යැවිය හැක
        # දැනට log එකක් පමණක් පෙන්වයි
        pass

    def request_menu(self, table_id="1", timeout=5):
        self.menu_event.clear()
        self.menu_response = None
        topic = f"aura/table/{table_id}/menu"
        self.client.publish(topic, json.dumps({"request": "menu"}), qos=1)
        if self.menu_event.wait(timeout):
            return self.menu_response
        return None

    def publish_order(self, table_id, items):
        topic = f"aura/table/{table_id}/order"
        order_payload = {
            "tableId": table_id,
            "items": items,
            "timestamp": time.time()
        }
        self.client.publish(topic, json.dumps(order_payload), qos=1)

    def publish_status(self, battery, location, state):
        topic = f"aura/robot/{self.robot_id}/status"
        status_payload = {
            "battery": battery,
            "location": location,
            "state": state
        }
        self.client.publish(topic, json.dumps(status_payload), qos=1)

    def start(self):
        self.client.connect(MQTT_BROKER, MQTT_PORT, 60)
        self.client.loop_start()

    def stop(self):
        self.client.loop_stop()
        self.client.disconnect()