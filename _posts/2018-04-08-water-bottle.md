---
layout: post
title: "Forgot to fill your water bottle? Have your phone remind you! (HackGSU S18)"
---

{% include image.html
    url="/assets/images/2018-04-08-water-bottle/final.jpg"
    description="Our incredibly polished final product." %}

## How it works

Our goal is to measure the height of the water, so we turn the water bottle
into one big capacitor. By coincidence, this is exactly what I was covering in
Physics class at the time!

The equation for capacitance is [*C=εA/d*][cap-eq], where *ε* is some fundamental
constant (i.e. never change), *d* is the separation of the plates (never
changes), and *A* is the area of overlap between the two places (changes with
the water level). Of course, this is a simplification, but since we don't care
about exact numbers, just relationships, it will work for us.

So far, we've shown that the capacitance will change with the water level. But
how can we measure capacitance? The only way to do that is to charge the
capacitor up, and measure how long it takes to discharge.

{% include image.html
    url="/assets/images/2018-04-08-water-bottle/drawing.svg"
    description="Diagram of the bottle." %}

So that's what we did. We used [Paul Badger's Capacitive Sensing
Library][cap-lib], but here's the procedure:

1. Charge the capacitor fully.
2. Disconnect the battery and start discharging the capacitor by flipping
   *SW1*.
3. Start a timer.
4. Measure the voltage over *R1*.
5. When dV≈0V, stop the timer.
6. Repeat.

Of course, this doesn't give us capacitance in Farads. It gives us some value
which is[^1] proportional to capacitance. And if we have capacitance, we have
water volume, we just need to do some calibration.

[^1]: At the time we thought it was linearly proportional, but as shown by the equation *V(t)=V_0e^(-t/RC)*, the relationship is more complex.

[cap-eq]: https://en.wikipedia.org/wiki/Capacitance#Capacitors
[cap-lib]: http://playground.arduino.cc/Main/CapacitiveSensor

## Why it doesn't work

There were issues with this idea:

Touching the bottle or even looking at it broke everything. People are giant
bags of water, and they have significant capacitance. We were able to detect
when the user was handling the bottle using other sensors, but does us no good
when the user is just near the bottle.

The surface the bottle is placed on has a similar effect. Metal surfaces will
return different values from wood surfaces, which will return different values
from wet paper towels (and we had enough leakage to really require them!).
