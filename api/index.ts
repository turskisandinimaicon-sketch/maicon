// @ts-ignore
import rawApp from "../dist/server.cjs";

const app = (rawApp as any).default || rawApp;

export default app;
