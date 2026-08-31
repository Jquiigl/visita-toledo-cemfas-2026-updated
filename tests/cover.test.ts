import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {coverCopy,guideUrl,coverUrl,adminLoginUrl,legacyGuideUrl} from '../data/cover.ts';
import {languageCodes} from '../data/ui.ts';

test('la portada tiene dos accesos y textos completos en los siete idiomas',()=>{
  assert.deepEqual(Object.keys(coverCopy),[...languageCodes]);
  for(const language of languageCodes){
    assert.ok(Object.values(coverCopy[language]).every(value=>value.trim().length>0));
    assert.equal(guideUrl(language),`/guia?lang=${language}#home`);
    assert.equal(coverUrl(language),`/?lang=${language}`);
  }
  assert.equal(adminLoginUrl,'/admin/login');
});
test('los enlaces antiguos de la visita conservan idioma y pantalla',()=>{
  for(const hash of ['#home','#program','#map','#visit','#useful','#menu','#registration','#card-orgaz']){
    assert.equal(legacyGuideUrl(hash,'?lang=ar'),`/guia?lang=ar${hash}`);
  }
  for(const hash of ['','#admin','#/admin','#https://example.test','#<script>'])assert.equal(legacyGuideUrl(hash,''),null);
});
test('la portada no maneja credenciales ni desbloquea la administración',()=>{
  const source=readFileSync(new URL('../app/cover.tsx',import.meta.url),'utf8');
  assert.match(source,/href=\{adminLoginUrl\}/);
  assert.match(source,/href=\{guideUrl\(language\)\}/);
  assert.doesNotMatch(source,/localStorage|sessionStorage|fetch\(|type="password"/);
});
test('la valoración sigue inmediatamente después de la inscripción',()=>{
  const source=readFileSync(new URL('../app/public-guide.tsx',import.meta.url),'utf8');
  assert.match(source,/navigate\('registration'\)\}>\{text.registration\}[\s\S]*?<\/button>\s*<section className="evaluation-callout"/);
});
