import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixMemberstackFile(filePath) {
    console.log(`Fixing ${filePath}...`);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ File not found: ${filePath}`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');

    console.log(`Original file size: ${content.length} characters`);
    console.log(`Last 50 chars: "${content.slice(-50)}"`);

    // Remove any trailing % or weird characters
    content = content.replace(/[%\x00-\x08\x0B\x0C\x0E-\x1F\x7F]+$/g, '');

    // Trim whitespace
    content = content.trim();

    // Add proper semicolon ending if missing
    if (!content.endsWith(';') && !content.endsWith('}')) {
        content += ';';
    }

    // Add proper newline ending
    content += '\n';

    console.log(`Fixed file size: ${content.length} characters`);
    console.log(`Last 50 chars after fix: "${content.slice(-50)}"`);

    // Write back the fixed content
    fs.writeFileSync(filePath, content, 'utf8');

    console.log(`✅ Fixed ${filePath}`);

    // Verify the fix
    try {
        execSync(`node -c "${filePath}"`, { stdio: 'pipe' });
        console.log(`✅ ${filePath} syntax is valid`);
    } catch (error) {
        console.log(`❌ ${filePath} still has syntax errors:`, error.message);
        // Try to show more details
        try {
            execSync(`node -c "${filePath}"`, { stdio: 'inherit' });
        } catch (detailError) {
            // Error will be shown above
        }
    }
}

// Fix both files - adjust paths based on your actual structure
const projectRoot = path.resolve(__dirname, '..');
fixMemberstackFile(path.join(projectRoot, 'src/vendor/memberstack/memberstack-v1.js'));
fixMemberstackFile(path.join(projectRoot, 'src/vendor/memberstack/memberstack-v2.js'));