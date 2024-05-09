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
  const lastTimeoutRef = useRef<Date | null>(null);
  const tryPlay = useCallback(async () => {
    const control = new AbortController();

    const ms = 900;
    const waitAndAbort = new Promise((resolve) =>
      setTimeout(() => {
        control.abort("timeout");
        lastTimeoutRef.current = new Date();
        resolve(false);
      }, ms)
    );

    const tryLockInner = navigator.locks.request(
      "audio",
      {
        signal: control.signal,
      },
      async () => {
        console.log("play");
        play();
        await new Promise((resolve) =>
          setTimeout(() => {
            const lastTimeout = lastTimeoutRef.current;
            if (
              lastTimeout &&
              new Date().getMilliseconds() - lastTimeout.getMilliseconds() <
                1000
            )
              pause();
            resolve(null);
          }, 2000)
        );
      }
    );
    return await Promise.race([waitAndAbort, tryLockInner]);
  }, [play, lastTimeoutRef]);
  const [enabled, setEnabled] = useState(false);
  const onArrive = useCallback(
    (buffer: Uint8Array, length: number) => {
      const maxFreqIndex = buffer.reduce<[number, number]>(
        (prevPair, curAmp, curFreq) => {
          const [prevAmp, prevFreq] = prevPair;
          if (prevAmp < curAmp) {
            return [curAmp, curFreq] as const;
          }

          return [prevAmp, prevFreq] as const;
        },
        [-1, -1] as const
      )[1];
      const flag = maxFreqIndex > (length * 2) / 3;
      if (flag) {
        tryPlay();
      }
    },
    [tryPlay, pause]
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
            <FormLabel mb="0">Enable System By Click Here: </FormLabel>
            <Switch onChange={onEnabled} />
          </FormControl>
          <HStack gap="32" mt="4">
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
