import type { TuiPlugin, TuiPluginApi, TuiPluginModule } from "@mimo-ai/plugin/tui"
import { createMemo, For, Show, createSignal } from "solid-js"
import { useLanguage } from "@tui/context/language"

const id = "internal:sidebar-subagent"

function View(props: { api: TuiPluginApi; session_id: string }) {
  const [open, setOpen] = createSignal(true)
  const theme = () => props.api.theme.current
  const t = useLanguage().t
  // Q9 grill 决策：host 层已过滤为 pending + running；UI 拿到就是"进行中"列表
  // Q12 grill 决策：per-session，host 层用 sessionID 过滤
  const all = createMemo(() => props.api.state.session.subagent(props.session_id))
  // 最近创建的在前（time_created 降序）
  const list = createMemo(() => [...all()].sort((a, b) => b.time_created - a.time_created))
  const show = createMemo(() => list().length > 0)
  // 多于 2 行才显示折叠箭头，仿 task/mcp/lsp/todo 风格
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
                  <span style={{ fg: theme().textMuted }}>{item.actor_id}</span>{" "}
                  {item.description}{" "}
                  <span style={{ fg: theme().textMuted }}>
                    ({item.agent}, turn {item.turn_count})
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
    // Q10 grill 决策：Tasks(400) 之下、Todos(400) 之上
    // task 和 todo 同 order 时按注册顺序排列，subagent 用 410 落在它们之后
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
