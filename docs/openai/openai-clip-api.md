## reference

```javascript
import Replicate from "replicate";
const replicate = new Replicate();

const input = {
    image: "https://replicate.delivery/pbxt/NSJXgUa7RjiqoPi4bmYjeHZs0PsaOyJv0USNgXOrUxXJU7UF/clip%20cover.webp"
};

const output = await replicate.run("openai/clip", { input });

console.log(output)
//=> {"embedding":[-0.15793871879577637,0.012011580169200897,-...
```


## env variables

```env
REPLICATE_API_TOKEN=
```