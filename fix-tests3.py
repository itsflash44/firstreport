import glob

old_snippet = """    await page.goto('/home?lang=en-IN&demo=true');
    await page.locator('button:has-text("Start")').first().click();"""

old_snippet_2 = """    await page1.goto('/home?lang=en-IN&demo=true');
    await page1.locator('button:has-text("Start")').first().click();"""

new_snippet = """    const { startNewCase } = require('./helpers');
    await startNewCase(page);"""

new_snippet_2 = """    const { startNewCase } = require('./helpers');
    await startNewCase(page1);"""

for file_path in glob.glob('tests/e2e/*.spec.ts'):
    if file_path == 'tests/e2e/case-creation.spec.ts':
        continue
    if file_path == 'tests/e2e/helpers.ts':
        continue
        
    with open(file_path, 'r') as f:
        content = f.read()
    
    content = content.replace(old_snippet, new_snippet)
    content = content.replace(old_snippet_2, new_snippet_2)
    
    with open(file_path, 'w') as f:
        f.write(content)
        
    print(f"Fixed {file_path}")
