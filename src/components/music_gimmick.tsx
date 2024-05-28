import React, { useCallback, useRef, useState } from "react";
import chips from "/chips.mp3";
import chips1 from "/chips1.mp3";
import chips2 from "/chips2.mp3";
import chips4 from "/chips4.wav";
import useSound from "use-sound";
import { useFFTMic } from "../hooks/useFFTMic";
import { Box, Text, Button, HStack, VStack } from "@chakra-ui/react";

type Props = {
  enabled: boolean;
};
export const MusicGimmick: React.FC<Props> = ({ enabled }) => {
  const [play0, { pause: pause0 }] = useSound(chips, { loop: true });
  const [play1, { pause: pause1 }] = useSound(chips1, {
    loop: true,
    volume: 1.5,
  });
  const [play2, { pause: pause2 }] = useSound(chips2, { loop: true });
  const [play4, { pause: pause4 }] = useSound(chips4, {
    loop: true,
    volume: 2,
  });

  const play = useCallback(() => {
    if (!enabled) return;
    const array = [play0, play1, play2, play4];
    array[Math.floor(Math.random() * array.length)]();
  }, [play0, play1, play2, play4, enabled]);
  const pause = useCallback(() => {
    pause0();
    pause1();
    pause2();
    pause4();
  }, [pause0, pause1, pause2, pause4]);
  const [freqs, setFreqs] = useState<number[]>([]);
  const [maxIndex, setMaxIndex] = useState<number>(0);
  const [eating, setEating] = useState(false);
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
        setEating(true);
        play();
        await new Promise((resolve) =>
          setTimeout(() => {
            const lastTimeout = lastTimeoutRef.current;
            if (
              lastTimeout &&
              new Date().getMilliseconds() - lastTimeout.getMilliseconds() <
                1000
            ) {
              setEating(false);
              pause();
            }
            resolve(null);
          }, 2000)
        );
      }
    );
    return await Promise.race([waitAndAbort, tryLockInner]);
  }, [play, pause, setEating, lastTimeoutRef]);
  const onArrive = useCallback(
    (buffer: Uint8Array, length: number) => {
      setFreqs([].slice.call(buffer));
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
      setMaxIndex(maxFreqIndex);
      const flag = maxFreqIndex > length / 2;
      if (flag) {
        tryPlay();
      }
    },
    [tryPlay, setFreqs, setMaxIndex]
  );
  useFFTMic(onArrive, enabled);

  if (!enabled) return null;
  const freqLen = freqs.length;
  return (
    <VStack height="100%" width="100%">
      <Box mt="8">
        <HStack gap="32">
          <Button colorScheme="yellow" size="lg" onClick={() => play()}>
            Play
          </Button>
          <Button colorScheme="yellow" size="lg" onClick={() => pause()}>
            Stop
          </Button>
        </HStack>
      </Box>
      <Box flexGrow={1} mt="4">
        <Text fontSize="x-large" fontWeight="bold">
          Status: {eating ? "Eating Chips" : "Not Eating"}
        </Text>
      </Box>
      <HStack
        position="absolute"
        bottom="0"
        alignItems="end"
        gap="0"
        width="100%"
        zIndex="-1"
      >
        {freqs.map((f, i) => {
          const colored = i > freqLen / 2;
          const color = i == maxIndex ? "blue" : colored ? "red" : "gray";
          return (
            <Box
              key={i}
              bgColor={color}
              width={`${(1 / freqLen) * 100}%`}
              height={`${f * 0.5}vh`}
            />
          );
        })}
      </HStack>
    </VStack>
  );
};
