var sb = require("../sideburns"),
    fs = require("fs"),
    assert = require("assert"),
    template,
    data = {
        firstname: "john",
        lastname: "doe",
        age: 37,
        hasCat: true,
        foo: {
            bar: {
                fizz: "Buzz"
            }
        }
    },
    options = {},
    output;

template = fs.readFileSync(__dirname + "/files/simpletags.sb").toString();
output = sb(template, data, options);
assert.strictEqual(output, "My name is john doe, I am 37 years old. It is true that I have a cat.");

template = fs.readFileSync(__dirname + "/files/simpletagserror.sb").toString();
assert.throws(function(){
    output = sb(template, data, options);
}, /missing expected data "missing"/);

template = fs.readFileSync(__dirname + "/files/simpletagsdeep.sb").toString();
output = sb(template, data, options);
assert.strictEqual(output, "My name is john doe, I am 37 years old. It is true that I have a cat, but I bet you don't know that my favourite astronaut is Buzz Aldrin.");

template = fs.readFileSync(__dirname + "/files/simpletagsdeeperror.sb").toString();
assert.throws(function(){
    output = sb(template, data, options);
}, /missing expected data "fizz\.bar" \(IDENT: foo\.fizz\.bar\)/);
