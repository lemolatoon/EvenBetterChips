import { Box, FormLabel, Switch, VStack } from "@chakra-ui/react";
import { Header } from "./components/header";
import { useCallback, useState } from "react";
import { MusicGimmick } from "./components/music_gimmick";

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
  const [enabled, setEnabled] = useState(false);
  const onEnabled = useCallback(() => {
    playReadySound(() => setEnabled((s) => !s));
  }, [setEnabled]);

  return (
    <>
      <VStack height="100vh">
        <Header />

        <Box mt="4" display="flex" alignItems="center">
          <FormLabel mb="0">Enable System By Click Here: </FormLabel>
          <Switch onChange={onEnabled} />
        </Box>
        <Box flexGrow={1}>
          <MusicGimmick enabled={enabled} />
        </Box>
      </VStack>
    </>
  );
}

export default App;
