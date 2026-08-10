export async function consumeSse(response, onEvent) {
  if (!response.body) throw new Error("streaming response has no body");
  const decoder = new TextDecoder();
  let buffer = "";

  for await (const chunk of response.body) {
    buffer += decoder.decode(chunk, { stream: true });
    const frames = buffer.split(/\r?\n\r?\n/);
    buffer = frames.pop() ?? "";
    for (const frame of frames) parseFrame(frame, onEvent);
  }
  buffer += decoder.decode();
  if (buffer.trim()) parseFrame(buffer, onEvent);
}

function parseFrame(frame, onEvent) {
  const dataLines = [];
  for (const line of frame.split(/\r?\n/)) {
    if (line.startsWith(":")) continue;
    if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart());
  }
  if (dataLines.length === 0) return;
  const raw = dataLines.join("\n");
  if (raw === "[DONE]") return;
  onEvent(JSON.parse(raw));
}
