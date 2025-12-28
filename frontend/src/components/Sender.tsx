/**
What we have to do in sender:
1. Create a socket connection to the server
2. Start or initiate the WEBRTC call by using the button which will create an offer
*/
/**
* FLOW:
* 1. SENDER sends a request to signalling server and tell them to identify me as sender
* 2. Then we click on Start Sending Video button
* 3. Then onicecandidate function is called to let the reciever know that these are the ip they used to connect with me
* 4. Then addTrack is called which initiates the `onnegotiationneeded` fucntion through which SDP exchanges
*/


import { useEffect, useState } from "react"


export function Sender() {
  
   const [socket, setSocket] = useState<WebSocket|null>(null);


   useEffect(() => {
       const socket = new WebSocket('ws://localhost:8080');
       socket.onopen = () => {
           socket.send(JSON.stringify({type: 'identify-as-sender'}));
       }
       setSocket(socket);
   }, []);
  
   async function startSendingVideo() {
       if (!socket) return;
       // Create an RTCPeerConnection
       const pc = new RTCPeerConnection();


       // Add Ice Candidate
       // The onicecandidate callback is a key part of the Trickle ICE API in WebRTC which
       // used to efficiently exchange network connectivity information between peers
       pc.onicecandidate = (event) => {
           if(event.candidate) {
               socket?.send(JSON.stringify({type: 'ice-candidate', candidate: event.candidate}));
           }
       }


       pc.onnegotiationneeded = async () => {
           // Create an offer
           const offer = await pc.createOffer();  // sdp
           // set local description
           await pc.setLocalDescription(offer);
           // send the offer to signalling server
           socket?.send(JSON.stringify({type: 'create-offer', sdp: pc.localDescription}));
       }


       socket.onmessage = async (event) => {
           const message = JSON.parse(event.data);
           if (message.type === "create-answer") {
               await pc.setRemoteDescription(message.sdp);
           }
           if(message.type === "ice-candidate") {
               await pc.addIceCandidate(message.candidate);
           }
       }


       // Allow access for camera
       const stream = await navigator.mediaDevices.getUserMedia({video: true, audio: true});
       // Due to addTrack the `onnegotiationneeded` callback is triggered
       pc.addTrack(stream.getVideoTracks()[0]);
       const video = document.createElement('video');
       document.body.appendChild(video);
       video.srcObject = stream;
       video.play();
   }


   return <div>
       sender
       <button onClick={startSendingVideo}>Send Video</button>
   </div>
}
