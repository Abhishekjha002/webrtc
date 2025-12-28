import { useEffect, useRef } from "react"

export function Receiver() {
   const pcRef = useRef<RTCPeerConnection | null>(null);
   useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080');
        socket.onopen = () => {
            socket.send(JSON.stringify({type: 'identify-as-reciever'}));
        }
        // Create an RTCPeerConnection
        pcRef.current = new RTCPeerConnection();
        
        socket.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if (message.type === "create-offer" && pcRef.current) {
                pcRef.current.ontrack = (event) => {
                    const video = document.createElement('video');
                    document.body.appendChild(video);
                    video.srcObject = new MediaStream([event.track]);
                    video.play();
                }
                // Set the offer as remote description
                await pcRef.current.setRemoteDescription(message.sdp);
                // Create an answer
                const answer = await pcRef.current.createAnswer();
                // set local description
                await pcRef.current.setLocalDescription(answer);
                // send the answer to signalling server
                socket?.send(JSON.stringify({type: 'create-answer', sdp: pcRef.current.localDescription}));

                pcRef.current.onicecandidate = (event) => {
                    console.log(event);
                    if(event.candidate) {
                        socket?.send(JSON.stringify({type: 'ice-candidate', candidate: event.candidate}));
                    }
                }
            }
            else if(message.type === "ice-candidate" && pcRef.current) {
                await pcRef.current.addIceCandidate(message.candidate);
            }
       }
   }, []);
   return <div>
       Reciever
   </div>
}
