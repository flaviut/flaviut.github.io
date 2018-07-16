---
layout: post
tags: [virtualization, linux, windows, libvirt]
title: 'Configuring a libvirt Windows VM'
---

This was a massive pain, so I've written up this post for my reference. I went
through lots of twists an turns to get to this point so it's probably
incomplete. You'll be required to solve some problems on your own (the
horror!), but it includes lots of links to documentation and should at least be
a starting point. My goals were:

- Minimal disk space. My SSD isn't infinite, and I want to have multiple VMs.
- Minimal memory usage. If Windows is only using 1.4GiB, I don't want it using
  4.0GiB on the host.
- Shiny features. I'm not going to use them or even understand what they do but
  I'll be damned if I'm not going to enable them all.

{% include image.html
    url="/assets/images/2018-07-16-configuring-libvirt-windows-vm/shiny.jpg"
    description="A photo of me (©<a href='https://commons.wikimedia.org/wiki/User:Joseph_C_Boone'>Joseph C Boone</a> CC-BY-SA-4.0)" %}

## Procedure

If you have suggestions or this is totally broken now, please [let me know][]!

1. Open up virt-manager, and use the default VM configuration to install
   Windows 10. Get to the point where the VM logs in to the default user on
   startup.
2. Add a new SCSI hard drive to the VM. This is just to convince Windows it
   actually needs to use the new drivers, so a blank 100MiB QCOW2 image works
   great for this.
3. Remove the Windows ISO from the CD drive, and replace it with
   [`virtio-win.iso`][virtio-iso]. [The documentation for this image can be
   found here.][virtio-iso-doc]
4. Install the following drivers from that disk. This is done by going to
   `<drivername>/w10/amd64/<drivername>.inf`, right-clicking, and selecting
   "Install". Since the documentation for this stuff is mostly non-existant and
   scattered all over the place, I will provide explainations below:
   - [vioscsi][]: SCSI driver, will be used for disks. Must be installed for
     thin-provisioned disks.
   - [NetKVM][]: Network driver. Documentation is light on the details of why I
     should care, but it's probably faster or something so might as well
     install it.
   - [viorng][]: Prevents the OS from running out of random numbers. Doesn't seem
     to do anything, but you might as well install it anyway.
   - [vioser][]: Some kind of serial dirver? Apparently this is used for
     copy-paste, although copy-paste seems to work just fine without it; might
     as well install it.
   - [Balloon][]: Allows memory to be allocated to other VMs when the host is
     running out of memory due to over-committing. Seems useful, might as well
     install it.
   - [qxldod][]: Better graphics performance than VGA, according to the docs.
     Might as well install it.
5. Install [guest-agent][] ([more docs][guest-agent-2]) from the disk. This
   provides the host an interface to run commands and read files on the guest.
   We're not going to need it, but extra features, right?
6. [Download and install the SPICE Windows guest tools][spice-win]. This will
   provide you with screen auto-resizing, a shared clipboard. According to the
   docs this also includes graphics drivers, although we've already installed
   [qxldod][] above.
7. Shutdown your system.
8. Open the "Details" tab in virt-manager, and configure the following items:
   - CDROM 1: Advanced -> Disk Bus = SCSI
   - DISK 1: Advanced -> Disk Bus = SCSI
   - NIC: Device Model = virtio
   - Display: Listen Type = None (running over IP seems kinda experimental)
   - Video: Model = QXL
   - Controller SCSI 0: Model = VirtIO SCSI
9. Open up the XML description of the VM for editing. No clue how to find out
   where it is, but mine was `/etc/libvirt/qemu/win10.xml`. Look for a line
   like `<driver name='qemu' type='qcow2'/>`. Add `discard='unmap'` so that it
   looks like `<driver name='qemu' type='qcow2' discard='unmap'/>`.
9. Start up the VM again and hope that it works.
10. Open up the defragmenter in Windows and confirm that the words "Thin
    Volume" show up somewhere.
11. Click "Optimize" to run TRIM and sparsify the disk image. You can also
    shave off a few more bytes by running [virt-sparsify][] afterwards.

Since you do not want to deal with all this BS again, make a copy of your disk
and of your VM's XML description.  It should be pretty small (for Windows at
least, <10GiB), and compresses very well. I did a little more to get rid of
useless crap, and my image compresses (with `gzip -9`) from 6.4GiB to 4.7GiB.

For reference, here is the `<devices>` section of  my `win10.xml`:

```xml
<emulator>/usr/bin/qemu-system-x86_64</emulator>
<disk type='file' device='cdrom'>
  <driver name='qemu' type='raw'/>
  <source file='/usr/share/virtio/virtio-win.iso'/>
  <target dev='sda' bus='scsi'/>
  <readonly/>
  <address type='drive' controller='0' bus='0' target='0' unit='0'/>
</disk>
<disk type='file' device='disk'>
  <driver name='qemu' type='qcow2' cache='none'/>
  <source file='/var/lib/libvirt/images/win10.qcow2'/>
  <target dev='sdb' bus='scsi'/>
  <address type='drive' controller='0' bus='0' target='0' unit='1'/>
</disk>
<controller type='usb' index='0' model='ich9-ehci1'>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x05' function='0x7'/>
</controller>
<controller type='usb' index='0' model='ich9-uhci1'>
  <master startport='0'/>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x05' function='0x0' multifunction='on'/>
</controller>
<controller type='usb' index='0' model='ich9-uhci2'>
  <master startport='2'/>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x05' function='0x1'/>
</controller>
<controller type='usb' index='0' model='ich9-uhci3'>
  <master startport='4'/>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x05' function='0x2'/>
</controller>
<controller type='pci' index='0' model='pci-root'/>
<controller type='scsi' index='0' model='virtio-scsi'>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x06' function='0x0'/>
</controller>
<controller type='virtio-serial' index='0'>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x07' function='0x0'/>
</controller>
<controller type='ide' index='0'>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x01' function='0x1'/>
</controller>
<interface type='network'>
  <mac address='52:54:00:6d:a3:d6'/>
  <source network='default'/>
  <model type='virtio'/>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x03' function='0x0'/>
</interface>
<serial type='pty'>
  <target type='isa-serial' port='0'>
    <model name='isa-serial'/>
  </target>
</serial>
<console type='pty'>
  <target type='serial' port='0'/>
</console>
<channel type='spicevmc'>
  <target type='virtio' name='com.redhat.spice.0'/>
  <address type='virtio-serial' controller='0' bus='0' port='1'/>
</channel>
<input type='tablet' bus='usb'>
  <address type='usb' bus='0' port='1'/>
</input>
<input type='mouse' bus='ps2'/>
<input type='keyboard' bus='ps2'/>
<graphics type='spice' keymap='en-us'>
  <listen type='none'/>
  <image compression='off'/>
  <gl enable='no'/>
</graphics>
<sound model='ich6'>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x04' function='0x0'/>
</sound>
<video>
  <model type='qxl' ram='65536' vram='65536' vgamem='16384' heads='1' primary='yes'/>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x02' function='0x0'/>
</video>
<redirdev bus='usb' type='spicevmc'>
  <address type='usb' bus='0' port='2'/>
</redirdev>
<redirdev bus='usb' type='spicevmc'>
  <address type='usb' bus='0' port='3'/>
</redirdev>
<memballoon model='virtio'>
  <address type='pci' domain='0x0000' bus='0x00' slot='0x08' function='0x0'/>
</memballoon>
```

[let me know]: mailto:me@flaviutamas.com
[virtio-iso]: https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso
[virtio-iso-doc]: https://docs.fedoraproject.org/quick-docs/en-US/creating-windows-virtual-machines-using-virtio-drivers.html
[vioscsi]: https://wiki.qemu.org/Features/VirtioSCSI
[netkvm]: https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/6/html/virtualization_host_configuration_and_guest_installation_guide/netkvm-parameters
[viorng]: https://wiki.qemu.org/Features/VirtIORNG
[vioser]: https://fedoraproject.org/wiki/Features/VirtioSerial
[balloon]: https://www.linux-kvm.org/page/Projects/auto-ballooning
[qxldod]: https://www.spice-space.org/spice-user-manual.html#_qxl_device_and_drivers
[guest-agent]: https://wiki.libvirt.org/page/Qemu_guest_agent
[guest-agent-2]: https://wiki.qemu.org/Features/GuestAgent
[spice-win]: https://www.spice-space.org/download.html#guest
[virt-sparsify]: http://libguestfs.org/virt-sparsify.1.html
