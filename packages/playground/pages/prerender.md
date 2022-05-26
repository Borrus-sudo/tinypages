<head>
<title>Instant page!!!</title>
</head>

# **🚀 Make your website an Instant Page!**

Performance is a key and critical aspect while developing web applications. Faster initial load time results in lower bounce rates and thus making your website more SEO friendly. Caching, SSR, and prerendering are usually techniques that developers resort to in a desperate attempt to improve their lighthouse performance score and strive to get all greens. While you should use them, it is also worth using prebrowsing to improve your performance and SEO.

</br>

## **What is prebrowsing**?

Prebrowsing is the process of loading resources beforehand to save the time utilized in fetching them from the server at the time of their rendering.

<br/>

## **How to do prebrowsing**?

### <u> DNS-prefetch</u>

Simply adding `rel="dns-prefetch"` will save you the time of DNS lookups for your links.

```html
<link rel="dns-prefetch" />
```

<br/>

### <u> Preconnect</u>

Adding `rel="preconnect"` will save the time of DNS lookups + will also perform TCP handshake saving you more time.

```html
<link rel="preconnect" />
```

<br/>

### <u>Prefetch</u>

Prefetch will load the resources during the idle time of the CPU and store them in the cache from where they will be loaded.

```html
<link rel="prefetch" />
```

💡 <u>_Common Pitfall_</u>
<br/>
While testing prefetch, many developers observe that the prefetched resources are fetched again at the time when they are needed. Be sure to unclick the Disable Cache option in your dev tools.

<br/>

### <u>Preload</u>

Preload is a declarative prefetch that will force the browser to load them in the background. Preload is a new web standard and an improved version of `subresource`.

```html
<link rel="preload" />
```

<br/>

### <u>Prerender</u>

Prerender will prerender that link completely. It is like opening that link in a secret tab and letting everything get rendered and displaying it when the user clicks that link. Use this feature only if you are sure that the user will click the link, else it would simply waste your cache storage.

<br/>

### **Important note**

> When the user starts typing the URL in the search box, chrome suggests URL autocompletion. At this point, chrome might start rendering that website page before the user clicks the enter button. Your link tags are also fetched based on your rel attributes value at this time.

