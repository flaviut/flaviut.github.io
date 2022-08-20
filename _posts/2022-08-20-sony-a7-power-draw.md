---
layout: post
tags: [hardware, embedded]
title: "Sony A7 camera power consumption"
---

A friend recently suggested that putting their Sony A7ii camera in airplane mode improved their battery life.

I don't have a Sony A7ii camera, but I do have an earlier model, the Sony A7, and the right gear to test this.

The setup:

{% include image.html
    url="/assets/images/2022-08-20-sony-a7-power-draw/setup.jpg"
    description="A photo of the test setup" %}

- 2 multimeters, one measuring current, one measuring voltage
- External battery pack, 2x LG INR18650HG2 in series
- Sony A7 camera

## Results

| Situation           | Description                                 | Power |
|---------------------|---------------------------------------------|-------|
| Sleep               | camera fully powered off                    | 39mW  |
| Deep sleep          | camera powered off for several minutes      | 14mW  |
| Viewfinder          | viewfinder in preview mode, auto brightness | 3.30W |
| Screen, +0          | in preview mode with default brightness     | 2.50W |
| Screen, -2          | min brightness                              | 2.43W |
| Screen, +2          | max brightness                              | 2.72W |
| Sensor off          | Menu, in sensor cleaning mode               | 1.12W |
| Airplane mode       |                                             | 2.51W |
| WiFi on             | in WPS push mode                            | 1.63W |
| Continuous shooting | RAW, holding the button down                | 4.59W |
| Shooting video      | 60i 24M, AVCHD compression                  | 4.22W |
| Video playback      |                                             | 1.79W |

## Analysis

Airplane mode has no impact on power draw. When transferring files wirelessly,
the camera shuts off the sensor and powers on the radio.

I was surprised to see that the viewfinder draws more power than the main
display. The main display shuts down when the viewfinder is being used.

## Caveats

My test setup isn't particularly accurate.

- There's 0.66Ω of resistance in the cabling
- I only made one measurement for each circumstance
- The external battery pack I'm using has batteries rated for 20A of continuous
  current; the internal battery pack will have much higher internal resistance
  and more energy wasted, especially at higher power usages
- I did not do a factory reset beforehand, so some of my settings may impact
  the data
- Shooting different subjects has different power consumption

However, I feel like the quality of the measurements is sufficient for relative comparisons.
