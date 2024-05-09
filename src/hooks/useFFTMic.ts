import { useEffect } from "react";

async function getMic() {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  });
}

const LENGTH = 32;
export const useFFTMic = (
  onArrive: (buffer: Uint8Array, length: number) => void,
  enabled: boolean
) => {
  useEffect(() => {
    if (!enabled) return;
    console.log("start get mic!!");
    getMic()
      .then((stream) => {
        const audioCtx = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();

        const data = new Uint8Array(LENGTH);
        analyser.fftSize = 1024;

        source.connect(analyser);
        tick();

        function tick() {
          analyser.getByteFrequencyData(data);
          onArrive(data, LENGTH);
          requestAnimationFrame(tick);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  }, [enabled]);
};
