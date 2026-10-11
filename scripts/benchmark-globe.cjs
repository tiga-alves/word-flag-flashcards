const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const { performance } = require('node:perf_hooks');
const { createCanvas } = require('C:/Users/tiga_/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/@napi-rs/canvas');
const file = process.argv[2] || 'globe.js';
fs.mkdirSync('.cache/performance', { recursive: true });
const canvas = createCanvas(1400,900);
canvas.getBoundingClientRect = () => ({width:1400,height:900});
canvas.dataset = {};
const context = canvas.getContext('2d');
let next;
const callbacks = {};
const started = performance.now();
vm.runInNewContext(fs.readFileSync('globe-data.js','utf8') + fs.readFileSync(file,'utf8'), { atob,
 document:{hidden:false,getElementById:()=>canvas,createElement:()=>createCanvas(1,1),addEventListener(name,fn){callbacks[name]=fn;}},
 performance,
 window:{devicePixelRatio:1,matchMedia:()=>({matches:false,addEventListener(){}}),requestAnimationFrame(fn){next=fn;return 1;},cancelAnimationFrame(){},addEventListener(){}}
});
const initializationMs = performance.now()-started;
const samples=[];
for(let i=0;i<45;i++) {const start=performance.now();next(i*1000/30+0.01);samples.push(performance.now()-start);}
const active=samples.slice(5).filter(value=>value>0.1).sort((a,b)=>a-b);
console.log(JSON.stringify({file,initializationMs,frames:active.length,meanMs:active.reduce((a,b)=>a+b,0)/active.length,p50Ms:active[Math.floor(active.length*.5)],p95Ms:active[Math.floor(active.length*.95)],maxMs:active.at(-1)},null,2));
fs.writeFileSync('.cache/performance/'+path.basename(file)+'.png',canvas.toBuffer('image/png'));


