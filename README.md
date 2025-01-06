# nats-multiplayer-whiteboard
This project is a collaborative drawing application built using React and NATS messaging. It allows users to draw on a shared canvas in real time. The application uses WebSockets via the nats.ws library to enable communication between multiple users, ensuring seamless updates to the canvas across connected clients.

The NATS server is configured to run on websocket with no TLS enabled for testing purposes. Production code would require WSS with TLS.

To test the app:
1. Start the NATS server with the following command: ```nats-server -c server.conf```
2. npm start the react app on 3000
3. npm start the react app on 3001
4. Open the app on localhost:3000 and localhost:3001
5. Subscribe to the channel "draw" on both clients ```nats sub "draw"```
