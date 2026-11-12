#!/usr/bin/env python3
"""Generate resumable dictionary audio using Azure Neural TTS through llm-gateway."""
import argparse, concurrent.futures, hashlib, json, pathlib, re, subprocess, time, os, urllib.request, urllib.error
ROOT = pathlib.Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'public/audio'
SETTINGS = dict(provider='azure', model='neural', voice='et-EE-AnuNeural', speed=1.0,
                bitrate=64, filters='', pauses='natural; forms separated by full stops')

def generate(text):
    token_file = pathlib.Path(os.environ['LLM_GATEWAY_TOKEN_FILE'])
    endpoint = os.environ.get('LLM_GATEWAY_URL')
    if not endpoint:
        container = json.loads(subprocess.check_output(['docker', 'inspect', 'llm-gateway-caddy-1'], timeout=10))[0]
        address = container['NetworkSettings']['Networks']['llm_clients']['IPAddress']
        endpoint = f'http://{address}:8080'
    data = json.dumps(dict(provider=SETTINGS['provider'], model=SETTINGS['model'],
                           input=text, voice=SETTINGS['voice'], speed=SETTINGS['speed'],
                           response_format='wav'), ensure_ascii=False).encode()
    request = urllib.request.Request(endpoint.rstrip('/') + '/v1/audio/speech', data=data,
                                    headers={'Content-Type': 'application/json',
                                             'Authorization': 'Bearer ' + token_file.read_text().strip()})
    try:
        with urllib.request.urlopen(request, timeout=180) as response:
            wav = response.read()
    except urllib.error.HTTPError as error:
        raise RuntimeError(f'llm-gateway speech returned HTTP {error.code}') from None
    if not wav.startswith(b'RIFF'):
        raise ValueError('Gateway returned an invalid WAV response')
    # No denoising, frequency filters, tempo adjustment or added silence.
    return subprocess.run(['docker','exec','-i','immich_server','ffmpeg','-v','error','-i','pipe:0',
                           '-ac','1','-ar','22050','-codec:a','libmp3lame','-b:a','64k','-f','mp3','pipe:1'],
                          input=wav,capture_output=True,check=True,timeout=60).stdout


def process_entry(item):
    word, entry = item
    path = OUTPUT / entry['file']
    for attempt in range(3):
        try:
            audio = generate(entry['text'])
            if len(audio) < 1000:
                raise ValueError('Empty audio')
            path.with_suffix('.tmp').write_bytes(audio)
            path.with_suffix('.tmp').replace(path)
            return word
        except Exception:
            if attempt == 2:
                raise
            time.sleep(2)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--workers', type=int, choices=(1, 2, 3), default=3,
                        help='Concurrent gateway synthesis requests (default: 3)')
    args = parser.parse_args()
    words = json.loads((ROOT/'src/data/words_combined.json').read_text())
    OUTPUT.mkdir(parents=True,exist_ok=True)
    entries = {}
    for word, details in words.items():
        forms = [re.sub(r'\s+[A-Z]\s*$', '', word)] + [details[k] for k in ('secondForm','thirdForm') if details.get(k)]
        text = '. '.join(forms) + '.'
        digest = hashlib.sha256(json.dumps([word,forms,SETTINGS],ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:24]
        entries[word] = dict(file=digest+'.mp3',forms=forms,text=text)
    manifest = dict(settings=SETTINGS,entries=entries)
    pending = [(word, entry) for word, entry in entries.items()
               if not (OUTPUT / entry['file']).exists()]
    initial = len(entries) - len(pending)
    start = time.monotonic()
    generated = 0
    print(json.dumps(dict(resumed=initial, remaining=len(pending), workers=args.workers)), flush=True)
    remaining = iter(pending)
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        # Keep only active requests submitted; never queue the entire dictionary.
        futures = {pool.submit(process_entry, item): item[0]
                   for item in (next(remaining, None) for _ in range(args.workers))
                   if item is not None}
        while futures:
            done, _ = concurrent.futures.wait(futures, return_when=concurrent.futures.FIRST_COMPLETED)
            try:
                # Check every completed request before scheduling replacements.
                results = [future.result() for future in done]
            except BaseException as error:
                for future in futures:
                    future.cancel()
                print(f'Generation failed: {error}. No more words will be scheduled; '
                      'waiting for any in-flight request to finish.', flush=True)
                raise
            for future in done:
                del futures[future]
            for word in results:
                generated += 1
                completed = initial + generated
                if generated % 25 == 0 or completed == len(entries):
                    elapsed = time.monotonic() - start
                    size = sum((OUTPUT / e['file']).stat().st_size for e in entries.values()
                               if (OUTPUT / e['file']).exists())
                    print(json.dumps(dict(completed=completed, total=len(entries), generated=generated,
                                          megabytes=round(size / 1e6, 2), elapsed_seconds=round(elapsed),
                                          eta_seconds=round(elapsed / generated * (len(entries) - completed)),
                                          last=word)), flush=True)
                item = next(remaining, None)
                if item is not None:
                    futures[pool.submit(process_entry, item)] = item[0]
    # Publish only after generation succeeds, then remove obsolete generated files.
    manifest_tmp = OUTPUT / 'manifest.json.tmp'
    manifest_tmp.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')
    manifest_tmp.replace(OUTPUT / 'manifest.json')
    expected = {entry['file'] for entry in entries.values()}
    removed = 0
    for path in OUTPUT.glob('*.mp3'):
        if re.fullmatch(r'[a-f0-9]{24}\.mp3', path.name) and path.name not in expected:
            path.unlink()
            removed += 1
    print(json.dumps(dict(obsolete_recordings_removed=removed)), flush=True)
    print('DONE',flush=True)
if __name__=='__main__': main()
