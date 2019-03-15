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

As shown, simply import `hbu` and use the given `start`, `end` and `times` exports to write your test scenario.

Run your test, like so:

```
$ hbu './example/basic.js' --times 1000000 --gc-stats
| Test Label   | Heap Used (MB) | Duration (MS) | GC Collected Heap (MB) | GC Pause Duration (MS) | GC Events (major) | GC Events (minor) |
| ------------ | -------------: | ------------: | ---------------------: | ---------------------: | ----------------: | ----------------: |
| example-test |          78.85 |    1427.17733 |                 193.02 |               86.24606 |                 2 |                25 |
```

*Notes:*

* Only write *one test per file.* Each test is run in an isolated child process by the test runner to make sure the performance of a given test isn't impacted by other tests.
* Report output is valid markdown! Use it in READMEs or tther documentation.

If you want to test something without requiring in hbu and manually adding `start` and `end` calls, you make do so as shown in the [./example/injected.js](./example/injected.js) example file.

## Usage

For the most part, it's as simple as writing and running your tests as shown in the examples above. Note that the `end` function can be called inside a callback or at the end of a promise-chain for async testing. Refer to options below for additional functionality.

## Options

### `--times`

This sets the `process.env.HBU_TIMES` environment variable and is also available as `hbu.time` when requiring the `hbu` module into your project.

### `--gc-stats`

Adds garbage collection statistics to the performance report.

### `--mode`

Value of `--mode` can be one of: `sequential` (default) or `parallel`. Running your tests in parallel mode is much faster but may be slightly less accurate as the concurrent processes compete for CPU and memory.

### `--inject`

When the `--inject` flag is included, your tests will be automatically instrumented without needing explicit calls `start` or `end`. Note that if you do have explicit calls to `start` or `end` in your code they will be ignore when this flag is used.

Note that performance metrics for tests run with the `--inject` flag will include load time and exit time of the file module. If you're looking to test a specific fragment of your file module, you should require `hbu` and manually add calls to `start` and `end` for the highest level of accuracy.

## License

MIT
