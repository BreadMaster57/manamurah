import requests
from urllib.parse import quote
import random
import re


def clean_price(text):
    """Extract a float from strings like 'RM 29.90' or 'MYR 1,299.00'"""
    if not text:
        return None
    cleaned = re.sub(r"[^\d.]", "", text.replace(",", ""))
    try:
        return float(cleaned)
    except ValueError:
        return None


def search_google_shopping(query, api_key, max_price=None):
    """
    Use SerpAPI to get real Google Shopping results (Malaysia).
    If max_price is provided (float), only return items with price <= max_price.
    """
    url = "https://serpapi.com/search"
    params = {
        "engine": "google_shopping",
        "q": query,
        "gl": "my",
        "hl": "en",
        "num": 50, 
        "api_key": api_key,
    }
    print(f"[SerpAPI] Searching for '{query}'...")
    try:
        resp = requests.get(url, params=params, timeout=15)
        data = resp.json()

        if "error" in data:
            print(f"[SerpAPI] API error: {data['error']}")
            return _demo_all(query)

        shopping_results = data.get("shopping_results", [])
        print(f"[SerpAPI] Got {len(shopping_results)} results")

        results = []
        for item in shopping_results:
            title = item.get("title", "")
            price_str = item.get("price", "")
            link = item.get("product_link", "") or item.get("link", "")
            source = item.get("source", "")

            price = clean_price(price_str)
            if not title or not price or not link:
                continue

            # Apply price cap only if max_price is set
            if max_price is not None and price > max_price:
                continue

            # Map well-known platforms
            platform = source
            src_lower = source.lower()
            if "shopee" in src_lower:
                platform = "Shopee"
            elif "lazada" in src_lower:
                platform = "Lazada"
            elif "tiktok" in src_lower:
                platform = "TikTok Shop"
            elif "zalora" in src_lower:
                platform = "Zalora"

            # Simulated extra fields
            original_price = round(price * random.uniform(1.05, 2.0), 2)
            discount = int((1 - price / original_price) * 100) if original_price > price else 0
            rating = round(random.uniform(3.5, 5.0), 1)

            results.append({
                "platform": platform,
                "title": title[:80],
                "price": price,
                "original_price": original_price,
                "discount": discount,
                "rating": rating,
                "voucher": random.choice([True, False]),
                "free_shipping": random.choice([True, False]),
                "link": link,
            })

        print(f"[SerpAPI] After filtering: {len(results)} valid results" +
              (f" (max RM{max_price})" if max_price is not None else " (no price cap)"))
        return results if results else _demo_all(query)

    except Exception as e:
        print(f"[SerpAPI] FAILED: {e} — falling back to demo")
        return _demo_all(query)


# ═══════════════════════════════════════════════════════════════════════
#  DEMO FALLBACK  (keeps the app working even if API is unreachable)
# ═══════════════════════════════════════════════════════════════════════
def _demo_all(query):
    """Generate demo results for Shopee, Lazada, and TikTok Shop."""
    results = []
    for _ in range(random.randint(1, 3)):
        price = round(random.uniform(5, 500), 2)
        original = round(price * random.uniform(1.1, 2.5), 2)
        results.append({
            "platform": "Shopee",
            "title": f"{query.title()} - Model {random.choice(['A','B','C'])}",
            "price": price,
            "original_price": original,
            "discount": int((1 - price / original) * 100),
            "rating": round(random.uniform(3.5, 5.0), 1),
            "voucher": random.choice([True, False]),
            "free_shipping": random.choice([True, False]),
            "link": "https://shopee.com.my",
        })
    for _ in range(random.randint(1, 3)):
        price = round(random.uniform(5, 500), 2)
        original = round(price * random.uniform(1.1, 2.5), 2)
        results.append({
            "platform": "Lazada",
            "title": f"LazMall {query.title()} - {random.choice(['New','Import'])}",
            "price": price,
            "original_price": original,
            "discount": int((1 - price / original) * 100),
            "rating": round(random.uniform(3.5, 5.0), 1),
            "voucher": random.choice([True, False]),
            "free_shipping": random.choice([True, False]),
            "link": "https://www.lazada.com.my",
        })
    for _ in range(random.randint(1, 3)):
        price = round(random.uniform(5, 500), 2)
        original = round(price * random.uniform(1.1, 2.5), 2)
        results.append({
            "platform": "TikTok Shop",
            "title": f"TikTok Exclusive {query.title()}",
            "price": price,
            "original_price": original,
            "discount": int((1 - price / original) * 100),
            "rating": round(random.uniform(3.5, 5.0), 1),
            "voucher": random.choice([True, False]),
            "free_shipping": random.choice([True, False]),
            "link": "https://www.tiktok.com/shop",
        })
    return results


# ═══════════════════════════════════════════════════════════════════════
#  MASTER SEARCH  (called by app.py)
# ═══════════════════════════════════════════════════════════════════════
def search_all_platforms(query, max_price=None, sort_order='asc'):
    # ⚠️ Replace with your real SerpAPI key
    API_KEY = "26198b02d4849e9c9bfe412308cc4dd9fe99ed5562d4d2af4409176a088bdb14"
    results = search_google_shopping(query, API_KEY, max_price=max_price)

    # Handle sorting
    if sort_order == 'asc':
        results.sort(key=lambda x: x['price'])
    elif sort_order == 'desc':
        results.sort(key=lambda x: x['price'], reverse=True)
    # 'relevance' → keep the order from Google Shopping (no sort)

    return results