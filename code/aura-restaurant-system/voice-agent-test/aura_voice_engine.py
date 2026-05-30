import json
import os
from typing import Dict, List, Any, Tuple
import google.generativeai as genai
from db_api_client import DBApiClient

# Use structured function calling instructions in the system prompt
SYSTEM_PROMPT = """You are AURA, a smart and friendly restaurant robot voice assistant.
You are helping a customer at a restaurant table.

You MUST respond with a valid JSON object matching this schema exactly:
{
  "intent": "MENU_INQUIRY" | "ORDER_ADD" | "ORDER_REVIEW" | "ORDER_CONFIRM" | "ORDER_CANCEL" | "TABLE_INQUIRY" | "GENERAL",
  "extracted_entities": {
    "items": [{"name": "item name", "quantity": 1}],
    "table_id": 1
  },
  "reply": "Your natural language response spoken as AURA"
}

Rules for your `reply`:
- Be conversational, friendly, and concise (this is spoken audio).
- When answering menu questions, use the provided Menu Context. If an item isn't there, say it's unavailable.
- When confirming an order, read back the items clearly.
- Do not mention you are an AI.

Intent Guide:
- MENU_INQUIRY: Asking what's available, prices, or ingredients.
- ORDER_ADD: Requesting to add items to their current order. Extract items and quantities!
- ORDER_REVIEW: Asking "what did I order?" or "what's my total?"
- ORDER_CONFIRM: Saying "that's all", "confirm order", "send it to kitchen".
- ORDER_CANCEL: Saying "cancel my order", "start over".
- TABLE_INQUIRY: Asking about table pricing, availability, or status.
- GENERAL: Casual chat, greetings, "hello".

Always output valid JSON. Nothing else.
"""

class AuraVoiceEngine:
    def __init__(self, api_key: str, db_client: DBApiClient):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
        self.db = db_client
        
        # In real usage, this would be per-session.
        # For simplicity in this engine class, we manage state explicitly.

    async def process_message(self, user_text: str, session_state: Dict) -> Tuple[str, Dict]:
        """
        Process user input, interact with DB, and return AURA's response + updated state.
        session_state should contain: 'current_order', 'table_id', 'conversation_history'
        """
        
        # 1. Fetch current menu and table info context
        menu_items = await self.db.get_menu()
        menu_context = "\n".join([f"{i['name']} - Rs {i['price']} (ID: {i['menuItemId']})" for i in menu_items])
        
        # 2. Build the prompt
        order_context = json.dumps(session_state.get('current_order', []))
        
        prompt = f"""{SYSTEM_PROMPT}

Menu Context:
{menu_context}

Current Order State for Table {session_state.get('table_id', 1)}:
{order_context}

User says: "{user_text}"
"""

        # 3. Call Gemini
        try:
            response = self.model.generate_content(prompt)
            # Remove markdown formatting if present
            response_text = response.text.replace("```json", "").replace("```", "").strip()
            result = json.loads(response_text)
        except Exception as e:
            print(f"Gemini processing error: {e}")
            return "Sorry, I had trouble understanding that. Could you repeat?", session_state

        intent = result.get("intent", "GENERAL")
        entities = result.get("extracted_entities", {})
        aura_reply = result.get("reply", "I'm not sure how to respond to that.")

        # 4. Handle Intents (State Machine)
        if intent == "ORDER_ADD":
            items_to_add = entities.get("items", [])
            for new_item in items_to_add:
                # Find matching menu item by name (simple substring match)
                match = next((m for m in menu_items if new_item['name'].lower() in m['name'].lower()), None)
                if match:
                    qty = new_item.get('quantity', 1)
                    # Add to session state
                    existing = next((i for i in session_state['current_order'] if i['menuItemId'] == match['menuItemId']), None)
                    if existing:
                        existing['quantity'] += qty
                    else:
                        session_state['current_order'].append({
                            'menuItemId': match['menuItemId'],
                            'name': match['name'],
                            'price': match['price'],
                            'quantity': qty
                        })
            
            # Re-calculate total
            total = sum(i['price'] * i['quantity'] for i in session_state['current_order'])
            # We don't overwrite Gemini's reply, but we *could* augment it if needed.
            
        elif intent == "ORDER_CONFIRM":
            if session_state['current_order']:
                # Place order in DB
                items_payload = [{"menuItemId": i["menuItemId"], "quantity": i["quantity"]} for i in session_state['current_order']]
                order_res = await self.db.place_order(session_state.get('table_id', 1), items_payload)
                if order_res:
                    session_state['current_order'] = [] # Clear after successful order
                    aura_reply = "Perfect! Your order has been sent to the kitchen. It will be out shortly."
                else:
                    aura_reply = "I'm sorry, there was a problem sending your order to the kitchen. Please try again."
            else:
                aura_reply = "You don't have anything in your order yet! What would you like?"

        elif intent == "ORDER_CANCEL":
            session_state['current_order'] = []
            
        elif intent == "TABLE_INQUIRY":
            tables = await self.db.get_tables()
            # Simple context augmentation - in a real app, we might do another LLM pass
            # but Gemini might have already answered generally.
            pass

        return aura_reply, session_state
