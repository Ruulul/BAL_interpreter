This is an implementation of [BAL](https://esolangs.org/wiki/Brainfuck_Assembly_Language) with some extentions:
  - ! starts a comment
  - " or ' starts a string, and it must end in the same line and the same character delimits it
    - The sequence of bytes is written directly on the output, without any type of inspection or handling
  - Standing number assembles its value directly on the output
Output behaviour:
  - 0 exits (original PICO-8 implementation behaviour)
Input behaviour:
Implementation details:
  - You have to type 0 instead of 32 when you want to pass 32 to the commands who accept it.
  - You cant write commands together right now.