const fs = require('fs');
const net = require('net');
const path = require('path');
const { spawn } = require('child_process');

const root = path.resolve(__dirname, '..');
const envPath = path.join(root, '.env.local');
const mongoConfig = path.join(root, 'mongod-service.cfg');
const mongoExecutable = 'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe';
const port = 27017;

function usesLocalMongo() {
  if (!fs.existsSync(envPath)) return false;

  const env = fs.readFileSync(envPath, 'utf8');
  const match = env.match(/^MONGODB_URI=(.+)$/m);
  if (!match) return false;

  const uri = match[1].trim().replace(/^['"]|['"]$/g, '');
  return /^mongodb:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(uri);
}

function isMongoAvailable() {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port });
    const finish = (available) => {
      socket.destroy();
      resolve(available);
    };

    socket.setTimeout(500);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function waitForMongo() {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (await isMongoAvailable()) return true;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return false;
}

async function main() {
  if (!usesLocalMongo() || await isMongoAvailable()) return;

  if (!fs.existsSync(mongoExecutable)) {
    throw new Error(`MongoDB was not found at ${mongoExecutable}`);
  }

  console.log('Starting local MongoDB for the CRM...');
  const child = spawn(mongoExecutable, ['--config', mongoConfig], {
    detached: true,
    stdio: 'ignore',
    windowsHide: true,
  });
  child.unref();

  if (!await waitForMongo()) {
    throw new Error('Local MongoDB did not start. See .mongodb/log/mongod.log for details.');
  }

  console.log('Local MongoDB is ready on localhost:27017.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
