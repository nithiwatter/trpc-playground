/**
 * This is the API-handler of your app that contains all your API routes.
 * On a bigger app, you will probably want to split this file up into multiple files.
 */
import cors from "@koa/cors";
import { initTRPC } from "@trpc/server";
import { applyWSSHandler } from "@trpc/server/adapters/ws";
import { observable } from "@trpc/server/observable";
import Koa from "koa";
import websocket from "koa-easy-ws";
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
  randomNumber: publicProcedure.subscription(() => {
    return observable<{ randomNumber: number }>((emit) => {
      let i = 0;

      const timer = setInterval(() => {
        if (i > 5) {
          clearInterval(timer);
          return;
        }

        i++;
        emit.next({ randomNumber: Math.random() });
      }, 200);

      return () => {
        clearInterval(timer);
      };
    });
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
const websocketMiddleware = websocket();
const websocketServer = websocketMiddleware.server;

// websocket
app.use(websocketMiddleware);
applyWSSHandler<AppRouter>({
  wss: websocketServer,
  router: appRouter,
});

// need this as koa-easy-ws does not create a ws server by default - it simply emits "connection" when there is an upgrade event
// applyWSSHandler handles attaching necessary events ex. "connection" to the ws server
app.use(async (ctx, next) => {
  if (ctx.ws) {
    return await ctx.ws();
  }

  await next();
});

// http
// NOTE: the adapter needs to be the last middleware as it does not call next()
app.use(cors());
app.use(adapter);

// silence to prevent koa default error logging
app.silent = true;
app.listen(2022);
