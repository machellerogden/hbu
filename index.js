'use strict';

const core = require('./lib/core');

exports.times = process.env.HBU_TIMES;

exports.end = () => {
    if (global.hbu_injected) return;
    core.end();
};

exports.start = () => {
    if (global.hbu_injected) return;
    core.start();
};

