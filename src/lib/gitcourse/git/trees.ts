import git from 'isomorphic-git';
import { repoDir, repoFs } from './repository';
import type { FileNode } from '../course/model';

function toNode(parentPath: string) {
	return (entry: { path: string; oid: string; type: string }): FileNode => ({
		name: entry.path,
		path: parentPath ? `${parentPath}/${entry.path}` : entry.path,
		type: entry.type === 'tree' ? 'tree' : 'blob',
		oid: entry.oid
	});
}

export async function readRootTree(commitOid: string): Promise<FileNode[]> {
	const { tree } = await git.readTree({ fs: repoFs(), dir: repoDir(), oid: commitOid });
	return tree.map(toNode(''));
}

/** Lazily expand one directory — called only when a learner opens it. */
export async function readDirTree(oid: string, parentPath: string): Promise<FileNode[]> {
	const { tree } = await git.readTree({ fs: repoFs(), dir: repoDir(), oid });
	return tree.map(toNode(parentPath));
}
