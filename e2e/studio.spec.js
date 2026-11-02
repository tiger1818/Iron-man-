import {test,expect} from '@playwright/test';
test('loads spatial studio, compiles grounded content and presents',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#heading')).not.toHaveText('No scenes',{timeout:30000});
 await page.locator('#topic').fill('Financial performance');
 await page.locator('#source').fill('Year,Revenue\n2024,100\n2025,150\n2026,175');
 page.on('dialog',dialog=>dialog.accept());
 await page.locator('#generate').click();
 await expect(page.locator('#dataPanel table tbody tr')).toHaveCount(3);
 await expect(page.locator('#heading')).toContainText('Year');
 await page.locator('#show').click();
 await expect(page.locator('#present')).toHaveAttribute('open','');
 await page.locator('#close').click();
 await expect(page.locator('#present')).not.toHaveAttribute('open','');
 expect(errors).toEqual([]);
});
test('keyboard navigation and editor stay usable',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#gl')).toBeVisible({timeout:30000});
 await page.locator('#add').click();
 await page.locator('#sceneTitle').fill('Second scene');
 await page.locator('#sceneTitle').blur();
 await expect(page.locator('#heading')).toHaveText('Second scene');
 await page.locator('#prev').click();
 await expect(page.locator('#heading')).not.toHaveText('Second scene');
});
