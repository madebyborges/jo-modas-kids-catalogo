import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateReview } from '../src/services/reviews';
test('Correção exige comentário e todos os status exigem identificação',()=>{assert.throws(()=>validateReview('needs_correction','   ','Revisora'));assert.throws(()=>validateReview('approved','',''));assert.doesNotThrow(()=>validateReview('needs_correction','Foto deve ser conferida.','Revisora'));assert.doesNotThrow(()=>validateReview('approved','','Revisora'));assert.doesNotThrow(()=>validateReview('pending','','Revisora'));});
