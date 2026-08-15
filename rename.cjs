const fs = require('fs');

const filesToUpdate = [
  'src/features/geopolitical-intelligence/types/index.ts',
  'src/features/geopolitical-intelligence/services/reportAssembler.ts',
  'src/features/geopolitical-intelligence/services/ragService.ts',
  'src/features/geopolitical-intelligence/schemas/intelligence.schema.ts',
  'src/features/geopolitical-intelligence/schemas/module-schemas.ts',
  'src/features/geopolitical-intelligence/prompts/module-prompts.ts',
  'src/features/geopolitical-intelligence/types/module-outputs.ts',
  'src/services/llm/normalization-profiles.ts',
  'src/features/geopolitical-intelligence/components/IntelligenceDashboard/intelligence-dashboard.tsx',
  'src/features/geopolitical-intelligence/components/WhyIndiaShouldCare/why-india-should-care.tsx'
];

for (const f of filesToUpdate) {
  try {
    let content = fs.readFileSync(f, 'utf-8');
    content = content.replace(/why_india_should_care/g, 'strategic_implications');
    content = content.replace(/whyIndiaShouldCare/g, 'strategicImplications');
    content = content.replace(/WhyIndiaShouldCare/g, 'StrategicImplications');
    content = content.replace(/why-india-should-care/g, 'strategic-implications');
    fs.writeFileSync(f, content);
  } catch (e) {
    console.log("Could not process " + f);
  }
}

try {
  fs.renameSync('src/features/geopolitical-intelligence/components/WhyIndiaShouldCare/why-india-should-care.tsx', 'src/features/geopolitical-intelligence/components/WhyIndiaShouldCare/strategic-implications.tsx');
  fs.renameSync('src/features/geopolitical-intelligence/components/WhyIndiaShouldCare', 'src/features/geopolitical-intelligence/components/StrategicImplications');
} catch (e) {
  console.log("Could not rename file/dir", e);
}
console.log('done');
