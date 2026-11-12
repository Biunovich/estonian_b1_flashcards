# Estonian dictionary recordings

One MP3 per dictionary entry, with the main word followed by each available
form, including repetitions. `manifest.json` maps exact dictionary keys to files.

Generated with Azure Neural TTS, voice **et-EE-AnuNeural**, speed **1.0**, through
llm-gateway. Full stops between forms give the model its natural pauses; no
silence is inserted afterwards.

Encoding: mono 22,050 Hz MP3, 64 kbps. No cleanup, denoising, frequency filters
or local speed adjustment.

Regenerate with `python3 scripts/generate-audio.py --workers 3` from the repository
root, with `LLM_GATEWAY_TOKEN_FILE` pointing to a private gateway client token.
See the project README for gateway configuration. The command resumes existing
recordings with matching settings. Run `npm run check:audio` to verify coverage,
forms, file uniqueness and every MP3 frame's encoding and integrity.
MP3s are stored directly in Git and served as static files by GitHub Pages.
