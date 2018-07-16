---
layout: post
tags: [virtualization, linux, docker, networking]
title: Making Docker and hostapd work together
description: "How I debugged and fixed an issue where launching the Docker service would break the internet connection for WiFi clients."
---

At some point, I ran `pacman -Syu` and was surprised to see that I could no
longer connect to the internet from my phone! I use [hostapd][] to use my
desktop PC as a wireless hotspot, and something in the update broke my
configuration.

I soon discovered that if I disabled the [Docker][] service, then my WiFi would
work fine after I restarted my system, but break when I started Docker! So it
was some sort of interaction between Docker and the rest of my system.

[hostapd]: https://w1.fi/hostapd/
[docker]: https://www.docker.com/

At first, I thought that the additional `docker0` was causing some sort of
weird interactions with hostapd. I ran `ip route` and `ip addr` before and
after starting Docker to see exactly what Docker had changed, and found that it
was adding a bridge interface named `docker0`. I didn't think that it was
interfering with anything, as it was using an unused subnet, but I deleted it
anyway: `sudo ip link set docker0 down; sudo brctl delbr docker0`. Still
broken.

I was stuck here for a while. But then I remembered that iptables existed. My
initial reaction was to uninstall iptables, but as it turns out, iptables is a
critical component of my system:

```console
$ sudo pacman -R iptables
checking dependencies...
error: failed to prepare transaction (could not satisfy dependencies)
:: iproute2: removing iptables breaks dependency 'iptables'
:: libvirt: removing iptables breaks dependency 'iptables'
:: systemd: removing iptables breaks dependency 'iptables'
```

So I ran `sudo iptables -S` ([DigitalOcean's docs are
great][do-iptables]) before and after starting Docker the same way as before,
and found that Docker changed the rules from

```
-P INPUT ACCEPT
-P FORWARD ACCEPT
-P OUTPUT ACCEPT
```

to

```
-P INPUT ACCEPT
-P FORWARD DROP
-P OUTPUT ACCEPT
-N DOCKER
-N DOCKER-ISOLATION
-A FORWARD -j DOCKER-ISOLATION
-A FORWARD -o docker0 -j DOCKER
-A FORWARD -o docker0 -m conntrack --ctstate RELATED,ESTABLISHED -j ACCEPT
-A FORWARD -i docker0 ! -o docker0 -j ACCEPT
-A FORWARD -i docker0 -o docker0 -j ACCEPT
-A DOCKER-ISOLATION -j RETURN
```

[do-iptables]: https://www.digitalocean.com/community/tutorials/how-to-list-and-delete-iptables-firewall-rules

The new configuration drops all packets passing through `br-inet`, which
explains why my phone was unable to connect to the internet. The fix is
straightforward: *just tell iptables to allow packets to be forwarded through
`br-inet` by running `sudo iptables -A FORWARD -i br-inet -j ACCEPT`*.

Well, then I had to make this happen automatically at startup. I found [this
superexchange answer][su-ans], and `sudo iptables-save | sudo tee
/etc/iptables/iptables.rules` quickly took care of that.

[su-ans]: https://superuser.com/a/1104399

After a reboot everything works as expected: my phone has internet, and so do
my docker containers and system.
