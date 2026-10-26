import test from 'node:test';
import assert from 'node:assert/strict';
import {imageType} from '../../supabase/functions/admin-media/validation.js';
import {png,jpeg,progressive,webp,lossless,extended,animatedPng,animatedWebp} from './fixtures/images.js';

test('static camera and web image formats retain their MIME type after container validation',()=>{
 for(const [bytes,mime,ext] of [[png,'image/png','png'],[jpeg,'image/jpeg','jpg'],[progressive,'image/jpeg','jpg'],[webp,'image/webp','webp'],[lossless,'image/webp','webp'],[extended,'image/webp','webp']]) assert.deepEqual(imageType(bytes),[mime,ext]);
});
test('a signature alone, truncated container, HTML payload or animation is not a photo',()=>{
 for(const bytes of [new Uint8Array([255,216,255]),png.slice(0,8),new TextEncoder().encode('RIFF0000WEBP<script>'),png.slice(0,-1),jpeg.slice(0,-2),webp.slice(0,-1),animatedPng,animatedWebp]) assert.equal(imageType(bytes),null);
});
test('image dimensions and pixel budgets apply before any full image decoding',()=>{
 for(const [w,h] of [[0,1],[1,0],[12001,1],[7000,6000],[0xffffffff,0xffffffff]]){
  const bytes=png.slice(),view=new DataView(bytes.buffer);view.setUint32(16,w);view.setUint32(20,h);assert.equal(imageType(bytes),null);
 }
 const jpg=jpeg.slice();for(let i=2;i<jpg.length-8;i++)if(jpg[i]===255&&[192,193,194].includes(jpg[i+1])){jpg[i+5]=255;jpg[i+6]=255;break;}assert.equal(imageType(jpg),null);
});
test('malformed PNG and WebP chunk lengths fail without reading beyond the request buffer',()=>{
 const p=png.slice();new DataView(p.buffer).setUint32(8,0xffffffff);assert.equal(imageType(p),null);
 const w=webp.slice();new DataView(w.buffer).setUint32(16,0xffffffff,true);assert.equal(imageType(w),null);
});
