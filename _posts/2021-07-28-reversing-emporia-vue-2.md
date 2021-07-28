---
layout: post
tags: [embedded, hardware, iot, reverse engineering]
title: "Reverse-engineering the Emporia Vue 2"
---

I grabbed a Emporia Vue 2 to keep track of my home's energy usage, since it is
one of the few listed WiFi energy monitors.

However, I also knew that I wanted control over my data and that I would not be
sending my data to their cloud or installing their app on my phone.

So the only way to get that data is to reverse-engineer the board and modify
the software to do what I need to get the data into Home Assistant.

The following are my mostly-chronological notes about how I got into this
thing. They're posted in the hope that they'll be useful to other folks trying
to get into similar devices.

## Bluetooth LE

ESP32 starts up a Bluetooth Low Energy station named `PROV_`. This station uses
the GATT protocol, and can be queried using the nRF Connect app, as well as the
`btgatt-client` from `bluez-utils`.

The provisioning protocol is documented at
<https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/provisioning/wifi_provisioning.html>.

There are two options for security with this setup:

- No security
- x25519 handshake and AES-CTR encryption of provisioning messages

After connecting to the BLE device using `btgatt-client -d B8:F0:09:84:1C:CA`,
the following is shown:

```
service - start: 0x0001, end: 0x0005, type: primary, uuid: 00001801-0000-1000-8000-00805f9b34fb
	charac - start: 0x0002, value: 0x0003, props: 0x20, ext_props: 0x0000, uuid: 00002a05-0000-1000-8000-00805f9b34fb
		descr - handle: 0x0004, uuid: 00002902-0000-1000-8000-00805f9b34fb

service - start: 0x0014, end: 0x001c, type: primary, uuid: 00001800-0000-1000-8000-00805f9b34fb
	charac - start: 0x0015, value: 0x0016, props: 0x02, ext_props: 0x0000, uuid: 00002a00-0000-1000-8000-00805f9b34fb
	charac - start: 0x0017, value: 0x0018, props: 0x02, ext_props: 0x0000, uuid: 00002a01-0000-1000-8000-00805f9b34fb
	charac - start: 0x0019, value: 0x001a, props: 0x02, ext_props: 0x0000, uuid: 00002aa6-0000-1000-8000-00805f9b34fb

service - start: 0x0028, end: 0xffff, type: primary, uuid: 0000ffff-0000-1000-8000-00805f9b34fb
	charac - start: 0x0029, value: 0x002a, props: 0x0a, ext_props: 0x0000, uuid: 0000ff53-0000-1000-8000-00805f9b34fb
		descr - handle: 0x002b, uuid: 00002901-0000-1000-8000-00805f9b34fb
	charac - start: 0x002c, value: 0x002d, props: 0x0a, ext_props: 0x0000, uuid: 0000ff54-0000-1000-8000-00805f9b34fb
		descr - handle: 0x002e, uuid: 00002901-0000-1000-8000-00805f9b34fb
```

We can then query the various characteristics by taking their handle and using
these commands:

```
[GATT client]# read-value 0x002e
[GATT client]#
Read value (9 bytes): 70 72 6f 76 2d 63 6f 6d 6d
[GATT client]# read-value 0x2b
[GATT client]#
Read value (9 bytes): 70 72 6f 74 6f 2d 76 65 72
```

We looked up the description for those characteristics, and the descriptions
are just ASCII. To decode these values, `xxd -r -p` can be opened in a seperate
terminal. Then, all that's needed is to paste the values in an press enter:

```console
$ xxd -r -p
70 72 6f 76 2d 63 6f 6d 6d
prov-comm
```

## Dumping firmware

The firmware was fairly easy to dump, although one of my USB-Serial adaptors
wasn't up to the task and didn't show anything at all.

The following procedure works to place the module into bootloader mode:

1. Solder a 2.54mm dupont header onto the programming header right above the ESP32-WROVER-B module
2. Connect the serial adaptor. TX on adaptor -> TX marked on the board.
3. Jumper the `EN` and `IO0` pins together, and connect them to ground (the ESP32
   shield works well)
4. Remove and re-apply power
5. Disconnect the `EN` and `IO0` cables from ground

The following command dumps the entire flash:

```console
$ esptool.py --port /dev/ttyUSB0 read_flash 0 0x400000 flash_contents.bin
```

## Reversing, first attempt

Using Ghidra and a [Xtensa module](https://github.com/Ebiroll/ghidra-xtensa)
allows us to disassemble, decompile, and examine the executable.

There are no symbols, which makes it hard to track down the various parts of
the program. However, if we open up the strings view, we see a few interesting
things, like the string
`"mqtts://a2poo8btpqc3gs-ats.iot.us-east-2.amazonaws.com:8883"`. This is nice
to see, since it appears that the device uses MQTT, a standard protocol, to
report results.

One interesting to note from the log above are the lines stating

```
I (250138) WiFiTask: Wifi connect to: emporia
I (250138) Provisioning: Waiting to Connect
```

which sounds like it's trying to connect to a wifi network named `emporia`. Searching the binary for that string shows us a section where the words "ssid", "emporia", "password", "emporia123" are found in close succession. Once we set up a wifi network with those credentials, we get the following from the log:

```
I (280158) WiFiTask: Wifi connect to: emporia
I (280158) Provisioning: Waiting to Connect
I (280158) MQTTdebug: buffer flush signal
I (280398) wifi: new:<1,0>, old:<1,0>, ap:<255,255>, sta:<1,0>, prof:1
I (281098) CT: Calculating instantaneous and cumulative readings
I (281098) Measure: Cal adjust: nan, 0.000000, 0.000000, 0.000000
I (281098) Measure: Power Adjusted: 0.000000, 0.000000, 0.000000
I (281458) wifi: state: init -> auth (b0)
I (281478) wifi: state: auth -> assoc (0)
I (281488) wifi: state: assoc -> run (10)
I (281548) wifi: connected with emporia, aid = 1, channel 1, BW20, bssid = 1e:6a:66:b2:b0:ad
I (281548) wifi: security type: 3, phy: bgn, rssi: -54
I (281558) wifi: pm start, type: 0

I (281558) wifi: AP's beacon interval = 102400 us, DTIM period = 2
I (282038) CT: Calculating instantaneous and cumulative readings
I (282038) Measure: Cal adjust: nan, 0.000000, 0.000000, 0.000000
I (282048) Measure: Power Adjusted: 0.000000, 0.000000, 0.000000
I (282288) MQTTdebug: buffer flush signal
I (282328) tcpip_adapter: sta ip: 192.168.135.25, mask: 255.255.255.0, gw: 192.168.135.69
I (282328) Provisioning: CONNECTED WIFI EVENT
I (282328) MQTTComms: MQTTComms_StartClient
I (282338) MQTTComms: MQTTComms_StartClient GET _initialized: FALSE
I (282338) MQTTComms: MQTTComms_StartClient GET _started: FALSE
I (282348) MQTTComms: MQTTComms_Init
I (282358) Settings: Read MQTT_IP from nvs 192.168.1.101, ESP_OK
I (282358) Settings: Read: TEST_MODE: 1 (ESP_OK)
I (282368) MQTTComms: MQTT Server Configured: mqtt://192.168.1.101:1883
I (282368) MQTTComms: [APP] Free memory: 4316060 bytes
I (282378) MQTTComms: MQTT START status=0
I (282378) MQTTComms: MQTT_EVENT_OTHER
I (282378) MQTTComms: MQTTComms_StartClient SET _started: TRUE
I (282418) WiFiTask: CHANGE STATE: OLD=Provisioned NEW=WiFiConnected
I (282418) NtpServer: Initializing NTP Server Config...
I (282418) NtpServer: Done.
I (282418) NtpServer: Polling NTP Server
I (282428) WiFiTask: Wifi rssi: -43
I (282428) WiFiTask: Wifi auth mode: 3
I (282428) WiFiTask: Wifi channel: 1
I (282448) WiFiTask: CHANGE STATE: OLD=WiFiConnected NEW=MQTTStarting
I (282448) WiFiTask: wifi_task MQTTStarting -> Spin Condition
I (282448) MQTTComms: MQTTComms_RestartMqtt
I (282458) MQTTComms: MQTTComms_RestartMqtt GET _restarting: FALSE
I (282458) MQTTComms: MQTTComms_RestartMqtt GET _started: TRUE
I (282468) MQTT_CLIENT: Client force reconnect requested
```

This is very cool, because it appears that the device has connected to the
local network and is uploading all data over it to a MQTT server found at
`192.168.1.101`. We can very easily become that MQTT server and dig deeper, and
we no longer need to understand the BLE/GATT provisioning.

Once we set up a mosquitto server on that machine using this `mosquitto.conf`:

```
listener 1883
bind_interface br0
allow_anonymous true
```

we get entries in the logs like the following:

```
I (703068) MQTTComms: MQTT_EVENT_OTHER
I (703078) MQTT_CLIENT: Sending MQTT CONNECT message, type: 1, id: 0000
I (703098) MQTTComms: MQTT_EVENT_CONNECTED
I (703098) MQTTComms: MQTTComms_EventHandler SET _restarting: FALSE
I (703098) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/AAAABBBBCCCCDDDDEEEEFF/cmd,  status=24206
I (703108) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/AAAABBBBCCCCDDDDEEEEFF/fw,  status=59758
I (703108) Json: Json_BuildAndSendInfo sending ({"event":"STARTUP","free_mem":4299008,"cpu_stats":"mqtt_task      \t19847730\t\t1%\r\nWiFi           \t1686356152\t\t127%\r\nIDLE1          \t2190705037\t\t165%\r\nIDLE0          \t2062978124\t\t156%\r\ntiT            \t96217496\t\t7%\r\nCT             \t2777667819\t\t210%\r\nTmr Svc        \t9970\t\t<1%\r\nbtuT           \t3528369\t\t<1%\r\nBTC_TASK       \t2116833\t\t<1%\r\nsys_evt        \t25037376\t\t1%\r\nesp_timer      \t1409316908\t\t106%\r\nipc0           \t592015925\t\t44%\r\nwifi           \t1276280916\t\t96%\r\nipc1           \t1066323580\t\t80%\r\nbtController   \t1390082462\t\t105%\r\nhciT           \t3553832\t\t<1%\r\n","uptime":701220,"build_datetime":"Mon Jul 13 20:14:22 UTC 2020","build_commit":"45126ee0","response":"query_info","firmware_version":"Vue2-1594671260","idf_version":"v4.0","device_id":"AAAABBBBCCCCDDDDEEEEFF","upload_frequency_seconds":1,"solar_enable":0,"solar_reverse":0,"wifi_rssi":-23,"wifi_authmode":3,"wifi_channel":1})
I (703118) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/AAAABBBBCCCCDDDDEEEEFF/verify,  status=6181
I (703208) MQTTComms: MQTTComms_PublishResponse
I (703218) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/broadcast/cmd,  status=22036
I (703238) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/broadcast/fw,  status=1579
I (703248) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/broadcast/verify,  status=13944
I (703258) MQTTdebug: buffer flush signal
I (703268) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=24206
I (703268) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=59758
I (703268) Json: Json_BuildAndSendInfo done sending
I (703268) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=6181
I (703288) WiFiTask: Creating device_readings protobuf
I (703288) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=22036
I (703288) DeviceReadings: Largest external SPIRAM block: 4194264
I (703298) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=1579
I (703308) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=13944
I (703418) WiFiTask: Sending live updates for 20 seconds at startup
I (703418) DeviceReadings: CurrentTime=Thu Mar  4 22:24:21 2021

I (703418) DeviceReadings: Live updates requested for 20 seconds
I (703438) WiFiTask: CHANGE STATE: OLD=MQTTStarting NEW=MQTTConnected
I (703468) WiFiTask: 1614896661 secs since upload. upload_state 1. message size 41 bytes. 0 readings of 11400 max. large message 0
I (703468) WiFiTask: Sending DeviceReadings at Thu Mar  4 22:24:21 2021

I (703478) MQTTComms: MQTTComms_PublishBinaryReadings Topic: $aws/rules/prodIngestBinaryToSQS/prod/binary/AAAABBBBCCCCDDDDEEEEFF/meter, return_code: 0 
I (703488) CT: Calculating instantaneous and cumulative readings
I (703488) MQTTComms: MQTTComms_PublishBinaryReadings Topic: aws/rules/prodIngestBinaryToSQS/prod/binary/AAAABBBBCCCCDDDDEEEEFF/meter, return_code: 0 
```

As soon as we look at `prod/minions/emporia/ct/v1/AAAABBBBCCCCDDDDEEEEFF/debug/v2` topic, we see the following:

```
id: AAAABBBBCCCCDDDDEEEEFF, t: 1614897405
03905220C1B3FFFFA5EAFFFF31FBFFFF
C1B3FFFFA5EAFFFF31FBFFFFC1B3FFFF
A5EAFFFF31FBFFFFEFB5FFFFD9EBFFFF
8DFCFFFF6FB2FFFF06EAFFFF73F9FFFF
A6B1FFFF88E9FFFFD4FAFFFFDFB6FFFF
C1EEFFFF71F6FFFF9EB3FFFFBAE9FFFF
18FDFFFF2BB0FFFF53EDFFFF03FCFFFF
FCB5FFFF9CE7FFFF35FCFFFF5FB3FFFF
59E8FFFFF2FCFFFFEFB5FFFFD9EBFFFF
8DFCFFFF6FB2FFFF06EAFFFF73F9FFFF
A6B1FFFF88E9FFFFD4FAFFFFDFB6FFFF
C1EEFFFF71F6FFFF9EB3FFFFBAE9FFFF
18FDFFFF2BB0FFFF53EDFFFF03FCFFFF
FCB5FFFF9CE7FFFF35FCFFFF5FB3FFFF
59E8FFFFF2FCFFFF0F000C000B000000
00000000005000500050FD4FFD4FFD4F
FD4FFD4F035003500350FD4FFD4FFD4F
FD4FFD4F0350035003500000
V1:   0.3,  0.4 Hz, 15, 0.0225336
V2:   0.3, 0 degrees, 12, 0.0220000
V3:   0.2, 0 degrees, 11, 0.0220000
I01:  372.4, P[V1]:   -80.0, P[V2]:   -21.9, P[V3]:    -4.9
I02:  372.4, P[V1]:   -80.0, P[V2]:   -21.9, P[V3]:    -4.9
I03:  372.4, P[V1]:   -80.0, P[V2]:   -21.9, P[V3]:    -4.9
I04:   93.1, P[V1]:   -19.4, P[V2]:    -5.2, P[V3]:    -0.9
I05:   93.1, P[V1]:   -20.3, P[V2]:    -5.6, P[V3]:    -1.7
I06:   93.1, P[V1]:   -20.5, P[V2]:    -5.8, P[V3]:    -1.3
I07:   93.1, P[V1]:   -19.2, P[V2]:    -4.4, P[V3]:    -2.4
I08:   93.1, P[V1]:   -20.0, P[V2]:    -5.7, P[V3]:    -0.7
I09:   93.1, P[V1]:   -20.9, P[V2]:    -4.8, P[V3]:    -1.0
I10:   93.1, P[V1]:   -19.4, P[V2]:    -6.2, P[V3]:    -1.0
I11:   93.1, P[V1]:   -20.1, P[V2]:    -6.1, P[V3]:    -0.8
I12:   93.1, P[V1]:   -19.4, P[V2]:    -5.2, P[V3]:    -0.9
I13:   93.1, P[V1]:   -20.3, P[V2]:    -5.6, P[V3]:    -1.7
I14:   93.1, P[V1]:   -20.5, P[V2]:    -5.8, P[V3]:    -1.3
I15:   93.1, P[V1]:   -19.2, P[V2]:    -4.4, P[V3]:    -2.4
I16:   93.1, P[V1]:   -20.0, P[V2]:    -5.7, P[V3]:    -0.7
I17:   93.1, P[V1]:   -20.9, P[V2]:    -4.8, P[V3]:    -1.0
I18:   93.1, P[V1]:   -19.4, P[V2]:    -6.2, P[V3]:    -1.0
I19:   93.1, P[V1]:   -20.1, P[V2]:    -6.1, P[V3]:    -0.8
```

This is great! The first segment I bet is raw sensor readings, and the second
segment contains our actual desired data. We're done trying to figure out how
how this works, we just need to figure out how to get it on our system instead
of theirs.

It's not particularly practical to have to host an access point with the same
password, this introduces vulnerability since anyone could come in and take
over our device (there's some endpoints like
`prod/minions/emporia/ct/v1/broadcast/fw`, which I'm suspicious would allow us
to download firmware onto the device).

But first, let's see what the various commands we have available.
Unfortunately, it's very difficult to reverse engineer ESP32 flash dumps, so
we're going to need to use a debugger. After doing some probing, pin 10 on the
big connector is MTCK and pin 9 is MTMS. No other pins are connected, so this
corresponds to cJTAG.

1 = VDD (3.3V)
2, 3 = GND

atmel samd09u:
6 = PA28/~RST
10 = PA31/SWDIO
9 = PA30/SWDCLK


## Reversing, second attempt

Picking this up after several months of working on other things, I've found
another approach to the problem.

Convert the dumped flash into ELF files using
[esp32\_image\_parser](https://github.com/tenable/esp32_image_parser). This throws an error:

```
Unsure what to do with segment: BYTE_ACCESSIBLE, DRAM
Traceback (most recent call last):
  File ".../esp32_image_parser/esp32_image_parser.py", line 281, in <module>
    main()
  File ".../esp32_image_parser/esp32_image_parser.py", line 264, in main
    image2elf(dump_file, output_file, verbose)
  File ".../esp32_image_parser/esp32_image_parser.py", line 159, in image2elf
    size = len(section_data[name]['data'])
KeyError: '.dram0.data'
```

The fix is straightforward:

```patch
diff --git a/esp32_image_parser.py b/esp32_image_parser.py
index 6503cf7..d5861a5 100755
--- a/esp32_image_parser.py
+++ b/esp32_image_parser.py
@@ -51,9 +51,9 @@ def image2elf(filename, output_file, verbose=False):
 
     # maps segment names to ELF sections
     section_map = {
-        'DROM'                      : '.flash.rodata',
-        'BYTE_ACCESSIBLE, DRAM, DMA': '.dram0.data',
-        'IROM'                      : '.flash.text',
+        'DROM'                 : '.flash.rodata',
+        'BYTE_ACCESSIBLE, DRAM': '.dram0.data',
+        'IROM'                 : '.flash.text',
         #'RTC_IRAM'                  : '.rtc.text' TODO
     }

```

And then list the partitions:

```console
$ python3 esp32_image_parser.py show_partitions ../flash_contents.bin
reading partition table...
entry 0:
  label      : nvs
  offset     : 0x9000
  length     : 327680
  type       : 1 [DATA]
  sub type   : 2 [WIFI]

entry 1:
  label      : otadata
  offset     : 0x59000
  length     : 8192
  type       : 1 [DATA]
  sub type   : 0 [OTA]

entry 2:
  label      : phy_init
  offset     : 0x5b000
  length     : 4096
  type       : 1 [DATA]
  sub type   : 1 [RF]

entry 3:
  label      : ota_0
  offset     : 0x60000
  length     : 1638400
  type       : 0 [APP]
  sub type   : 16 [ota_0]

entry 4:
  label      : ota_1
  offset     : 0x1f0000
  length     : 1638400
  type       : 0 [APP]
  sub type   : 17 [ota_1]

entry 5:
  label      : storage
  offset     : 0x380000
  length     : 393216
  type       : 1 [DATA]
  sub type   : 130 [unknown]

MD5sum: 
34f7ce970d9ab12b7226dc8c2dd47955
Done
```

Try and dump the firmware to ELF:

```console
$ python3 esp32_image_parser.py create_elf ../flash_contents.bin -partition ota_0 -output ../ota_0.elf
Dumping partition 'ota_0' to ota_0_out.bin

Writing ELF to ../ota_0.elf...
```

Also try `ota_1`, but we get an error:

```console
$ python3 esp32_image_parser.py create_elf ../flash_contents.bin -partition ota_1 -output ../ota_1.elf
Dumping partition 'ota_1' to ota_1_out.bin
Traceback (most recent call last):
  File ".../esp32_image_parser/esp32_image_parser.py", line 281, in <module>
    main()
  File ".../esp32_image_parser/esp32_image_parser.py", line 264, in main
    image2elf(dump_file, output_file, verbose)
  File ".../esp32_image_parser/esp32_image_parser.py", line 41, in image2elf
    image = LoadFirmwareImage('esp32', filename)
  File ".../esp32_image_parser/venv/lib/python3.9/site-packages/esptool.py", line 2229, in LoadFirmwareImage
    return ESP32FirmwareImage(f)
  File ".../esp32_image_parser/venv/lib/python3.9/site-packages/esptool.py", line 2645, in __init__
    segments = self.load_common_header(load_file, ESPLoader.ESP_IMAGE_MAGIC)
  File ".../esp32_image_parser/venv/lib/python3.9/site-packages/esptool.py", line 2322, in load_common_header
    raise FatalError('Invalid firmware image magic=0x%x' % (magic))
esptool.FatalError: Invalid firmware image magic=0xff
```

The 0xFF seems to indicate that this is empty flash. I bet it's a download area
for OTA updates. No problem, we don't need it then.

Opening up the ELF file in Ghidra using the [Xtensa
module](https://github.com/Ebiroll/ghidra-xtensa) gets a full disassemby and
decompilation of the software!

However, it turns out that this code is hard to read. And it doesn't even
contain the wifi network constants that we identified above, those must be in
some other partition.

## Non-volatile Storage

And it turns out they are! nvs stands for [non-volatile storage, and it is
where the ESP32 stores its
configuration](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/storage/nvs_flash.html).

And fortunately, the
[esp32\_image\_parser](https://github.com/tenable/esp32_image_parser) tool
allows us to dump that information:

```console
$ python3 esp32_image_parser.py dump_nvs ../flash_contents.bin -partition nvs -nvs_output_type json > ../nvs.json
```

And here we see exactly what we wanted!

```json
      {
        "entry_state": "Written",
        "entry_ns_index": 1,
        "entry_ns": "SETTINGS_NVS",
        "entry_type": "U8",
        "entry_span": 1,
        "entry_chunk_index": 255,
        "entry_key": "TEST_MODE",
        "entry_data_type": "U8",
        "entry_data": 1
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 4,
        "entry_ns": "storage",
        "entry_type": "BLOB_DATA",
        "entry_span": 2,
        "entry_chunk_index": 0,
        "entry_key": "ssid",
        "entry_data_type": "BLOB_DATA",
        "entry_data_size": 32,
        "entry_data": "ZW1wb3JpYQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA="
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 4,
        "entry_ns": "storage",
        "entry_type": "BLOB_IDX",
        "entry_span": 1,
        "entry_chunk_index": 255,
        "entry_key": "ssid",
        "entry_data_type": "BLOB_IDX",
        "entry_data_size": 32,
        "entry_data_chunk_count": 0,
        "entry_data_chunk_start": 255
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 4,
        "entry_ns": "storage",
        "entry_type": "BLOB_DATA",
        "entry_span": 3,
        "entry_chunk_index": 0,
        "entry_key": "password",
        "entry_data_type": "BLOB_DATA",
        "entry_data_size": 64,
        "entry_data": "ZW1wb3JpYTEyMwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=="
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 4,
        "entry_ns": "storage",
        "entry_type": "BLOB_IDX",
        "entry_span": 1,
        "entry_chunk_index": 255,
        "entry_key": "password",
        "entry_data_type": "BLOB_IDX",
        "entry_data_size": 64,
        "entry_data_chunk_count": 0,
        "entry_data_chunk_start": 255
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 4,
        "entry_ns": "storage",
        "entry_type": "I8",
        "entry_span": 1,
        "entry_chunk_index": 255,
        "entry_key": "provisioned",
        "entry_data_type": "I8",
        "entry_data": 1
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 1,
        "entry_ns": "SETTINGS_NVS",
        "entry_type": "STR",
        "entry_span": 2,
        "entry_chunk_index": 255,
        "entry_key": "FACTORYCODE",
        "entry_data_type": "STR",
        "entry_data_size": 10,
        "entry_data": "2035A04B4"
      },
      {
        "entry_state": "Written",
        "entry_ns_index": 1,
        "entry_ns": "SETTINGS_NVS",
        "entry_type": "STR",
        "entry_span": 2,
        "entry_chunk_index": 255,
        "entry_key": "MQTT_IP",
        "entry_data_type": "STR",
        "entry_data_size": 14,
        "entry_data": "192.168.1.101"
      },
```

Blob entries are base64-encoded, and the above decode to `emporia` and
`emporia123`, the wifi credentials that we want to change.

As a bonus, we also get `MQTT_IP`, which we need to change if we're to use this
on any other networks.

So I wrote `./nvsjson2csv.py`, which allows us to turn the JSON file into a CSV
file suitible for use with the [NVS partition generator
tool](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/storage/nvs_partition_gen.html)

Then the `nvs.json` file can be updated with the correct WiFi credentials and
my MQTT server's IP address.

The new NVS partition is created like this, using the partition size from
`esp32_image_parser.py show_partitions ../flash_contents.bin`:

```
$ ./nvs_partition_gen.py generate
usage: nvs_partition_gen.py generate [-h] [--version {1,2}] [--outdir OUTDIR] input output size
nvs_partition_gen.py generate: error: the following arguments are required: input, output, size
$ ./nvsjson2csv.py ./nvs_new.json /dev/stdout | ./nvs_partition_gen.py generate /dev/stdin ./nvs_new.bin 327680

Creating NVS binary with version: V2 - Multipage Blob Support Enabled

Created NVS binary: ===> ..././nvs_new.bin
```

We know that the nvs parititon starts at 0x9000 and is 327680 bytes long from earlier:

```console
$ python3 esp32_image_parser.py show_partitions ../flash_contents.bin
reading partition table...
entry 0:
  label      : nvs
  offset     : 0x9000
  length     : 327680
  type       : 1 [DATA]
  sub type   : 2 [WIFI]
...
```

So we can just open up the new NVS binary file, and use a hex editor to
overwrite the region of the flash that the NVS partition is in.

It's then easy to flash the new image on:

```console
$ esptool.py --port /dev/ttyUSB0 write_flash -fs 4MB 0x0 flash_contents_new.bin
```

The only problem here is brownouts--the USB dongle I have does not provide
enough power for this task, and the dupont wires have too much voltage drop.

The solution is to use thicker wires to connect another power supply, and to
attach the ground of that supply to the ground of the serial dongle.

## MQTT

At this point, we're up and running on the intended network!

```
I (147042) MQTT_CLIENT: Sending MQTT CONNECT message, type: 1, id: 0000
W (147062) MQTT_CLIENT: Connection refused, not authorized
I (147062) MQTTComms: MQTT_EVENT_ERROR
I (147062) MQTT_CLIENT: Error MQTT Connected
I (147072) MQTTComms: MQTT_EVENT_DISCONNECTED
```

`Connection refused, not authorized` is exactly what we want to see. There's no
way to specify credentials without deeper reverse engineering, so we can't
authenticate to the MQTT server.

```
I (13322) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/<id>8/cmd,  status=37249
I (13332) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/<id>8/fw,  status=64727
I (13332) Json: Json_BuildAndSendInfo sending ({"event":"STARTUP","free_mem":4303960,"cpu_stats":"mqtt_task      \t3034772\t\t<1%\r\nWiFi           \t406926069\t\t10%\r\nIDLE1          \t1787872612\t\t46%\r\nIDLE0          \t538524270\t\t13%\r\nCT             \t34166486\t\t<1%\r\ntiT            \t3162833\t\t<1%\r\nTmr Svc        \t9970\t\t<1%\r\nbtuT           \t3358668\t\t<1%\r\nBTC_TASK       \t2573434\t\t<1%\r\nsys_evt        \t9470383\t\t<1%\r\nesp_timer      \t792967\t\t<1%\r\nwifi           \t209618326\t\t5%\r\nipc0           \t273062235\t\t7%\r\nipc1           \t93019349\t\t2%\r\nbtController   \t47665616\t\t1%\r\nhciT           \t3492562\t\t<1%\r\n","uptime":11550,"build_datetime":"Mon Jul 13 20:14:22 UTC 2020","build_commit":"45126ee0","response":"query_info","firmware_version":"Vue2-1594671260","idf_version":"v4.0","device_id":"<id>8","upload_frequency_seconds":1,"solar_enable":0,"solar_reverse":0,"wifi_rssi":-55,"wifi_authmode":3,"wifi_channel":6})
I (13332) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/<id>8/verify,  status=43915
I (13432) MQTTComms: MQTTComms_PublishResponse
I (13442) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/broadcast/cmd,  status=26728
I (13452) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/broadcast/fw,  status=51922
I (13462) MQTTComms: SUBSCRIBE to topic prod/minions/emporia/ct/v1/broadcast/verify,  status=63188
I (13472) Json: Json_BuildAndSendInfo done sending
I (13472) WiFiTask: Creating device_readings protobuf
I (13482) DeviceReadings: Largest external SPIRAM block: 4194264
I (13482) MQTTComms: MQTT_EVENT_SUBSCRIBED, msg_id=37249

I (13692) MQTTComms: MQTTComms_PublishBinaryReadings Topic: $aws/rules/prodIngestBinaryToSQS/prod/binary/<id>8/meter, return_code: 0 
I (13702) MQTTComms: MQTTComms_PublishBinaryReadings Topic: aws/rules/prodIngestBinaryToSQS/prod/binary/<id>8/meter, return_code: 0
```

## On-board Communications

Up next is looking at the board to see if we can understand the protocol that
is used to transfer the data from the MCU doing the measurements, an Atmel SAM
D09, and the ESP32.

Turns out that the communications are done on pins IO21 & IO22 of the ESP32
module. After soldering some wires on, we see something that looks like I2C.

Decoding it shows us that it is a request for address 0x64, and the following
messages are returned for each request:

```
0000:0000 | 03 22 52 10  3C BC FF FF  D2 F2 FF FF  81 B5 FF FF
0000:0010 | 3C BC FF FF  D2 F2 FF FF  81 B5 FF FF  3C BC FF FF
0000:0020 | D2 F2 FF FF  81 B5 FF FF  1D BE FF FF  B1 EF FF FF
0000:0030 | 4F B4 FF FF  37 BE FF FF  BF F2 FF FF  9A B4 FF FF
0000:0040 | 84 BA FF FF  09 F0 FF FF  3C B9 FF FF  C1 BE FF FF
0000:0050 | 19 F6 FF FF  FA B2 FF FF  F6 BA FF FF  19 F6 FF FF
0000:0060 | 8F B7 FF FF  5F BA FF FF  41 F2 FF FF  47 B6 FF FF
0000:0070 | 81 BB FF FF  AB F4 FF FF  E6 B4 FF FF  74 BB FF FF
0000:0080 | F9 F0 FF FF  29 B4 FF FF  1D BE FF FF  B1 EF FF FF
0000:0090 | 4F B4 FF FF  37 BE FF FF  BF F2 FF FF  9A B4 FF FF
0000:00A0 | 84 BA FF FF  09 F0 FF FF  3C B9 FF FF  C1 BE FF FF
0000:00B0 | 19 F6 FF FF  FA B2 FF FF  F6 BA FF FF  19 F6 FF FF
0000:00C0 | 8F B7 FF FF  5F BA FF FF  41 F2 FF FF  47 B6 FF FF
0000:00D0 | 81 BB FF FF  AB F4 FF FF  E6 B4 FF FF  74 BB FF FF
0000:00E0 | F9 F0 FF FF  29 B4 FF FF  0E 00 0B 00  0E 00 00 00
0000:00F0 | 00 00 00 00  00 50 00 50  00 50 FD 4F  FD 4F FD 4F
0000:0100 | FD 4F FD 4F  03 50 03 50  03 50 FD 4F  FD 4F FD 4F
0000:0110 | FD 4F FD 4F  03 50 03 50  03 50 00 00             
```

```
0000:0110 |                                        03 A2 52 13
0000:0120 | 66 B8 FF FF  6B EF FF FF  56 B0 FF FF  66 B8 FF FF
0000:0130 | 6B EF FF FF  56 B0 FF FF  66 B8 FF FF  6B EF FF FF
0000:0140 | 56 B0 FF FF  DD BA FF FF  21 ED FF FF  97 AE FF FF
0000:0150 | 31 BC FF FF  18 EC FF FF  9B AD FF FF  3B B6 FF FF
0000:0160 | 6E F0 FF FF  4D B1 FF FF  ED B9 FF FF  9D F1 FF FF
0000:0170 | D4 B2 FF FF  FD B8 FF FF  22 F7 FF FF  F0 AE FF FF
0000:0180 | 3D B2 FF FF  DF F0 FF FF  17 B2 FF FF  0A B9 FF FF
0000:0190 | 63 EC FF FF  A0 AF FF FF  B5 B7 FF FF  B3 EB FF FF
0000:01A0 | B2 B1 FF FF  DD BA FF FF  21 ED FF FF  97 AE FF FF
0000:01B0 | 31 BC FF FF  18 EC FF FF  9B AD FF FF  3B B6 FF FF
0000:01C0 | 6E F0 FF FF  4D B1 FF FF  ED B9 FF FF  9D F1 FF FF
0000:01D0 | D4 B2 FF FF  FD B8 FF FF  22 F7 FF FF  F0 AE FF FF
0000:01E0 | 3D B2 FF FF  DF F0 FF FF  17 B2 FF FF  0A B9 FF FF
0000:01F0 | 63 EC FF FF  A0 AF FF FF  B5 B7 FF FF  B3 EB FF FF
0000:0200 | B2 B1 FF FF  0E 00 0B 00  0F 00 00 00  00 00 00 00
0000:0210 | 00 50 00 50  00 50 FD 4F  03 50 FD 4F  FD 4F FD 4F
0000:0220 | 03 50 03 50  FD 4F FD 4F  03 50 FD 4F  FD 4F FD 4F
0000:0230 | 03 50 03 50  FD 4F 00 00                          
```

This is exactly the same data that is shown in the
`prod/minions/emporia/ct/v1/<ID>/debug` topic at the start.

Which is nice for reverse engineering, because we can remove the wires from the
board, plug the device into the panel, and reverse-engineer the I2C results
remotely.

But only if we want to go down this route. The data printed in MQTT is already
good enough for keeping track of our power usage.