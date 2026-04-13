import { onMount, onCleanup } from "solid-js";

const VIDEO_SRC =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4";

export default function AuthVideoBackground() {
  let videoRef;

  onMount(() => {
    if (videoRef) {
      videoRef.src = VIDEO_SRC;
      videoRef.muted = true;
      videoRef.loop = true;
      videoRef.playsInline = true;
      videoRef.play().catch(() => {});
    }
  });

  onCleanup(() => {
    if (videoRef) {
      videoRef.pause();
      videoRef.src = "";
    }
  });

  return (
    <>
      {/* Video fills the nearest positioned ancestor (the page wrapper) */}
      <video
        ref={videoRef}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          "object-fit": "cover",
          "z-index": 0,
          "pointer-events": "none",
          opacity: 0.5,
        }}
      />

      {/* Dark overlay for readability */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          "z-index": 1,
          background:
            "linear-gradient(135deg, rgba(10,8,30,0.78) 0%, rgba(5,12,25,0.72) 100%)",
          "pointer-events": "none",
        }}
      />
    </>
  );
}
