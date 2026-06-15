import { spawn } from 'node:child_process';

const processes = [
    spawn('npm', ['run', 'start:dev', '--workspace', 'backend'], {
        stdio: 'inherit',
        shell: true,
    }),
    spawn('npm', ['run', 'dev', '--workspace', 'frontend'], {
        stdio: 'inherit',
        shell: true,
    }),
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
