---
layout: post
tags: [teardown, power-supply, hardware]
title: "Taking apart a failed 10W LED bulb"
---

## The bulb

I've had a GE LED11DAV3/827W bulb in the hallway for quite a while, but it has
the habit of flickering on & off almost immediately after flipping the switch.

I was curious about what was causing this, so I decided to take it apart.

## PSU PCB

Here are some shots of the power PCB after carefully removing the glass cover &
the heat transfer potting:

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_1.jpg"
    description="Bottom of main PCB" %}

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_4.jpg"
    description="Top of main PCB, with BJT model number" %}

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_5.jpg"
    description="Top of main PCB, with coupled inductor model number" %}

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_7.jpg"
    description="Side view of main PCB, with bulk capacitor model number" %}

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_2.jpg"
    description="Top of rectification PCB" %}

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_3.jpg"
    description="Bottom of rectification PCB" %}

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_6.jpg"
    description="Side view of rectification PCB, with output filter model number" %}

## Cause of failure

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/pic_8.jpg"
    description="Heat discoloration of bulk capacitor heatshrink" %}

It's hard to say what the real cause of failure was here. The bulk capacitor
obviously doesn't look too great, but measuring it gives the correct value. The
BJT also seems to measure correctly.

I'm unable to connect the board to power and test it that way since the
mechanical forces involved in disassembling the bulb have lifted quite a few
traces & broken the board in half.

Unfortunately it looks like there's no way to figure out what failed.

## Schematic

{% include image.html
    url="/assets/images/2019-04-02-failed-led-teardown/schematic/schematic.svg"
    description="Power supply schematic" %}
