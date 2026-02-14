/**
 * Mulch CLI client.
 *
 * Wraps the `mulch` command-line tool for structured expertise operations.
 * Uses Bun.spawn — zero runtime dependencies.
 */

import { AgentError } from "../errors.ts";
import type { MulchStatus } from "../types.ts";

export interface MulchClient {
	/** Generate a priming prompt, optionally scoped to specific domains. */
	prime(
		domains?: string[],
		format?: "markdown" | "xml" | "json",
		options?: {
			files?: string[];
			excludeDomain?: string[];
		},
	): Promise<string>;

	/** Show domain statistics. */
	status(): Promise<MulchStatus>;

	/** Record an expertise entry for a domain. */
	record(
		domain: string,
		options: {
			type: string;
			name?: string;
			description?: string;
			title?: string;
			rationale?: string;
			tags?: string[];
			classification?: string;
			stdin?: boolean;
			evidenceBead?: string;
		},
	): Promise<void>;

	/** Query expertise records, optionally scoped to a domain. */
	query(domain?: string): Promise<string>;

	/** Search records across all domains. */
	search(query: string): Promise<string>;

	/** Show expertise record changes since a git ref. */
	diff(options?: { since?: string }): Promise<string>;

	/** Show changed files and suggest domains for recording learnings. */
	learn(options?: { since?: string }): Promise<string>;

	/** Remove unused or stale records. */
	prune(options?: { dryRun?: boolean }): Promise<string>;

	/** Run health checks on mulch repository. */
	doctor(options?: { fix?: boolean }): Promise<string>;

	/** Show recently added or updated expertise records. */
	ready(options?: { limit?: number; domain?: string; since?: string }): Promise<string>;

	/** Compact and optimize domain storage. */
	compact(
		domain?: string,
		options?: {
			analyze?: boolean;
			apply?: boolean;
			auto?: boolean;
			dryRun?: boolean;
			minGroup?: number;
			maxRecords?: number;
			yes?: boolean;
			records?: string[];
		},
	): Promise<string>;
}

/**
 * Run a shell command and capture its output.
 */
async function runCommand(
	cmd: string[],
	cwd: string,
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
	const proc = Bun.spawn(cmd, {
		cwd,
		stdout: "pipe",
		stderr: "pipe",
	});
	const stdout = await new Response(proc.stdout).text();
	const stderr = await new Response(proc.stderr).text();
	const exitCode = await proc.exited;
	return { stdout, stderr, exitCode };
}

/**
 * Create a MulchClient bound to the given working directory.
 *
 * @param cwd - Working directory where mulch commands should run
 * @returns A MulchClient instance wrapping the mulch CLI
 */
export function createMulchClient(cwd: string): MulchClient {
	async function runMulch(
		args: string[],
		context: string,
	): Promise<{ stdout: string; stderr: string }> {
		const { stdout, stderr, exitCode } = await runCommand(["mulch", ...args], cwd);
		if (exitCode !== 0) {
			throw new AgentError(`mulch ${context} failed (exit ${exitCode}): ${stderr.trim()}`);
		}
		return { stdout, stderr };
	}

	return {
		async prime(domains, format, options) {
			const args = ["prime"];
			if (domains && domains.length > 0) {
				args.push(...domains);
			}
			if (format) {
				args.push("--format", format);
			}
			if (options?.files && options.files.length > 0) {
				args.push("--files", options.files.join(","));
			}
			if (options?.excludeDomain && options.excludeDomain.length > 0) {
				args.push("--exclude-domain", options.excludeDomain.join(","));
			}
			const { stdout } = await runMulch(args, "prime");
			return stdout;
		},

		async status() {
			const { stdout } = await runMulch(["status", "--json"], "status");
			const trimmed = stdout.trim();
			if (trimmed === "") {
				return { domains: [] };
			}
			try {
				return JSON.parse(trimmed) as MulchStatus;
			} catch {
				throw new AgentError(
					`Failed to parse JSON output from mulch status: ${trimmed.slice(0, 200)}`,
				);
			}
		},

		async record(domain, options) {
			const args = ["record", domain, "--type", options.type];
			if (options.name) {
				args.push("--name", options.name);
			}
			if (options.description) {
				args.push("--description", options.description);
			}
			if (options.title) {
				args.push("--title", options.title);
			}
			if (options.rationale) {
				args.push("--rationale", options.rationale);
			}
			if (options.tags && options.tags.length > 0) {
				args.push("--tags", options.tags.join(","));
			}
			if (options.classification) {
				args.push("--classification", options.classification);
			}
			if (options.stdin) {
				args.push("--stdin");
			}
			if (options.evidenceBead) {
				args.push("--evidence-bead", options.evidenceBead);
			}
			await runMulch(args, `record ${domain}`);
		},

		async query(domain) {
			const args = ["query"];
			if (domain) {
				args.push(domain);
			}
			const { stdout } = await runMulch(args, "query");
			return stdout;
		},

		async search(query) {
			const { stdout } = await runMulch(["search", query], "search");
			return stdout;
		},

		async diff(options) {
			const args = ["diff"];
			if (options?.since) {
				args.push("--since", options.since);
			}
			const { stdout } = await runMulch(args, "diff");
			return stdout;
		},

		async learn(options) {
			const args = ["learn"];
			if (options?.since) {
				args.push("--since", options.since);
			}
			const { stdout } = await runMulch(args, "learn");
			return stdout;
		},

		async prune(options) {
			const args = ["prune"];
			if (options?.dryRun) {
				args.push("--dry-run");
			}
			const { stdout } = await runMulch(args, "prune");
			return stdout;
		},

		async doctor(options) {
			const args = ["doctor"];
			if (options?.fix) {
				args.push("--fix");
			}
			const { stdout } = await runMulch(args, "doctor");
			return stdout;
		},

		async ready(options) {
			const args = ["ready"];
			if (options?.limit !== undefined) {
				args.push("--limit", String(options.limit));
			}
			if (options?.domain) {
				args.push("--domain", options.domain);
			}
			if (options?.since) {
				args.push("--since", options.since);
			}
			const { stdout } = await runMulch(args, "ready");
			return stdout;
		},

		async compact(domain, options) {
			const args = ["compact"];
			if (domain) {
				args.push(domain);
			}
			if (options?.analyze) {
				args.push("--analyze");
			}
			if (options?.apply) {
				args.push("--apply");
			}
			if (options?.auto) {
				args.push("--auto");
			}
			if (options?.dryRun) {
				args.push("--dry-run");
			}
			if (options?.minGroup !== undefined) {
				args.push("--min-group", String(options.minGroup));
			}
			if (options?.maxRecords !== undefined) {
				args.push("--max-records", String(options.maxRecords));
			}
			if (options?.yes) {
				args.push("--yes");
			}
			if (options?.records && options.records.length > 0) {
				args.push("--records", options.records.join(","));
			}
			const { stdout } = await runMulch(args, domain ? `compact ${domain}` : "compact");
			return stdout;
		},
	};
}
