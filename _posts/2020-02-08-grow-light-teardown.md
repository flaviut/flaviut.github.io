---
layout: post
tags: [teardown, power-supply, hardware, lights]
title: "LED Grow Light Teardown"
---

{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/01_back_cover.jpg"
    description="The rear of the GLS-54W5F grow light from superbrightleds.com." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/03_fan_case.jpg"
    description="The inside of the back cover, where all the electronics are. There are 4 constant-current power supplies for the LEDs, and another constant-current (115mA) power supply for the fans. The fans are two 80×80×15mm fans, 24V, 150mA, wired in serial. The aluminum circuit board is cleverly designed to wedge in under the fan lip and apply pressure on the power supply cases in order to keep everything in place." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/02_led_board_back.jpg"
    description="The rear of the LED PCB. It's an aluminum PCB for better heatsinking." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/04_led_pcb.jpg"
    description="The front of the LED PCB. Each constant-current power supply is attached to 24 LEDs in series." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/05_reflectors.jpg"
    description="The construction of the reflectors on the other side of the board. I'm not certain what the point of these is, since the light would function exactly the same without them." %}

## Fan Power Supply

{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_01.jpg"
    description="The circuit board for the fan constant-current power supply. This is a non-isolated power supply, and will go all the way up to line voltage if there is no load." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_02.jpg"
    description="The input filtering section, featuring the MOV (blue), pre-rectification capacitor (yellow), fuse (F1), and post-rectification capacitor (red)." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_03.jpg"
    description="The X2 input filtering capacitor (yellow), and the fuse (F1)." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_04.jpg"
    description="The BM10F full bridge rectifier." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_05.jpg"
    description="The [Bright Power Semiconductor Co. BP2338J](/files/2020-02-08-grow-light-teardown/BP2338J.pdf) constant-current LED driver. Pins 6 & 7 are not connected--it's unclear why this was done, but pins 8 & 7 and 5 & 6 are connected internally to the chip. You can also observe the current measurement: R2=1.8Ω, Vref=0.2V, and therefore the output current is Vref/R2=111mA. This matches the observed output current." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_06.jpg"
    description="The output inductor and filtering capacitor. The transformer provides no isolation here." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-fan_07.jpg"
    description="The bottom of the board. Note the 100uF, 100V output capacitor: this will cause problems in open-circuit situations where the output voltage will be equal to line voltage (120V or 250V)." %}

## LED Power Supply

{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-led_01.jpg"
    description="Each of the 4 LED CC power supplies are identical and output 230mA each." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-led_02.jpg"
    description="The MB10F full-bridge rectifier, as well as the fuse (F1) and input filtering capacitor (C3, red)." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-led_03.jpg"
    description="The VDR 07D561K MOV (blue)." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-led_04.jpg"
    description="Thie power supply makes use of the [Kiwi Instrument Corporation KP1062](/files/2020-02-08-grow-light-teardown/Kiwi-KP1062C.pdf)." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-led_05.jpg"
    description="The 100V, 68uF output filtering capacitor." %}
{% include image.html
    url="/assets/images/2020-02-08-grow-light-teardown/cc-led_06.jpg"
    description="The bottom side of the power supply. Note that two transformer pins are tied together: it is being used as an non-isolated inductor, and was likely chosen over a regular inductor for cost reasons." %}, 
