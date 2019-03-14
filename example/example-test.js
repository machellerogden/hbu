'use strict';

// run with ./bin/hbu './example/*.js' --times 1000000 --gc-stats

const { start, end, times } = require('..');

const data = {
    a: "a",
    b: "b",
    c: "c"
};

const leak = [];

let i = 0;

start();

while (i < process.env.HBU_TIMES) {
    leak.push(JSON.parse(JSON.stringify(data)));
    i++;
}

end();
