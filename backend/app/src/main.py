import json
from websocket_server import WebsocketServer


PORT = 8080


sender_socket = None
reciever_socket = None


"""
This function handle below functinality:
1. identify-as-sender
2. identify-as-reciever
3. create offer
4. create answer
5. add ice candidate
"""


def message_received(client, server, message):
   global sender_socket, reciever_socket   
   if not message:
       return
   msg = json.loads(message)
   if not msg:
       return
   if msg["type"] == "identify-as-sender":
       print("sender")
       sender_socket = client
   elif msg["type"] == "identify-as-reciever":
       print("reciever")
       reciever_socket = client
   elif msg["type"] == "create-offer":
       print("Create offer")
       if client != sender_socket:
           return
       server.send_message(reciever_socket, json.dumps(msg))
   elif msg["type"] == "create-answer":
       print("Create answer")
       if client != reciever_socket:
           return
       server.send_message(sender_socket, json.dumps(msg))
   elif msg["type"] == "ice-candidate":
       if client == sender_socket and reciever_socket:
           server.send_message(reciever_socket, json.dumps({"type": "ice-candidate", "candidate": msg["candidate"]}))
       elif client == reciever_socket and sender_socket:
           server.send_message(sender_socket, json.dumps({"type": "ice-candidate", "candidate": msg["candidate"]}))


server = WebsocketServer(port=PORT, host="0.0.0.0")
server.set_fn_message_received(message_received)


print(f"WebSocket server running on port {PORT}")
server.run_forever()