/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import cors from "@koa/cors";
import { initTRPC } from "@trpc/server";
import Koa from "koa";
import { createKoaMiddleware } from "trpc-koa-adapter";
import { z } from "zod";

const t = initTRPC.create();

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  greeting: publicProcedure
    // This is the input schema of your procedure
    // 💡 Tip: Try changing this and see type errors on the client straight away
    .input(
      z
        .object({
          name: z.string().nullish(),
        })
        .nullish()
    )
    .query(({ input }) => {
      // This is what you're returning to your client
      return {
        text: `hello from trpc: ${input?.name ?? "world"}`,
        // 💡 Tip: Try adding a new property here and see it propagate to the client straight-away
      };
    }),
});

// export only the type definition of the API
// None of the actual implementation is exposed to the client
export type AppRouter = typeof appRouter;

// create server
const app = new Koa();
const adapter = createKoaMiddleware({
  router: appRouter,
});
app.use(cors());
app.use(adapter);
app.listen(2022);
