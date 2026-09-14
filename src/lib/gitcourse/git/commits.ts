import git from 'isomorphic-git';
import { repoDir, repoFs } from './repository';
import { branchRef } from './branches';
import { splitCommitMessage } from '../course/mapper';
import type { CourseSection } from '../course/model';

export async function listSections(branch: string): Promise<CourseSection[]> {
	const commits = await git.log({ fs: repoFs(), dir: repoDir(), ref: branchRef(branch) });
	return commits.map((c) => {
		const { title, subtitle } = splitCommitMessage(c.commit.message);
		return { oid: c.oid, title, subtitle };
	});
}
