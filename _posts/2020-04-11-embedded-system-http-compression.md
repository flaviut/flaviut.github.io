---
layout: post
tags: [hardware, http, performance]
title: "Performance of HTTP compression in embedded systems"
---

Embedded systems these days frequently need to serve up HTML pages, but in most cases, both the processor and the network interfaces are very slow. It's important to find the right balance of gzip compression ratio to reduce the page load time of these devices, with the goal being to minimize the total amount of time from when the request is made to when the response is fully recieved.

## gzip Performance

The first step is to figure out exactly how slow gzip is on the desired processor.

The following script is used to fetch performance data at varying levels of performance. It uses `./test.html` as the document to test with, and you'll likely want to change `exec_count` depending on your processor.

```python
from __future__ import print_function
from timeit import timeit
import io, gzip


def compress(data, level):
    output = io.BytesIO()
    gzip.GzipFile(mode="wb", fileobj=output, compresslevel=level).write(data)
    return output.tell()


def load_example():
    with open("./test.html", "r") as f:
        content = f.read()
        try:
            return content.encode("utf8")
        except UnicodeDecodeError:
            return content


data = load_example()
exec_count = 20
print("compression level, time (ms), compressed size (kiB)")
for level in range(0, 10):
    test_fun = lambda: compress(data, level=level)
    time = timeit(test_fun, number=exec_count)
    size = test_fun()
    print(str((level, time / float(exec_count) * 1000, size / 1024.0)) + ",")
```


```python
import pandas as pd
%config InlineBackend.figure_formats = ['svg']
import matplotlib.pyplot as plt
%matplotlib inline
```


```python
orange_pi_zero = pd.DataFrame([
    (0, 11.398696899414062, 403.4951171875),
    (1, 30.363094806671143, 87.796875),
    (2, 31.992197036743164, 83.490234375),
    (3, 35.304808616638184, 79.7978515625),
    (4, 45.820748805999756, 74.3955078125),
    (5, 56.08339309692383, 70.9033203125),
    (6, 70.80044746398926, 68.8701171875),
    (7, 80.49700260162354, 68.52734375),
    (8, 111.0435962677002, 68.2294921875),
    (9, 160.21054983139038, 68.1083984375),
], columns=['level', 'time_ms', 'size_kiby']
).set_index('level')

ryzen_2700x = pd.DataFrame([
    (0, 0.6599545478820801, 403.4951171875),
    (1, 3.2829999923706055, 87.796875),
    (2, 2.991056442260742, 83.490234375),
    (3, 3.4702062606811523, 79.7978515625),
    (4, 4.487097263336182, 74.3955078125),
    (5, 5.750846862792969, 70.9033203125),
    (6, 7.645905017852783, 68.8701171875),
    (7, 8.826696872711182, 68.52734375),
    (8, 12.513351440429688, 68.2294921875),
    (9, 18.452298641204834, 68.1083984375),
], columns=['level', 'time_ms', 'size_kiby']
).set_index('level')
```


```python
def add_stat_cols(df):
    return df.assign(compression_ratio=lambda df: df.size_kiby / df.size_kiby[0],
                     slowdown=lambda df: df.time_ms / df.time_ms[0])

orange_pi_zero = add_stat_cols(orange_pi_zero)
ryzen_2700x = add_stat_cols(ryzen_2700x)

orange_pi_zero
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table class="table table-hover dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>time_ms</th>
      <th>size_kiby</th>
      <th>compression_ratio</th>
      <th>slowdown</th>
    </tr>
    <tr>
      <th>level</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>11.398697</td>
      <td>403.495117</td>
      <td>1.000000</td>
      <td>1.000000</td>
    </tr>
    <tr>
      <th>1</th>
      <td>30.363095</td>
      <td>87.796875</td>
      <td>0.217591</td>
      <td>2.663734</td>
    </tr>
    <tr>
      <th>2</th>
      <td>31.992197</td>
      <td>83.490234</td>
      <td>0.206918</td>
      <td>2.806654</td>
    </tr>
    <tr>
      <th>3</th>
      <td>35.304809</td>
      <td>79.797852</td>
      <td>0.197767</td>
      <td>3.097267</td>
    </tr>
    <tr>
      <th>4</th>
      <td>45.820749</td>
      <td>74.395508</td>
      <td>0.184378</td>
      <td>4.019823</td>
    </tr>
    <tr>
      <th>5</th>
      <td>56.083393</td>
      <td>70.903320</td>
      <td>0.175723</td>
      <td>4.920158</td>
    </tr>
    <tr>
      <th>6</th>
      <td>70.800447</td>
      <td>68.870117</td>
      <td>0.170684</td>
      <td>6.211276</td>
    </tr>
    <tr>
      <th>7</th>
      <td>80.497003</td>
      <td>68.527344</td>
      <td>0.169834</td>
      <td>7.061948</td>
    </tr>
    <tr>
      <th>8</th>
      <td>111.043596</td>
      <td>68.229492</td>
      <td>0.169096</td>
      <td>9.741780</td>
    </tr>
    <tr>
      <th>9</th>
      <td>160.210550</td>
      <td>68.108398</td>
      <td>0.168796</td>
      <td>14.055164</td>
    </tr>
  </tbody>
</table>
</div>




```python
fig, ax = plt.subplots()

ax.set_ylabel('Compression Ratio')
ax.set_xlabel('Compression Duration (ms)')
ax.set_title('Compression Ratio vs Duration')

for label, data in [('Orange Pi Zero', orange_pi_zero), ('Ryzen 2700X', ryzen_2700x)]:
    ax.scatter(data.time_ms[1:], data.compression_ratio[1:], label=label)
ax.grid()
ax.legend()

plt.show()
```


{% include image.html
    url="/assets/images/2020-04-11-embedded-system-http-compression/output_4_0.svg"
    description="" %}


## Network Performance

Now that we've figured out how long gzip takes us, we need to understand the performance of the board. One nice way to do that is by running `iperf3 -c <hardwired pc ip>` on the client device and `iperf3 -s` on a wired PC. It's probably a good idea to try this out at various times of the day and with various physical configurations of the board and the access point.

Fortunately, if you don't want to do this, tkaiser has done lots of this work for us at https://forum.armbian.com/topic/3739-wi-fi-performance-and-known-issues-on-sbc/. I've used this forum topic as my reference for `typical_networks_kbps`.


```python
def calculate_total_time_ms(level, network_speed_kbps):
    compressed_kbits = data.size_kiby[level] * 8
    network_speed_kbpms = network_speed_kbps / 1000.0
    compression_time_ms = data.time_ms[level]
    return compressed_kbits / network_speed_kbpms + compression_time_ms

typical_networks_kbps = {
    'crappy wifi': 6_000,
    'ok wifi': 24_000,
    'good wifi': 50_000,
    'gigabit ethernet': 1_000_000
}

total_transfer_times = pd.DataFrame({
    name: [calculate_total_time_ms(level, speed_kbps)
           for level in range(0, 10)]
    for name, speed_kbps in typical_networks_kbps.items()
})
total_transfer_times
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table class="table table-hover dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>crappy wifi</th>
      <th>ok wifi</th>
      <th>good wifi</th>
      <th>gigabit ethernet</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>538.653444</td>
      <td>135.158327</td>
      <td>65.219173</td>
      <td>3.887915</td>
    </tr>
    <tr>
      <th>1</th>
      <td>120.345500</td>
      <td>32.548625</td>
      <td>17.330500</td>
      <td>3.985375</td>
    </tr>
    <tr>
      <th>2</th>
      <td>114.311369</td>
      <td>30.821135</td>
      <td>16.349494</td>
      <td>3.658978</td>
    </tr>
    <tr>
      <th>3</th>
      <td>109.867342</td>
      <td>30.069490</td>
      <td>16.237863</td>
      <td>4.108589</td>
    </tr>
    <tr>
      <th>4</th>
      <td>103.681108</td>
      <td>29.285600</td>
      <td>16.390379</td>
      <td>5.082261</td>
    </tr>
    <tr>
      <th>5</th>
      <td>100.288607</td>
      <td>29.385287</td>
      <td>17.095378</td>
      <td>6.318073</td>
    </tr>
    <tr>
      <th>6</th>
      <td>99.472728</td>
      <td>30.602611</td>
      <td>18.665124</td>
      <td>8.196866</td>
    </tr>
    <tr>
      <th>7</th>
      <td>100.196489</td>
      <td>31.669145</td>
      <td>19.791072</td>
      <td>9.374916</td>
    </tr>
    <tr>
      <th>8</th>
      <td>103.486008</td>
      <td>35.256516</td>
      <td>23.430070</td>
      <td>13.059187</td>
    </tr>
    <tr>
      <th>9</th>
      <td>109.263497</td>
      <td>41.155098</td>
      <td>29.349642</td>
      <td>18.997166</td>
    </tr>
  </tbody>
</table>
</div>




```python
total_transfer_time_improvement = pd.DataFrame({
    network_type:
        total_transfer_times[network_type] / total_transfer_times[network_type][0]
    for network_type in total_transfer_times
})

total_transfer_time_improvement
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table class="table table-hover dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>crappy wifi</th>
      <th>ok wifi</th>
      <th>good wifi</th>
      <th>gigabit ethernet</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>1.000000</td>
      <td>1.000000</td>
      <td>1.000000</td>
      <td>1.000000</td>
    </tr>
    <tr>
      <th>1</th>
      <td>0.223419</td>
      <td>0.240818</td>
      <td>0.265727</td>
      <td>1.025067</td>
    </tr>
    <tr>
      <th>2</th>
      <td>0.212217</td>
      <td>0.228037</td>
      <td>0.250685</td>
      <td>0.941116</td>
    </tr>
    <tr>
      <th>3</th>
      <td>0.203967</td>
      <td>0.222476</td>
      <td>0.248974</td>
      <td>1.056759</td>
    </tr>
    <tr>
      <th>4</th>
      <td>0.192482</td>
      <td>0.216676</td>
      <td>0.251312</td>
      <td>1.307194</td>
    </tr>
    <tr>
      <th>5</th>
      <td>0.186184</td>
      <td>0.217414</td>
      <td>0.262122</td>
      <td>1.625054</td>
    </tr>
    <tr>
      <th>6</th>
      <td>0.184669</td>
      <td>0.226420</td>
      <td>0.286191</td>
      <td>2.108293</td>
    </tr>
    <tr>
      <th>7</th>
      <td>0.186013</td>
      <td>0.234311</td>
      <td>0.303455</td>
      <td>2.411296</td>
    </tr>
    <tr>
      <th>8</th>
      <td>0.192120</td>
      <td>0.260853</td>
      <td>0.359251</td>
      <td>3.358918</td>
    </tr>
    <tr>
      <th>9</th>
      <td>0.202846</td>
      <td>0.304495</td>
      <td>0.450016</td>
      <td>4.886209</td>
    </tr>
  </tbody>
</table>
</div>




```python
fig, ax = plt.subplots()

ax.set_ylabel('Compression + Transfer Time (ms)')
ax.set_xlabel('gzip Level')
ax.set_title('Effect of compression level on request time')

for network_type in total_transfer_times:
    ax.scatter(total_transfer_times.index, total_transfer_times[network_type], label=network_type)

ax.set_yscale('log')
ax.grid()
ax.legend()

plt.show()
```


{% include image.html
    url="/assets/images/2020-04-11-embedded-system-http-compression/output_8_0.svg"
    description="" %}



```python
fig, (ax1, ax2) = plt.subplots(2, 1, sharex=True)

ax.set_ylabel('Compression + Transfer Time (ms)')
ax2.set_xlabel('gzip Level')
ax1.set_title('Effect of compression level on request time')

for network_type in total_transfer_time_improvement:
    for ax in [ax1, ax2]:
        ax.scatter(total_transfer_time_improvement.index,
                   total_transfer_time_improvement[network_type], label=network_type)

ax1.set_ylim(0.9, 0.9 + .25)
ax2.set_ylim(0.15, 0.15 + .25)
ax1.grid()
ax1.legend()
ax2.grid()
ax1.spines['bottom'].set_visible(False)
ax2.spines['top'].set_visible(False)
ax1.xaxis.tick_top()
ax1.tick_params(labeltop=False)  # don't put tick labels at the top
ax2.xaxis.tick_bottom()

plt.show()
```


{% include image.html
    url="/assets/images/2020-04-11-embedded-system-http-compression/output_9_0.svg"
    description="" %}


## Conclusion

It's fairly clear that no matter what you do, the network won't be the bottleneck when using gigabit ethernet.

However, it seems like the performance sweet-spot for the type of slow wifi links frequently found in these SBCs is around gzip level 4. There's a fairly strong knee in the speed of gzip at that point, even on a desktop CPU.

### Other Algorithms

Brotli is the only other compression algorithm widely supported by browsers, but its compression ratio is much worse, which makes it unsuitiable for on-the-fly compression on low-end hardware.

It looks like the people behind zstd are looking to add it to browsers. When it's widely supported, this will likely beat gzip in this application, or at the very least allow for more fine-grained tuning of the compression ratio.
