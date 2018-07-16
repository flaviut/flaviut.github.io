---
layout: post
tags: [hackathon, hackgsu, hardware]
title: "Porta Potty Patrol: Detect dirty toilets (HackGSU F17)"
---


{% include image.html
    url="/assets/images/2017-11-11-porta-potty-patrol/logo.png" %}

I attended HackGSU again, and again had a great time and won second place! Our
(me, Jimmy Pham, and Lee Klarich) project was a toilet stall that detects when
it is dirty. Here's our prototype:

{% include image.html
    url="/assets/images/2017-11-11-porta-potty-patrol/prototype.jpg" %}

The source code is [availble on GitHub][source code].

## How it works

The way that we do that is really intersting. We take advantage of typical
human behavior, like not wanting to use a dirty stall. We detect the following
events:

 - the door is opened,
 - the door is closed,
 - the door is unlocked,
 - the door is locked.

Assuming that the stall door is self-closing, the the procedure that a typical
human goes through is:

  1. Open the door and look inside. Is it clean?
      1. No.
          1. Close the door and go to the next stall.
      2. Yes.
          1. Close the door.
          2. Lock the door.
          3. Use the stall.
          4. Unlock the door.
          5. Open the door.
          6. Close the door.

We consider the bathroom dirty if three people perform steps 1 to 1.1.1 in a
row.

## The prototype
The way that this project worked is actually very similar to our last project,
the [SmartBar][] ([my post][]). We used the accelerometer on the Arduino 101 to
detect door being slammed shut (our device used a pretty hefty spring to shut
the door). The graph from one closing looks like this:

{% include image.html
    url="/assets/images/2017-11-11-porta-potty-patrol/graph.png" %}

The physical construction of the "porta potty" was the most fun part of this
whole thing. It was made signficantly out of repurposed trash:

 - The cardboard came from packages that I've recieved.
 - The wood on the door was taken from a nearby construction dumpster (thank
   you people remodeling the Equitable Building!)
 - The "lock" was made out of a used Coca-Cola can, a piece of cardboard, and
   scrap drywall cornering from the dumpster.

It was really fun putting everything together, and I'm definately going to try
to do more physical demos in the future.

We used a potentiometer to detect the position of the lock. I initially wanted
to use a hall effect sensor to detect the opening and closing of the lock
because it would allow for easier installation on real-world doors (glue a
magnet on the latch and you're done), but those were unavailable at the
hardware desk.

Getting the data from the Arduino to the cloud was the hardest part. Our
initial plan was to use an LTE shield and upload the data directly, but the
first thing I did when I got there on Friday was to brick the LTE shield.

Our next attempted solution was to make a Bluetooth Low Energy connection
between the Arduino and an Android App. We spent over 16 hours on that, but we
were never able to make it work.

We finally just gave up and used a serial connection to my laptop. Pretty
straightforward, the accelerometer and potentiometer values are output over
serial, and there's a Python server interpreting them and doing an HTTP POST to
another server on AWS.

The AWS server is just a plain old REST server, with a Sqlite database (also,
it turns out that [the author of SQLite, D. Richard Hipp, is a Georgia Tech
graduate!][sqlite-gt])

Our frontend (ReactJS) fetches the data from the backend every few seconds to provide a
live dashboard of which toilets are dirty.

[source code]: https://github.com/flaviut/porta-potty-patrol-hackgsu-f17
[my post]: /2017/hackgsu-postmortem
[SmartBar]: https://github.com/KevinAiken/Smart-Bar
[sqlite-gt]: https://en.wikipedia.org/wiki/D._Richard_Hipp#Life_and_career

