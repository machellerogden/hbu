#!/usr/bin/env node

const label = process.env.HBU_LABEL;

const { PerformanceObserver, performance } = require('perf_hooks');
const gc = require('gc-stats')();

process.send({
    type: 'memory_usage',
    data: process.memoryUsage()
});

const obs = new PerformanceObserver((items) => {
    process.send({
        type: 'perf_entries',
        data: items.getEntries()
    });
    performance.clearMarks();
});

obs.observe({ entryTypes: ['measure'] });

performance.mark(`${label}_start`);

gc.on('stats', stats => {
    process.send({
        type: 'gc_event',
        data: stats
    });
});

process.on('exit', () => {
    performance.mark(`${label}_end`);
    process.send({
        type: 'memory_usage',
        data: process.memoryUsage()
    });
    performance.measure(label, `${label}_start`, `${label}_end`);
    obs.disconnect();
    process.send({
        type: 'done'
    });
});
