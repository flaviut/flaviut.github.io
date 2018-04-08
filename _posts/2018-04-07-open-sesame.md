---
layout: post
title: 'Open Sesame: Unlock doors… with your face (HackPrinceton S18)'
description: "Combining 3-d printing, Azure compute services, and Linux into a self-unlocking deadbolt"
---

I've spent 3/4 weekends over the past month developing various things for
hackathons, and one of the most interesting ideas that I've come across is
using [Azure's Face API][azure-face] in physical products.

At HackPrinceton this spring, Leon Wu, Imanuel Sonubi, Natasha
Hanley, and I developed [a deadbolt that would automatically unlock the door
when authorized users walk in front of the door][open-sesame]:

{% include image.html
    url="/assets/images/2018-04-07-open-sesame/final.jpg"
    description="Our final project (minus the laptop, which is just a temporary subsitute for a webcam)" %}

I first got started with this API at [BuildGT 2018][], where Kevin Aiken
brought up the idea of using facial recognition. Our project there, [Auto
Metrics][] analyzed customers entering a shop, and kept track of who they were
and whether or not they were were shoplifters.

[azure-face]: https://azure.microsoft.com/en-us/services/cognitive-services/face/
[BuildGT 2018]: https://buildgt-2018.devpost.com/
[Auto Metrics]: https://devpost.com/software/auto-metrics
[open-sesame]: https://devpost.com/software/open-sesame-dj0leg

## The hardware

Our initial plan was to build this on top of a [DragonBoard 410c][], but our
dreams were quickly cut short when we realized that we didn't have a USB
webcam. However, we did still want to be eligible for the "[Best IoT Hack Using
a Qualcomm Device][best-iot]" prize, so in the end we did (barely) incorporate
the board.

The most fun part of the hardware was designing our own components in FreeCAD,
a parametric CAD program, to be 3-d printed. Along with helping Leon with his
first time using any CAD software, I made the bolts (blue) to hold the motor in
and the fillet on the main frame (red):

{% include image.html
    url="/assets/images/2018-04-07-open-sesame/3d.png"
    description="Render of our components." %}

Of course, our design didn't actually work on the first try (although the 3d
print was perfect on the first try!). We should have moved the motor about
midway to the end of the deadbolt enclosure, but it was too late to wait for
that part to print again, so instead we sanded some off the teeth off the
deadbolt.

Otherwise, the rest of the hardware was pretty straightforward: code running on
the laptop (although easily portable to the DragonBoard), dragonboard proxying
commands to the knockoff Arduino over serial, the Arduino moving the stepper a
specific number of steps to open and close the deadbolt.

[DragonBoard 410c]: https://developer.qualcomm.com/hardware/dragonboard-410c
[best-iot]: https://hackprinceton-spr18.devpost.com/

## The software

There was also software, although nothing special. The code is [on github][],
so go get it. The face API allows 16KiB of metadata, so we used that to store
thumbnails, which we generated in the browser (based on [Joel Vardy's
code][jv-code], see [resize.js][]). This allowed us to serve the site as a
static site, which greatly simplified our deployment since there was no
database or backend. We did have to have the [azure secret keys][secret] on the
frontend, but hey, it's just gonna run on my machine and I trust me.

{% include image.html
    url="/assets/images/2018-04-07-open-sesame/mp.png"
    description="By the time I wrote this, the data was destoryed and the keys
    invalidated, so you'll have to use your imagination a little on how the
    main page used to look." %}

{% include image.html
    url="/assets/images/2018-04-07-open-sesame/au.png"
    description="The page for adding a new user looks just fine though!" %}

{% include image.html
    url="/assets/images/2018-04-07-open-sesame/art.jpg"
    description="Bonus picture: Mount Vesuvius and the Bay of Naples, as
    displayed at the Princeton University Art Museum." %}

[on github]: https://github.com/flaviut/hackprinceton-s2018
[jv-code]: https://github.com/joelvardy/javascript-image-upload
[resize.js]: https://github.com/flaviut/hackprinceton-s2018/blob/master/frontend/js/resize.js
[secret]: https://github.com/flaviut/hackprinceton-s2018/blob/master/frontend/js/azure.js#L12

