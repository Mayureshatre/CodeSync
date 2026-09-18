import os
import glob
import re

def fix_mocks():
    files = glob.glob('tests/unit/**/*.test.ts', recursive=True)
    for file in files:
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Replace vi.mock('../../apps/web/src/server/db', () => ({ ...prisma... }))
        # with vi.mock('@codesync/core', async () => { return { ...await vi.importActual('@codesync/core'), ...prisma... } })
        
        # A simple replacement that handles the object correctly:
        def replacer(match):
            db_mock_body = match.group(1)
            # Find the queue mock if it exists
            return f"vi.mock('@codesync/core', async () => ({{ ...(await vi.importActual<any>('@codesync/core')), {db_mock_body}"
            
        new_content = re.sub(r"vi\.mock\('\.\./\.\./apps/web/src/server/db',\s*\(\)\s*=>\s*\(\{\s*(.*?)\s*\}\)\);", replacer, content, flags=re.DOTALL)
        
        # Remove queue mock
        new_content = re.sub(r"vi\.mock\('\.\./\.\./apps/web/src/server/jobs/queue',\s*\(\)\s*=>\s*\(\{.*?\}\)\);\n", "", new_content, flags=re.DOTALL)
        
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)

fix_mocks()
