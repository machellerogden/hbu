global.hbu_run(() => {
    const data = {
        a: "a",
        b: "b",
        c: "c"
    };

    const leak = [];

    let i = 0;
    while (i < process.env.HBU_TIMES) {
        leak.push(JSON.parse(JSON.stringify(data)));
        i++;
    }
});
