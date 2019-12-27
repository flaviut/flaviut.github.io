---
layout: post
tags: [linux, networking]
title: "Fixing broken name resolution after sleep"
---

I've been having trouble resolving domains on my laptop after resuming from
sleep, i.e. trying to load a website gets stuck forever since the system isn't
able to resolve "google.com" to "64.233.185.101".

I use [systemd-resolved][] on this system to do the work of resolving names.
Checking the logs shows that it's unable to start after waking:

[systemd-resolved]: https://www.freedesktop.org/software/systemd/man/systemd-resolved.service.html

```
systemd-resolved[4659]: Positive Trust Anchors:
systemd-resolved[4659]: . IN DS 19036 8 2 49aac11d7b6f6446702e54a1607371607a1a41855200fd2ce1cdde32f24e8fb5
systemd-resolved[4659]: . IN DS 20326 8 2 e06d44b80b8f1d39a95c0b0d7c65d08458e880409bbc683457104237c7f8ec8d
systemd-resolved[4659]: Negative trust anchors: 10.in-addr.arpa 16.172.in-addr.arpa <snip>
systemd-resolved[4659]: Using system hostname 'hot-sound'.
systemd-resolved[4659]: Failed to listen on UDP socket 127.0.0.53:53: Cannot assign requested address
systemd-resolved[4659]: Failed to start manager: Cannot assign requested address
```

A bit of further debugging shows it's not possible to bind to anything on
`127.0.0.0/8`, at any port:

```
$ python -c 'import socket; server = socket.socket(socket.AF_INET, socket.SOCK_STREAM); server.bind(("127.0.0.1", 4000))'
Traceback (most recent call last):
  File "<string>", line 1, in <module>
OSError: [Errno 99] Cannot assign requested address
```

Interesting… Well, let's take a look at the interfaces list:

```
$ ip addr
1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN group default qlen 1000
    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00
2: enp3s0f0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc fq_codel state DOWN group default qlen 1000
    link/ether f8:75:a4:2b:77:8d brd ff:ff:ff:ff:ff:ff
```

Well, that explains it! We don't actually have a loopback address! How can this
possibly happen? Turns out that the following [systemd-networkd][]
configuration from `/etc/systemd/networkd/*.network` is at fault:

```
[Match]
Name=*

[Network]
MulticastDNS=true
DHCP=yes
```

The intent here is to enable mDNS & DHCP on all interfaces without having to
configure each interface individually. However, it turns out that `lo` will
also match this glob!

The fix is to use `Name=wlp* enp*`, which provides the perfect level of
generality. And as a one-time fix, `sudo ip link set lo down && sudo ip link
set lo up` will get loopback working again without having to reboot.

[systemd-networkd]: https://www.freedesktop.org/software/systemd/man/systemd.network.html
