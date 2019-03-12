#!/usr/bin/env node
'use strict';

const path = require('path');
const glob = require('glob');
const rc = require('rc');
const table = require('markdown-table')
const { fork } = require('child_process');
const { readdirSync:readdir } = require('fs');

const config = rc('hbu', {
    times: 10
});

const testPattern = config._[0];
if (!testPattern) throw new Error('No test pattern specified.');

const testArgs = config['--'];

const times = config.times;

const filePaths = glob.sync(testPattern, { nodir: true });

const headings = [ 'Test Label', 'Heap Used (MB)', 'Duration (MS)', 'GC Events', "GC Collected Heap (MB)", 'GC Pause Duration (MS)' ];

const columnAlignment = [ null, '.', '.', null, '.', null ];

const runnerPath = path.join(__dirname, './runner');

const processSpawn = (filePath, label) => {
    const testPath = path.join(process.cwd(), filePath);
    const { dir:cwd } = path.parse(testPath);
    const env = {
        ...process.env,
        HBU_LABEL: label,
        HBU_TIMES: Number(times)
    };
    return fork(testPath, testArgs, {
        env,
        cwd,
        execArgv: [
            '-r', path.join(__dirname, 'instrument.js')//,
            //'--max-old-space-size=2048' // TODO make configurable
        ]
    });
};

const runOne = filePath => {
    const label = path.parse(filePath).name;
    const gc_events = [];
    let perf_entries = [];
    const memory_entries = [];
    const handlers = {
        gc_event: data => gc_events.push(data),
        perf_entries: data => {
            perf_entries = perf_entries.concat(data);
        },
        memory_usage: data => memory_entries.push(data)
    };
    return new Promise((resolve, reject) => {
        const done = () => resolve({
            label,
            perf_entries,
            gc_events,
            memory_entries
        });
        processSpawn(filePath, label).on('message', msg => {
            const h = {
                ...handlers,
                done
            }[msg.type];
            if (h) h(msg.data);
        });
    });
};

const runAll = filePaths => Promise.all(filePaths.map(runOne));

const toMB = v => Math.round(v / 1024 / 1024 * 100) / 100;

//const gctypes = {
    //'1': 'Scavenge (minor GC)',
    //'2': 'Mark/Sweep/Compact (major GC)',
    //'4': 'Incremental marking',
    //'8': 'Weak/Phantom callback processing',
    //'15': 'All'
//};

const run = paths => runAll(paths).then(results => {
    const report = results.map(({ label, perf_entries, gc_events, memory_entries }) => {

        const heapUsed = memory_entries[memory_entries.length - 1].heapUsed - memory_entries[0].heapUsed;
        const duration = perf_entries[0].duration;

        const gc_count = gc_events.length;

        let gc_heap = 0;
        let gc_pause = 0;
        if (gc_count > 1) {
            gc_heap = gc_events.map(({ diff }) => diff.usedHeapSize).reduce((a, b) => a - b);
            gc_pause = gc_events.map(evt => evt.pauseMS).reduce((a, b) => a + b);
        } else if (gc_count > 0) {
            gc_heap = gc_events[0].diff.usedHeapSize;
            gc_pause = gc_events[0].pauseMS;
        }

        return [ label, `${toMB(heapUsed)}`, duration, String(gc_count), `${toMB(gc_heap)}`, String(gc_pause) ];
    });

    console.log(table([ headings, ...report ], { align: columnAlignment }))
});

run(filePaths);
