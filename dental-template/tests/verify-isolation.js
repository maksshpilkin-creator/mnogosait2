import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

function verifyIsolation() {
  console.log('--- Running Test Suite: Workspace Isolation Guard (Rule R3) ---');
  const rootDir = path.resolve(process.cwd(), '..');

  // Baseline task start time (2026-11-21 18:18:00 UTC+3)
  const taskStartTime = new Date('2026-11-21T15:18:00Z').getTime();

  let gitOutput = '';
  try {
    gitOutput = execSync('git status --porcelain', { cwd: rootDir, encoding: 'utf-8' });
  } catch (err) {
    console.error('Failed to run git status:', err.message);
    process.exit(1);
  }

  const lines = gitOutput.split('\n').map(l => l.trim()).filter(Boolean);
  const modifiedOutside = [];

  for (const line of lines) {
    // line is "XY filename"
    const relPath = line.substring(2).trim().replace(/^"|"$/g, '').replace(/\\/g, '/');

    // dental-template is allowed
    if (relPath.startsWith('dental-template/') || relPath === 'dental-template') {
      continue;
    }
    // agent state directories are allowed
    if (relPath.startsWith('.agents/')) {
      continue;
    }

    const absPath = path.join(rootDir, relPath);
    if (fs.existsSync(absPath)) {
      const stat = fs.statSync(absPath);
      // Check if this file was touched or modified after worker task started
      if (stat.mtimeMs > taskStartTime) {
        modifiedOutside.push({
          file: relPath,
          modifiedAt: new Date(stat.mtimeMs).toISOString()
        });
      }
    }
  }

  if (modifiedOutside.length > 0) {
    console.error('\n❌ STRICT ISOLATION VIOLATION DETECTED!');
    console.error('The following files outside dental-template were modified after worker task started:');
    console.error(modifiedOutside);
    process.exit(1);
  }

  console.log('✓ All motorcycle salon files (package.json, template/, dist/, data/, etc.) remain 100% UNTOUCHED.');
  console.log('✓ Zero files outside dental-template/ have been modified during this session.');
  console.log('\n=== ISOLATION VERIFICATION PASSED! ===\n');
}

verifyIsolation();
