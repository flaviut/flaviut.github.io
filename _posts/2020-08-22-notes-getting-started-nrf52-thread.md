---
layout: post
tags: [iot, embedded, nrf52, thread]
title: "Getting started with the nRF52 & Thread"
---

Some personal notes for working with nRF52 hardware. The official documentation
is oddly written and expects both too much and too little prior knowlage from
the reader.

## Running the Thread CLI

### Required downloads

- [nRF5_SDK_for_Thread_and_Zigbee_v4.1.0_32ce5f8](https://www.nordicsemi.com/-/media/Software-and-other-downloads/SDKs/nRF5-SDK-for-Thread/nRF5-SDK-for-Thread-and-Zigbee/nRF5SDKforThreadv41.zip)
- [gcc-arm-none-eabi-7-2018-q2](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads/6-2017-q2-update)
- nrfutil via `pip install --user nrfutil==6.1.0`

Unpack these files and run `export GNU_INSTALL_ROOT=<path>/bin` with the
output directory.

### Required hardware

- [nRF52840 Dongle](https://www.nordicsemi.com/Software-and-tools/Development-Kits/nRF52840-Dongle)

### Building example program

1. Navigate to `nRF5_SDK_for_Thread_and_Zigbee_v4.1.0_32ce5f8/examples/thread/cli/ftd/usb/pca10059/mbr/armgcc`.
2. Build the program by running `make -j$(nproc)`. (make sure `GNU_INSTALL_ROOT` is set)
3. You should see a message like `DONE nrf52840_xxaa` indicating successfully compilation.

### Flashing example program via DFU

When you plug your dongle into your computer's USB port, you should see
something like:

```
usb 1-1.2.1: new full-speed USB device number 6 using xhci_hcd
usb 1-1.2.1: New USB device found, idVendor=1915, idProduct=521f, bcdDevice= 1.00
usb 1-1.2.1: New USB device strings: Mfr=1, Product=2, SerialNumber=3
usb 1-1.2.1: Product: Open DFU Bootloader
usb 1-1.2.1: Manufacturer: Nordic Semiconductor
usb 1-1.2.1: SerialNumber: D88744B9EE73
cdc_acm 1-1.2.1:1.0: ttyACM0: USB ACM device
```

If you don't see this, press the reset button (the side button next to the
antenna) while the dongle is plugged in to enter DFU mode.

Make a note of the tty device shown in the console, and use it when using the
following commands to flash the board:

```console
$ nrfutil pkg generate \
    --hw-version 52 \
    --sd-req 0x00 \
    --application-version 1 \
    --application _build/nrf52840_xxaa.hex \
    app_dfu_package.zip
$ nrfutil dfu usb-serial \
    -pkg app_dfu_package.zip \
    -p /dev/ttyACM0
```

See [Programming the nRF52840 MDK USB
Dongle](https://wiki.makerdiary.com/nrf52840-mdk-usb-dongle/programming/) for
more information.

### Using the Thread CLI

After flashing the dongle, unplug it and plug it back in. You should see
something like

```
usb 1-1.2.1: new full-speed USB device number 12 using xhci_hcd
usb 1-1.2.1: config 1 has an invalid interface number: 2 but max is 1
usb 1-1.2.1: config 1 has no interface number 0
usb 1-1.2.1: New USB device found, idVendor=1915, idProduct=cafe, bcdDevice= 1.00
usb 1-1.2.1: New USB device strings: Mfr=1, Product=2, SerialNumber=3
usb 1-1.2.1: Product: nRF52 USB Product
usb 1-1.2.1: Manufacturer: Nordic Semiconductor
usb 1-1.2.1: SerialNumber: D88744B9EE73
cdc_acm 1-1.2.1:1.1: ttyACM0: USB ACM device
```

Make a note of the tty, and use `minicom -b 115200 -D /dev/ttyACM0` or `screen
/dev/ttyACM0 115200` to connect to the CLI.

As an example, type `help` into the CLI and press enter:

```
> help
bufferinfo
channel
child
...
```

## Debugging

### Required hardware

- [ST-LINK v2](https://www.adafruit.com/product/2548). Make sure it looks like the one in the picture.
- several [2x5 IDC ribbon cables](https://www.sparkfun.com/products/8535). These can be obtained cheap from eBay/Aliexpress. Get many because they're getting cut up.
- soldering iron & related equipment

### Setting up the hardware

1. Cut the cable in half.
2. Pin 1 is the pin with the red stripe. Peel the pins apart about 15-20mm and cut off pins 1, 3, 6, 7, 8, and 9.
3. Solder the cable onto the dongle according to this image:

{% include image.html
    url="/assets/images/2020-08-22-notes-getting-started-nrf52-thread/programmer-soldering.jpg"
    description="Cable soldering order" %}

### Running the debugger

1. Download and unpack [xPack OpenOCD](https://github.com/xpack-dev-tools/openocd-xpack/releases/tag/v0.10.0-14)
2. Run `export OPENOCD_DIR=<path>` with the path where you extracted OpenOCD
3. Plug everything together and run `"$OPENOCD_DIR/bin/openocd" -f interface/stlink.cfg -f target/nrf52.cfg -c "init"` to open the debug interface.
4. Run `arm-none-eabi-gdb`. The version from the gcc-arm-none-eabi-7-2018-q2-update may fail with `error while loading shared libraries: libncurses.so.5`, so you can just whatever `arm-none-eabi-gdb` your distro provides.
5. With gdb open, run `target remote :3333` to connect to openocd.
6. For testing, press ctrl-c to stop execution, and `continue` to resume it.

## Flashing the DFU bootloader

1. Follow all the instructions in [Debugging][].
2. Navigate to `nRF5_SDK_for_Thread_and_Zigbee_v4.1.0_32ce5f8/examples/dfu/open_bootloader/pca10059_usb_debug/hex`. There is a pre-built bootloader in this directory. For production use you will want to build your own bootloader with your own public key, but this is fine for development.
3. Connect your ST-Link to your dongle and use the following OpenOCD command to flash the bootloader: `"$OPENOCD_DIR/bin/openocd" -f interface/stlink.cfg -c "transport select hla_swd" -f target/nrf52.cfg -c "init; halt; program {open_bootloader_usb_mbr_pca10059_debug.hex} verify; reset; exit"`
4. If you see `** Verified OK **`, the flashing has been successful.
4. Unplug the ST-Link from the dongle and reinsert the dongle into the USB port. You should see LED2 slowly fading in and out and `usb 1-1.2.3: Product: Open DFU Bootloader` in `dmesg`.
