---
layout: post
tags: [teardown, hardware]
title: "SpO2 Sensor Teardown"
---

I got my hands on a Masimo LNCS Adtx single-use adult SpO2 sensor and was
curious to see what's in there and why it's a $20 part.

It's very simple. There's a red LED:

{% include image.html
    url="/assets/images/2020-02-09-spo2-sensor-teardown/led.jpg"
    description="Closeup of the LED" %}

And a photodiode that ends up on the opposite side of the finger. The forward
voltage of the photodiode is 0.65V in my testing.

{% include image.html
    url="/assets/images/2020-02-09-spo2-sensor-teardown/photodiode.jpg"
    description="Closeup of the photodiode" %}

Also interesting is the shielding over the photodiode. Even the top of the
photodiode is shielded with thin copper wires cut out of the copper tape.

The shielding that surrounds the wires in the cable is soldered onto the back of
the copper tape.
