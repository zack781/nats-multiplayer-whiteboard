import { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";
import { JSONCodec, connect } from "nats.ws";

const max = 9999;

export default function App() {
  const colors = useMemo(
    () => ["black", "red", "green", "orange", "blue", "yellow"],
    []
  );
  const canvasReference = useRef(null);
  const contextReference = useRef(null);
  const jc = useRef(null);
  const nats = useRef(null);
  const user_id = useRef(
    Math.floor(Math.random() * max)
  );

  const [isPressed, setIsPressed] = useState(false);

  const clearCanvas = () => {
    const canvas = canvasReference.current;
    const context = canvas.getContext("2d");
    context.fillStyle = "white";
    context.fillRect(0, 0, canvas.width, canvas.height);
  };

  const beginDraw = (e) => {
    contextReference.current.beginPath();
    contextReference.current.moveTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );

    // harcoding a subject named "draw" to publish the drawing
    // the message is a JSON object with the x and y coordinates
    nats.current.publish("draw", jc.current.encode({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, status: "begin", user_id: user_id.current }));

    setIsPressed(true);
  };

  const updateDraw = (e) => {
    console.log('updateDraw');
    if (!isPressed) return;

    contextReference.current.lineTo(
      e.nativeEvent.offsetX,
      e.nativeEvent.offsetY
    );

    // publishing the drawing
    nats.current.publish("draw", jc.current.encode({ x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY, status: "update", user_id: user_id.current}));
    contextReference.current.stroke();
  };

  const endDraw = () => {
    console.log('endDraw');
    contextReference.current.closePath();
    // publishing the end of the drawing
    nats.current.publish("draw", jc.current.encode({ status: "end", user_id: user_id.current}));
    setIsPressed(false);
  };

  // useEffect to connect to the NATS server
  useEffect(() => {
    const initNATS = async () => {
      // creating a JSON codec to encode/decode messages
      jc.current = JSONCodec();
      // connecting to the NATS server
      nats.current = await connect({ servers: "ws://localhost:9222" });

      // subscribing to the "draw" subject to receive the drawing
      const sub = nats.current.subscribe("draw");
      for await (const msg of sub) {
        const data = jc.current.decode(msg.data);
        console.log('data = ', data.status);
        if (data.user_id !== user_id.current) {
          if (data.status === "begin") {
            contextReference.current.beginPath();
            contextReference.current.moveTo(data.x, data.y);
          } else if (data.status === "update") {
            contextReference.current.lineTo(data.x, data.y);
            contextReference.current.stroke();
          } else if (data.status === "end") {
            contextReference.current.closePath();
          }
        }
      }
    }

    initNATS();
  });

  useEffect(() => {
    const canvas = canvasReference.current;
    canvas.width = 800;
    canvas.height = 800;

    const context = canvas.getContext("2d");
    context.lineCap = "round";
    context.strokeStyle = colors[0];
    context.lineWidth = 5;
    contextReference.current = context;
  }, [colors]);

  const setColor = (color) => {
    contextReference.current.strokeStyle = color;
  };

  return (
    <div className="App">
      <canvas
        ref={canvasReference}
        onMouseDown={beginDraw}
        onMouseMove={updateDraw}
        onMouseUp={endDraw}
      />
      <div className="buttons">
        <button onClick={clearCanvas}>CLR</button>
        {colors.map((color) => (
          <button
            onClick={() => setColor(color)}
            style={{ backgroundColor: color }}
          ></button>
        ))}
      </div>
    </div>
  );
}
