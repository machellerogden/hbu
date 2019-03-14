'use strict';

// run with `./bin/hbu './example/default.js' --times 1000000 --gc-stats`

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
