import glob

old_snippet = """    await page.goto('/home?lang=en-IN&demo=true');
    await page.locator('button:has-text("Standard")').first().click();
    await page.locator('button:has-text("Routine")').first().click();
    await page.locator('button', { hasText: 'Start' }).first().click();"""

old_snippet_2 = """    await page1.goto('/home?lang=en-IN&demo=true');
    await page1.locator('button:has-text("Standard")').first().click();
    await page1.locator('button:has-text("Routine")').first().click();
    await page1.locator('button', { hasText: 'Start' }).first().click();"""

new_snippet = """    await page.goto('/home?lang=en-IN&demo=true');
    await page.locator('button:has-text("Start")').first().click();"""

new_snippet_2 = """    await page1.goto('/home?lang=en-IN&demo=true');
    await page1.locator('button:has-text("Start")').first().click();"""

for file_path in glob.glob('tests/e2e/*.spec.ts'):
    with open(file_path, 'r') as f:
        content = f.read()
    
    content = content.replace(old_snippet, new_snippet)
    content = content.replace(old_snippet_2, new_snippet_2)
    
    with open(file_path, 'w') as f:
        f.write(content)
        
    print(f"Fixed {file_path}")
