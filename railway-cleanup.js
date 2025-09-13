#!/usr/bin/env node

/**
 * Railway Cleanup Script
 * Removes package-lock.json files to prevent Node.js version conflicts
 */

const fs = require('fs');
const path = require('path');

const lockFiles = [
  'package-lock.json',
  'backend/package-lock.json',
  'frontend/package-lock.json', 
  'contracts/package-lock.json',
  'sdk/package-lock.json'
];

console.log('🧹 Railway cleanup: Removing potentially incompatible package-lock.json files...');

lockFiles.forEach(lockFile => {
  const fullPath = path.join(__dirname, lockFile);
  try {
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`   ✅ Removed: ${lockFile}`);
    } else {
      console.log(`   ⏭️  Not found: ${lockFile}`);
    }
  } catch (error) {
    console.log(`   ⚠️  Could not remove ${lockFile}: ${error.message}`);
  }
});

console.log('🎉 Cleanup complete! Railway will regenerate package-lock.json with correct Node.js version.');