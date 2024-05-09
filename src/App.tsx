import { Box, Button, HStack, VStack } from "@chakra-ui/react";
import { Header } from "./components/header";
import chips from "/chips.mp3";
import useSound from "use-sound";

function App() {
  const [play, { stop }] = useSound(chips, { loop: true });
  return (
    <>
      <VStack>
        <Header />

        <Box mt="8">
          <HStack gap="32">
            <Button colorScheme="yellow" size="lg" onClick={() => play()}>
              Play
            </Button>
            <Button colorScheme="yellow" size="lg" onClick={() => stop()}>
              Stop
            </Button>
          </HStack>
        </Box>
      </VStack>
    </>
  );
}

export default App;
