---
layout: post
tags: [reverse engineering, android]
title: "Hacking the LG ThinQ App for use with trackers blocked"
---

When I try to use the LG ThinQ app[^1], I get an error saying that "There are
problems with the security certificate for this server". Probably because I'm
blocking the millions of tracking services that the app tries to connect to at
the DNS level.

[^1]: I unfortunately need to use the app to get to a certain energy-saving mode on my dryer & for initial setup with Home Assistant.

I've been able to patch the app to get past this error:

## Downloading the APK

I grabbed the APK by installing [apk.sh][], and then
running `./apk.sh pull com.lgeha.nuts`.

[apk.sh]: https://github.com/ax/apk.sh

I then unpacked it using `./apk.sh decode base.apk`.

## Finding the problem

I was able to search for the exact error text, which ended up being in
the `lt_ssl_error_msg` resource. This resource is then used by
the `smali_classes4/com/lge/emplogin/ui/BaseWebViewActivity$1.smali` class,
which
I had trouble reading.

Fortunately, it turns out that there is another took, [jadx][], which can
decompile into Java code. This code is much clearer:

[jadx]: https://github.com/skylot/jadx

```java
@Override // android.webkit.WebViewClient
public void onReceivedSslError(WebView webView, SslErrorHandler sslErrorHandler, SslError sslError) {
    String str = BaseWebViewActivity.TAG;
    Emp4HLog.e(str, "onReceivedSslError..error is : " + sslError.toString());
    FirebaseCrashlytics.getInstance().recordException(new Throwable("onRevicedSSLError"));
    Toast.makeText(BaseWebViewActivity.this, R.string.lt_ssl_error_msg, 1).show();
    sslErrorHandler.cancel();
    BaseWebViewActivity.this.finish();
}
```

Every time there's an SSL error it:

- reports the error to their servers
- sends a toast message
- closes the webview

That's not great, because their login screen is in the webview and loads tons of
tracking services, and when those tracking scripts fail to load due to the SSL
error, it fails the whole login. Simple solution though: just don't close the
webview.

## Patching the code

There's probably a better way to do this, perhaps using
[ReVanced project][revanced]. But I just opened
`smali_classes4/com/lge/emplogin/ui/BaseWebViewActivity$1.smali`, and
deleted the following lines that call `finish()`:

[revanced]: https://github.com/revanced

```
.line 6
iget-object p1, p0, Lcom/lge/emplogin/ui/BaseWebViewActivity$1;->this$0:Lcom/lge/emplogin/ui/BaseWebViewActivity;

invoke-virtual {p1}, Landroid/app/Activity;->finish()V
```

## Rebuilding and installing

`./apk.sh build base` then rebuilt the APK, and then install my patched version:

```console
$ adb install file.apk
Performing Streamed Install
adb: failed to install file.apk: Failure [INSTALL_FAILED_UPDATE_INCOMPATIBLE: Existing package com.lgeha.nuts signatures do not match newer version; ignoring!]
$ adb uninstall com.lgeha.nuts
Success
$ adb install file.apk
```

## Bypassing "security" checks

Unfortunately, now the app fails with a "Cannot run on a rooted device" toast ☹.
Following the above steps again show it to come from
`com.lgeha.nuts.WebMainActivity`:

```java
SecurityModule securityModule = SecurityModule.getInstance(this);
this.mSecurityModule = securityModule;
if (securityModule.getVerifyDoneResult() != null && this.mSecurityModule.getVerifyDoneResult() == SecurityCheckerCallbackIF.Result.ROOTING_CHECK_FAILED) {
    Toast.makeText(this, (int) R.string.CP_UX30_CANNOT_RUN_ROOTED_DEVICE, 1).show();
    CrashReportUtils.reportExceptional(new Exception("mSecuritymodule.getVerifyDoneResult == CHECK_FAILED"));
    finish();
    return;
}
```

Instead of patching this check, it'd be better to patch `SecurityModule` in case
it also gets checked elsewhere. It looks like they call into native code for
some extra obfuscation, but let's just patch the interface:

```java
@Override // com.lge.securitychecker.SecurityCheckerCallbackIF
public void onVerifyDone(SecurityCheckerCallbackIF.Result result, Object appInstance) {
    Timber.d("onVerifyDone() : " + result, new Object[0]);
    if (this.verifyComplete == null) {
        Timber.d("verifyComplete is null.", new Object[0]);
        return;
    }
    sResult = result;
    if (SecurityCheckerCallbackIF.Result.SUCCESS.equals(result) && appInstance != null) {
        Timber.d("onVerifyDone result success.", new Object[0]);
        sMainLoaderInterface = (MainLoaderInterface) appInstance;
        for (IVerifyComplete iVerifyComplete : this.verifyComplete) {
            Timber.d("send complete callback", new Object[0]);
            iVerifyComplete.complete(sResult, sMainLoaderInterface);
        }
    } else {
        Timber.e("onVerifyDone result fail. result : " + result, new Object[0]);
        sMainLoaderInterface = null;
        for (IVerifyComplete iVerifyComplete2 : this.verifyComplete) {
            Timber.e("send fail callback", new Object[0]);
            iVerifyComplete2.complete(sResult, sMainLoaderInterface);
        }
    }
    this.verifyComplete.clear();
}
```

And just change this code so that `SUCCESS` is always written into `sResult`:

```diff
-    sput-object p1, Lcom/lgeha/nuts/security/module/SecurityCheckerCallback;->sResult:Lcom/lge/securitychecker/SecurityCheckerCallbackIF$Result;
-
-    .line 5
     sget-object v0, Lcom/lge/securitychecker/SecurityCheckerCallbackIF$Result;->SUCCESS:Lcom/lge/securitychecker/SecurityCheckerCallbackIF$Result;
 
+    sput-object v0, Lcom/lgeha/nuts/security/module/SecurityCheckerCallback;->sResult:Lcom/lge/securitychecker/SecurityCheckerCallbackIF$Result;
+
+    .line 5
```

After [rebuilding and installing][], I was able to log in!

[rebuilding and installing]: #rebuilding-and-installing
