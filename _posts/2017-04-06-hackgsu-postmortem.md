---
layout: post
title: HackGSU Spring 2017 Postmortem
---

I attended [HackGSU][] last weekend, and it was my first hackathon. I worked in
a team with Kevin Aiken, Lee Klarich, and Cameron McRae, all of whom are
friends from [GSMST][]. We produced the [SmartBar][], a barbell which counted
the number of reps done and measured imbalances. Our project [won the Covello
Prize for the best sports hack][win].

{% include image.html
    url="/assets/images/2017-04-06-hackgsu-postmortem/2.jpg"
    description="The SmartBar being held by M. Cole Jones of covello. Photo: Lee Klarich" %}

I had a great time, although it was incredibly draining. 3 hours of sleep in 48
hours is not healthy--I became more irritable and less able to think, and I
also experienced physical effects, like nausea and a sore throat. If I'm going
to do this again, I'm going to have to sleep more.

Our first hardware implementation (which I worked on) used two [Grove
Accelerometers (MMA7660FC)][grove-accel]. That didn't really work out because:

1. The accelerometer is a piece of crap. Six bits per axis ([spec
sheet][mma7660fc]), including the sign bit. -31 to 31 is not enough precision…
for anything really. It was also very noisy, the value would constantly (on
every read) toggle ±1.
2. You can only attach one device with a specific I2C slave address to one bus,
and we needed two devices. We could have "contact[ed] the factory to request a
different I2C slave address,"[^1] but we had a time limit (and a budget of $0).
The workaround I worked on was to attach one of them directly to the Pi's I2C
port, but I gave up on that after realizing that the poor resolution made it
pointless.

[^1]: [spec sheet][mma7660fc], p. 23, section "The Slave Address"

I also had trouble connecting the sensor to the Arduino. Turns out the problem
was some bad jumper wires. **Lesson learned: never assume that anything is to
simple to fail--even if it's a wire with no visible physical damage.**

So we tried to use an Arduino 101 that we borrowed from downstairs, but it was
broken. We couldn't figure out what was wrong, but then we finally ended up
exchanging it and the new one worked fine. The resolution on the 101's
accelerometer is really great, and we had no problems with noise. Kevin graphed
the data on LibreOffice Calc, and used the graph for guidance while writing the
detection code.

{% include image.html
    url="/assets/images/2017-04-06-hackgsu-postmortem/1.png"
    description="Newer version of Kevin's graph. Note the lack of noise!" %}

Cameron worked on the Android app. We had a lot of trouble with it, because
none of us had ever worked on an Android app or Android Bluetooth. I learned
that a) copy-pasting code without understand it doesn't work, and b) we
shouldn't choose technologies that none of us have even touched. **A hackathon
is not the time to learn a complicated system like Android from scratch.**

Me and Lee set up the website. Lee initially implemented it in PHP & MySQL, but
then we rewrote it in Python 3, Flask, SQLAlchemy, and PostgreSQL. Writing the
website was pretty straightforward. Even though we were not familiar with Flask
or SQLAlchemy, we were familiar with web development in Python, so we didn't
run into any issues.

Lee tried to set up Apache2 on the EC2 server to host the server. We spent a
few hours trying to get that to work. We eventually just gave up and set up a
dev server with Nginx proxying port 80 to port 6000. The lesson here is to
**not bother setting things up correctly, just get them working.** Polish,
reliability, or security is not a priority for hackathon software, **all that
matters is that the demo seems to work.**


[HackGSU]: https://hackgsu-spring-2017.devpost.com/
[GSMST]: http://www.gsmst.org/
[SmartBar]: https://github.com/KevinAiken/Smart-Bar
[win]: https://hackgsu-spring-2017.devpost.com/submissions/search?utf8=✓&terms=SmartBar
[grove-accel]: http://wiki.seeed.cc/Grove-3-Axis_Digital_Accelerometer-1.5g/
[mma7660fc]: http://www.nxp.com/assets/documents/data/en/data-sheets/MMA7660FC.pdf
