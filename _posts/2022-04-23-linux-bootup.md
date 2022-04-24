---
layout: post
tags: [embedded, linux, performance]
title: "Improving Klipper startup time"
---

I'm running Klipper & Octoprint on my Orange Pi Zero to control my 3d printer.
Sometimes Klipper breaks, and power needs to be cycled to fix things.

One big problem is that Klipper needs to be running all the time to control the
hotend fan, since leaving it off for too long when the hotend is hot can cause
clogs. At the moment, klipper only starts up 23s after the power is applied, as
shown by `systemd-analyze plot`.

## `klipper.service`

All that klipper needs is a TTY and /tmp, so it doesn't make sense to wait for
the network.

In my case, the TTY is `/dev/ttyS1`. So I needed to replace the `After=` in my
service file with `After=dev-ttyS0.device`.

However, systemd adds the `sysinit.target` target as a dependency to all
services by default. We know better here, since klipper has such limited
dependencies. We can override this using `DefaultDependencies=no`.

But when we're telling it we're smarter than it, we have to also tell it we
need a filesystem. An additional `After=local-fs.target` line must be added.

## `keyboard-setup.service`

Not sure what this is, but this is a headless machine and doesn't require it.

## Results

Before, we started klipper at 23s from power-on.

After these changes, klipper starts at 9s from power-on.

Unfortunately, we can't do much about that. Systemd only starts executing units
at 7.2s, and Linux only finishes loading in at 5.5s. The initramfs is
compressed, but still takes up 9.4MiB--huge for a slow SD card.
