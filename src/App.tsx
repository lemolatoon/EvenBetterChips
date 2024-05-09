import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Switch,
  VStack,
} from "@chakra-ui/react";
import { Header } from "./components/header";
import chips from "/chips.mp3";
import useSound from "use-sound";
import { useFFTMic } from "./hooks/useFFTMic";
import { useCallback, useRef, useState } from "react";

// 無音を再生。
const playReadySound = (onPlayEnd: () => void) => {
  const audioCtx = new window.AudioContext();
  const oscillator = audioCtx.createOscillator();
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(0, audioCtx.currentTime);
  oscillator.connect(audioCtx.destination);

  oscillator.onended = () => {
    onPlayEnd();
  };
  oscillator.start(0);
  oscillator.stop(0);
};

function App() {
  const [play, { pause }] = useSound(chips, { loop: true });
  const [enabled, setEnabled] = useState(false);
  const playingRef = useRef(false);
  const onArrive = useCallback(
    (buffer: Uint8Array, length: number) => {
      const maxFreqIndex = buffer?.reduce<[number, number]>(
        (prevPair, curAmp, curFreq) => {
          const [prevAmp, prevFreq] = prevPair;
          if (prevAmp < curAmp) {
            return [curAmp, curFreq] as const;
          }

          return [prevAmp, prevFreq] as const;
        },
        [-1, -1] as const
      )[1];
      if (
        !playingRef.current &&
        maxFreqIndex &&
        maxFreqIndex > (length * 2) / 3
      ) {
        console.log({ maxFreqIndex, length });
        if (playingRef.current) return;
        const sleep = (ms: number) =>
          new Promise((resolve) => setTimeout(() => resolve(null), ms));
        const control = new AbortController();
        const sleepAndAbort = async () => {
          await sleep(100);
          control.abort();
        };
        const tryLock = navigator.locks.request("audio", async (lock) => {
          if (control.signal.aborted) {
            console.log("already aborted");
            return;
          }
          play();
          await sleep(200);
          console.log("pause");
          pause();
          playingRef.current = false;
        });
        Promise.race([sleepAndAbort, tryLock]);
      }
    },
    [play, pause, playingRef]
  );
  useFFTMic(onArrive, enabled);
  const onEnabled = useCallback(() => {
    playReadySound(() => setEnabled((s) => !s));
  }, [setEnabled]);

  return (
    <>
      <VStack>
        <Header />

        <Box mt="8">
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">Enable System ?</FormLabel>
            <Switch onChange={onEnabled} />
          </FormControl>
          <HStack gap="32">
            <Button colorScheme="yellow" size="lg" onClick={() => play()}>
              Play
            </Button>
            <Button colorScheme="yellow" size="lg" onClick={() => pause()}>
              Stop
            </Button>
          </HStack>
        </Box>
      </VStack>
    </>
  );
}

export default App;
