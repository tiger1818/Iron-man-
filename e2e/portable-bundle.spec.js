import {test,expect} from '@playwright/test';
import {makeTwoPartGLB} from '../tests/fixtures/two-part-glb.mjs';

test('portable model bundle exports and reimports without losing GLB',async({page})=>{
 await page.goto('/');
 await expect(page.locator('#heading')).not.toHaveText('No scenes',{timeout:30000});
 await page.locator('#modelFile').setInputFiles({name:'two-part.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(makeTwoPartGLB())});
 await expect(page.locator('#modelInfo')).toContainText('two-part.glb',{timeout:30000});
 await expect(page.locator('#status')).toContainText('Saved locally.',{timeout:30000});
 const [download]=await Promise.all([page.waitForEvent('download',{timeout:30000}),page.locator('#bundle').click()]);
 const path=await download.path();expect(path).toBeTruthy();
 await page.locator('#modelClear').click();
 await expect(page.locator('#modelInfo')).toContainText('Model removed');
 page.on('dialog',d=>d.accept());
 await page.locator('#bundleFile').setInputFiles(path);
 await expect(page.locator('#modelInfo')).toContainText('imported-model.glb',{timeout:30000});
 await expect(page.locator('#modelLabels .model-annotation').first()).toBeVisible({timeout:10000});
});
