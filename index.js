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
            '-r', path.join(__dirname, 'instrument.js')
        ]
    });
};

// other node gc options to consider making configurable:
// --log_gc (Log heap samples on garbage collection for the hp2ps tool.)
//       type: bool  default: false
// --expose_gc (expose gc extension)
//       type: bool  default: false
// --max_new_space_size (max size of the new generation (in kBytes))
//       type: int  default: 0
// --max_old_space_size (max size of the old generation (in Mbytes))
//       type: int  default: 0
// --max_executable_size (max size of executable memory (in Mbytes))
//       type: int  default: 0
// --gc_global (always perform global GCs)
//       type: bool  default: false
// --gc_interval (garbage collect after <n> allocations)
//       type: int  default: -1
// --trace_gc (print one trace line following each garbage collection)
//       type: bool  default: false
// --trace_gc_nvp (print one detailed trace line in name=value format after each garbage collection)
//       type: bool  default: false
// --trace_gc_ignore_scavenger (do not print trace line after scavenger collection)
//       type: bool  default: false
// --print_cumulative_gc_stat (print cumulative GC statistics in name=value format on exit)
//       type: bool  default: false
// --trace_gc_verbose (print more details following each garbage collection)
//       type: bool  default: false
// --trace_fragmentation (report fragmentation for old pointer and data pages)
//       type: bool  default: false
// --trace_external_memory (print amount of external allocated memory after each time it is adjusted.)
//       type: bool  default: false
// --collect_maps (garbage collect maps from which no objects can be reached)
//       type: bool  default: true
// --flush_code (flush code that we expect not to use again before full gc)
//       type: bool  default: true
// --incremental_marking (use incremental marking)
//       type: bool  default: true
// --incremental_marking_steps (do incremental marking steps)
//       type: bool  default: true
// --trace_incremental_marking (trace progress of the incremental marking)
//       type: bool  default: false
// --track_gc_object_stats (track object counts and memory usage)
//       type: bool  default: false
// --use_idle_notification (Use idle notification to reduce memory footprint.)
//       type: bool  default: true
// --use_ic (use inline caching)
//       type: bool  default: true
// --native_code_counters (generate extra code for manipulating stats counters)
//       type: bool  default: false
// --always_compact (Perform compaction on every full GC)
//       type: bool  default: false
// --lazy_sweeping (Use lazy sweeping for old pointer and data spaces)
//       type: bool  default: true
// --never_compact (Never perform compaction on full GC - testing only)
//       type: bool  default: false
// --compact_code_space (Compact code space on full non-incremental collections)
//       type: bool  default: true
// --incremental_code_compaction (Compact code space on full incremental collections)
//       type: bool  default: true
// --cleanup_code_caches_at_gc (Flush inline caches prior to mark compact collection and flush code caches in maps during mark compact cycle.)
//       type: bool  default: true


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
