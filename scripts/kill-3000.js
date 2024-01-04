const net = require('net');
const { exec } = require('child_process');

killProcessOnPort(3000);

function killProcessOnPort(port) {
    const server = net.createServer();

    server.listen(port, '127.0.0.1');
    server.on('error', err => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is in use, trying to kill the process...`);
            exec(`lsof -i tcp:${port} | awk 'NR!=1 {print $2}' | xargs kill`, (err, stdout, stderr) => {
                if (err) {
                    return console.error('Error killing process: ', err);
                }
                console.log(`Process on port ${port} has been killed`);
            });
        }
    });

    server.on('listening', () => {
        console.log(`Port ${port} is free, no action needed`);
        server.close();
    });
}