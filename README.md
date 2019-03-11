# How's by u?

> Performance testing CLI

## Install

```
npm i -g hbu
```

## Example

```
$ hbu 'tests/*.js' --times 100000
| Label        | Heap Used          | Elapsed Time             |
| ------------ | :----------------: | :----------------------: |
| example-test |        12.86 MB    |          211.071512 MS   |
```

## Usage

Write some code. `process.env.HBU_TIMES` contains the number of iterations
you've specified. Use this for loop conditions. The test is up to you.

Run your tests as shown in the example above.

## License

MIT
