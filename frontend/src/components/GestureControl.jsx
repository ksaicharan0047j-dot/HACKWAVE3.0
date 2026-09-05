import { useEffect, useRef, useState } from "react";
import {
  FilesetResolver,
  HandLandmarker,
} from "@mediapipe/tasks-vision";

const MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

const WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";

export default function GestureControl({ onGesture }) {
  const videoRef = useRef(null);
  const landmarkerRef = useRef(null);
  const streamRef = useRef(null);
  const lastY = useRef(null);
  const lastGestureTime = useRef(0);

  const [active, setActive] = useState(false);
  const [gesture, setGesture] = useState("SHOW YOUR HAND");

  useEffect(() => {
    let animationFrame;

    const start = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(WASM_URL);

        landmarkerRef.current =
          await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: MODEL_URL,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
          });

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: 640,
            height: 480,
            facingMode: "user",
          },
          audio: false,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setActive(true);
        }

        detect();
      } catch (error) {
        console.error("Gesture camera error:", error);
        setGesture("CAMERA ERROR");
      }
    };

    const detect = () => {
      const video = videoRef.current;
      const landmarker = landmarkerRef.current;

      if (!video || !landmarker || video.readyState < 2) {
        animationFrame = requestAnimationFrame(detect);
        return;
      }

      const now = performance.now();

      const result = landmarker.detectForVideo(video, now);

      if (result.landmarks?.length) {
        const hand = result.landmarks[0];

        // Wrist position
        const y = hand[0].y;

        if (lastY.current !== null) {
          const delta = y - lastY.current;
          const timeSinceGesture =
            Date.now() - lastGestureTime.current;

          if (timeSinceGesture > 700) {
            if (delta < -0.035) {
              setGesture("NEXT");
              onGesture?.("NEXT");
              lastGestureTime.current = Date.now();
            } else if (delta > 0.035) {
              setGesture("PREVIOUS");
              onGesture?.("PREVIOUS");
              lastGestureTime.current = Date.now();
            }
          }
        }

        lastY.current = y;
      }

      animationFrame = requestAnimationFrame(detect);
    };

    start();

    return () => {
      cancelAnimationFrame(animationFrame);

      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });

      landmarkerRef.current?.close();
    };
  }, [onGesture]);

  return (
    <div className="gesture-control">
      <video
        ref={videoRef}
        className="gesture-camera"
        muted
        playsInline
      />

      <div className="gesture-status">
        <span className={active ? "gesture-dot active" : "gesture-dot"} />
        {active ? `GESTURE: ${gesture}` : gesture}
      </div>
    </div>
  );
}