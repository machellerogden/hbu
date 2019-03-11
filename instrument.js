#!/usr/bin/env node

const label = process.env.HBU_LABEL;

const { PerformanceObserver, performance } = require('perf_hooks');
const gc = require('gc-stats')();

gc.on('stats', stats => {
    console.log('GC happened', stats);
});

const toMB = v => Math.round(v / 1024 / 1024 * 100) / 100;
let previousHeap = process.memoryUsage().heapUsed;

function memory() {
    const heap = process.memoryUsage().heapUsed;
    p = previousHeap;
    previousHeap = process.memoryUsage().heapUsed;
    return `${toMB(heap - p)} MB`;
}

const obs = new PerformanceObserver((items) => {
    const { name, duration } = items.getEntries()[0];
    process.send({
        done: true,
        data: [
            name,
            memory(),
            `${duration} MS`
        ]
    });
    performance.clearMarks();
});

obs.observe({ entryTypes: ['measure'] });

performance.mark(`${label}_start`);

process.on('exit', () => {
    performance.mark(`${label}_end`);
    performance.measure(label, `${label}_start`, `${label}_end`);
    obs.disconnect();
});
