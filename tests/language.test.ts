import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeLanguage,readingDirection,forwardArrow,forwardChevron,languageUrl} from '../data/language.ts';
import {languageCodes} from '../data/ui.ts';

test('solo admite los siete idiomas previstos',()=>{
  for(const language of languageCodes)assert.equal(normalizeLanguage(language),language);
  for(const value of [undefined,null,'xx','AR','<script>', ['ar']])assert.equal(normalizeLanguage(value),'es');
});
test('el árabe invierte la lectura y las flechas, los demás idiomas no',()=>{
  for(const language of languageCodes){
    assert.equal(readingDirection(language),language==='ar'?'rtl':'ltr');
    assert.equal(forwardArrow(language),language==='ar'?'←':'→');
    assert.equal(forwardChevron(language),language==='ar'?'‹':'›');
  }
});
test('el idioma se conserva en el enlace sin perder pantalla ni parámetros',()=>{
  const changed=languageUrl('https://example.test/?source=qr#card-orgaz','ar');
  assert.equal(changed,'/?source=qr&lang=ar#card-orgaz');
  const reloaded=new URL(changed,'https://example.test');
  assert.equal(normalizeLanguage(reloaded.searchParams.get('lang')),'ar');
  assert.equal(languageUrl(reloaded.href,'es'),'/?source=qr&lang=es#card-orgaz');
});
