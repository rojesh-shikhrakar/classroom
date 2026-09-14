import git from 'isomorphic-git';
import { repoDir, repoFs } from './repository';
import { branchTitle } from '../course/mapper';
import type { CourseModule } from '../course/model';

export async function listModules(): Promise<CourseModule[]> {
	const names = await git.listBranches({ fs: repoFs(), dir: repoDir(), remote: 'origin' });
	return names.filter((n) => n !== 'HEAD').map((name) => ({ name, title: branchTitle(name) }));
}

/** We clone with noCheckout, so branches only exist as remote-tracking refs. */
export function branchRef(name: string) {
	return `refs/remotes/origin/${name}`;
}
