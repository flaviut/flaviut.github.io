---
layout: post
tags: [hardware, fluid-dynamics, fan, coffee]
title: "Designing a fan for a coffee roaster"
---

I'm trying to improve the airflow through my repurposed popcorn popper coffee
roaster. At the moment, I need to continuously shake the roaster to get even
roasts, but I'd like to just set it and let it run.

The popcorn popper's fan is a small impeller on a 12V DC motor. The heating
element is used as a voltage divider to supply the motor.

{% include image.html
url="/assets/images/2022-11-27-blower-fan-shape/original.jpg"
description="The original impeller and (damaged) fan housing" %}

My first attempt was a propeller using [the Multipropv6.scad tool][multipropv6]
and the [goe244-il airfoil][goe244-il]. This came out far too small, had too
fine a pitch, and details too difficult to print.

[multipropv6]: https://www.techmonkeybusiness.com/articles/Parametric_Propellers.html

[goe244-il]: http://airfoiltools.com/airfoil/details?airfoil=goe244-il

{% include image.html
url="/assets/images/2022-11-27-blower-fan-shape/rev1.jpg"
description="The first attempt at a propeller" %}

A second, scaled up attempt came out much better, although the details and pitch
were still problematic:

{% include image.html
url="/assets/images/2022-11-27-blower-fan-shape/rev2.jpg"
description="The second attempt at a propeller" %}

However, once the popper is put back together, it becomes very clear that these
axial fans cannot perform with very restricted airflow in the popper.

## Alternate fan types

All the Google results are unfortunately useless sales pitches. I
did come across [a paper from the US Department of
Energy](https://www.nrel.gov/docs/fy03osti/29166.pdf)
which covers the different kinds of fan, as well various design considerations.

I also came across
some [fascinating experiments with different blower housings](https://woodgears.ca/dust_collector/housing.html)
and [impeller shapes](https://woodgears.ca/dust_collector/impeller.html).

## Impeller design

Switching to an impeller fan yielded much better results. One interesting thing
I found was that bigger is not always better. With the RS-365SH-2080 motor that
I've been using, I get much better results with a smaller impeller:

{% include image.html
url="/assets/images/2022-11-27-blower-fan-shape/comparison.jpeg"
description="Suction for of these two impellers" %}

I measured the suction force using a kitchen scale and holding the blower as
close as possible to the scale. These impellers are 3d printed, and
made [using this OpenSCAD script][impeller].

[impeller]: https://www.printables.com/model/332344-parametric-centrifugal-blower-impeller

I then came across [The Fan Handbook][fanhandbook], which is a great resource
and provides design guidance & equations. I haven't gotten to performing these
equations yet, but they seem like a good next step when I pick this project up
again.
