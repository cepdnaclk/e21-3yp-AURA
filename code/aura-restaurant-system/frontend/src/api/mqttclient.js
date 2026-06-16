// src/api/mqttClient.js
import mqtt from 'mqtt';

class KitchenMqttService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.listeners = {
      onNewOrder: [],
      onOrderStatusUpdate: [],
      onMenuUpdate: [],
      onDashboardStats: [],
      onWaiterCall: [],
      onRobotFleetUpdate: [],
      onError: [],
    };
  }

  connect() {
    if (this.connected) return;
    
    const brokerUrl = import.meta.env.VITE_MQTT_URL || 'ws://localhost:9001';


    // WebSocket port 9001 — not TCP 1883
    this.client = mqtt.connect(brokerUrl, {
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: true,
      clientId: `aura_web_${Math.random().toString(16).slice(2, 8)}`,
    });

    this.client.on('connect', () => {
      console.log('✅ MQTT connected via WebSocket');
      this.connected = true;

      this.client.subscribe('aura/kitchen/update-order');
      this.client.subscribe('aura/table/+/order/response');
      this.client.subscribe('aura/menu/updated');
      this.client.subscribe('aura/admin/stats');
      this.client.subscribe('aura/admin/robots');
      // Must be inside connect handler so it re-subscribes after reconnection
      this.client.subscribe('aura/table/+/call-waiter');
    });

    this.client.on('message', (topic, message) => {
      try {
        const data = JSON.parse(message.toString());
        console.log('📦 MQTT message received:', topic, data);

        // ✅ FIXED: Now correctly matches the backend topic
        if (topic === 'aura/kitchen/update-order') {
          console.log('🔔 New order notification via MQTT');
          this.listeners.onNewOrder.forEach(cb => cb(data));
        } else if (topic.includes('/order/response')) {
          this.listeners.onOrderStatusUpdate.forEach(cb => cb(data));
        } else if (topic === 'aura/menu/updated') {
          this.listeners.onMenuUpdate.forEach(cb => cb(data));
        } else if (topic === 'aura/admin/stats') {
          this.listeners.onDashboardStats.forEach(cb => cb(data));
        } else if (topic === 'aura/admin/robots') {
          this.listeners.onRobotFleetUpdate.forEach(cb => cb(data));
        } else if (topic.includes('/call-waiter')) {
          this.listeners.onWaiterCall.forEach(cb => cb(data));
        }
      } catch (e) {
        console.error('Failed to parse MQTT message:', e);
      }
    });

    this.client.on('error', (error) => {
      console.error('❌ MQTT error:', error);
      this.connected = false;
      this.listeners.onError.forEach(cb => cb(error));
    });

    this.client.on('reconnect', () => {
      console.log('🔄 MQTT reconnecting...');
    });

    this.client.on('offline', () => {
      console.warn('⚠️ MQTT offline');
      this.connected = false;
    });
  }

  onNewOrder(callback) {
    this.listeners.onNewOrder.push(callback);
    return () => {
      this.listeners.onNewOrder =
        this.listeners.onNewOrder.filter(cb => cb !== callback);
    };
  }

  onOrderStatusUpdate(callback) {
    this.listeners.onOrderStatusUpdate.push(callback);
    return () => {
      this.listeners.onOrderStatusUpdate =
        this.listeners.onOrderStatusUpdate.filter(cb => cb !== callback);
    };
  }

  onMenuUpdate(callback) {
    this.listeners.onMenuUpdate.push(callback);
    return () => {
      this.listeners.onMenuUpdate =
        this.listeners.onMenuUpdate.filter(cb => cb !== callback);
    };
  }

  onDashboardStats(callback) {
    this.listeners.onDashboardStats.push(callback);
    return () => {
      this.listeners.onDashboardStats =
        this.listeners.onDashboardStats.filter(cb => cb !== callback);
    };
  }

  onRobotFleetUpdate(callback) {
    this.listeners.onRobotFleetUpdate.push(callback);
    return () => {
      this.listeners.onRobotFleetUpdate =
        this.listeners.onRobotFleetUpdate.filter(cb => cb !== callback);
    };
  }

  onError(callback) {
    this.listeners.onError.push(callback);
    return () => {
      this.listeners.onError =
        this.listeners.onError.filter(cb => cb !== callback);
    };
  }

  disconnect() {
    this.client?.end();
    this.connected = false;
    console.log('🔌 MQTT disconnected');
  }

  isConnected() {
    return this.connected;
  }

  // Waiter call publish method
  publish(topic, payload) {
    if (this.client && this.connected) {
      this.client.publish(topic, JSON.stringify(payload));
    }
  }

  // Waiter call receive listener
  onWaiterCall(callback) {
    this.listeners.onWaiterCall.push(callback);
    return () => {
      this.listeners.onWaiterCall =
        this.listeners.onWaiterCall.filter(cb => cb !== callback);
    };
  }
}

export const orderMqtt = new KitchenMqttService();
export default orderMqtt;