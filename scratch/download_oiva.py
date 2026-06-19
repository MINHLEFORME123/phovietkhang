import urllib.request

url = 'https://www.oivahymy.fi/wp-content/themes/oiva/images/Oiva_logo_nega.png'
req = urllib.request.Request(
    url, 
    headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.oivahymy.fi/'
    }
)

try:
    with urllib.request.urlopen(req) as response:
        content = response.read()
        if b'<!DOCTYPE' not in content[:20] and b'<html' not in content[:20]:
            with open('c:/Users/minhb/OneDrive/Desktop/phovietkhang/images/oiva-logo.png', 'wb') as f:
                f.write(content)
            print("Successfully downloaded image.")
        else:
            print("Server returned HTML instead of an image.")
except Exception as e:
    print(f"Error: {e}")
