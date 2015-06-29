module.exports = function(sb) {
    var fs = require("fs"),
        assert = require("assert"),
        template,
        inc,
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

    template = fs.readFileSync(__dirname + "/files/includetestmissing.sb").toString();
    assert.throws(function(){
        output = sb(template, data, options);
    }, /Cannot get include missing/);

    template = fs.readFileSync(__dirname + "/files/includetest-a.sb").toString();
    inc = fs.readFileSync(__dirname + "/files/includetest-b.sb").toString();
    sb.addInclude("includetest", inc);
    output = sb(template, data, options);
    assert.strictEqual(output, "My name is john doe, I am 37 years old. It is true that I have a cat.");
}
