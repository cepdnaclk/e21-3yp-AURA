# AURA Voice Assistant - Test Module

This directory contains the standalone integration testing module for the AURA Voice Assistant.

## Features

- **Python FastAPI Backend** (`server.py`): Serves the UI and acts as the conversational bridge.
- **AURA Voice Engine** (`aura_voice_engine.py`): Uses Gemini 2.5 to determine user intent (Menu Inquiry, Order Add, Order Confirm, etc.) and keeps track of the session's current order state.
- **DB API Client** (`db_api_client.py`): Asynchronously communicates with the main Java Spring Boot backend to fetch the live menu, check table info, and place orders.
- **Web UI** (`static/`): A glassmorphism-styled dashboard to simulate a customer talking to the robot.

## Setup & Running

1. **Prerequisites**: Ensure the main Java Backend is running (either via Docker or locally on port 8080).
2. **Environment**: 
   ```bash
   cp .env.example .env
   # Edit .env and add your GEMINI_API_KEY
   ```
3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Run the Server**:
   ```bash
   python server.py
   ```
5. **Access the UI**: Open your browser to `http://localhost:8000`

## Architecture

1. The customer (simulated via text in the UI) says: "I want 2 koththu".
2. The UI sends this to `server.py` (`/api/chat`).
3. The server asks `db_api_client.py` for the live menu.
4. The server sends the menu context, the user's current unconfirmed order, and the new message to `aura_voice_engine.py` (Gemini).
5. Gemini responds with a structured JSON intent (`ORDER_ADD`) and extracted items.
6. The server updates the session state and returns AURA's friendly spoken response to the UI.
7. Once the user says "Confirm my order", Gemini returns `ORDER_CONFIRM`, and the server posts the final order to the Java Backend via REST.
