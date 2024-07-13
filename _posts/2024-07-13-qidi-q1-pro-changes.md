---
layout: post
tags: [ 3d-printing, fan, power-supply ]
title: "Qidi Q1 Pro modifications"
---

I recently got a Qidi Q1 Pro printer & am extremely happy with it. It works and prints perfectly
right out of the box, but I don't have anything useful to print right now and I want to play with my
new toy. So it's time to modify it!

There's a few tiny issues that I have with it:

- the camera picture is not perfectly evenly lit
- the camera sets the exposure based on the white print head, not on the work being printed.
- it makes sound even when idle due to the power supply fan

## Even lighting

I have extra V-shaped aluminum extrusion from under-cabinet kitchen lighting. It puts the LEDs at an
45° angle and has a diffuser.

Parts:

- [V-channel aluminum extrusion for LEDs 16x16x10mm](https://www.amazon.com/dp/B0733NN716)
- VHB tape (this stuff is good up to 93°C long-term!)

I cut the extrusion to length and applied the VHB backing. I then peeled the LED tape from the
printer chassis and moved it to the extrusion. Mounted the extrusion to the frame and firmly pressed
along the whole length to ensure a good bond.

{% include image.html
url="/assets/images/2024-07-13-qidi-q1-pro-changes/lightstrip.jpg"
description="Close-up of the installed light strip" %}

## Black tool cover

The tool cover is white, which is not great especially with the angled light strip since it means it
is much brighter than anything else in the printer & causes the auto-exposure to be incorrect. Even
white prints are not as bright as the tool cover.

Parts:

- Masking tape
- Sharp knife (exacto or utility knife)
- Black spray paint

Remove the cover & unplug the fan from the back panel. Unscrew the hex screws keeping the bottom
half of the cover attached to the top half and the screws holding the fan in place. Mask the fan
intake and partly reassemble. Mask the part cooling duct outlet, using the sharp knife to neatly
cut away the excess masking tape.

Spray paint the cover with several thin coats, waiting a few minutes between. I usually end up
getting impatient and putting the paint on too thick, but this time I waited & it really goes much
better.

{% include image.html
url="/assets/images/2024-07-13-qidi-q1-pro-changes/cover.jpg"
description="The fully painted front cover" %}

{% include image.html
url="/assets/images/2024-07-13-qidi-q1-pro-changes/cam.jpg"
description="Camera image after these changes" %}

It really looks a lot better in black. I'm not sure why Qidi didn't manufacture the cover
in black in the first place.

## Power supply fan

Even when idle, the power supply fan runs at full power. This can be fixed, but this modification
involves working with mains power, so it is not for those inexperienced with mains safety. See
[the article on this modification for details](/2024/fan-controller).

Parts:

- custom fan control board
- 10kΩ temperature sensor
- soldering iron & solder
- wire cutters
- wire strippers
- heatshrink/18650 wrap

{% include image.html
url="/assets/images/2024-07-13-qidi-q1-pro-changes/04-glue.jpg"
description="Fan control module in the power supply" %}
