export async function Hoyolab(cookie: signCookies) {
  const signstatus = await isSigned(cookie);
  console.log(signstatus);
  if (signstatus.retcode === 0 && signstatus.data.is_sign === false) {
    console.log(await sign(cookie));
  }
}

async function sign(cookie: signCookies) {
  const response = await fetch(
    "https://sg-hk4e-api.hoyolab.com/event/sol/sign?lang=zh-cn",
    {
      method: "POST",
      body: JSON.stringify({ act_id: "e202102251931481" }),
      headers: { Cookie: printCookies(cookie) },
    }
  );
  return response.json();
}

async function isSigned(cookie: signCookies): Promise<signstatus> {
  const response = await fetch(
    "https://sg-hk4e-api.hoyolab.com/event/sol/info?lang=zh-cn&act_id=e202102251931481",
    {
      method: "GET",
      headers: { Cookie: printCookies(cookie) },
    }
  );
  return response.json();
}

function printCookies(c: cookies) {
  return Object.entries(c)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

function parseSignCookies(rawCookies: string): signCookies {
  const cookies: cookies = Object.fromEntries(
    rawCookies.split("; ").map((kv) => kv.split("="))
  );
  if ("ltoken_v2" in cookies && "ltmid_v2" in cookies) {
    return {
      ltoken_v2: cookies.ltoken_v2,
      ltmid_v2: cookies.ltmid_v2,
    };
  } else {
    throw new Error("不符合的 cookies");
  }
}

type cookies = { [key: string]: string };

interface signCookies extends cookies {
  ltoken_v2: string;
  ltmid_v2: string;
}

type signstatus =
  | {
      retcode: 0;
      message: "OK";
      data: {
        total_sign_day: number;
        today: string;
        is_sign: boolean;
        first_bind: boolean;
        is_sub: boolean;
        region: "";
        month_last_day: boolean;
      };
    }
  | {
      retcode: -100;
      message: "Not logged in";
      data: null;
    };
