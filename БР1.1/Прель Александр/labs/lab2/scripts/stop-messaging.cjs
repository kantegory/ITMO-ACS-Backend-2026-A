const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = fs.realpathSync(path.resolve(__dirname, '..'));

async function main() {
  const rows = execFileSync('/bin/ps', ['-axo', 'pid=,command='], { encoding: 'utf8' }).split('\n');
  let stopped = 0;
  for (const row of rows) {
    const match = row.match(/^\s*(\d+)\s+(.+)$/);
    if (!match || !/^(?:.*\/)?node --env-file=\.env\.hw5 scripts\/start\.cjs$/.test(match[2].trim())) continue;
    const pid = Number(match[1]);
    let cwd;
    try {
      cwd = execFileSync('/usr/sbin/lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], {
        encoding: 'utf8', env: { ...process.env, LC_ALL: 'en_US.UTF-8' }, stdio: ['ignore', 'pipe', 'pipe'],
      })
        .split('\n').find(line => line.startsWith('n'))?.slice(1);
    } catch { continue; }
    if (!cwd || fs.realpathSync(cwd) !== root) continue;
    // Match both the exact launch command and checkout directory; never kill by port.
    try { process.kill(pid, 'SIGTERM'); } catch (error) { if (error.code === 'ESRCH') continue; throw error; }
    let exited = false;
    for (let attempt = 0; attempt < 120; attempt++) {
      try { process.kill(pid, 0); } catch (error) { if (error.code === 'ESRCH') { exited = true; break; } throw error; }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    if (!exited) throw new Error('Project supervisor did not stop within 12 seconds');
    stopped++;
  }
  console.log(stopped ? `Stopped ${stopped} HW5 stack(s) in this directory; broker and data preserved.` : 'No matching HW5 stack is running in this directory.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
