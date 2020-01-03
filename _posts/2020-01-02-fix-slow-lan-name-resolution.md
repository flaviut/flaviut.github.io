---
layout: post
tags: [linux, networking]
title: "Fix Slow Local Name Resolution"
---

I was having some trouble with it takeing about 10 seconds to resolve names on
the local network like `tight-seat.local`.

My network stack is systemd-networkd and systemd-resolved, and it turns out
that the issue here is that both these programs default to enabling
[LLMNR](https://en.wikipedia.org/wiki/Link-Local_Multicast_Name_Resolution), a
protocol invented by Microsoft that failed to be standardized because the
standardization bodies realized that
[mDNS already existed and didn't have massive security
flaws](https://www.eiman.tv/blog/posts/lannames/#the-ietf-debacle).

Microsoft-bashing aside, the solution is to disable LLMNR and enable mDNS.

The [Arch Linux wiki is very descriptive on this
issue](https://wiki.archlinux.org/index.php/Systemd-resolved#mDNS):

> By default systemd-resolved enables mDNS responder, but both systemd-networkd
> and NetworkManager do not enable it for connections
>
> …
>
> By default systemd-resolved enables LLMNR responder; systemd-networkd and
> NetworkManager enable it for connections.

The following `/etc/systemd/network/mdns.network` will disable LLMNR and enable
mDNS:

```
[Match]
Name=enp* wlp*

[Network]
MulticastDNS=true
LLMNR=false
```

And that's it.
