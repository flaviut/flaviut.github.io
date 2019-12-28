---
layout: post
tags: [design, hardware]
title: "Making beautiful SVG schematics"
---

I really enjoy the way that the following schematic looks, so I might as well
document the process of creating it before I forget.

{% include image.html
    url="/assets/images/2019-12-27-making-beautiful-svg-schematics/schematic.svg"
    description="Example schematic" %}

## Software Used

- [Inkscape](https://inkscape.org/)
- [KiCad](https://www.kicad-pcb.org/)
- [SVGOMG](https://jakearchibald.github.io/svgomg/)

## Steps

Export the KiCad schematic to SVG by navigating to "File" → "Plot...".

Then select the output directory, SVG output, and output mode. Then "Plot
Current Page" to export the SVG:

{% include image.html
    url="/assets/images/2019-12-27-making-beautiful-svg-schematics/step1.png"
    description="Export settings" %}

The, in Inkscape, open the exported SVG. Delete everything but the schematic.
Then navigate to "File" → "Document Properties...":

{% include image.html
    url="/assets/images/2019-12-27-making-beautiful-svg-schematics/step2.png"
    description="Document Properties in menu" %}

For you, the document properties might pop up as a docked pane, but in my case
it came up as a floating window.

Click on "Resize page to content...", and then "Resize page to drawing or
selection":

{% include image.html
    url="/assets/images/2019-12-27-making-beautiful-svg-schematics/step3.png"
    description="Document Properties window" %}

Save the SVG file.

At this point, you're done, but to minify the SVG, upload the file to
[SVGOMG](https://jakearchibald.github.io/svgomg/) and play around with the
settings.

One particularly nice setting is "Prefer viewbox to width/height". This makes
the SVG scale to fit the window.

Alternatively, this can be done by just deleting the `width` and `height`
attributes of the `<svg>` element.
