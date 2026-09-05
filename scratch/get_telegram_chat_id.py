import urllib.request
import json

TOKEN = "8908938270:AAGURjR8EQsZ8vRAKyQKwq3kprTRDTm1bgA"
URL = f"https://api.telegram.org/bot{TOKEN}/getUpdates"

try:
    response = urllib.request.urlopen(URL)
    data = json.loads(response.read().decode())
    
    print("Response from Telegram API:")
    print(json.dumps(data, indent=2))
    
    if data.get("ok"):
        for result in data["result"]:
            if "message" in result and "chat" in result["message"]:
                chat = result["message"]["chat"]
                print(f"Chat ID found: {chat['id']} (Type: {chat['type']}, Title: {chat.get('title', 'N/A')})")
            elif "my_chat_member" in result:
                chat = result["my_chat_member"]["chat"]
                print(f"Chat ID found: {chat['id']} (Type: {chat['type']}, Title: {chat.get('title', 'N/A')})")
except Exception as e:
    print("Error:", e)
