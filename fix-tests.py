import glob

# The old snippet that needs replacing
old_snippet = """    await page.goto('/?demo=true');
    await page.locator('text=Start New Case').or(page.locator('text=नया केस शुरू करें')).click();
    await page.locator('text=Theft & Property').or(page.locator('text=चोरी और संपत्ति')).click();"""

old_snippet_2 = """    await page1.goto('/?demo=true');
    await page1.locator('text=Start New Case').or(page1.locator('text=नया केस शुरू करें')).click();
    await page1.locator('text=Theft & Property').or(page1.locator('text=चोरी और संपत्ति')).click();"""

# The new snippet
new_snippet = """    await page.goto('/home?lang=en-IN&demo=true');
    await page.locator('button:has-text("Standard")').first().click();
    await page.locator('button:has-text("Routine")').first().click();
    await page.locator('button', { hasText: 'Start' }).first().click();"""

new_snippet_2 = """    await page1.goto('/home?lang=en-IN&demo=true');
    await page1.locator('button:has-text("Standard")').first().click();
    await page1.locator('button:has-text("Routine")').first().click();
    await page1.locator('button', { hasText: 'Start' }).first().click();"""

for file_path in glob.glob('tests/e2e/*.spec.ts'):
    if file_path == 'tests/e2e/case-creation.spec.ts':
        continue # Already fixed
        
    with open(file_path, 'r') as f:
        content = f.read()
    
    content = content.replace(old_snippet, new_snippet)
    content = content.replace(old_snippet_2, new_snippet_2)
    
    with open(file_path, 'w') as f:
        f.write(content)
        
    print(f"Fixed {file_path}")
