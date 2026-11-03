import {test,expect} from '@playwright/test';
import {makeTwoPartGLB} from '../tests/fixtures/two-part-glb.mjs';

test('imports actual two-part GLB and selects a component in the 3D stage',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/');
 await expect(page.locator('#heading')).not.toHaveText('No scenes',{timeout:30000});
 const glb=makeTwoPartGLB();
 await page.locator('#modelFile').setInputFiles({name:'two-part.glb',mimeType:'model/gltf-binary',buffer:Buffer.from(glb)});
 await expect(page.locator('#modelInfo')).toContainText('two-part.glb',{timeout:30000});
 await expect(page.locator('#modelInfo')).toContainText('nodes');
 await expect(page.locator('#modelLabels .model-annotation').first()).toBeVisible({timeout:10000});
 const first=page.locator('#modelLabels .model-annotation').first();
 await first.click();
 await expect(page.locator('#modelInfo')).toContainText('Selected component:');
 await page.locator('#show').click();
 await expect(page.locator('#present')).toHaveAttribute('open','');
 await expect(page.locator('#presentCanvas')).toBeVisible();
 await page.locator('#close').click();
 await page.locator('#modelClear').click();
 await expect(page.locator('#modelInfo')).toContainText('Model removed');
 expect(errors).toEqual([]);
});
