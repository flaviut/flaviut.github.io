// ==ClosureCompiler==
// @compilation_level SIMPLE_OPTIMIZATIONS
// @output_file_name default.js
// ==/ClosureCompiler==

// GoatCounter: https://www.goatcounter.com
// This file (and *only* this file) is released under the ISC license:
// https://opensource.org/licenses/ISC
;(function() {
    'use strict';

    window.goatcounter = window.goatcounter || {}

    // Load settings from data-goatcounter-settings.
    var s = document.querySelector('script[data-goatcounter]')
    if (s && s.dataset.goatcounterSettings) {
        try         { var set = JSON.parse(s.dataset.goatcounterSettings) }
        catch (err) { console.error('invalid JSON in data-goatcounter-settings: ' + err) }
        for (var k in set)
            if (['no_onload', 'no_events', 'allow_local', 'allow_frame', 'path', 'title', 'referrer', 'event'].indexOf(k) > -1)
                window.goatcounter[k] = set[k]
    }

    var enc = encodeURIComponent

    // Get all data we're going to send off to the counter endpoint.
    var get_data = function(vars) {
        var data = {
            p: (vars.path     === undefined ? goatcounter.path     : vars.path),
            r: (vars.referrer === undefined ? goatcounter.referrer : vars.referrer),
            t: (vars.title    === undefined ? goatcounter.title    : vars.title),
            e: !!(vars.event || goatcounter.event),
            s: [window.screen.width, window.screen.height, (window.devicePixelRatio || 1)],
            b: is_bot(),
            q: location.search,
        }

        var rcb, pcb, tcb  // Save callbacks to apply later.
        if (typeof(data.r) === 'function') rcb = data.r
        if (typeof(data.t) === 'function') tcb = data.t
        if (typeof(data.p) === 'function') pcb = data.p

        if (is_empty(data.r)) data.r = document.referrer
        if (is_empty(data.t)) data.t = document.title
        if (is_empty(data.p)) data.p = get_path()

        if (rcb) data.r = rcb(data.r)
        if (tcb) data.t = tcb(data.t)
        if (pcb) data.p = pcb(data.p)
        return data
    }

    // Check if a value is "empty" for the purpose of get_data().
    var is_empty = function(v) { return v === null || v === undefined || typeof(v) === 'function' }

    // See if this looks like a bot; there is some additional filtering on the
    // backend, but these properties can't be fetched from there.
    var is_bot = function() {
        // Headless browsers are probably a bot.
        var w = window, d = document
        if (w.callPhantom || w._phantom || w.phantom)
            return 150
        if (w.__nightmare)
            return 151
        if (d.__selenium_unwrapped || d.__webdriver_evaluate || d.__driver_evaluate)
            return 152
        if (navigator.webdriver)
            return 153
        return 0
    }

    // Object to urlencoded string, starting with a ?.
    var urlencode = function(obj) {
        var p = []
        for (var k in obj)
            if (obj[k] !== '' && obj[k] !== null && obj[k] !== undefined && obj[k] !== false)
                p.push(enc(k) + '=' + enc(obj[k]))
        return '?' + p.join('&')
    }

    // Show a warning in the console.
    var warn = function(msg) {
        if (console && 'warn' in console)
            console.warn('goatcounter: ' + msg)
    }

    // Get the endpoint to send requests to.
    var get_endpoint = function() {
        var s = document.querySelector('script[data-goatcounter]')
        if (s && s.dataset.goatcounter)
            return s.dataset.goatcounter
        return (goatcounter.endpoint || window.counter)  // counter is for compat; don't use.
    }

    // Get current path.
    var get_path = function() {
        var loc = location,
            c = document.querySelector('link[rel="canonical"][href]')
        if (c) {  // May be relative or point to different domain.
            var a = document.createElement('a')
            a.href = c.href
            if (a.hostname.replace(/^www\./, '') === location.hostname.replace(/^www\./, ''))
                loc = a
        }
        return (loc.pathname + loc.search) || '/'
    }

    // Run function after DOM is loaded.
    var on_load = function(f) {
        if (document.body === null)
            document.addEventListener('DOMContentLoaded', function() { f() }, false)
        else
            f()
    }

    // Filter some requests that we (probably) don't want to count.
    var goatcounter_filter = function() {
        if ('visibilityState' in document && document.visibilityState === 'prerender')
            return 'visibilityState'
        if (!goatcounter.allow_frame && location !== parent.location)
            return 'frame'
        if (!goatcounter.allow_local && location.hostname.match(/(localhost$|^127\.|^10\.|^172\.(1[6-9]|2[0-9]|3[0-1])\.|^192\.168\.|^0\.0\.0\.0$)/))
            return 'localhost'
        if (!goatcounter.allow_local && location.protocol === 'file:')
            return 'localfile'
        if (localStorage && localStorage.getItem('skipgc') === 't')
            return 'disabled with #toggle-goatcounter'
        return false
    }

    // Get URL to send to GoatCounter.
    var goatcounter_url = function(vars) {
        var data = get_data(vars || {})
        if (data.p === null)  // null from user callback.
            return
        data.rnd = Math.random().toString(36).substr(2, 5)  // Browsers don't always listen to Cache-Control.

        var endpoint = get_endpoint()
        if (!endpoint)
            return warn('no endpoint found')

        return endpoint + urlencode(data)
    }

    // Count a hit.
    var goatcounter_count = function(vars) {
        var f = goatcounter_filter()
        if (f)
            return warn('not counting because of: ' + f)

        var url = goatcounter_url(vars)
        if (!url)
            return warn('not counting because path callback returned null')

        var img = document.createElement('img')
        img.src = url
        img.style.position = 'absolute'  // Affect layout less.
        img.style.bottom = '0px'
        img.style.width = '1px'
        img.style.height = '1px'
        img.loading = 'eager'
        img.setAttribute('alt', '')
        img.setAttribute('aria-hidden', 'true')

        var rm = function() { if (img && img.parentNode) img.parentNode.removeChild(img) }
        img.addEventListener('load', rm, false)
        document.body.appendChild(img)
    }

    // Track click events.
    var goatcounter_bind_events = function() {
        if (!document.querySelectorAll)  // Just in case someone uses an ancient browser.
            return

        var send = function(elem) {
            return function() {
                goatcounter_count({
                    event:    true,
                    path:     (elem.dataset.goatcounterClick || elem.name || elem.id || ''),
                    title:    (elem.dataset.goatcounterTitle || elem.title || (elem.innerHTML || '').substr(0, 200) || ''),
                    referrer: (elem.dataset.goatcounterReferrer || elem.dataset.goatcounterReferral || ''),
                })
            }
        }

        Array.prototype.slice.call(document.querySelectorAll("*[data-goatcounter-click]")).forEach(function(elem) {
            if (elem.dataset.goatcounterBound)
                return
            var f = send(elem)
            elem.addEventListener('click', f, false)
            elem.addEventListener('auxclick', f, false)  // Middle click.
            elem.dataset.goatcounterBound = 'true'
        })
    }

    // Make it easy to skip your own views.
    if (location.hash === '#toggle-goatcounter') {
        if (localStorage.getItem('skipgc') === 't') {
            localStorage.removeItem('skipgc', 't')
        }
        else {
            localStorage.setItem('skipgc', 't')
        }
    }

    if (!goatcounter.no_onload)
        on_load(function() {
            // 1. Page is visible, count request.
            // 2. Page is not yet visible; wait until it switches to 'visible' and count.
            // See #487
            if (!('visibilityState' in document) || document.visibilityState === 'visible')
                goatcounter_count()
            else {
                var f = function(e) {
                    if (document.visibilityState !== 'visible')
                        return
                    document.removeEventListener('visibilitychange', f)
                    goatcounter_count()
                }
                document.addEventListener('visibilitychange', f)
            }

            if (!goatcounter.no_events)
                goatcounter_bind_events()
        })
})();
