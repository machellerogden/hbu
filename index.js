#!/usr/bin/env node
'use strict';

const path = require('path');
const glob = require('glob');
const rc = require('rc');
const table = require('markdown-table')
const { fork } = require('child_process');

const config = rc('hbu', {
    times: 10,
    'gc-stats': false
});

const testPattern = config._[0];
if (!testPattern) throw new Error('No test pattern specified.');

const testArgs = config['--'];

const times = config.times;
const useGC = config['gc-stats'];

const filePaths = glob.sync(testPattern, { nodir: true });

let headings = [ 'Test Label', 'Heap Used (MB)', 'Duration (MS)' ];
let columnAlignment = [ null, 'right', 'right' ];

if (useGC) {
    headings = [ ...headings, "GC Collected Heap (MB)", 'GC Pause Duration (MS)', 'GC Events (major)', 'GC Events (minor)' ];
    columnAlignment = [ ...columnAlignment, 'right', 'right', 'right', 'right' ];
}

const runnerPath = path.join(__dirname, './runner');

const processSpawn = (filePath, label) => {
    const testPath = path.join(process.cwd(), filePath);
    const { dir:cwd } = path.parse(testPath);
    const env = {
        ...process.env,
        HBU_LABEL: label,
        HBU_TIMES: Number(times)
    };
    if (useGC) {
        env.HBU_GC_STATS = true;
    }
    return fork(testPath, testArgs, {
        env,
        cwd,
        execArgv: [
            '-r', path.join(__dirname, 'instrument.js'),
            '--expose-gc'
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

// TODO: unused right now ... should make an option
const runAllSeq = filePaths => {
    const [ head, ...rest ] = filePaths;
    return filePaths.reduce((acc, fp) =>
        acc.then(([ results, p ]) => p.then(result =>
            [ [ ...results, result ], runOne(fp) ]
        )),
        Promise.resolve([ [], runOne(head) ]))
        .then(([results]) => results);
};

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

        if (useGC) {
            gc_events = gc_events.filter(evt => [ 1, 2, 15 ].includes(evt.gctype));
            const gc_length = gc_events.length;
            const [ gc_major_count, gc_minor_count ] = gc_events.reduce(([ major, minor ], evt) => {
                if (evt.gctype === 1) {
                    minor += 1;
                } else {
                    major += 1;
                }
                return [ major, minor ];
            }, [ 0, 0 ]);

            let gc_heap = 0;
            let gc_pause = 0;
            if (gc_length > 1) {
                gc_heap = gc_events
                    .map(({ diff }) => diff.usedHeapSize)
                    .reduce((a, b) => a - b);
                gc_pause = gc_events.map(evt => evt.pause).reduce((a, b) => a + b) / 1200000;
            } else if (gc_length > 0) {
                gc_heap = gc_events[0].diff.usedHeapSize;
                gc_pause = gc_events[0].pause / 1200000;
            }

            return [ label, toMB(heapUsed).toFixed(2), duration.toFixed(5), toMB(gc_heap).toFixed(2), gc_pause.toFixed(5), gc_major_count, gc_minor_count ];
        }

        return [ label, `${toMB(heapUsed)}`, duration ];
    });

    console.log(table([ headings, ...report ], { align: columnAlignment }))
});

run(filePaths);
