type LLMConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export async function chatCompletion({ config, messages }: { config: LLMConfig; messages: { role: 'system'|'user'|'assistant', content: string }[] }) {
  const url = config.baseUrl.replace(/\/$/, '') + '/chat/completions';
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.3 })
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`LLM 调用失败: ${res.status} ${t}`);
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? '';
  return content as string;
}

