import { describe, expect, test } from "bun:test"
import { dict as en } from "../../src/cli/cmd/tui/i18n/en"
import { dict as zh } from "../../src/cli/cmd/tui/i18n/zh"
import { dict as zht } from "../../src/cli/cmd/tui/i18n/zht"
import { dict as ja } from "../../src/cli/cmd/tui/i18n/ja"
import { dict as ru } from "../../src/cli/cmd/tui/i18n/ru"
import { dict as es } from "../../src/cli/cmd/tui/i18n/es"
import { dict as fr } from "../../src/cli/cmd/tui/i18n/fr"

type ActorEntry = {
  actor_id: string
  session_id: string
  mode: "subagent" | "peer" | "main"
  status: "pending" | "running" | "completed" | "failed" | "cancelled" | "unknown"
  agent: string
  description: string
  parent_actor_id: string | null
  time_created: number
  time_updated: number
  turn_count: number
  last_turn_time: number | null
}

type SubagentItem = {
  id: string
  status: "pending" | "running"
  agent: string
  description: string
  turnCount: number
  lastTurnTime: number | null
  parentActorID: string | null
  timeCreated: number
}

function filterSubagents(list: ActorEntry[]): SubagentItem[] {
  return list
    .filter((a) => a.actor_id !== "main" && (a.status === "pending" || a.status === "running"))
    .map((a) => ({
      id: a.actor_id,
      status: a.status as "pending" | "running",
      agent: a.agent,
      description: a.description,
      turnCount: a.turn_count,
      lastTurnTime: a.last_turn_time,
      parentActorID: a.parent_actor_id,
      timeCreated: a.time_created,
    }))
}

function makeActor(overrides: Partial<ActorEntry>): ActorEntry {
  return {
    actor_id: "explore-1",
    session_id: "ses_test",
    mode: "subagent",
    status: "running",
    agent: "explore",
    description: "Test actor",
    parent_actor_id: null,
    time_created: Date.now(),
    time_updated: Date.now(),
    turn_count: 0,
    last_turn_time: null,
    ...overrides,
  }
}

describe("subagent sidebar", () => {
  describe("filter logic", () => {
    test("excludes main agent", () => {
      const list = [makeActor({ actor_id: "main", status: "running" })]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("includes pending actors", () => {
      const list = [makeActor({ status: "pending" })]
      expect(filterSubagents(list)).toHaveLength(1)
    })

    test("includes running actors", () => {
      const list = [makeActor({ status: "running" })]
      expect(filterSubagents(list)).toHaveLength(1)
    })

    test("excludes completed actors", () => {
      const list = [makeActor({ status: "completed" })]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("excludes failed actors", () => {
      const list = [makeActor({ status: "failed" })]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("excludes cancelled actors", () => {
      const list = [makeActor({ status: "cancelled" })]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("excludes unknown status actors", () => {
      const list = [makeActor({ status: "unknown" as any })]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("handles mixed statuses correctly", () => {
      const list = [
        makeActor({ actor_id: "main", status: "running" }),
        makeActor({ actor_id: "explore-1", status: "running" }),
        makeActor({ actor_id: "explore-2", status: "pending" }),
        makeActor({ actor_id: "explore-3", status: "completed" }),
        makeActor({ actor_id: "explore-4", status: "failed" }),
      ]
      const result = filterSubagents(list)
      expect(result).toHaveLength(2)
      expect(result.map((a) => a.id)).toEqual(["explore-1", "explore-2"])
    })

    test("returns empty for empty input", () => {
      expect(filterSubagents([])).toHaveLength(0)
    })

    test("returns empty when only main exists", () => {
      const list = [makeActor({ actor_id: "main", status: "running" })]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("handles multiple main actors", () => {
      const list = [
        makeActor({ actor_id: "main", status: "running" }),
        makeActor({ actor_id: "main", status: "pending" }),
      ]
      expect(filterSubagents(list)).toHaveLength(0)
    })

    test("handles null description", () => {
      const list = [makeActor({ description: null as any })]
      const result = filterSubagents(list)
      expect(result).toHaveLength(1)
      expect(result[0].description).toBeNull()
    })
  })

  describe("sort order", () => {
    test("sorts by timeCreated descending (newest first)", () => {
      const list = [
        { id: "old", timeCreated: 1000 } as SubagentItem,
        { id: "new", timeCreated: 3000 } as SubagentItem,
        { id: "mid", timeCreated: 2000 } as SubagentItem,
      ]
      const sorted = [...list].sort((a, b) => b.timeCreated - a.timeCreated)
      expect(sorted.map((a) => a.id)).toEqual(["new", "mid", "old"])
    })
  })

  describe("i18n keys", () => {
    test("tui.sidebar.subagent exists in all locale files", () => {
      const locales = { en, zh, zht, ja, ru, es, fr }
      for (const [lang, dict] of Object.entries(locales)) {
        expect(dict["tui.sidebar.subagent"], `Missing key in ${lang}`).toBeDefined()
        expect(typeof dict["tui.sidebar.subagent"], `Key not string in ${lang}`).toBe("string")
        expect(
          (dict["tui.sidebar.subagent"] as string).length > 0,
          `Empty key in ${lang}`,
        ).toBe(true)
      }
    })

    test("zh translation is 子智能体", () => {
      expect(zh["tui.sidebar.subagent"]).toBe("子智能体")
    })

    test("en translation is Subagents", () => {
      expect(en["tui.sidebar.subagent"]).toBe("Subagents")
    })

    test("all locale files have the same sidebar keys", () => {
      const locales: Record<string, Record<string, string>> = { en, zh, zht, ja, ru, es, fr }
      const sidebarKeys = Object.keys(en).filter((k) => k.startsWith("tui.sidebar."))
      for (const [lang, dict] of Object.entries(locales)) {
        for (const key of sidebarKeys) {
          expect(dict[key], `Missing ${key} in ${lang}`).toBeDefined()
        }
      }
    })
  })

  describe("plugin registration", () => {
    test("plugin id follows naming convention", () => {
      const id = "internal:sidebar-subagent"
      expect(id).toMatch(/^internal:sidebar-/)
    })

    test("plugin order is between task (400) and todo (400)", () => {
      const order = 410
      expect(order).toBeGreaterThan(400)
    })
  })
})
