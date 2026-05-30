import aiohttp
import asyncio
import os
import time
from typing import Dict, List, Any, Optional

class DBApiClient:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = os.getenv("BACKEND_URL", base_url).rstrip("/")
        # Simple in-memory cache for menu items
        self._menu_cache = None
        self._menu_cache_time = 0
        self.CACHE_TTL_SECONDS = 30

    async def _get(self, endpoint: str) -> Optional[Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=5) as response:
                    if response.status == 200:
                        return await response.json()
                    print(f"Error fetching {url}: Status {response.status}")
                    return None
        except Exception as e:
            print(f"Exception fetching {url}: {e}")
            return None

    async def _post(self, endpoint: str, json_data: dict) -> Optional[Any]:
        url = f"{self.base_url}{endpoint}"
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=json_data, timeout=5) as response:
                    if response.status in (200, 201):
                        return await response.json()
                    print(f"Error POSTing to {url}: Status {response.status}")
                    text = await response.text()
                    print(f"Response: {text}")
                    return None
        except Exception as e:
            print(f"Exception POSTing to {url}: {e}")
            return None

    async def get_menu(self, force_refresh: bool = False) -> List[Dict]:
        """Fetch all available menu items, with caching."""
        now = time.time()
        if not force_refresh and self._menu_cache and (now - self._menu_cache_time) < self.CACHE_TTL_SECONDS:
            return self._menu_cache

        data = await self._get("/api/menu/available")
        if data is not None:
            self._menu_cache = data
            self._menu_cache_time = now
            return data
        return []

    async def search_menu(self, keyword: str) -> List[Dict]:
        data = await self._get(f"/api/menu/search?keyword={keyword}")
        return data if data is not None else []

    async def get_tables(self) -> List[Dict]:
        data = await self._get("/api/tables")
        return data if data is not None else []

    async def get_table_by_id(self, table_id: int) -> Optional[Dict]:
        return await self._get(f"/api/tables/{table_id}")

    async def place_order(self, table_id: int, items: List[Dict]) -> Optional[Dict]:
        """
        Submit a new order.
        `items` format: [{"menuItemId": 1, "quantity": 2, "customization": ""}]
        """
        payload = {
            "tableId": table_id,
            "items": items
        }
        return await self._post("/api/orders", payload)
