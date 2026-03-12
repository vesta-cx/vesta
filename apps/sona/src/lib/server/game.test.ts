import { describe, expect, it } from 'vitest';
import { effectiveBitrate } from './game';

describe('effectiveBitrate', () => {
	it('returns 1411 for flac regardless of bitrate', () => {
		expect(effectiveBitrate('flac', 0)).toBe(1411);
		expect(effectiveBitrate('flac', 960)).toBe(1411);
	});

	it('returns 1411 when bitrate is 0 (lossless)', () => {
		expect(effectiveBitrate('flac', 0)).toBe(1411);
	});

	it('returns actual bitrate for non-flac codecs', () => {
		expect(effectiveBitrate('opus', 128)).toBe(128);
		expect(effectiveBitrate('mp3', 320)).toBe(320);
		expect(effectiveBitrate('aac', 256)).toBe(256);
	});
});
