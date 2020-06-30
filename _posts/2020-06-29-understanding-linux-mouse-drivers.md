---
layout: post
tags: [linux, hid, hardware, driver]
title: "Understanding scrolling and hi-res scrolling on Linux"
---

I've recently purchased a Logitech MX Master 3. One of the cool features is
that it supports smooth & high resolution scrolling: it can turn a barely
perceptable movement of the scroll wheel into a pixel or two of scroll.

However, when I scroll inside Firefox, I get 3 lines of movement every so
often! And I need to wait what feels like 100ms between moving the scroll wheel
and seeing the page move. Unacceptable!

## The Mouse

First order of business is to see if my mouse actually supports high-resolution
scrolling. [Pavel came up with a really neat Arduino solution][ard-dump-usb] to
dump the USB HID packets, but I don't have that hardware. Fortunately, I'm on
Linux, so it's possible to just politely ask to see the packets! [And that's
exactly what `usbhid-dump` does][usbhid-dump].

[ard-dump-usb]: https://pavelfatin.com/scrolling-with-pleasure/#pointer-precision
[usbhid-dump]: https://github.com/DIGImend/usbhid-dump

But first, I need to figure out which of the devices was my mouse:

```
$ lsusb
...
Bus 001 Device 018: ID 05e3:0610 Genesys Logic, Inc. 4-port hub
Bus 001 Device 020: ID 046d:c52b Logitech, Inc. Unifying Receiver
Bus 001 Device 016: ID 05e3:0610 Genesys Logic, Inc. 4-port hub
...
```

Great! It's device 20 on bus 1. That gets turned into `sudo usbhid-dump -s 1:20
-f -e stream`, and it's dumping packets:

```
Starting dumping interrupt transfer stream
with 1 minute timeout.

001:020:002:STREAM             1593475543.943522
 20 01 02 00 00 00 40 00 00 00 00 00 00 00 00

.001:020:002:STREAM             1593475543.953238
 20 01 02 00 00 FF 4F 00 00 00 00 00 00 00 00

.001:020:002:STREAM             1593475543.959546
 20 01 02 00 00 FF 4F 00 00 00 00 00 00 00 00
```

But what does it mean? Looks like just gibberish hex digits & a unix timestamp
to me. Fortunately, the `usbhid-dump` readme points us towards [`hidrd`, a
program that will parse the USB HID descriptors][hidrd] for us! As it turns
out, each USB HID device first prints out some kind of binary string that
explains what every field in every message it sends means. That way the USB HID
prorocoal is truly extensible, and allows us to both [report being
robbed][duress-alarm] *and* [turn on the AC][climate], all with the same bit of
hardware!

[hidrd]: https://github.com/DIGImend/hidrd
[duress-alarm]: https://github.com/DIGImend/hidrd/blob/7e94881a6059a824efaed41301c4a89a384d86a2/db/usage/id_consumer.m4#L157
[climate]: https://github.com/DIGImend/hidrd/blob/7e94881a6059a824efaed41301c4a89a384d86a2/db/usage/id_consumer.m4#L150

Following the instructions in the [`usbhid-dump`] readme still, we get to see
what the fancy mouse supports:

```
$ sudo usbhid-dump -s1:17 | grep -v : | xxd -r -p | hidrd-convert -o spec
Usage Page (FF00h),                     ; FF00h, vendor-defined
Usage (01h),
...
Usage Page (Desktop),                   ; Generic desktop controls (01h)
Usage (Mouse),                          ; Mouse (02h, application collection)
Collection (Application),
    Report ID (2),
    Usage (Pointer),                    ; Pointer (01h, physical collection)
    Collection (Physical),
        Report Count (16),
        Report Size (1),
        Logical Minimum (0),
        Logical Maximum (1),
        Usage Page (Button),            ; Button (09h)
        Usage Minimum (01h),
        Usage Maximum (10h),
        Input (Variable),
        Report Count (2),
        Report Size (12),
        Logical Minimum (-2047),
        Logical Maximum (2047),
        Usage Page (Desktop),           ; Generic desktop controls (01h)
        Usage (X),                      ; X (30h, dynamic value)
        Usage (Y),                      ; Y (31h, dynamic value)
        Input (Variable, Relative),
        Report Count (1),
        Report Size (8),
        Logical Minimum (-127),
        Logical Maximum (127),
        Usage (Wheel),                  ; Wheel (38h, dynamic value)
        Input (Variable, Relative),
        Report Count (1),
        Usage Page (Consumer),          ; Consumer (0Ch)
        Usage (AC Pan),                 ; AC pan (0238h, linear control)
        Input (Variable, Relative),
    End Collection,
End Collection,
...
```

Great! So each message is shaped like this:

```c
struct USBMessage {
    bool button1 : 1;
    bool button1 : 1;
    ...
    bool button16 : 1;
    int x : 12;
    int y : 12;
    char scroll : 8;
    char pan : 8.
}
```

When we look at the output of `usbhid-dump -s 1:20 -f -e stream` again, we can
see that the message definition seems to match up with the actual reported
message. And we can see that when we scroll, the messages come in right after
the other, and there's no delay between events:

```
.001:020:002:STREAM             1593476841.317263
 20 01 02 00 00 00 00 00 03 00 00 00 00 00 00

.001:020:002:STREAM             1593476841.333111
 20 01 02 00 00 00 00 00 03 00 00 00 00 00 00

.001:020:002:STREAM             1593476841.349126
 20 01 02 00 00 00 00 00 02 00 00 00 00 00 00

.001:020:002:STREAM             1593476841.365116
 20 01 02 00 00 00 00 00 02 00 00 00 00 00 00
```

15ms reporting interval? Not amazing, but I'm not a pro gamer so I really don't
care. It's wireless!

But that eliminates the mouse hardware as the source of the crappy scrolling,
so let's move on to the Linux kernel!

## The Driver

First, let's see what the kernel is reporting for us. We can look at
`/dev/input/mouse0` ([which is apparently a crappy hack][mousedev]) using `cat
/dev/input/mouse0 | xxd -c 1`, so that it doesn't flood the terminal with
special characters.

When viewing `mouse0` simultaneously with `usbhid-dump`, it's clear that the
vast majority of scroll events are never reported to the application via this
interface. But this is still inconclusive: apparently there's more modern
interfaces that applications should be using these days.

[mousedev]: https://www.kernel.org/doc/html/v4.15/input/input.html#mousedev

And it turns out that Peter Hutterer is the person who's done a large portion
of the work in this area, and his blog mentions that [Linux now supports the
`REL_WHEEL_HI_RES` axis for mice][hi-res-scroll].

[hi-res-scroll]: https://who-t.blogspot.com/2020/04/high-resolution-wheel-scrolling-in.html

And that brings us to [the documentation on Linux input
events][linux-input-events], as well as [`evtest`, a tool for viewing input
events][evtest]. Surprise, Peter Hutterer strikes again! When we look at the
output from that, we can see that things are working properly:


```
$ evtest
...
..., -------------- SYN_REPORT ------------
..., type 2 (EV_REL), code 11 (REL_WHEEL_HI_RES), value -24
..., -------------- SYN_REPORT ------------
..., type 2 (EV_REL), code 11 (REL_WHEEL_HI_RES), value -16
..., -------------- SYN_REPORT ------------
..., type 2 (EV_REL), code 11 (REL_WHEEL_HI_RES), value -16
..., -------------- SYN_REPORT ------------
..., type 2 (EV_REL), code 11 (REL_WHEEL_HI_RES), value -24
..., type 2 (EV_REL), code 8 (REL_WHEEL), value -1
..., -------------- SYN_REPORT ------------
```

Thanks Peter!

[linux-input-events]: https://github.com/torvalds/linux/blob/b5aef86e089a2d85a6d627372287785d08938cbe/Documentation/input/event-codes.rst#ev_rel
[evtest]: https://cgit.freedesktop.org/evtest/

## What's Left

So if the issue isn't in the mouse, and the issue isn't in the kernel, what's
left?

As it turns out, Xorg also needs a driver to figure out how to talk to the
mouse! If I check the logs using `grep 'Using input driver'
~/.local/share/xorg/Xorg.0.log`, it turns out that, for me, that driver is
[libinput][]:

```
...
[ 35497.401] (II) Using input driver 'libinput' for 'Logitech MX Master 3'
[ 35497.410] (II) Using input driver 'libinput' for 'Logitech MX Master 3'
```

[libinput]: https://www.freedesktop.org/wiki/Software/libinput/

And when we search for `REL_WHEEL_HI_RES` in libinput, [we get nothing but
unused defines][li-rwhr], at least of today. Hopefully you get more results.
And, as you should have expected by now, Peter Hutterer is already way ahead of
us and [has sent in a merge request to get this functionality added][mr-hr].

[li-rwhr]: https://gitlab.freedesktop.org/search?utf8=%E2%9C%93&search=REL_WHEEL_HI_RES&group_id=1723&project_id=147&scope=&search_code=true&snippets=false&repository_ref=master&nav_source=navbar
[mr-hr]: https://gitlab.freedesktop.org/libinput/libinput/-/merge_requests/139
