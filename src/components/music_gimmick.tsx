import React, { useCallback, useRef, useState } from "react";
import chips from "/chips.mp3";
import useSound from "use-sound";
import { useFFTMic } from "../hooks/useFFTMic";
import { Box, Text, Button, HStack } from "@chakra-ui/react";

type Props = {
  enabled: boolean;
};
export const MusicGimmick: React.FC<Props> = ({ enabled }) => {
  const [play, { pause }] = useSound(chips, { loop: true });
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
    [tryPlay]
  );
  useFFTMic(onArrive, enabled);

  if (!enabled) return null;

  return (
    <>
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
      <Box mt="4">
        <Text fontSize="x-large" fontWeight="bold">
          Status: {eating ? "Eating Chips" : "Not Eating"}
        </Text>
      </Box>
    </>
  );
};
