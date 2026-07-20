import { config } from 'dotenv';
config({ path: '.env.local' });
import { POST } from './src/app/api/intelligence/ask/route';

async function runTest(question: string) {
  console.log(`\n\n=== Question: ${question} ===`);
  const req = new Request('http://localhost/api/intelligence/ask', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  });
  
  try {
    const res = await POST(req as any);
    const data = await res.json();
    console.log('--- RESPONSE ---');
    console.log(JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

async function main() {
  await runTest("How did LPG and petrol prices react to past Hormuz disruptions?");
  await runTest("What happened during the 2026 Hormuz naval blockade and how did it affect India?");
  await runTest("Did the 2019 Aramco attack cause LPG shortages in India?");
  await runTest("What is the capital of France?");
}

main().catch(console.error);
