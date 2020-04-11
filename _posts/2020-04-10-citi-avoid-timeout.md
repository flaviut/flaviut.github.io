---
layout: post
tags: []
title: "Avoiding Citi's session timeout"
---

One annoying thing that banks like to do is to timeout any sessions that don't have activity for a certain number of minutes. This is incredibly annoying because sometimes you're waiting in a queue and you won't want to be constantly wiggling the mouse.

So here's a fix for Citi's website:

```javascript
setInterval(() => {
  const continueSessionButt = document.evaluate("//button[contains(., 'Continue Session')]", document, null, XPathResult.ANY_TYPE, null).iterateNext();
	if (continueSessionButt.getBoundingClientRect().width === 0) { /* session not about to expire */ return; }
  continueSessionButt.click();
}, 10000)
```

If you don't know how to use it, you really shouldn't be running code from random websites on your bank's website 😁.
