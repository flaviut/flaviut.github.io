---
layout: post
tags: [ hardware, embedded, teardown ]
title: "Low cost digital spot welder teardown & review"
---

Despite the very good internet advice to not short a lithium ion battery, I decided to buy a cheap
spot welders that does exactly that.

## Circuit board

It has a 2-layer board, and it's obvious it's been through quite a few testing and optimization
iterations.

{% include image.html
url="/assets/images/2023-08-27-spot-welder-teardown/front.jpg"
description="The front of the main circuit board" %}

{% include image.html
url="/assets/images/2023-08-27-spot-welder-teardown/back.jpg"
description="The back of the main circuit board" %}

Selected part numbers:

- D7, D8, D10, D11, D12 - S4
- Q10 - Alpha&Omega AO4606
- Q6, Q7, Q8, Q9 - Infineon 5N04N010
- U1 - B6282
- chip near L4 - B6282
- U12 - TI LM358
- U2 - HICHON SM5308
- U7 - PC857
- U8 - XB8089D

## Modifications

I noticed some stray solder balls on the back of the board, which I was able to remove.

Silk screen was used as insulation where the battery was bolted to the board. That's probably good
enough, but I added some additional electrical tape insulation.

The programming and control headers are broken out and clearly labeled. I did not dig further, but I
suspect this device would be quite hackable.

## Battery testing

There are two battery cells in parallel. They are unmarked, but the listing claims 5Ah total, which
would come out to 2.5Ah per cell. The actual capacity seems to match the advertised capacity.

{% include image.html
url="/assets/images/2023-08-27-spot-welder-teardown/capacity.png"
description="Capacity test graph" %}

The missing 350mAh is reasonable, since these tests are typically done at a 0.2C discharge rate
(0.5A), while I did my testing at 0.4C or 1A.

Internal resistance seems to be about 8mΩ measured at 10A, although I don't know how accurate my
equipment is really. This comes out to 4mΩ when the cells are in parallel. I'm skeptical this will
reach the advertised 600-800A peak current, but the cells are optimized for high discharge rates.

## In-use testing

Works fine. I've welded a couple batteries and just some nickel strips. Good ergonomics and a
reasonable repetition rate. Sensitivity of the automatic detection is pretty much perfect.

UI is pleasant to use, and the manual is very helpful.
