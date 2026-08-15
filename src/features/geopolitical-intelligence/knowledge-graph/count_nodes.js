const fs = require('fs');
const code = fs.readFileSync('c:/Users/Abbas/Smart-Supply-Chain-Analyst/src/features/geopolitical-intelligence/knowledge-graph/tradeGraph.ts', 'utf8');
const counts = {};
const regex = /type:\s*["']([^"']+)["']/g;
let match;
while ((match = regex.exec(code)) !== null) {
  const type = match[1];
  counts[type] = (counts[type] || 0) + 1;
}
console.log('Total nodes:', Object.values(counts).reduce((a,b)=>a+b, 0));
console.log(counts);
