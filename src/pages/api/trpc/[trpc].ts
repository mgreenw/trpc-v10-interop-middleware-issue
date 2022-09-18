import { initTRPC, router } from '@trpc/server';
import * as trpcNext from '@trpc/server/adapters/next';
import { z } from 'zod';

type Session = {
  userId: string;
}

type Context = {
  session?: Session
}

const t = initTRPC.context<Context>().create();

const childRouter = router<Context>().query('hello', {
  resolve() {
    return "hi";
  },
});

const legacyRouter = router<Context>()
  .middleware(({ ctx, next }) => {
    return next({ ctx: { ...ctx, session: { userId: '123' }} });
  })
  .merge('child.', childRouter)
  .query('hello', {
    input: z
      .object({
        text: z.string().nullish(),
      })
      .nullish(),
    resolve({ input }) {
      return {
        greeting: `hello ${input?.text ?? 'world'}`,
      };
    },
  })
  .interop();

const v10Router = t.router({
  foo: t.procedure.query(() => 'bar' as const),
});

const appRouter = t.mergeRouters(legacyRouter, v10Router);

// export type definition of API
export type AppRouter = typeof appRouter;

// export API handler
export default trpcNext.createNextApiHandler({
  router: appRouter,
  createContext: () => {
    return {

    }
  },
});
