#!/usr/bin/env node

const label = process.env.HBU_LABEL;

const { PerformanceObserver, performance } = require('perf_hooks');

const obs = new PerformanceObserver((items) => {
    process.send({
        type: 'perf_entries',
        data: items.getEntries()
    });
    performance.clearMarks();
});

obs.observe({ entryTypes: ['measure'] });

process.on('exit', () => {
    process.send({
        type: 'done'
    });
});

global.hbu_run = (fn) => {

    global.gc();

    if (process.env.HBU_GC_STATS) {
        let skip_gc_send = true;
        require('gc-stats')().on('stats', stats => {
            if (skip_gc_send) {
                skip_gc_send = false;
                return;
            }
            process.send({
                type: 'gc_event',
                data: stats
            });
        });
        global.gc(); // one more gc - "clean room" approach
    }

    process.send({
        type: 'memory_usage',
        data: process.memoryUsage()
    });

    performance.mark(`${label}_start`);

    fn();

    performance.mark(`${label}_end`);

    process.send({
        type: 'memory_usage',
        data: process.memoryUsage()
    });

    performance.measure(label, `${label}_start`, `${label}_end`);

    obs.disconnect();
};
