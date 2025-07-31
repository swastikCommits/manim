import { WebSocketServer, WebSocket } from "ws";

export function setupSocket(wss: WebSocketServer){
wss.on('connection', function connection(ws: WebSocket){
    ws.on('message', function message(data, isBinary){
        wss.clients.forEach(client => {
            if(client.readyState === WebSocket.OPEN){
                client.send(data, {binary: isBinary});
            }
        })
    })
    ws.on('close', () => {
        console.log("WebSocket disconnected");
    })
})
}