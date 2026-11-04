## What it does

The WAF stands for a web application firewall such as ModSecurity with the OWASP Core Rule Set.

Place it in front of your App Servers. It takes every request kind and sends on what it lets through. It blocks a share of bots, and a smaller share of real users with them. Blocked users fail as `blocked`. See [WAF](/glossary/waf-web-application-firewall).

The **paranoia level** sets the tradeoff. A higher level blocks more bots, blocks more real users, and costs more CPU per request, so the WAF handles less traffic. Each size step doubles its capacity. It spans every zone.

**Under attack** mode challenges every request. It blocks nearly all junk, blocks some real users, and adds latency. Use it only while an attack lasts.

## When to place it

Place it when bots take a large share of your traffic and load your App Servers, or when logins spike from bots. The [Bots](/sandboxes/bots) Sandbox shows the symptom. It unlocks with [Web application firewall](/research/waf).

## How it fails

- Overloaded, it drops requests before they reach the App Servers. A high paranoia level makes this happen sooner.
- A high level blocks real users and costs revenue.
- [Regex backtracking](/incidents/regex): a new rule backtracks on long inputs, and every WAF runs out of CPU. Disable the rule to end it. See [ReDoS](/glossary/redos-regular-expression-denial-of-service).

Without a WAF, [Bot surge](/incidents/bot-surge), [Credential stuffing](/incidents/stuffing), and [DDoS](/incidents/ddos) hit harder and more often.

## Tips

- Start at the default level and raise it only when bots still get through.
- Turn Under attack mode off when the DDoS ends.
