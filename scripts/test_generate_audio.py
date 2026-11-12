"""Regression checks for safe regeneration, using temporary files and fake TTS."""
import contextlib
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('generate_audio', pathlib.Path(__file__).with_name('generate-audio.py'))
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)


class RegenerationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        (self.root / 'src/data').mkdir(parents=True)
        (self.root / 'src/data/words_combined.json').write_text(json.dumps({
            'ahi S': {'secondForm': 'ahju', 'thirdForm': 'ahju'}
        }))
        self.output = self.root / 'public/audio'
        self.output.mkdir(parents=True)
        self.stale = self.output / ('a' * 24 + '.mp3')
        self.stale.write_bytes(b'old recording')
        self.manifest = self.output / 'manifest.json'
        self.manifest.write_text('{"previous": true}')
        (self.output / 'README.md').write_text('Keep me')

    def run_generator(self, synth, workers=1):
        with patch.object(generator, 'ROOT', self.root), patch.object(generator, 'OUTPUT', self.output), \
                patch.object(generator, 'generate', synth), patch.object(generator.time, 'sleep'), \
                patch('sys.argv', ['generate-audio.py', '--workers', str(workers)]), contextlib.redirect_stdout(io.StringIO()):
            generator.main()

    def test_success_prunes_obsolete_audio_and_resumes_existing_files(self):
        from unittest.mock import Mock
        synth = Mock(return_value=b'new audio' * 200)
        self.run_generator(synth)
        synth.assert_called_once_with('ahi. ahju. ahju.')
        self.assertFalse(self.stale.exists())
        manifest = json.loads(self.manifest.read_text())
        recording = self.output / manifest['entries']['ahi S']['file']
        self.assertTrue(recording.exists())
        self.assertTrue((self.output / 'README.md').exists())
        synth.reset_mock()
        self.run_generator(synth)
        synth.assert_not_called()
        self.assertTrue(recording.exists())

    def test_failure_preserves_previous_manifest_and_obsolete_recordings(self):
        from unittest.mock import Mock
        with self.assertRaises(RuntimeError):
            self.run_generator(Mock(side_effect=RuntimeError('TTS unavailable')))
        self.assertEqual(json.loads(self.manifest.read_text()), {'previous': True})
        self.assertTrue(self.stale.exists())

    def test_failure_does_not_drain_the_remaining_dictionary(self):
        from unittest.mock import Mock
        words = {f'word{i} S': {} for i in range(20)}
        (self.root / 'src/data/words_combined.json').write_text(json.dumps(words))
        for workers in (1, 2, 3):
            with self.subTest(workers=workers):
                synth = Mock(side_effect=RuntimeError('TTS unavailable'))
                with self.assertRaises(RuntimeError):
                    self.run_generator(synth, workers=workers)
                self.assertLessEqual(synth.call_count, workers * 3)
                self.assertEqual(json.loads(self.manifest.read_text()), {'previous': True})
                self.assertTrue(self.stale.exists())

    def test_parallel_success_processes_the_whole_dictionary(self):
        from unittest.mock import Mock
        words = {f'word{i} S': {} for i in range(20)}
        (self.root / 'src/data/words_combined.json').write_text(json.dumps(words))
        synth = Mock(return_value=b'new audio' * 200)
        self.run_generator(synth, workers=3)
        self.assertEqual(synth.call_count, 20)
        self.assertEqual(len(list(self.output.glob('*.mp3'))), 20)
        self.assertEqual(len(json.loads(self.manifest.read_text())['entries']), 20)


if __name__ == '__main__':
    unittest.main()
