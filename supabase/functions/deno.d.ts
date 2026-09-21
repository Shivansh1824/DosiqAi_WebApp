// Ambient type definitions to satisfy IDE TypeScript language servers for Supabase Edge Functions
declare const Deno: {
  serve: (handler: (req: Request) => Promise<Response> | Response) => void;
  env: {
    get: (key: string) => string | undefined;
  };
};

declare module 'https://*' {
  const content: any;
  export default content;
  export const createClient: any;
  export const encodeBase64: any;
}
