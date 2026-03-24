import { createLLM } from "runanywhere";

export const llm = await createLLM({
  model: "smollm2",
});

export async function askAI(prompt) {
  const res = await llm.generate({ prompt });
  return res.text;
}
