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

const times = config.times;

const filePaths = glob.sync(testPattern);

const headings = [ 'Label', 'Heap Used', 'Elapsed Time' ];

const columnAlignment = [ null, '.', '.' ];

const runnerPath = path.join(__dirname, './runner');

const processSpawn = filePath => {
    const testPath = path.join(process.cwd(), filePath);
    const { dir, name } = path.parse(testPath);
    const env = {
        ...process.env,
        HBU_LABEL: name,
        HBU_TIMES: Number(times),
        HBU_TEST_PATH: testPath
    };
    return fork(path.join(__dirname, 'runner.js'), [], { env, cwd: dir });
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
    console.log(
        table([ headings, ...results ],
        { align: columnAlignment })));

run(filePaths);
