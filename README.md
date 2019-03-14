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

There is a file called `basic.js` inside the `./example` directory which looks like this:

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

while (i < times) {
    leak.push(JSON.parse(JSON.stringify(data)));
    i++;
}

end();
```

As shown, simply import `hbu` and use the given `start`, `end` and `times` exports to instrument your test scenario.

You can run your test, like this:

```
$ hbu './example/basic.js' --times 1000000 --gc-stats
| Test Label   | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------ | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| example-test |          78.85 |    1427.17733 |                 193.02 |               86.24606 |                 2 |                25 |
```

*Note:* only write *one test per file.* Each test is run in an isolated child process by the test runner to make sure the performance of a given test isn't impacted by other tests.

If you want to test something without requiring in hbu and manually adding `start` and `end` calls, you make do so as shown in the [./examples/injected.js](./examples/injected.js) example file.

## Usage

Write and run your tests as shown in the example above. More detailed instructions coming soon.

## License

MIT
