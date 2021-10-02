---
layout: post
tags: [hardware, power-supply]
title: "Designing a DIY audio reciever"
---

There's four parts to an audio reciever:

- receiving the audio signal from a variety of sources. For this, I'll want
  input from:
  - Bluetooth (aptX prefered for best quality)
  - 3.5mm jack
  - HDMI eARC
- an audio mux or possibly even mixing the different audio sources together
- volume control
- output amplification

## Receiving

### 3.5mm jack

We'll want to convert this to digital, since doing so will simplify the rest of
our architecture: we won't need analog volume control, and we'll be able to
detect if we have signal coming in or not.

### Bluetooth

### HDMI ARC/eARC

This is the trickiest part. There's [an excellent whitepaper by Lattice][eARC],
and we should be able to use the 7-channel uncompressed mode for this. However,
this will require quite a bit of coding that has never been done in an
open-source way before.

There's chips like the SiI9437, but they have no publicly available datasheet.
The source code for their MCU is public however:
https://github.com/flaviut/sii9437

[eARC]: https://www.latticesemi.com/-/media/LatticeSemi/Documents/WhitePapers/AG/Lattice_eARC_WP_FINAL.ashx?document_id=52269

## Output amplification

The [TPA3116D2][] IC is a very cheap audio amplifier with plenty of power.
There's also a lot of (roughly $15) AliExpress modules using this IC, so that
saves all the work of designing and building the circuit.



[TPA3116D2]: https://www.ti.com/lit/ds/symlink/tpa3116d2.pdf
