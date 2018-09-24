---
layout: post
tags: []
title: "Connecting to GSU's HPC cluster from Linux"
---

# Connecting to GSU's HPC cluster from Linux

GSU puts their HPC cluster behind a firewall, so it's impossible to SSH in from
the public internet. Fortunately they provide a VPN service to enter the
network with, which is publicly available at secureaccess.gsu.edu.

Unfortunately, they don't provide instructions on how to use this service from
Linux.

The [openconnect][] project implements the VPN protocol needed, so install it
with your distribution's package manager, and use it to log in:

[openconnect]: http://www.infradead.org/openconnect/index.html

```console
$ sudo apt install openconnect  # Ubuntu/Debian
$ sudo dnf install openconnect  # Fedora
$ sudo pacman -S openconnect  # Arch Linux
$ sudo openconnect secureaccess.gsu.edu
POST https://secureaccess.gsu.edu/
Connected to 131.96.5.6:443
SSL negotiation with secureaccess.gsu.edu
Connected to HTTPS on secureaccess.gsu.edu
XML POST enabled
Please enter your username and password.
GROUP: [Off Campus|On Campus|Wireless|vCRM]:Off Campus
POST https://secureaccess.gsu.edu/
XML POST enabled
Please enter your username and password.
Username:<campus id>
Password:
POST https://secureaccess.gsu.edu/
Got CONNECT response: HTTP/1.1 200 OK
CSTP connected. DPD 30, Keepalive 20
Connected as 131.96.253.123, using SSL
Established DTLS connection (using GnuTLS). Ciphersuite (DTLS0.9)-(DHE-RSA-4294967237)-(AES-256-CBC)-(SHA1).
```

This works, but there's some caveats:

 - You need to enter your credentials manually
 - All the traffic on your machine will pass through the tunnel

You can stop here if you'd like; at this point you can ssh to hpclogin.gsu.edu
without a problem. But I like automated solutions, and I don't trust GSU with
all my traffic.

## Making it non-interactive

First, let's make it non-interactive:

```console
# cat /root/gsu_password | \
  openconnect --authgroup 'Off Campus' \
              --user '<campus id>' \
              --non-inter \
              --passwd-on-stdin \
              secureaccess.gsu.edu
```

Your GSU password should be in `/root/gsu_password`, and that file should be
locked down to something like `0600`: allow root to read/write, deny access to
everyone else. Storing a password in a file like this is not nice, but it's the
only option for non-interactivity. From what I can tell, the service doesn't
offer any kind of key-based authentication.

## Only tunnel GSU-related traffic

And then, to avoid tunneling all traffic through the GSU network, we must first
find GSU's subnet:

```console
$ nslookup hpclogin.gsu.edu
Server:         2606:4700:4700::1111
Address:        2606:4700:4700::1111#53

Non-authoritative answer:
Name:   hpclogin.gsu.edu
Address: 131.96.171.80
```

The address listed here can then be looked up to check the size of the subnet
GSU owns: https://whois.arin.net/rest/net/NET-131-96-0-0-1/pft. In this case,
GSU owns a `/16`, so create a `/etc/vpnc/connect.d/gsu-routes.sh` file, and set
the relevant environment variables:

```sh
# Initialize empty split tunnel list
export CISCO_SPLIT_INC=0

# Delete DNS info provided by VPN server to use internet DNS
# Comment following line to use DNS beyond VPN tunnel
unset INTERNAL_IP4_DNS

# Only tunnel the GSU subnet
export CISCO_SPLIT_INC_0_ADDR=131.96.0.0 \
       CISCO_SPLIT_INC_0_MASK=255.255.0.0 \
       CISCO_SPLIT_INC_0_MASKLEN=16
```

## Testing it out

Putting it all together:

```console
$ sudo sh -c \
       'cat /root/gsu_password | \
           openconnect --authgroup "Off Campus" \
                       --user "<campus id>" \
                       --non-inter \
                       --passwd-on-stdin \
                       secureaccess.gsu.edu'
POST https://secureaccess.gsu.edu/
Connected to 131.96.5.6:443
SSL negotiation with secureaccess.gsu.edu
Connected to HTTPS on secureaccess.gsu.edu
XML POST enabled
Please enter your username and password.
POST https://secureaccess.gsu.edu/
XML POST enabled
Please enter your username and password.
POST https://secureaccess.gsu.edu/
Got CONNECT response: HTTP/1.1 200 OK
CSTP connected. DPD 30, Keepalive 20
Connected as 131.96.253.123, using SSL
Established DTLS connection (using GnuTLS). Ciphersuite (DTLS0.9)-(DHE-RSA-4294967237)-(AES-256-CBC)-(SHA1).
```

And check to make sure that the routes are properly set, i.e. that the default
route is not via `tun0`:

```console
$ ip route                                                                                            ✘ 130 
default via 192.168.0.1 dev enp3s0 src 192.168.0.18
default via 192.168.0.1 dev enp3s0 proto dhcp src 192.168.0.18 metric 1024
131.96.0.0/16 dev tun0 scope link
```

And to test that it is possible to connect to the HPC cluster:

```console
$ ssh <campus id>@hpclogin.gsu.edu
|--------------------------------------------------------
| Hello ftamas1,
| You are now logged into GSU's ACoRE HPC resource.
| Documentation is located at http://help.rs.gsu.edu
...
```
