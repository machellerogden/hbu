'use strict';

/**
 * If you want to performance test without manually setting up a
 * test, you can simply write the code you want to performance test.
 * Remember, only one test is allowed per file!
 *
 * Run this example with:
 *
 *      `./bin/hbu './example/injected.js' --times 1000000 --gc-stats`
 *
 */

const data = {
    a: "a",
    b: "b",
    c: "c"
};

const leak = [];

let i = 0;
// Note: While optional, if you want to take advantage of the `--times` command-line option, you can access it via `process.env.HBU_TIMES`.
while (i < process.env.HBU_TIMES) {
    leak.push(JSON.parse(JSON.stringify(data)));
    i++;
}
