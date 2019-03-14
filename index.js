'use strict';

const label = process.env.HBU_LABEL;

exports.times = process.env.HBU_TIMES;

const { PerformanceObserver, performance } = require('perf_hooks');

let obs;

exports.start = () => {
    obs = new PerformanceObserver((items) => {
        process.send({
            type: 'perf_entries',
            data: items.getEntries()
        });
        performance.clearMarks();
    });

    obs.observe({ entryTypes: ['measure'] });

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
};

exports.end = () => {
    performance.mark(`${label}_end`);

    process.send({
        type: 'memory_usage',
        data: process.memoryUsage()
    });

    performance.measure(label, `${label}_start`, `${label}_end`);

    obs.disconnect();
};

