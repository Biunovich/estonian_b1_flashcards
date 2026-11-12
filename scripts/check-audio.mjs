import { readFile, readdir } from 'node:fs/promises';
import assert from 'node:assert/strict';

const root = new URL('../', import.meta.url);
const words = JSON.parse(await readFile(new URL('src/data/words_combined.json', root)));
const manifest = JSON.parse(await readFile(new URL('public/audio/manifest.json', root)));
assert.deepEqual(Object.keys(manifest.entries).sort(), Object.keys(words).sort(), 'Audio manifest must cover the dictionary exactly');
const filenames = new Set();
let bytes = 0;
let seconds = 0;
for (const [word, details] of Object.entries(words)) {
  const entry = manifest.entries[word];
  const forms = [word.replace(/\s+[A-Z]\s*$/, ''), details.secondForm, details.thirdForm].filter(Boolean);
  assert.deepEqual(entry.forms, forms, `Incorrect forms: ${word}`);
  assert.equal(entry.text, `${forms.join('. ')}.`, `Incorrect spoken text: ${word}`);
  assert.match(entry.file, /^[a-f0-9]{24}\.mp3$/);
  assert(!filenames.has(entry.file), `Duplicate recording: ${word}`);
  let data;
  try {
    data = await readFile(new URL(`public/audio/${entry.file}`, root));
  } catch (error) {
    if (error.code === 'ENOENT' && process.argv.includes('--partial')) continue;
    throw new Error(`Missing recording for ${word}: ${entry.file}`, { cause: error });
  }
  filenames.add(entry.file);
  bytes += data.length;
  let offset = 0;
  if (data.subarray(0, 3).toString() === 'ID3') {
    offset = 10 + ((data[6] & 127) << 21) + ((data[7] & 127) << 14) + ((data[8] & 127) << 7) + (data[9] & 127);
  }
  let frames = 0;
  while (offset < data.length) {
    const header = data.readUInt32BE(offset);
    assert.equal(header >>> 21, 0x7ff, `Invalid MP3 frame: ${word}`);
    assert.equal((header >>> 19) & 3, 2, `Expected MPEG-2: ${word}`);
    assert.equal((header >>> 17) & 3, 1, `Expected Layer III: ${word}`);
    assert.equal((header >>> 12) & 15, 8, `Expected 64 kbps: ${word}`);
    assert.equal((header >>> 10) & 3, 0, `Expected 22050 Hz: ${word}`);
    assert.equal((header >>> 6) & 3, 3, `Expected mono: ${word}`);
    offset += Math.floor(72000 * 64 / 22050) + ((header >>> 9) & 1);
    frames++;
  }
  assert.equal(offset, data.length, `Truncated recording: ${word}`);
  assert(frames > 1, `Empty recording: ${word}`);
  seconds += frames * 576 / 22050;
}
const files = (await readdir(new URL('public/audio/', root))).filter((name) => name.endsWith('.mp3'));
if (!process.argv.includes('--partial')) {
  assert.equal(files.length, filenames.size, 'Unexpected MP3 files in audio folder');
}
console.log(`Verified ${filenames.size}/${Object.keys(words).length} recordings, ${(bytes / 1e6).toFixed(2)} MB, ${(seconds / 3600).toFixed(2)} hours of audio.`);
