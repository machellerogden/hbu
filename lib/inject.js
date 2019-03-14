process.on('exit', () => {
    process.send({
        type: 'done'
    });
});
