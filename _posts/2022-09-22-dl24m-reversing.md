---
layout: post
tags: [hardware, embedded, teardown]
title: "ATorch DL24 electronic load reversing"
---

This page contains essentially my notes on reverse engineering the ATorch DL24 electronic load.

Results here are very rough and this document has not been proofread.

## Prior work

- [a very good description of the BLE protocol, but I only ran into this after I'd
  written this document](https://auto-scripting.com/2020/05/03/atorch-dl24-hack-1/)
- [python code to decode the serial protocol. Also points out that the BLE data is
  exactly the same as what can be found by serial on the board](https://www.ordinoscope.net/index.php/Electronique/Hardware/Outils/Atorch/DL24P)
- [A python implementation of what could potentially be additional commands](https://github.com/dimas/DL24-python)
- [Protocol description of what appears to be an older version of this device](https://github.com/misdoro/Electronic_load_px100/blob/master/protocol_PX-100_2_70.md)

## Hardware

{% include image.html
  url="/assets/images/2022-09-22-dl24m-reversing/display-mcu.jpg"
  description="the microcontroller on the front of the control board" %}

Everything is controlled by a HDSC HC32L170 microcontroller.

{% include image.html
  url="/assets/images/2022-09-22-dl24m-reversing/display-back.jpg"
  description="the reverse side of the control board" %}

### J3, unknown

Possibly I2C, possibly UART?

| Pin | Signal | Functions           |
|-----|--------|---------------------|
| 1   | GND    |                     |
| 2   | PB08   | I2C0_SCL, UART0_TXD |
| 3   | PB07   | I2C0_SDA, UART0_RXD |
| 4   | PF06   | I2C1_SCL, UART0_CTS |
| 5   | PF07   | I2C1_SDA, UART0_RTS |

### J1, debug

Unfortunately this doesn't do much good since it seems like the debug port has
been disabled.

| Pin | Signal | Functions |
|-----|--------|-----------|
| 1   | VCC    | 3.3V      |
| 2   | GND    |           |
| 3   | PA13   | SWDIO     |
| 4   | PA14   | SWCLK     |
| 5   | BOOT0  |           |

### J5, BLE serial

With the top pin as pin 1,

| Pin | Signal | Functions   |
|-----|--------|-------------|
| 1   | GND    |             |
| 2   | PA01   | LPUART1_RXD |
| 3   | PA00   | LPUART1_TXD |
| 4   | VCC    | 3.3V        |

{% include image.html
  url="/assets/images/2022-09-22-dl24m-reversing/display-ble.jpg"
  description="the bluetooth circuit on the control board" %}

The BLE module (marked BP0D608-68A2) is by [Zhuhai Jieli Technology, a manufacturer
of Bluetooth chips](https://electronics.stackexchange.com/a/367360/35534).

### J2, control

See the [method of operation](/2022/dl24m-electronics) post.

### Load board

{% include image.html
  url="/assets/images/2022-09-22-dl24m-reversing/expansion-back.jpg"
  description="the reverse side of the control board" %}

The load MOSFETs are marked IRFP264. I believe they are counterfeit, or at least
recycled, since the markings are different on each chip & they show signs of
physical wear.

## Communications

Communications happen over Bluetooth Low Energy, with a device named
`DL24M_BLE`. The `0000ffe1-0000-1000-8000-00805f9b34fb` characteristic is used
to communicate.

### Reading data

Subscribing to the characteristic produces output like the following:

```
ff5501020000320001890000080000000000000000000000001600000000000000000030
ff55010200003200018c0000080000000000000000000000001600000000000000000013
ff55010200003200018d000008000000000000000000000000160000000000000000007f
ff55010200003200018d00000800000000000000000000000016000000000000000000e3
ff5501020000320001890000080000000000000000000000001600000000000000000043
ff55010200003400000100000800000000000000000000000016000000000000000000a4
ff5501020000340000010000080000000000000000000000001700000000000000000006
ff55010200003400000100000800000000000000000000000017000000000000000000e0
ff550102000034000001000008000000000000000000000000170000000000000000003a
ff550102000034000001000008000000000000000000000000170000000000000000009c
ff550102000034000001000008000000000000000000000000170000000000000000007e
```

Or, in decimal form,

```
[255, 85, 1, 2, 0, 0, 50, 0, 1, 137, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 48]
[255, 85, 1, 2, 0, 0, 50, 0, 1, 140, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 19]
[255, 85, 1, 2, 0, 0, 50, 0, 1, 141, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 127]
[255, 85, 1, 2, 0, 0, 50, 0, 1, 141, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 227]
[255, 85, 1, 2, 0, 0, 50, 0, 1, 137, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 67]
[255, 85, 1, 2, 0, 0, 52, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 22, 0, 0, 0, 0, 0, 0, 0, 0, 0, 164]
[255, 85, 1, 2, 0, 0, 52, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6]
[255, 85, 1, 2, 0, 0, 52, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 224]
[255, 85, 1, 2, 0, 0, 52, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 58]
[255, 85, 1, 2, 0, 0, 52, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 156]
[255, 85, 1, 2, 0, 0, 52, 0, 0, 1, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 23, 0, 0, 0, 0, 0, 0, 0, 0, 0, 126]
```


The readings in the first half of these messages roughly correspond to:

- Ps: 2.0W
- Vol: 5.04V
- Cur: 0.40A
- Pwr: 2.00W
- Res: 12.68ohm
- Ene: 0.37339Wh
- Cap: 80mAh

The readings in the second half of the messages roughly correspond to:

- Ps: 2.0W
- Vol: 5.23V
- Cur: 0.0A
- Pwr: 0.01W
- Res: 3680.43ohm
- Ene: 0.38824Wh
- Cap: 83mAh

Decompiling the app indicates that index 3 is some sort of message type. Here's an
abbreviated version of the message parsing:

```java
this.adu = payload[3];
switch(payload[3]) {
    case 1 -> {  // AC reading -- not sure what this is
        var2 = (double) ((payload[4] & 255) * 65536 + (payload[5] & 255) * 256 + (payload[6] & 255));
        Float var41 = (float) (var2 / 10.0);
        var34.append(new DecimalFormat("000.0").format(var41));
        var34.append("V");

        var2 = (double) ((payload[7] & 255) * 65536 + (payload[8] & 255) * 256 + (payload[9] & 255));
        res.currentReading = (float) (var2 / 1000.0);
        var2 = (double) ((payload[10] & 255) * 65536 + (payload[11] & 255) * 256 + (payload[12] & 255));
        res.powerReading = (float) (var2 / 10.0);

        var2 = (double) ((payload[22] & 255) * 256 + (payload[23] & 255));
        var32.append(new DecimalFormat("0.00").format(var2 / 1000.0));
        var32.append("PF");

        var2 = (double) ((payload[13] & 255) * 16777216 + (payload[14] & 255) * 65536 + (payload[15] & 255) * 256 + (payload[16] & 255));
        Double.isNaN(var2);
        var32.append(new DecimalFormat("000.00").format(var2 / 100.0));
        var32.append("KWH");

        var2 = (double) ((payload[20] & 255) * 256 + (payload[21] & 255));
        var34.append(var2 / 10.0);
        var34.append("Hz");

        double temperatureCelcius = (payload[24] & 255) * 256 + (payload[25] & 255);
        var32 = new StringBuilder().append(temperatureCelcius).append("℃/");
    },
    case 2 -> {  // DC reading
        // one packet per second, so packetCount == number of seconds since we started listening
        ++this.packetCount;

        var2 = (double) ((payload[4] & 255) * 65536 + (payload[5] & 255) * 256 + (payload[6] & 255));
        var12 = (float) (var2 / 10.0);
        var26.append(new DecimalFormat("000.0").format(var12));
        var26.append("V");

        var2 = (double) ((payload[7] & 255) * 65536 + (payload[8] & 255) * 256 + (payload[9] & 255));
        var11 = (float) (var2 / 1000.0);
        var25.append(new DecimalFormat("0.000").format(var11));
        var25.append("A");

        var31 = var12 * var11;
        var24 = new DecimalFormat("0000.000000").format(var31);
        var25.append("W");

        var2 = (double) ((payload[10] & 255) * 65536 + (payload[11] & 255) * 256 + (payload[12] & 255));
        var25.append(new DecimalFormat("000.00").format(var2 / 100.0));
        var25.append("Ah");

        var2 = (double) ((payload[13] & 255) * 16777216 + (payload[14] & 255) * 65536 + (payload[15] & 255) * 256 + (payload[16] & 255));
        var26.append(new DecimalFormat("000.00").format(var2 / 100.0));
        var26.append("KWH");


        temperatureCelcius = (payload[24] & 255) * 256 + (payload[25] & 255);
        var2 = (double) temperatureCelcius;
        var26.append(temperatureCelcius);
        var26.append("℃/");
    },
    case 3 -> { }  // "usb" reading -- not sure what this is
}
```

I've skipped over some pointless fields, like the current screen brightness & the
kg of CO2 emitted.

### Sending commands

Button press handler:

```java
switch(button) {
    case "button_jia" ->  // chinese for "increase"
        this.send(this.adu,51,0,0,0);
    case "button_jian" ->  // chinese for "decrease"
        this.send(this.adu,52,0,0,0);
    case "button_ok" ->
        this.send(this.adu,50,0,0,0);
    case "button_set" ->
        this.send(this.adu,49,0,0,0);
}
```

The `send` method:

```java
private void send(int var1, int var2, int var3, int var4, int var5) {
  byte[] var6 = new byte[]{-1, 85, 17, (byte)var1, (byte)var2, 0, (byte)var3, (byte)var4, (byte)var5, 0};
  var6[9] = (byte)((var6[2] & 255) + (var6[3] & 255) + (var6[4] & 255) + (var6[5] & 255) + (var6[6] & 255) + (var6[7] & 255) + (var6[8] & 255) ^ 68);
  BLEService.send(var6);
}
```
