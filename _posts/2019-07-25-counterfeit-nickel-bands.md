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

Steel has [a density of $$7.75\frac{\mathrm{g}}{\mathrm{cm}^3}$$ to
$$8.05\frac{\mathrm{g}}{\mathrm{cm}^3}$$][steel-density].

[steel-density]: https://en.wikipedia.org/wiki/Steel#Material_properties

$$20\mathrm{cm}^3 \times 7.75\frac{\mathrm{g}}{\mathrm{cm}^3} = 155\mathrm{g}$$

The low end of this range ends up being exactly what my band weighs, a point of
evidence towards my band being made up mostly of steel.

## Flame test

One way to find out what it's actually made up of is to conduct a [flame
test][].

[flame test]: https://en.wikipedia.org/wiki/Flame_test

{% include image.html
    url="/assets/images/2019-07-25-counterfeit-nickel-bands/flame-test.jpg"
    description="Yellow/orange flame from nickel strip" %}

The results from the flame test are conclusive. This strip does not have
significant nickel content, which glows silver-white. The orange flame indicates
either iron or sodium.

### Potential contamination

> Sodium is a common component or contaminant in many compounds and its spectrum
> tends to dominate over others<sup>[[1]][sodium-contamination]</sup>

At first, I didn't realize that sodium contamination could be a problem. After
careful reading though, I decided to try cleaning my strip in hydrochloric acid
before applying the flame. This mimics the procedure used when placing flame
test samples on a platinum wire:

> Samples are usually held on a platinum wire cleaned repeatedly with
> hydrochloric acid<sup>[[1]][sodium-contamination]</sup>

[sodium-contamination]: https://en.wikipedia.org/wiki/Flame_test#Process

After doing this, the results were very different:

{% include image.html
    url="/assets/images/2019-07-25-counterfeit-nickel-bands/flame-test-after.jpg"
    description="Orange flame from a cleaned nickel strip" %}

This flame is much more clearly orange, and has no yellow tint to it, like
it did before. The orange here clearly indicates the presence of iron.

However, when I then touched the band with my fingers and applied
the flame again, I'd get an orange flame. This shows that the tiny amount of
sodium contamination from my fingers has a drastic result on the color of the
flame--and it's a neat, intuitive, way of seeing why sodium was chosen for
[sodium-vapor lamps][].

[sodium-vapor lamps]: https://en.wikipedia.org/wiki/Sodium-vapor_lamp

## Conclusion

Both the orange glow from the acid-cleaned band and the density of the band
indicate that this product is not made of nickel.
