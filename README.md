# Sideburns
A super small templating library for different types of files

## Roadmap
The current version of Sideburns (0.5.x) only supports a subset of the features that will be included in the v1 release;

* [Complete] Simple variable replacement
* [Complete] Automatic looping (Iteration through lists)
* [Complete] Context switching (Define blocks that will use a nested object as context)
* [WIP] Optional escaping of variables

## Installing Sideburns
Sideburns works by default with node.js/io.js and vanillajs. For running on a **server**, you can install by using `npm install --save bp-sideburns` and then anywhere in your code require it as per usual `var sideburns = require("bp-sideburns");`. In the **browser**, you simply need to download a copy of `sideburns.js` and include it in a `<script>` tag before the code that uses it. For example:
```html
<script type="application/javascript" src="js/sideburns.js"></script>
<script>
console.log(
  sideburns("Hello [[name]]!", {name: functionThatReturnsName()})
);
</script>
```

## Using Sideburns
Once you've got it installed, the only thing you need to worry about is the `sideburns(template, context)` function. 

### template \<String\>
The template parameter is a string containing special markup to tell sideburns where to insert your data. A sideburns tag starts with \[\[ (double left square brackets) and ends with ]] (double right square brackets). Any whitespace in the tag is simply ignored, meaning that `[[ name ]]` and `[[name]]` are both equivelent.

The start of the tag can also be given certain modifiers to change its meaning. Two of these create a "block" that will need to be closed with a special closing tag, while the third functions as per the standard tag but will also escape whatever value is to be inserted.

NB: Check the Roadmap to see which features are currently available. Use of an un-implemented operator will currently be ignored.

The modifiers are as follows:

* & - Creates a block whose context is set to the property with the name provided. For example:
```javascript
/* Context: 
{
  name: 'Frank',
  likes: {
    animal: 'rabbits',
    colour: 'red'
  },
  dislikes : {
    animal: 'lions',
    colour: 'green
  }
}
*/

//Template:
"Hi, my name is [[name]] and I like [[& likes]][[animal]] and the colour [[colour]][[/& likes]], but not [[& dislikes]][[animal]] or the colour [[colour]][[/&dislikes]]!"

//Output:
"Hi, my name is Frank and I like rabbits and the colour red, but not lions or the colour green!"
```

* * - Creates a block that will be inserted in-place for every value in the array with the name provided. The current element of the array can be accessed by using the name of the array minus the last character as the variable name. For [example](https://www.youtube.com/watch?v=ZZ5LpwO-An4):
```javascript
/* Context:
{
  lyrics: [
    "I said hey, what's goin' on?",
    "I said hey"
  ]
}
*/
//Template:
"[[* lyrics]]
And I say hey, yeah, yeah, yeah yay
Hey, yay, yay
[[lyric]]

[[/* lyrics]]"

//Output:
"And I say hey, yeah, yeah, yeah yay
Hey, yay, yay
I said hey, what's goin' on?

And I say hey, yeah, yeah, yeah yay
Hey, yay, yay
I said hey"
```

* ! - Works as per the default tag, but also escapes the variable
* / - Indicates that this tag ends the block that was previously opened with the same name _and type_. Blocks _must_ be ended in the reverse order that they were opened in - e.g. if you open a context block called `obj` and then a looping block called `arr`, you **must** close `arr` before you can close `obj`. Any other situation will throw a `SyntaxError`.

### context \<Object\>
The context parameter is simply an object that should contain the properties used in the template, in the correct formats (e.g. names used in context blocks should be objects, names used in looping blocks should be array-like, etc). Looping blocks aren't limited to arrays, but instead can be any object with a `length` property and numerically indexed values.

At present, any values that are not defined will be inserted in place as 'undefined'. In the case of context and looping blocks, the interpreter will throw an error as it can't access properties of undefined. While an option may be added in future to ignore undefined values/blocks, the current behaviour will remain the default as it is far more likely that such a situation will arise out of user error than be an intended consequence. 
