import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@mimo-ai/plugin/tui"
import { createMemo, For, Show, createSignal } from "solid-js"
import { useLanguage } from "@tui/context/language"

const id = "internal:sidebar-subagent"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const t = useLanguage().t
  // Host layer filters to pending/running only; completed actors are hidden (Q9: real-time disappear)
  // Scoped to current session via sessionID (Q12: current session only)
  const all = createMemo(() => props.api.state.session.subagent(props.session_id))
  // Newest first for stable visual order across polls
  const list = createMemo(() => [...all()].sort((a, b) => b.timeCreated - a.timeCreated))
  const show = createMemo(() => list().length > 0)
  // Show collapse arrow only when more than 2 rows (consistent with task/mcp/lsp/todo)
  const collapsible = createMemo(() => list().length > 2)

  return (
    <Show when={show()}>
      <box>
        <box flexDirection="row" gap={1} onMouseDown={() => collapsible() && setOpen((x) => !x)}>
          <Show when={collapsible()}>
            <text fg={theme().text}>{open() ? "▼" : "▶"}</text>
          </Show>
          <text fg={theme().text}>
            <b>{t("tui.sidebar.subagent")}</b>
            <Show when={!open()}>
              <span style={{ fg: theme().textMuted }}> ({list().length} active)</span>
            </Show>
          </text>
        </box>
        <Show when={!collapsible() || open()}>
          <For each={list()}>
            {(item) => (
              <box flexDirection="row" gap={1}>
                <text
                  flexShrink={0}
                  style={{
                    fg: item.status === "running" ? theme().success : theme().warning,
                  }}
                >
                  {item.status === "running" ? "●" : "○"}
                </text>
                <text fg={theme().text} wrapMode="word">
                  <span style={{ fg: theme().textMuted }}>{item.id}</span>{" "}
                  {item.description}{" "}
                  <span style={{ fg: theme().textMuted }}>
                    ({item.agent}, turn {item.turnCount})
                  </span>
                </text>
              </box>
            )}
          </For>
        </Show>
      </box>
    </Show>
  )
}

const tui: TuiPlugin = async (api) => {
  api.slots.register({
    // Below Tasks (400), above Todos (400) — same-order plugins render by registration order
    order: 410,
    slots: {
      sidebar_content(_ctx, props) {
        return <View api={api} session_id={props.session_id} />
      },
    },
  })
}

const plugin: TuiPluginModule & { id: string } = {
  id,
  tui,
}

export default plugin
