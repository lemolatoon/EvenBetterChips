import { Box, Image, Heading, Link } from "@chakra-ui/react";

export const Header = () => {
  return (
    <Box h="80px" width="full" backgroundColor="header" textAlign="center">
      <Link href="/">
        <Image
          height="80px"
          width="auto"
          position="absolute"
          src="/logo.webp"
        />
      </Link>
      <Heading mt="4" as="div">
        EvenBetterChips
      </Heading>
    </Box>
  );
};
