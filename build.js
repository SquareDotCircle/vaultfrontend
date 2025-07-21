#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Path to the supabase config file
const configPath = path.join(__dirname, 'public', 'supabase-config.js');

// Read the current config file
let configContent = fs.readFileSync(configPath, 'utf8');

// Replace the placeholder with the actual environment variable
const supabasePublicKey = process.env.SUPABASE_PUBLIC_KEY;

console.log('🔧 Build script environment check:');
console.log('📋 Available environment variables:');
Object.keys(process.env).filter(key => key.includes('SUPABASE')).forEach(key => {
    console.log(`   ${key}: ${process.env[key] ? process.env[key].substring(0, 20) + '...' : 'NOT SET'}`);
});

if (supabasePublicKey) {
    configContent = configContent.replace('{{SUPABASE_PUBLIC_KEY}}', supabasePublicKey);
    console.log('✅ Injected SUPABASE_PUBLIC_KEY into config');
    console.log('🔑 Key preview:', supabasePublicKey.substring(0, 20) + '...');
} else {
    console.warn('⚠️  SUPABASE_PUBLIC_KEY environment variable not found');
    console.warn('⚠️  Config will contain placeholder value');
}

// Write the updated config back
fs.writeFileSync(configPath, configContent);

console.log('✅ Build script completed'); 