'use strict';

global.hbu_injected = true;

const { start, end } = module.require('./core');

process.on('exit', () => end());

start();
