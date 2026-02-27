import json
import urllib.request
import urllib.error
import time

BASE = 'http://127.0.0.1:3000'

def post_json(path, data, headers=None):
    url = BASE + path
    b = json.dumps(data).encode('utf-8')
    req = urllib.request.Request(url, data=b, headers={'Content-Type': 'application/json', **(headers or {})}, method='POST')
    with urllib.request.urlopen(req, timeout=5) as r:
        return json.load(r)

try:
    # create product (admin)
    prod = post_json('/api/admin/products', {
        'title': 'Demo Product',
        'price': 4.5,
        'description': 'Demo item',
        'artistName': 'Demo Artist',
        'image': '/uploads/default.jpg'
    }, headers={'x-admin-key': 'ryan'})
    print('CREATED_PRODUCT:', json.dumps(prod, indent=2))
    prod_id = prod['product']['id']

    # register user
    uniq = int(time.time())
    email = f'testuser+{uniq}@example.com'
    reg = post_json('/api/register', {'name': 'Test User', 'email': email, 'password': 'pass123'})
    print('REGISTER:', reg)

    # login
    login = post_json('/api/login', {'email': email, 'password': 'pass123'})
    print('LOGIN:', login)
    token = login['token']

    # initiate mpesa checkout
    # Try with and without trailing slash
    try:
        checkout = post_json('/api/mpesa/checkout', {'phone': '254712345678', 'items': [{'productId': prod_id, 'quantity': 1}]}, headers={'Authorization': f'Bearer {token}'})
    except urllib.error.HTTPError as e:
        print('First attempt failed, trying trailing slash...')
        checkout = post_json('/api/mpesa/checkout/', {'phone': '254712345678', 'items': [{'productId': prod_id, 'quantity': 1}]}, headers={'Authorization': f'Bearer {token}'})
    print('MPESA_CHECKOUT:', json.dumps(checkout, indent=2))

except urllib.error.HTTPError as e:
    print('HTTP ERROR', e.code)
    try:
        print(e.read().decode())
    except Exception:
        pass
except Exception as e:
    print('ERROR', e)
