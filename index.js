#!/usr/bin/env node
'use strict';

const path = require('path');
const glob = require('glob');
const rc = require('rc');
const table = require('markdown-table')
const { spawnSync:spawn } = require('child_process');
const { readdirSync:readdir } = require('fs');

const config = rc('hbu', {
    times: 10
});

const testPattern = config._[0];
if (!testPattern) throw new Error('No test pattern specified.');

const times = config.times;

const filePaths = glob.sync(testPattern);

const headings = [ 'Label', 'Heap Used', 'Elapsed Time' ];

const columnAlignment = [ null, '.', '.' ];

const runnerPath = path.join(__dirname, './runner');

const processSpawn = filePath => {
    const fullPath = path.join(__dirname, filePath);
    const label = path.parse(filePath).name;
    const args = [ '-r', runnerPath, fullPath ];
    const env = {
        ...process.env,
        HBU_LABEL: label,
        HBU_TIMES: Number(times)
    };
    return spawn('node', args, { env });
};

const runOne = filePath => {
    const p = processSpawn(filePath);
    const err = p.error || p.stderr.toString();
    if (err) {
        console.error('Error in test run:');
        console.error(err);
        process.exit(1);
    }
    return JSON.parse(p.stdout.toString());
};

const runAll = filePaths => filePaths.map(runOne);

const run = () => console.log(
    table([ headings, ...runAll(filePaths) ],
    { align: columnAlignment }));

run();
