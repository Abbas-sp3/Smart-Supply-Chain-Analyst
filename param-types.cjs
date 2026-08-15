const fs = require('fs');

let content = fs.readFileSync('src/features/geopolitical-intelligence/types/index.ts', 'utf-8');

// Update import if needed
if (!content.includes('CountryProfile')) {
  content = 'import type { CountryProfile } from "@/data/countries/types";\n' + content;
}

// Update fetch signature
content = content.replace(/fetch\(\): Promise<DataSourceOutput\[\]>;/, 
  `fetch(country: CountryProfile): Promise<DataSourceOutput[]>;`);

fs.writeFileSync('src/features/geopolitical-intelligence/types/index.ts', content);
console.log('types updated');
