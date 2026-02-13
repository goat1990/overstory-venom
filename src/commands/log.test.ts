import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdtemp, readdir, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ValidationError } from "../errors.ts";
import { createMetricsStore } from "../metrics/store.ts";
import type { AgentSession } from "../types.ts";
import { logCommand } from "./log.ts";

/**
 * Tests for `overstory log` command.
 *
 * Uses real filesystem (temp dirs) and real bun:sqlite to test logging behavior.
 * Captures process.stdout.write to verify help text output.
 */

describe("logCommand", () => {
	let chunks: string[];
	let originalWrite: typeof process.stdout.write;
	let tempDir: string;
	let originalCwd: string;

	beforeEach(async () => {
		// Spy on stdout
		chunks = [];
		originalWrite = process.stdout.write;
		process.stdout.write = ((chunk: string) => {
			chunks.push(chunk);
			return true;
		}) as typeof process.stdout.write;

		// Create temp dir with .overstory/config.yaml structure
		tempDir = await mkdtemp(join(tmpdir(), "log-test-"));
		const overstoryDir = join(tempDir, ".overstory");
		await Bun.write(
			join(overstoryDir, "config.yaml"),
			`project:\n  name: test\n  root: ${tempDir}\n  canonicalBranch: main\n`,
		);

		// Change to temp dir so loadConfig() works
		originalCwd = process.cwd();
		process.chdir(tempDir);
	});

	afterEach(async () => {
		process.stdout.write = originalWrite;
		process.chdir(originalCwd);
		await rm(tempDir, { recursive: true, force: true });
	});

	function output(): string {
		return chunks.join("");
	}

	test("--help flag shows help text", async () => {
		await logCommand(["--help"]);
		const out = output();

		expect(out).toContain("overstory log");
		expect(out).toContain("tool-start");
		expect(out).toContain("tool-end");
		expect(out).toContain("session-end");
		expect(out).toContain("--agent");
	});

	test("-h flag shows help text", async () => {
		await logCommand(["-h"]);
		const out = output();

		expect(out).toContain("overstory log");
		expect(out).toContain("tool-start");
		expect(out).toContain("tool-end");
		expect(out).toContain("session-end");
		expect(out).toContain("--agent");
	});

	test("missing event with only flags throws ValidationError", async () => {
		// The code finds first non-flag arg. Passing only flags should trigger "Event is required"
		// Note: the implementation checks for undefined event
		await expect(async () => {
			await logCommand([]);
		}).toThrow(ValidationError);

		await expect(async () => {
			await logCommand([]);
		}).toThrow("Event is required");
	});

	test("invalid event name throws ValidationError", async () => {
		expect(async () => {
			await logCommand(["invalid-event", "--agent", "test-agent"]);
		}).toThrow(ValidationError);

		expect(async () => {
			await logCommand(["invalid-event", "--agent", "test-agent"]);
		}).toThrow("Invalid event");
	});

	test("missing --agent flag throws ValidationError", async () => {
		expect(async () => {
			await logCommand(["tool-start"]);
		}).toThrow(ValidationError);

		expect(async () => {
			await logCommand(["tool-start"]);
		}).toThrow("--agent is required");
	});

	test("tool-start creates log directory structure", async () => {
		await logCommand(["tool-start", "--agent", "test-builder", "--tool-name", "Read"]);

		const logsDir = join(tempDir, ".overstory", "logs", "test-builder");
		const contents = await readdir(logsDir);

		// Should have at least .current-session marker and a session directory
		expect(contents).toContain(".current-session");
		expect(contents.length).toBeGreaterThanOrEqual(2);
	});

	test("tool-start creates session directory and .current-session marker", async () => {
		await logCommand(["tool-start", "--agent", "test-scout", "--tool-name", "Grep"]);

		const logsDir = join(tempDir, ".overstory", "logs", "test-scout");
		const markerPath = join(logsDir, ".current-session");
		const markerFile = Bun.file(markerPath);

		expect(await markerFile.exists()).toBe(true);

		const sessionDir = (await markerFile.text()).trim();
		expect(sessionDir).toBeTruthy();
		expect(sessionDir).toContain(logsDir);

		// Session directory should exist
		const dirStat = await stat(sessionDir);
		expect(dirStat.isDirectory()).toBe(true);
	});

	test("tool-start creates log files in session directory", async () => {
		await logCommand(["tool-start", "--agent", "test-builder", "--tool-name", "Write"]);

		// Wait for async file writes to complete
		await new Promise((resolve) => setTimeout(resolve, 50));

		const logsDir = join(tempDir, ".overstory", "logs", "test-builder");
		const markerPath = join(logsDir, ".current-session");
		const sessionDir = (await Bun.file(markerPath).text()).trim();

		// Check for events.ndjson file
		const eventsFile = Bun.file(join(sessionDir, "events.ndjson"));
		expect(await eventsFile.exists()).toBe(true);
	});

	test("tool-end uses the same session directory as tool-start", async () => {
		await logCommand(["tool-start", "--agent", "test-agent", "--tool-name", "Edit"]);

		const logsDir = join(tempDir, ".overstory", "logs", "test-agent");
		const markerPath = join(logsDir, ".current-session");
		const sessionDirAfterStart = (await Bun.file(markerPath).text()).trim();

		await logCommand(["tool-end", "--agent", "test-agent", "--tool-name", "Edit"]);

		const sessionDirAfterEnd = (await Bun.file(markerPath).text()).trim();
		expect(sessionDirAfterEnd).toBe(sessionDirAfterStart);
	});

	test("tool-end writes to the same session directory", async () => {
		await logCommand(["tool-start", "--agent", "test-worker", "--tool-name", "Bash"]);
		await logCommand(["tool-end", "--agent", "test-worker", "--tool-name", "Bash"]);

		// Wait for async file writes to complete
		await new Promise((resolve) => setTimeout(resolve, 50));

		const logsDir = join(tempDir, ".overstory", "logs", "test-worker");
		const markerPath = join(logsDir, ".current-session");
		const sessionDir = (await Bun.file(markerPath).text()).trim();

		// Events file should contain both tool-start and tool-end events
		const eventsFile = Bun.file(join(sessionDir, "events.ndjson"));
		const eventsContent = await eventsFile.text();

		expect(eventsContent).toContain("tool.start");
		expect(eventsContent).toContain("tool.end");
	});

	test("session-end transitions agent state to completed in sessions.json", async () => {
		// Create sessions.json with a test agent
		const sessionsPath = join(tempDir, ".overstory", "sessions.json");
		const session: AgentSession = {
			id: "session-001",
			agentName: "test-agent",
			capability: "builder",
			worktreePath: "/tmp/test",
			branchName: "test-branch",
			beadId: "bead-001",
			tmuxSession: "test-tmux",
			state: "working",
			pid: 12345,
			parentAgent: null,
			depth: 0,
			startedAt: new Date().toISOString(),
			lastActivity: new Date().toISOString(),
			escalationLevel: 0,
			stalledSince: null,
		};
		await Bun.write(sessionsPath, `${JSON.stringify([session], null, "\t")}\n`);

		await logCommand(["session-end", "--agent", "test-agent"]);

		// Read sessions.json and verify state changed to completed
		const sessionsFile = Bun.file(sessionsPath);
		const sessions = JSON.parse(await sessionsFile.text()) as AgentSession[];
		const updatedSession = sessions.find((s) => s.agentName === "test-agent");

		expect(updatedSession).toBeDefined();
		expect(updatedSession?.state).toBe("completed");
	});

	test("session-end clears the .current-session marker", async () => {
		// First create a session with tool-start
		await logCommand(["tool-start", "--agent", "test-cleanup", "--tool-name", "Read"]);

		const logsDir = join(tempDir, ".overstory", "logs", "test-cleanup");
		const markerPath = join(logsDir, ".current-session");

		// Verify marker exists before session-end
		let markerFile = Bun.file(markerPath);
		expect(await markerFile.exists()).toBe(true);

		// Now end the session
		await logCommand(["session-end", "--agent", "test-cleanup"]);

		// Marker should be removed - need to create a new Bun.file reference
		markerFile = Bun.file(markerPath);
		expect(await markerFile.exists()).toBe(false);
	});

	test("session-end records metrics when agent session exists in sessions.json", async () => {
		// Create sessions.json with a test agent
		const sessionsPath = join(tempDir, ".overstory", "sessions.json");
		const session: AgentSession = {
			id: "session-002",
			agentName: "metrics-agent",
			capability: "scout",
			worktreePath: "/tmp/metrics",
			branchName: "metrics-branch",
			beadId: "bead-002",
			tmuxSession: "metrics-tmux",
			state: "working",
			pid: 54321,
			parentAgent: "parent-agent",
			depth: 1,
			startedAt: new Date(Date.now() - 60_000).toISOString(), // 1 minute ago
			lastActivity: new Date().toISOString(),
			escalationLevel: 0,
			stalledSince: null,
		};
		await Bun.write(sessionsPath, `${JSON.stringify([session], null, "\t")}\n`);

		await logCommand(["session-end", "--agent", "metrics-agent"]);

		// Verify metrics.db was created and has the session record
		const metricsDbPath = join(tempDir, ".overstory", "metrics.db");
		const metricsStore = createMetricsStore(metricsDbPath);
		const metrics = metricsStore.getRecentSessions(1);
		metricsStore.close();

		expect(metrics).toHaveLength(1);
		expect(metrics[0]?.agentName).toBe("metrics-agent");
		expect(metrics[0]?.beadId).toBe("bead-002");
		expect(metrics[0]?.capability).toBe("scout");
		expect(metrics[0]?.parentAgent).toBe("parent-agent");
	});

	test("session-end does not crash when sessions.json does not exist", async () => {
		// No sessions.json file exists
		// session-end should complete without throwing
		await expect(
			logCommand(["session-end", "--agent", "nonexistent-agent"]),
		).resolves.toBeUndefined();
	});

	test("tool-start updates lastActivity timestamp in sessions.json", async () => {
		// Create sessions.json with a test agent
		const sessionsPath = join(tempDir, ".overstory", "sessions.json");
		const oldTimestamp = new Date(Date.now() - 120_000).toISOString(); // 2 minutes ago
		const session: AgentSession = {
			id: "session-003",
			agentName: "activity-agent",
			capability: "builder",
			worktreePath: "/tmp/activity",
			branchName: "activity-branch",
			beadId: "bead-003",
			tmuxSession: "activity-tmux",
			state: "working",
			pid: 99999,
			parentAgent: null,
			depth: 0,
			startedAt: oldTimestamp,
			lastActivity: oldTimestamp,
			escalationLevel: 0,
			stalledSince: null,
		};
		await Bun.write(sessionsPath, `${JSON.stringify([session], null, "\t")}\n`);

		await logCommand(["tool-start", "--agent", "activity-agent", "--tool-name", "Glob"]);

		// Read sessions.json and verify lastActivity was updated
		const sessionsFile = Bun.file(sessionsPath);
		const sessions = JSON.parse(await sessionsFile.text()) as AgentSession[];
		const updatedSession = sessions.find((s) => s.agentName === "activity-agent");

		expect(updatedSession).toBeDefined();
		expect(updatedSession?.lastActivity).not.toBe(oldTimestamp);
		expect(new Date(updatedSession?.lastActivity ?? "").getTime()).toBeGreaterThan(
			new Date(oldTimestamp).getTime(),
		);
	});

	test("tool-start transitions state from booting to working", async () => {
		// Create sessions.json with agent in 'booting' state
		const sessionsPath = join(tempDir, ".overstory", "sessions.json");
		const session: AgentSession = {
			id: "session-004",
			agentName: "booting-agent",
			capability: "builder",
			worktreePath: "/tmp/booting",
			branchName: "booting-branch",
			beadId: "bead-004",
			tmuxSession: "booting-tmux",
			state: "booting",
			pid: 11111,
			parentAgent: null,
			depth: 0,
			startedAt: new Date().toISOString(),
			lastActivity: new Date().toISOString(),
			escalationLevel: 0,
			stalledSince: null,
		};
		await Bun.write(sessionsPath, `${JSON.stringify([session], null, "\t")}\n`);

		await logCommand(["tool-start", "--agent", "booting-agent", "--tool-name", "Read"]);

		// Read sessions.json and verify state changed to working
		const sessionsFile = Bun.file(sessionsPath);
		const sessions = JSON.parse(await sessionsFile.text()) as AgentSession[];
		const updatedSession = sessions.find((s) => s.agentName === "booting-agent");

		expect(updatedSession).toBeDefined();
		expect(updatedSession?.state).toBe("working");
	});

	test("tool-start defaults to unknown when --tool-name not provided", async () => {
		// Should not throw when --tool-name is missing
		await expect(
			logCommand(["tool-start", "--agent", "default-tool-agent"]),
		).resolves.toBeUndefined();

		// Verify log was created
		const logsDir = join(tempDir, ".overstory", "logs", "default-tool-agent");
		const markerPath = join(logsDir, ".current-session");
		const markerFile = Bun.file(markerPath);

		expect(await markerFile.exists()).toBe(true);

		// Wait for async file writes to complete (logger uses fire-and-forget appendFile)
		await new Promise((resolve) => setTimeout(resolve, 50));

		const sessionDir = (await markerFile.text()).trim();
		const eventsFile = Bun.file(join(sessionDir, "events.ndjson"));
		const eventsContent = await eventsFile.text();

		// Should contain "unknown" as the tool name
		expect(eventsContent).toContain("unknown");
	});

	test("tool-end defaults to unknown when --tool-name not provided", async () => {
		await logCommand(["tool-start", "--agent", "default-end-agent"]);

		// tool-end without --tool-name should not throw
		await expect(logCommand(["tool-end", "--agent", "default-end-agent"])).resolves.toBeUndefined();

		// Wait for async file writes to complete
		await new Promise((resolve) => setTimeout(resolve, 50));

		const logsDir = join(tempDir, ".overstory", "logs", "default-end-agent");
		const markerPath = join(logsDir, ".current-session");
		const sessionDir = (await Bun.file(markerPath).text()).trim();
		const eventsFile = Bun.file(join(sessionDir, "events.ndjson"));
		const eventsContent = await eventsFile.text();

		expect(eventsContent).toContain("unknown");
	});
});
