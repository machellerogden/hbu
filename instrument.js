#!/usr/bin/env node

const label = process.env.HBU_LABEL;

const { PerformanceObserver, performance } = require('perf_hooks');
const gc = require('gc-stats')();
const gc_events = [];

const toMB = v => Math.round(v / 1024 / 1024 * 100) / 100;
let previousHeapUsed = process.memoryUsage().heapUsed;

function memoryCheck() {
    const newHeapUsed = process.memoryUsage().heapUsed;
    const gc_count = gc_events.length;
    const stats = gc_events.splice(0, gc_count).reduce((acc, evt) => ({
        gc_diff: acc.gc_diff - evt.diff,
        gc_time: acc.gc_time + evt.pause
    }), {
        gc_time: 0,
        gc_diff: 0
    });
    const diff = newHeapUsed - previousHeapUsed;
    previousHeapUsed = newHeapUsed;
    return {
        diff,
        gc_count,
        ...stats
    };
}

const obs = new PerformanceObserver((items) => {
    const { name, duration } = items.getEntries()[0];
    const stats = memoryCheck();
    process.send({
        done: true,
        data: [
            name,
            `${toMB(stats.diff)}`,
            `${duration}`,
            String(stats.gc_count),
            `${toMB(stats.gc_diff)}`,
            `${stats.gc_time}`
        ]
    });
    performance.clearMarks();
});

obs.observe({ entryTypes: ['measure'] });

performance.mark(`${label}_start`);

const gctypes = {
    '1': 'Scavenge (minor GC)',
    '2': 'Mark/Sweep/Compact (major GC)',
    '4': 'Incremental marking',
    '8': 'Weak/Phantom callback processing',
    '15': 'All'
};

gc.on('stats', stats => {
    gc_events.push({
        type: gctypes[stats.gctype],
        pause: stats.pauseMS,
        diff: stats.diff.usedHeapSize
    });
});

process.on('exit', () => {
    performance.mark(`${label}_end`);
    performance.measure(label, `${label}_start`, `${label}_end`);
    obs.disconnect();
});
