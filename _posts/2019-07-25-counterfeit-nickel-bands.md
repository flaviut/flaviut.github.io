---
layout: post
tags: [hardware]
title: "Testing a nickel band material"
---

I recently purchased a "pure nickel" band for use in building a battery pack.

{% include image.html
    url="/assets/images/2019-07-25-counterfeit-nickel-bands/listing.png"
    description="Store listing for nickel band" %}

However, from various forum posts, I've learned that it's unlikely that these
strips are really made up of what they claim to be made up of, so I decided to
test the product.

## By weight

When measured on a scale, the product I received was $$156\mathrm{g}$$.

The volume, as calculated from the vendor's measurements, should be
$$10\mathrm{m} \times 10\mathrm{mm} \times 0.2\mathrm{mm} = 20\mathrm{cm}^3$$.

[Nickel's density is $$8.9\frac{\mathrm{g}}{\mathrm{cm}^3}$$][nickel-density].

[nickel-density]: https://en.wikipedia.org/wiki/Nickel

$$20\mathrm{cm}^3 \times 8.9\frac{\mathrm{g}}{\mathrm{cm}^3} = 178.16\mathrm{g}$$

So clearly something is off. I either received too little product, or it was not
actually made of nickel.

## Flame test

One way to find out what it's actually made up of is to conduct a [flame
test][].

[flame test]: https://en.wikipedia.org/wiki/Flame_test

{% include image.html
    url="/assets/images/2019-07-25-counterfeit-nickel-bands/flame-test.jpg"
    description="Orange flame from 'nickel' strip" %}

The results from the flame test are conclusive. This strip does not have
significant nickel content, which glows silver-white. The orange flame indicates
either calcium or iron, and the band doesn't look like calcium.

Steel has [a density of $$7.75\frac{\mathrm{g}}{\mathrm{cm}^3}$$ to
$$8.05\frac{\mathrm{g}}{\mathrm{cm}^3}$$][steel-density].

[steel-density]: https://en.wikipedia.org/wiki/Steel#Material_properties

$$20\mathrm{cm}^3 \times 7.75\frac{\mathrm{g}}{\mathrm{cm}^3} = 155\mathrm{g}$$

The low end of this range ends up being exactly what my band weighs, indicating
that the band is just steel with a thin nickel coating.

