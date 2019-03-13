# How's by u?

> Performance testing CLI

## Install

```
npm i -g hbu
```

## Example

In you had a test file called `example-test.js` inside a `./example` directory which looked like this:

```
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
```

You could then run your test, like this:

```
$ hbu './example/*.js' --times 1000000 --gc-stats
| Test Label   | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------ | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| example-test |          78.85 |    1427.17733 |                 193.02 |               86.24606 |                 2 |                25 |
```

## Usage

Write some code. `process.env.HBU_TIMES` contains the number of iterations
you've specified. Use this for loop conditions. The test is up to you.

Run your tests as shown in the example above.

## License

MIT
