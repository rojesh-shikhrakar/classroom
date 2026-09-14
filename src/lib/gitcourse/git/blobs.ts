import git from 'isomorphic-git';
import { repoDir, repoFs } from './repository';

// ponytail: hard cap against pathological repos, raise if a course legitimately needs bigger assets.
const MAX_BLOB_SIZE = 5 * 1024 * 1024;

/** Resolves a file's blob directly from a commit + path, no manual tree walking needed. */
export async function readFileBlob(
	commitOid: string,
	filepath: string
): Promise<{ oid: string; blob: Uint8Array }> {
	const result = await git.readBlob({ fs: repoFs(), dir: repoDir(), oid: commitOid, filepath });
	if (result.blob.byteLength > MAX_BLOB_SIZE) {
		throw new Error(`File too large to render (${(result.blob.byteLength / 1e6).toFixed(1)}MB)`);
	}
	return result;
}

export async function fileExistsAt(commitOid: string, filepath: string): Promise<boolean> {
	try {
		await git.readBlob({ fs: repoFs(), dir: repoDir(), oid: commitOid, filepath });
		return true;
	} catch {
		return false;
	}
}
