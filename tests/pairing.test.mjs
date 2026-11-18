import assert from 'node:assert/strict'
import {test} from 'node:test'

import {parseNames} from '../src/pairing.ts'

test('parses pasted names, dropping blank lines but keeping duplicates', () => {
  assert.deepEqual(parseNames(' Alex \r\n\r\nAlex\n Sam Lee \n'), ['Alex', 'Alex', 'Sam Lee'])
})
