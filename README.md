# IchigoTerm

IchigoTerm using [Web Serial API](https://developer.mozilla.org/en-US/docs/Web/API/Serial)

- https://ichigojam.github.io/IchigoTerm/
- https://ichigojam.github.io/IchigoTerm/ichigoconnect.html

## usage

```html
<button id=btn>connect</button>
<script type="module">
import { IchigoConnect } from "https://ichigojam.github.io/IchigoTerm/IchigoConnect.js";

btn.onclick = async () => {
  const ic = await IchigoConnect.create();
  ic.write("LED1\n");
};
</script>
```

## todo

improve IchigoJam compatibility
