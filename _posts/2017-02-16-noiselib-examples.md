---
layout: post
title: noiselib example outputs
description: "Pictures of outputs from noiselib"
---

I planned to write a game nearly 3 years ago (wow, it's already been 3 years!).
A core concept in that game was that the world be procedurally generated, so I
decided that I had to implement several algorims for procedural generation.

[flaviut/noiselib][] is the result of that effort. I never actually wrote my
game, and I never implemented any other game mechanics.

Anyway, I recently decided to [publish lots of examples][noiselib-site] of the
kind of noise that it can generate. I'm particularly happy with this sample,
"[White Noise with FBM][wnfbm-ref]": 

{% include image.html
    url="/assets/images/2017-02-16-noiselib-examples/1.png" %}

I've never seen anything like it, although it isn't anything special. The
general focus is on using [FBM][] with [perlin noise][], since it generates
realistic terrain.

[flaviut/noiselib]: https://github.com/flaviut/noiselib
[noiselib-site]: https://flaviutamas.com/noiselib/
[wnfbm-ref]: https://flaviutamas.com/noiselib/#White.noise.with.FBM
[FBM]: https://en.wikipedia.org/wiki/Fractional_Brownian_motion
[perlin noise]: https://en.wikipedia.org/wiki/Perlin_noise
