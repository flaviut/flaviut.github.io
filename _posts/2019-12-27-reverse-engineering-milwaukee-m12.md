---
layout: post
tags: [hardware, teardown]
title: "Reverse Engineering Milwaukee M12 Battery Packs"
---

*Correction*: A previous version of this post said the resistors were 10Ω. They
are actually 1kΩ.

I was curious about what the insides of Milwaukee's M12 battery packs look
like, and it turns out it's fairly simple:

{% include image.html
    url="/assets/images/2019-12-27-reverse-engineering-milwaukee-m12/schematic.svg"
    description="Schematic for the M12 battery pack" %}

There's some things that aren't visible from the schematic:

- The connector pinout is done CCW, just like an IC.
- R1 and R2 are 0603 resistors, so consider that when load balancing.
- I had trouble reading the numbers on R1 & R2, so while I think it read "01B",
  it might have read something else.
- There's no part number on the NTC resistor, but it's 10kΩ at room
  temperature, roughly 8kΩ after rubbing it in my fingers, and 14kΩ after being
  cooled with acetone. I'd just go ahead and call anything under 2kΩ "overheated".
