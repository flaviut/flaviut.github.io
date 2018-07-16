---
layout: post
title: Blocking rouge DHCP servers with firewalld
tags: [networking]
---

## Track down the servers

Open up Wireshark, and start a capture on the interface the rouge servers
operate on. Filter for "bootp", the DHCP protocol, and either perform your own
DHCP requests or wait for someone else to do some.

You'll get some output like this:

{% include image.html
    url="/assets/images/2018-07-16-block-rouge-dhcpd/wireshark.png"
    description="Wireshark screenshot, with the good server selected" %}

You'll need to figure out which of the servers is good, and which are bad.

A few hints:

- The source on DHCP Request is a client, not a server
- The source on DHCP ACK/NAK is a server
- The manufacturer of the server can often be determined from the MAC address

Once you have a reasonable guess for which server is correct, take a note of
the MAC address.

## Configuring firewalld

firewalld has multiple "zones", which are basically configuration sets, and
each zone has a set of rules. We'll be using the "public" zone to represent
external interface.

First, create a list of good devices, by MAC address:

```console
# firewall-cmd --permanent --new-ipset=good-routers --type=hash:mac
# firewall-cmd --permanent --ipset=good-routers --add-entry=00:19:b9:dc:41:c0
```

It's also possible to hard-code the devices in the rule, but by creating an
ipset, a couple goals are accomplished:

- the rule is more-or-less self-documenting
- if it's necessary to add another device, there's no need to add another
  identical rule

Then create a rule to drop all DHCP packets that don't come from our good
server list:

```console
# firewall-cmd --zone=public --permanant \
    --add-rich-rule='rule source NOT ipset=good-routers service name=dhcp drop'
```

This rule reads as "ignore each packet that's (not from good-routers and is on
the DHCP port)". There's also [some excellent reference material on the rule
syntax,][rich-syntax] so you can write your own rules, perhaps if you want to
use a blacklist instead.

[rich-syntax]: https://fedoraproject.org/wiki/Features/FirewalldRichLanguage#General_rich_rule_structure

The rule is now created in the zone, but interface needs to be added to the
zone so that the rules are applied. In my case, the external interface is
`enp6s0`, so to add the zone to this interface, run (unless you're using
CentOS/RHEL, then you also need to [do some extra stuff][centos-if]):

[centos-if]: https://access.redhat.com/discussions/1455033

```console
# firewall-cmd --zone public --add-interface enp6s0 --permanent
```

And then tell firewalld to load all the new rules:

```console
# firewall-cmd --reload
```
