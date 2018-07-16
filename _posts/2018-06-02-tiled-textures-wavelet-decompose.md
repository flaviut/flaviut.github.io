---
layout: post
tags: [design]
title: 'Generating tileable textures with wavelet decompose'
---

When redesigning this website, I wanted a subtle paper background texture. I
couldn't find anything online that fit my needs, and honestly, I wanted to try
doing it myself.

So I got out my camera, set it to RAW[^1], and took a super-closeup picture of
a sheet of paper. I got this:

{% include image.html
    url="/assets/images/2018-06-02-tiled-textures-wavelet-decompose/initial.jpeg"
    description="I promise the paper grain is in there!" %}

This is obviously not going to tile. First off, I don't have a fancy lighting
setup, so the light is inconstant throughout the image.

Fortunately, GIMP[^2] has a "wavelet decompose" filter (`Filters > Enhance >
Wavelet Decompose`). This splits the image into several levels of detail to be
edited individually.

{% include image.html
    url="/assets/images/2018-06-02-tiled-textures-wavelet-decompose/decompose_layers.png"
    description="Output of the wavelet decompose filter." %}

You'll notice that all the crazy lighting is on the "Residual" layer. So just
get rid of that, and BAM:

{% include image.html
    url="/assets/images/2018-06-02-tiled-textures-wavelet-decompose/clean.jpeg"
    description="Cleanly lit image." %}

My next steps were to find a boring, in-focus area, cut it out, and colorize it
to `#dcd6c8`. That's it! You can see the result in the background of this page.


### But wait, there's more!

You're also not limited to just fixing inconsistent lighting in homogeneous
pictures. Here's an example where I've boosted the darks on only the
background:

{% include image.html
    url="/assets/images/2018-06-02-tiled-textures-wavelet-decompose/darker_blacks.jpeg"
    description="Effects of darkening the blacks. Residuals only sides, full image center." %}

I'm not sure how useful it is in this specific example, but there's way more to
this filter [than removing blemishes][rm-blemish].


[^1]: I tried JPEG first, but the artifacts were unacceptable, and for the stuff we'll be doing here we need the full 32-bit channels.
[^2]: GIMP looks amazing now, and is way faster than last time I used it.
[rm-blemish]: http://registry.gimp.org/node/11742
