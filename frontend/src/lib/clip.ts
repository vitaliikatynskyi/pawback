import { pipeline, env } from '@xenova/transformers';

env.allowLocalModels = false;

type ExtractorPipeline = Awaited<ReturnType<typeof pipeline<'image-feature-extraction'>>>;
let extractor: ExtractorPipeline | null = null;

async function getExtractor(): Promise<ExtractorPipeline> {
  if (!extractor) {
    extractor = await pipeline('image-feature-extraction', 'Xenova/clip-vit-base-patch32');
  }
  return extractor;
}

export async function getImageEmbedding(file: File): Promise<number[]> {
  const pipe = await getExtractor();
  const url = URL.createObjectURL(file);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const output = await (pipe as any)(url, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
  } finally {
    URL.revokeObjectURL(url);
  }
}
