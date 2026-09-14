import './browser-polyfills';
import LightningFS from '@isomorphic-git/lightning-fs';
import git from 'isomorphic-git';
import http from 'isomorphic-git/http/web';
import type { CourseConfig } from '../course/model';

// Public isomorphic-git CORS proxy; GitHub doesn't serve CORS headers itself.
const DEFAULT_CORS_PROXY = 'https://cors.isomorphic-git.org';
const DIR = '/repo';

let fs: LightningFS;
let activeRepo = '';
const repositories = new Map<string, { fs: LightningFS; ready: Promise<void> }>();

function getFs() {
	fs ??= new LightningFS('gitcourse');
	return fs;
}

/** Clones the course repo into IndexedDB on first visit; reuses the cache after. */
export function ensureRepo(config: CourseConfig): Promise<void> {
	activeRepo = config.repoUrl.replace(/\.git\/?$/, '');
	const cached = repositories.get(activeRepo);
	if (cached) {
		fs = cached.fs;
		return cached.ready;
	}
	const fsInstance = new LightningFS(`gitcourse-${hashRepo(activeRepo)}`);
	fs = fsInstance;
	const ready = (async () => {
		const proxy = config.corsProxy ?? DEFAULT_CORS_PROXY;
		try {
			await fsInstance.promises.stat(`${DIR}/.git`);
			// Cached repo found; refresh refs in the background, don't block first render.
			git
				.fetch({ fs: fsInstance, http, dir: DIR, corsProxy: proxy, depth: 10, singleBranch: false })
				.catch(() => {});
		} catch {
			await git.clone({
				fs: fsInstance,
				http,
				dir: DIR,
				url: config.repoUrl,
				corsProxy: proxy,
				depth: 10,
				singleBranch: false,
				noCheckout: true
			});
		}
	})();
	repositories.set(activeRepo, { fs: fsInstance, ready });
	return ready;
}

function hashRepo(value: string) {
	let hash = 0;
	for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
	return hash.toString(36);
}

export function repoDir() {
	return DIR;
}

export function repoFs() {
	return getFs();
}
