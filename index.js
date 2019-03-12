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

const filePaths = glob.sync(testPattern);

const headings = [ 'Test Label', 'Heap Used (MB)', 'Duration (MS)', 'GC Events', "GC'd Heap (MB)", 'GC Pause Duration (MS)' ];

const columnAlignment = [ null, '.', '.', '.', null, null ];

const runnerPath = path.join(__dirname, './runner');

const processSpawn = filePath => {
    const testPath = path.join(process.cwd(), filePath);
    const { dir:cwd, name:label } = path.parse(testPath);
    const env = {
        ...process.env,
        HBU_LABEL: label,
        HBU_TIMES: Number(times)
    };
    return fork(testPath, testArgs, {
        env,
        cwd,
        execArgv: [ '-r', path.join(__dirname, 'instrument.js') ]
    });
};

const runOne = filePath => {
    return new Promise((resolve, reject) => {
        const p = processSpawn(filePath);
        p.on('message', msg => {
            if (msg.done && msg.data) return resolve(msg.data);
        });
    });
};

const runAll = filePaths => Promise.all(filePaths.map(runOne));

const run = (paths) => runAll(paths).then(results =>
    console.log(table([ headings, ...results ], { align: columnAlignment })));

run(filePaths);
