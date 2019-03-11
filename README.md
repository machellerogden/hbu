# How's by u?

> Performance testing CLI

## Install

```
npm i -g hbu
```

## Example

In you had a test file called `example-test.js` inside a `./tests` directory which looked like this:

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
$ hbu './tests/*.js' --times 100000
| Label        | Heap Used          | Elapsed Time             |
| ------------ | :----------------: | :----------------------: |
| example-test |        12.97 MB    |          206.248026 MS   |
```

## Usage

Write some code. `process.env.HBU_TIMES` contains the number of iterations
you've specified. Use this for loop conditions. The test is up to you.

Run your tests as shown in the example above.

## License

MIT
