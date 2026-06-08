from flask import Flask, request, jsonify
from flask_cors import CORS
from scrapers import search_all_platforms
import os

app = Flask(__name__)
CORS(app)

@app.route('/health')
def health():
    return jsonify({"status": "ok"}), 200

@app.route('/api/search')
def search():
    query = request.args.get('q', '')
    if not query:
        return jsonify({"error": "Missing query parameter 'q'"}), 400

    try:
        max_price_str = request.args.get('max_price', None)
        max_price = None
        if max_price_str:
            try:
                max_price = float(max_price_str)
            except ValueError:
                pass

        sort_order = request.args.get('sort', 'relevance')
        if sort_order not in ('asc', 'desc', 'relevance'):
            sort_order = 'relevance'

        products = search_all_platforms(query, max_price, sort_order)

        if products:
            cheapest = min(products, key=lambda x: x['price'])
            platforms = list(set(p['platform'] for p in products))
            voucher_count = sum(1 for p in products if p['voucher'])
            summary = {
                "cheapest_item": f"{cheapest['title']} (RM{cheapest['price']:.2f})",
                "platforms_available": platforms,
                "total_products": len(products),
                "voucher_available": voucher_count
            }
        else:
            summary = None

        return jsonify({
            "query": query,
            "results": products,
            "summary": summary
        })
    
    except ValueError as e:
        # Handle missing API key error
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)