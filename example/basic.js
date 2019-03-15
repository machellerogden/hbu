'use strict';

/**
 * A good test should import `start`, `end` and `times` from `hbu`
 * and be constructed as below. Only one test is allowed per file!
 *
 * Run this example with:
 *
 *      `./bin/hbu './example/basic.js' --times 1000000 --gc-stats`
 *
 */

const { start, end, times } = require('..');

const data = {
    a: "a",
    b: "b",
    c: "c"
};

const leak = [];

let i = 0;

start();

while (i < times) {
    leak.push(JSON.parse(JSON.stringify(data)));
    i++;
}

end();
