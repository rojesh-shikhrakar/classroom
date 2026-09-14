import type { CourseConfig, CourseModule, CourseSection, FileNode } from '../course/model';
import { ensureRepo } from '../git/repository';
import { listModules } from '../git/branches';
import { listSections } from '../git/commits';
import { readRootTree, readDirTree } from '../git/trees';
import { fileExistsAt } from '../git/blobs';

interface InitialState {
	branch?: string;
	commit?: string;
	file?: string;
}

class CourseStore {
	config = $state<CourseConfig | null>(null);
	modules = $state<CourseModule[]>([]);
	selectedBranch = $state('');
	sections = $state<CourseSection[]>([]);
	selectedCommit = $state('');
	tree = $state<FileNode[]>([]);
	selectedFile = $state<string | undefined>(undefined);
	commitPanelOpen = $state(true);
	filePanelOpen = $state(true);
	diffMode = $state(false);
	loading = $state(false);
	error = $state<string | null>(null);

	/** Sections are newest-first, so the previous chapter sits at the next index. */
	get previousCommitOid(): string | undefined {
		const i = this.sections.findIndex((s) => s.oid === this.selectedCommit);
		return i >= 0 ? this.sections[i + 1]?.oid : undefined;
	}

	async load(config: CourseConfig, initial: InitialState = {}) {
		this.config = config;
		this.loading = true;
		this.error = null;
		try {
			await ensureRepo(config);
			this.modules = await listModules();
			const branch =
				(initial.branch && this.modules.find((m) => m.name === initial.branch)?.name) ??
				(config.defaultBranch && this.modules.find((m) => m.name === config.defaultBranch)?.name) ??
				this.modules[0]?.name;
			if (branch) await this.selectBranch(branch, initial.commit, initial.file);
		} catch (e) {
			this.error = e instanceof Error ? e.message : String(e);
		} finally {
			this.loading = false;
		}
	}

	async selectBranch(branch: string, commitOid?: string, file?: string) {
		this.selectedBranch = branch;
		this.selectedFile = undefined; // new module — don't carry a file over from the old one
		this.sections = await listSections(branch);
		const commit =
			(commitOid && this.sections.find((s) => s.oid.startsWith(commitOid))?.oid) ??
			this.sections[0]?.oid;
		if (commit) await this.selectCommit(commit, file);
	}

	async selectCommit(oid: string, file?: string) {
		const currentFile = this.selectedFile;
		this.selectedCommit = oid;
		this.tree = await readRootTree(oid);
		if (file) {
			this.selectedFile = file;
		} else if (currentFile && (await fileExistsAt(oid, currentFile))) {
			// Same file exists at this commit too — stay on it so learners can watch it evolve.
			this.selectedFile = currentFile;
		} else {
			this.selectedFile =
				this.tree.find((n) => n.type === 'blob' && /readme/i.test(n.name))?.path ??
				this.tree.find((n) => n.type === 'blob')?.path;
		}
	}

	selectFile(path: string | undefined) {
		this.selectedFile = path;
	}

	async expandDir(node: FileNode) {
		if (node.children) return;
		node.children = await readDirTree(node.oid, node.path);
		this.tree = [...this.tree]; // trigger reactivity on the nested array
	}

	toggleCommitPanel() {
		this.commitPanelOpen = !this.commitPanelOpen;
	}

	toggleFilePanel() {
		this.filePanelOpen = !this.filePanelOpen;
	}

	toggleDiffMode() {
		this.diffMode = !this.diffMode;
	}
}

export const courseStore = new CourseStore();
