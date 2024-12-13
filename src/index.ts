import { Hoyolab } from "./mihoyo";

export default {
  async scheduled(event, env, ctx) {
    switch (event.cron) {
      case "0 0 * * *":
        await Hoyolab({ ltoken_v2: env.ltoken_v2, ltmid_v2: env.ltmid_v2 });
        return;
    }
  },
} satisfies ExportedHandler<Env>;
