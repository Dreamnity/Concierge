const {workerData,parentPort} = require('worker_threads');
if(!workerData) throw new Error('Invalid worker data!');
const {port} = workerData
console.log('Summoning port '+port);
