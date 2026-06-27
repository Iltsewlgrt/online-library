import { spawn, spawnSync } from 'node:child_process';

function runNpm(commandArgs, options = {}) {
    if (process.platform === 'win32') {
        return ['cmd.exe', ['/d', '/s', '/c', 'npm', ...commandArgs], options];
    }

    return ['npm', commandArgs, options];
}

const [databaseCommand, databaseArgs, databaseOptions] = runNpm(['run', 'db:up', '--workspace', 'backend'], {
    stdio: 'inherit',
});

const databaseResult = spawnSync(databaseCommand, databaseArgs, databaseOptions);

if (databaseResult.status && databaseResult.status !== 0) {
    process.exit(databaseResult.status);
}

const processes = [
    (() => {
        const [command, args, options] = runNpm(['run', 'start:dev', '--workspace', 'backend'], { stdio: 'inherit' });
        return spawn(command, args, options);
    })(),
    (() => {
        const [command, args, options] = runNpm(['run', 'dev', '--workspace', 'frontend'], { stdio: 'inherit' });
        return spawn(command, args, options);
    })(),
];

for (const childProcess of processes) {
    childProcess.on('exit', (code) => {
        if (code && code !== 0) {
            for (const otherProcess of processes) {
                if (otherProcess.pid !== childProcess.pid) {
                    otherProcess.kill();
                }
            }
            process.exit(code);
        }
    });
}
