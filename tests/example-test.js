'use strict';

const data = {
    a: "a",
    b: "b",
    c: "c",
    d: "d",
    e: "e",
    f: "f"
};

const leak = [];

let i = 0;
while (process.env.HBU_TIMES > i) {
    const cloned = JSON.parse(JSON.stringify(data));
    cloned.a = 'b';
    cloned.b = 'c';
    cloned.c = 'd';
    cloned.d = 'e';
    cloned.e = 'f';
    cloned.f = 'g';
    leak.push(cloned);
    i++;
}
