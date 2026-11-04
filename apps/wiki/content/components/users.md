## What it does

Users stands for the people on the internet who type your domain into a browser or open your app.

The Node sends every request kind in the current Era's mix (see [Eras](/eras)). Each request pays the user hop before it reaches your first Node. How many users you have depends on Apdex and growth, as [Users and growth](/explanation/users-and-growth) explains.

A domain resolves to one host, so Users take one routing link. To reach more than one App Server, link Users to [DNS](/components/dns) or a [Load Balancer](/components/lb) and let that Node split the traffic.

From the Series C Era, users live in four regions. Each region you open gets its own Users Node on its own tab. The [GeoDNS](/research/geo-dns) Research sends each region's users to their own region, or to the nearest live one.

## When to place it

You never place Users, and you cannot sell it. You act on its link instead. When the board refuses a second link from Users, one host is no longer enough. Put DNS or a Load Balancer in front of your App Servers.

## How it fails

Users never fail by themselves, but everything they reach can.

- If the one Node behind Users goes down, every request fails.
- In a [Certificate expired](/incidents/certificate) incident, every browser refuses the site until you renew the certificate. The [Certificate automation](/research/cert-automation) Research prevents it.
- In a [BGP misconfiguration](/incidents/bgp), a routing change withdraws your Company from the internet. Roll back the change to end it.
- A [Traffic spike](/incidents/spike), a [Bot surge](/incidents/bot-surge), and a [DDoS](/incidents/ddos) all arrive through Users.

:::Note{tone="real"}
Real browsers and resolvers cache a domain's answer, so a single A record really does send everyone to one address. See [DNS round robin](/glossary/dns-round-robin) and [BGP](/glossary/bgp-border-gateway-protocol).
:::

## Tips

- Link Users to a Load Balancer, not to an App Server, as soon as you can afford one.
- Put a CDN or WAF directly after Users: they work best at the edge.
