import { useEffect, useRef, useState } from 'react';
import { useStore } from '../store';
import { api, type AgentChannelConfig } from '../api';

const FALLBACK_MODELS = [
  { id: 'anthropic/claude-sonnet-4-6', l: 'Claude Sonnet 4.6', p: 'Anthropic' },
  { id: 'anthropic/claude-opus-4-5', l: 'Claude Opus 4.5', p: 'Anthropic' },
  { id: 'anthropic/claude-haiku-3-5', l: 'Claude Haiku 3.5', p: 'Anthropic' },
  { id: 'openai/gpt-4o', l: 'GPT-4o', p: 'OpenAI' },
  { id: 'openai/gpt-4o-mini', l: 'GPT-4o Mini', p: 'OpenAI' },
  { id: 'google/gemini-2.5-pro', l: 'Gemini 2.5 Pro', p: 'Google' },
  { id: 'copilot/claude-sonnet-4', l: 'Claude Sonnet 4', p: 'Copilot' },
  { id: 'copilot/claude-opus-4.5', l: 'Claude Opus 4.5', p: 'Copilot' },
  { id: 'copilot/gpt-4o', l: 'GPT-4o', p: 'Copilot' },
  { id: 'copilot/gemini-2.5-pro', l: 'Gemini 2.5 Pro', p: 'Copilot' },
];

const PLATFORMS = [
  { id: 'discord', label: 'Discord' },
  { id: 'feishu', label: '飞书' },
  { id: 'telegram', label: 'Telegram' },
  { id: 'slack', label: 'Slack' },
];

type ChannelDraft = { platform: string; guildId: string; channelId: string; label: string };
const emptyDraft = (ch?: AgentChannelConfig): ChannelDraft => ({
  platform: ch?.platform || 'discord',
  guildId: ch?.guildId || '',
  channelId: ch?.channelId || '',
  label: ch?.label || '',
});

export default function ModelConfig() {
  const agentConfig = useStore((s) => s.agentConfig);
  const changeLog = useStore((s) => s.changeLog);
  const loadAgentConfig = useStore((s) => s.loadAgentConfig);
  const toast = useStore((s) => s.toast);

  const [selMap, setSelMap] = useState<Record<string, string>>({});
  const [statusMap, setStatusMap] = useState<Record<string, { cls: string; text: string }>>({});
  const [chMap, setChMap] = useState<Record<string, ChannelDraft>>({});
  const [chStatus, setChStatus] = useState<Record<string, { cls: string; text: string }>>({});
  const prevServerChannels = useRef<Record<string, string>>({});

  useEffect(() => {
    loadAgentConfig();
  }, [loadAgentConfig]);

  useEffect(() => {
    if (agentConfig?.agents) {
      const m: Record<string, string> = {};
      agentConfig.agents.forEach((ag) => { m[ag.id] = ag.model; });
      setSelMap(m);

      setChMap((prev) => {
        const next = { ...prev };
        agentConfig.agents.forEach((ag) => {
          const serverKey = JSON.stringify(ag.channel ?? null);
          const prevKey = prevServerChannels.current[ag.id];
          if (!(ag.id in next) || serverKey !== prevKey) {
            next[ag.id] = emptyDraft(ag.channel);
          }
          prevServerChannels.current[ag.id] = serverKey;
        });
        return next;
      });
    }
  }, [agentConfig]);

  if (!agentConfig?.agents) {
    return <div className="empty" style={{ gridColumn: '1/-1' }}>Please start the local server first</div>;
  }

  const models = agentConfig.knownModels?.length
    ? agentConfig.knownModels.map((m) => ({ id: m.id, l: m.label, p: m.provider }))
    : FALLBACK_MODELS;

  const handleSelect = (agentId: string, val: string) => {
    setSelMap((p) => ({ ...p, [agentId]: val }));
  };

  const resetMC = (agentId: string) => {
    const ag = agentConfig.agents.find((a) => a.id === agentId);
    if (ag) setSelMap((p) => ({ ...p, [agentId]: ag.model }));
  };

  const applyModel = async (agentId: string) => {
    const model = selMap[agentId];
    if (!model) return;
    setStatusMap((p) => ({ ...p, [agentId]: { cls: 'pending', text: '⟳ 提交中…' } }));
    try {
      const r = await api.setModel(agentId, model);
      if (r.ok) {
        setStatusMap((p) => ({ ...p, [agentId]: { cls: 'ok', text: '✅ 已提交，Gateway 重启中（约5秒）' } }));
        toast(agentId + ' 模型已更改', 'ok');
        setTimeout(() => loadAgentConfig(), 5500);
      } else {
        setStatusMap((p) => ({ ...p, [agentId]: { cls: 'err', text: '❌ ' + (r.error || '错误') } }));
      }
    } catch {
      setStatusMap((p) => ({ ...p, [agentId]: { cls: 'err', text: '❌ 无法连接服务器' } }));
    }
  };

  const updateChField = (agentId: string, field: keyof ChannelDraft, val: string) => {
    setChMap((p) => ({ ...p, [agentId]: { ...p[agentId], [field]: val } }));
  };

  const isChChanged = (agentId: string) => {
    const ag = agentConfig.agents.find((a) => a.id === agentId);
    const draft = chMap[agentId];
    if (!ag || !draft) return false;
    const cur = ag.channel;
    if (!cur) return !!(draft.platform && draft.channelId);
    return (
      draft.platform !== (cur.platform || '') ||
      draft.guildId !== (cur.guildId || '') ||
      draft.channelId !== (cur.channelId || '') ||
      draft.label !== (cur.label || '')
    );
  };

  const applyChannel = async (agentId: string) => {
    const draft = chMap[agentId];
    if (!draft?.platform) return;
    setChStatus((p) => ({ ...p, [agentId]: { cls: 'pending', text: '⟳ 保存中…' } }));
    try {
      const r = await api.setChannel(agentId, {
        platform: draft.platform,
        guildId: draft.guildId || undefined,
        channelId: draft.channelId || undefined,
        label: draft.label || undefined,
      });
      if (r.ok) {
        setChStatus((p) => ({ ...p, [agentId]: { cls: 'ok', text: '✅ 渠道已保存' } }));
        toast(agentId + ' 渠道已更新', 'ok');
        setTimeout(() => loadAgentConfig(), 1500);
      } else {
        setChStatus((p) => ({ ...p, [agentId]: { cls: 'err', text: '❌ ' + (r.error || '错误') } }));
      }
    } catch {
      setChStatus((p) => ({ ...p, [agentId]: { cls: 'err', text: '❌ 无法连接服务器' } }));
    }
  };

  const resetChannel = (agentId: string) => {
    const ag = agentConfig.agents.find((a) => a.id === agentId);
    if (ag) setChMap((p) => ({ ...p, [agentId]: emptyDraft(ag.channel) }));
    setChStatus((p) => {
      const n = { ...p };
      delete n[agentId];
      return n;
    });
  };

  return (
    <div>
      <div className="model-grid">
        {agentConfig.agents.map((ag) => {
          const sel = selMap[ag.id] || ag.model;
          const changed = sel !== ag.model;
          const st = statusMap[ag.id];
          const draft = chMap[ag.id] || emptyDraft();
          const chSt = chStatus[ag.id];
          const chChanged = isChChanged(ag.id);
          const showChannelId = draft.platform === 'discord';
          return (
            <div className="mc-card" key={ag.id}>
              <div className="mc-top">
                <span className="mc-emoji">{ag.emoji || '🏛️'}</span>
                <div>
                  <div className="mc-name">
                    {ag.label}{' '}
                    <span style={{ fontSize: 11, color: 'var(--muted)' }}>{ag.id}</span>
                  </div>
                  <div className="mc-role">{ag.role}</div>
                </div>
              </div>

              {/* Model Section */}
              <div className="mc-cur">
                当前模型: <b>{ag.model}</b>
              </div>
              <select className="msel" value={sel} onChange={(e) => handleSelect(ag.id, e.target.value)}>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.l} ({m.p})
                  </option>
                ))}
              </select>
              <div className="mc-btns">
                <button className="btn btn-p" disabled={!changed} onClick={() => applyModel(ag.id)}>
                  应用
                </button>
                <button className="btn btn-g" onClick={() => resetMC(ag.id)}>
                  重置
                </button>
              </div>
              {st && <div className={`mc-st ${st.cls}`}>{st.text}</div>}

              {/* Channel Section */}
              <div style={{ borderTop: '1px solid var(--border, #333)', marginTop: 10, paddingTop: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>
                  消息渠道
                  {ag.channel?.channelId && (
                    <span style={{ marginLeft: 6, color: 'var(--accent, #6a9eff)' }}>
                      {ag.channel.label || `channel:${ag.channel.channelId}`}
                    </span>
                  )}
                </div>
                <select
                  className="msel"
                  value={draft.platform}
                  onChange={(e) => updateChField(ag.id, 'platform', e.target.value)}
                  style={{ marginBottom: 4 }}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
                {showChannelId && (
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    <input
                      className="msel"
                      type="text"
                      placeholder="服务器 ID (Guild ID)"
                      value={draft.guildId}
                      onChange={(e) => updateChField(ag.id, 'guildId', e.target.value)}
                      style={{ flex: 1, fontSize: 12, padding: '4px 6px' }}
                    />
                    <input
                      className="msel"
                      type="text"
                      placeholder="频道 ID (Channel ID)"
                      value={draft.channelId}
                      onChange={(e) => updateChField(ag.id, 'channelId', e.target.value)}
                      style={{ flex: 1, fontSize: 12, padding: '4px 6px' }}
                    />
                  </div>
                )}
                <input
                  className="msel"
                  type="text"
                  placeholder="备注 (如: 我的服务器 / #太子殿)"
                  value={draft.label}
                  onChange={(e) => updateChField(ag.id, 'label', e.target.value)}
                  style={{ marginBottom: 4, fontSize: 12, padding: '4px 6px' }}
                />
                <div className="mc-btns">
                  <button className="btn btn-p" disabled={!chChanged} onClick={() => applyChannel(ag.id)}>
                    保存渠道
                  </button>
                  <button className="btn btn-g" onClick={() => resetChannel(ag.id)}>
                    重置
                  </button>
                </div>
                {chSt && <div className={`mc-st ${chSt.cls}`}>{chSt.text}</div>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Change Log */}
      <div style={{ marginTop: 24 }}>
        <div className="sec-title">变更日志</div>
        <div className="cl-list">
          {!changeLog?.length ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>暂无变更</div>
          ) : (
            [...changeLog]
              .reverse()
              .slice(0, 15)
              .map((e, i) => (
                <div className="cl-row" key={i}>
                  <span className="cl-t">{(e.at || '').substring(0, 16).replace('T', ' ')}</span>
                  <span className="cl-a">{e.agentId}</span>
                  <span className="cl-c">
                    <b>{e.oldModel}</b> → <b>{e.newModel}</b>
                    {e.rolledBack && (
                      <span
                        style={{
                          color: 'var(--danger)',
                          fontSize: 10,
                          border: '1px solid #ff527044',
                          padding: '1px 5px',
                          borderRadius: 3,
                          marginLeft: 4,
                        }}
                      >
                        ⚠ 已回滚
                      </span>
                    )}
                  </span>
                </div>
              ))
          )}
        </div>
      </div>
    </div>
  );
}
