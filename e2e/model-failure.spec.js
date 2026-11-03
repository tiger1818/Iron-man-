import {test,expect} from '@playwright/test';

test('model import rejects invalid GLB without damaging the existing scene',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#heading')).not.toHaveText('No scenes',{timeout:30000});
 const original=await page.locator('#heading').textContent();
 await page.locator('#modelFile').setInputFiles({name:'broken.glb',mimeType:'model/gltf-binary',buffer:Buffer.from('not a glb')});
 await expect(page.locator('#status')).toContainText('GLB import failed:',{timeout:30000});
 await expect(page.locator('#heading')).toHaveText(original);
 await expect(page.locator('#modelLabels .model-annotation')).toHaveCount(0);
 expect(errors).toEqual([]);
});
test('3D model overlay has a safe empty state on mobile',async({page})=>{
 await page.setViewportSize({width:390,height:844});
 await page.goto('/');
 await expect(page.locator('#modelFile')).toBeAttached();
 await expect(page.locator('#modelLabels')).toBeAttached();
 await expect(page.locator('#modelInfo')).toContainText('import a self-contained GLB');
 await page.locator('#modelClear').click();
 await expect(page.locator('#modelInfo')).toContainText('Model removed');
});
