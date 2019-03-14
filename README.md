# How's by u?

> Performance testing CLI

## Install

```
npm i -D hbu
```

...or, globally, if you must:

```
npm i -g hbu
```

## Example

If you had a test file called `example-test.js` inside a `./example` directory which looked like this:

```
const { start, end, times } = require('hbu');

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
```

You could then run your test, like this:

```
$ hbu './example/*.js' --times 1000000 --gc-stats
| Test Label   | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------ | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| example-test |          78.85 |    1427.17733 |                 193.02 |               86.24606 |                 2 |                25 |
```

*Note:* only write *one test per file.* Each test is run in an isolated child process by the test runner to make sure the performance of a given test isn't impacted by other tests.

## Usage

Write and run your tests as shown in the example above. More detailed instructions coming soon.

## License

MIT
